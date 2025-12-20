import { EXPENSES_CSV, INCOME_CSV } from './data';
import { Expense, Income, DashboardSummary, MonthlyData, CategoryData } from '../types';
// @ts-ignore
import Papa from 'papaparse';

const STORAGE_KEY = 'POLIFIN_DATA_DB';

const parseNumber = (val: string): number => {
  if (!val) return 0;
  // Ensure we are working with a string
  const strVal = String(val);
  // Handle Brazilian format: 414.708,07 -> 414708.07
  let cleanVal = strVal.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanVal) || 0;
};

// Helper to parse "DD/MM/YYYY" to ISO "YYYY-MM-DD" for sorting/charting
const parseDate = (val: string): string => {
  if (!val) return '';
  const parts = val.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return val;
};

const parseExpenses = (csv: string): Expense[] => {
  // Find where the actual data starts (header row)
  const headerSignature = 'Data da despesa';
  const headerIndex = csv.indexOf(headerSignature);
  
  // Slice the CSV from the header onwards to avoid metadata issues
  const cleanCsv = headerIndex >= 0 ? csv.substring(headerIndex) : csv;

  // Use PapaParse for robust parsing of quotes and newlines
  const result = Papa.parse(cleanCsv, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';', // SPCA standard is usually semicolon
  });

  return result.data.map((row: any) => ({
    date: parseDate(row['Data da despesa']),
    providerName: row['Nome / Razão'] || row['Nome/Razão'] || 'Fornecedor Desconhecido',
    documentNumber: row['Nº do documento'] || '',
    value: parseNumber(row['Valor do documento'] || row['Valor do gasto']), 
    description: row['Descrição da despesa'] || '',
    nature: row['Natureza do gasto'] || ''
  })).filter((item: Expense) => item.date && (item.value > 0 || item.description !== ''));
};

const parseIncome = (csv: string): Income[] => {
  const headerSignature = 'Data da receita';
  const headerIndex = csv.indexOf(headerSignature);
  const cleanCsv = headerIndex >= 0 ? csv.substring(headerIndex) : csv;

  const result = Papa.parse(cleanCsv, {
    header: true,
    skipEmptyLines: true,
    delimiter: ';',
  });

  return result.data.map((row: any) => ({
    date: parseDate(row['Data da receita']),
    donorName: row['Nome / Razão'] || row['Nome/Razão'] || 'Doador Desconhecido',
    type: row['Espécie do recurso'] || '',
    source: row['Fonte do recurso'] || '',
    nature: row['Natureza do recurso'] || '',
    value: parseNumber(row['Valor da doação'])
  })).filter((item: Income) => item.date && item.value > 0);
};

// --- DATA MANAGEMENT ---

export interface PartyRecord {
  name: string;
  incomeCsv: string;
  expenseCsv: string;
}

export const getStoredParties = (): Record<string, PartyRecord> => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error("Error reading storage", e);
  }
  
  // Return default data if storage is empty
  const defaultData = {
    "Progressistas (PP)": {
      name: "Progressistas (PP)",
      incomeCsv: INCOME_CSV,
      expenseCsv: EXPENSES_CSV
    }
  };
  // Initialize storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData));
  return defaultData;
};

export const savePartyData = (name: string, incomeCsv: string, expenseCsv: string) => {
  const currentData = getStoredParties();
  currentData[name] = { name, incomeCsv, expenseCsv };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
  return currentData;
};

export const deletePartyData = (name: string) => {
  const currentData = getStoredParties();
  if (currentData[name]) {
    delete currentData[name];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
  }
  return currentData;
};

// --- AGGREGATION ---

export const getDashboardData = (incomeCsv: string, expenseCsv: string): DashboardSummary => {
  const expenses = parseExpenses(expenseCsv);
  const incomes = parseIncome(incomeCsv);

  const totalExpense = expenses.reduce((acc, cur) => acc + cur.value, 0);
  const totalIncome = incomes.reduce((acc, cur) => acc + cur.value, 0);

  // Group by Top Donors
  const donorMap = new Map<string, number>();
  incomes.forEach(inc => {
    const current = donorMap.get(inc.donorName) || 0;
    donorMap.set(inc.donorName, current + inc.value);
  });
  const topDonors = Array.from(donorMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Group by Top Suppliers
  const supplierMap = new Map<string, number>();
  expenses.forEach(exp => {
    const current = supplierMap.get(exp.providerName) || 0;
    supplierMap.set(exp.providerName, current + exp.value);
  });
  const topSuppliers = Array.from(supplierMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Expenses by Category (Description)
  const categoryMap = new Map<string, number>();
  expenses.forEach(exp => {
    // Simplify description to first few words or key category
    // Many descriptions are "CATEGORY - SUBCATEGORY - DETAIL"
    const cat = exp.description.split('-')[0].trim();
    const current = categoryMap.get(cat) || 0;
    categoryMap.set(cat, current + exp.value);
  });
  const expensesByCategory = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Monthly Flow
  const flowMap = new Map<string, { income: number, expense: number }>();
  
  const getMonthKey = (dateStr: string) => {
      if (!dateStr || dateStr.length < 7) return 'N/A';
      const d = new Date(dateStr);
      // Format YYYY-MM for sorting
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  incomes.forEach(inc => {
      const key = getMonthKey(inc.date);
      if (key === 'N/A') return;
      if (!flowMap.has(key)) flowMap.set(key, { income: 0, expense: 0});
      flowMap.get(key)!.income += inc.value;
  });

  expenses.forEach(exp => {
      const key = getMonthKey(exp.date);
      if (key === 'N/A') return;
      if (!flowMap.has(key)) flowMap.set(key, { income: 0, expense: 0});
      flowMap.get(key)!.expense += exp.value;
  });

  const monthlyFlow = Array.from(flowMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, val]) => ({
          name: key,
          income: val.income,
          expense: val.expense
      }));

  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    topDonors,
    topSuppliers,
    expensesByCategory,
    monthlyFlow,
    rawExpenses: expenses,
    rawIncomes: incomes
  };
};
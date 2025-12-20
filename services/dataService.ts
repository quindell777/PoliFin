import { EXPENSES_CSV, INCOME_CSV } from './data';
import { Expense, Income, DashboardSummary, MonthlyData, CategoryData } from '../types';

const STORAGE_KEY = 'POLIFIN_DATA_DB';

const parseNumber = (val: string): number => {
  if (!val) return 0;
  let cleanVal = val.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanVal) || 0;
};

const parseDate = (val: string): string => {
  const parts = val.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return val;
};

const parseExpenses = (csv: string): Expense[] => {
  const lines = csv.trim().split('\n');
  const expenses: Expense[] = [];
  
  let startIdx = 0;
  for(let i=0; i<lines.length; i++) {
      if(lines[i].startsWith('Data da despesa')) {
          startIdx = i + 1;
          break;
      }
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cols = line.split(';').map(c => c.replace(/^"|"$/g, ''));
    
    if (cols.length < 10) continue;

    expenses.push({
      date: parseDate(cols[0]),
      providerName: cols[2],
      documentNumber: cols[6],
      value: parseNumber(cols[7]), 
      description: cols[8],
      nature: cols[9]
    });
  }
  return expenses;
};

const parseIncome = (csv: string): Income[] => {
  const lines = csv.trim().split('\n');
  const income: Income[] = [];
  
  let startIdx = 0;
  for(let i=0; i<lines.length; i++) {
      if(lines[i].startsWith('Data da receita')) {
          startIdx = i + 1;
          break;
      }
  }

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const cols = line.split(';').map(c => c.replace(/^"|"$/g, ''));
    
    if (cols.length < 10) continue;

    income.push({
      date: parseDate(cols[0]),
      donorName: cols[2],
      type: cols[4],
      source: cols[6],
      nature: cols[7],
      value: parseNumber(cols[9])
    });
  }
  return income;
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

// --- AGGREGATION ---

export const getDashboardData = (incomeCsv: string, expenseCsv: string): DashboardSummary => {
  const expenses = parseExpenses(expenseCsv);
  const incomes = parseIncome(incomeCsv);

  const totalExpense = expenses.reduce((acc, cur) => acc + cur.value, 0);
  const totalIncome = incomes.reduce((acc, cur) => acc + cur.value, 0);

  const donorMap = new Map<string, number>();
  incomes.forEach(inc => {
    const current = donorMap.get(inc.donorName) || 0;
    donorMap.set(inc.donorName, current + inc.value);
  });
  const topDonors = Array.from(donorMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const supplierMap = new Map<string, number>();
  expenses.forEach(exp => {
    const current = supplierMap.get(exp.providerName) || 0;
    supplierMap.set(exp.providerName, current + exp.value);
  });
  const topSuppliers = Array.from(supplierMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const categoryMap = new Map<string, number>();
  expenses.forEach(exp => {
    const cat = exp.description.split('-')[0].trim();
    const current = categoryMap.get(cat) || 0;
    categoryMap.set(cat, current + exp.value);
  });
  const expensesByCategory = Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const flowMap = new Map<string, { income: number, expense: number }>();
  const getMonthKey = (dateStr: string) => {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  incomes.forEach(inc => {
      const key = getMonthKey(inc.date);
      if (!flowMap.has(key)) flowMap.set(key, { income: 0, expense: 0});
      flowMap.get(key)!.income += inc.value;
  });

  expenses.forEach(exp => {
      const key = getMonthKey(exp.date);
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
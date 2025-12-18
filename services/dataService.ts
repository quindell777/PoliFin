import { EXPENSES_CSV, INCOME_CSV } from './data';
import { Expense, Income, DashboardSummary, MonthlyData, CategoryData } from '../types';

const parseNumber = (val: string): number => {
  if (!val) return 0;
  // Handle Brazilian format: 414.708,07 -> 414708.07
  // Remove thousand separators (if any, usually '.') and replace decimal ',' with '.'
  let cleanVal = val.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleanVal) || 0;
};

// Helper to parse "DD/MM/YYYY" to ISO "YYYY-MM-DD" for sorting/charting
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
    
    // Simple split by semicolon, respecting quotes is hard without a library, 
    // but the data seems consistent. We will remove quotes.
    const cols = line.split(';').map(c => c.replace(/^"|"$/g, ''));
    
    if (cols.length < 10) continue;

    expenses.push({
      date: parseDate(cols[0]),
      providerName: cols[2],
      documentNumber: cols[6],
      value: parseNumber(cols[7]), // Valor do documento usually matches Valor do gasto
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

export const getDashboardData = (): DashboardSummary => {
  const expenses = parseExpenses(EXPENSES_CSV);
  const incomes = parseIncome(INCOME_CSV);

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
      const d = new Date(dateStr);
      // Format YYYY-MM for sorting
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
          name: key, // Keep YYYY-MM for simpler sorting, render nice label in chart
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
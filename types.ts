export interface Expense {
  date: string;
  providerName: string;
  description: string;
  nature: string;
  value: number;
  documentNumber: string;
}

export interface Income {
  date: string;
  donorName: string;
  source: string;
  nature: string;
  value: number;
  type: string;
}

export interface MonthlyData {
  name: string; // "Jan 2025"
  income: number;
  expense: number;
}

export interface CategoryData {
  name: string;
  value: number;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topDonors: CategoryData[];
  topSuppliers: CategoryData[];
  expensesByCategory: CategoryData[];
  monthlyFlow: MonthlyData[];
  rawExpenses: Expense[];
  rawIncomes: Income[];
}
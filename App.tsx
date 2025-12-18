import React, { useMemo, useState } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, PieChart as PieChartIcon, DollarSign, Wallet } from 'lucide-react';
import { getDashboardData } from './services/dataService';
import Chatbot from './components/Chatbot';
import { CashFlowChart, TopEntitiesChart, CategoryPieChart } from './components/Charts';
import IncomeList from './components/IncomeList';
import ExpenseList from './components/ExpenseList';

type ViewState = 'dashboard' | 'incomes' | 'expenses';

function App() {
  const data = useMemo(() => getDashboardData(), []);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderContent = () => {
    switch(currentView) {
      case 'incomes':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                   <TrendingUp className="text-green-500" /> Receitas
                </h2>
                <div className="text-right">
                   <p className="text-sm text-gray-500">Total Recebido</p>
                   <p className="text-xl font-bold text-green-600">{formatCurrency(data.totalIncome)}</p>
                </div>
             </div>
             <IncomeList data={data.rawIncomes} />
          </div>
        );
      case 'expenses':
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                   <TrendingDown className="text-red-500" /> Despesas
                </h2>
                <div className="text-right">
                   <p className="text-sm text-gray-500">Total Gasto</p>
                   <p className="text-xl font-bold text-red-600">{formatCurrency(data.totalExpense)}</p>
                </div>
             </div>
             <ExpenseList data={data.rawExpenses} />
          </div>
        );
      case 'dashboard':
      default:
        return (
          <div className="space-y-6 animate-in fade-in duration-300">
             {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Receita Total</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalIncome)}</h3>
              </div>
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <TrendingUp size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Despesa Total</p>
                <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(data.totalExpense)}</h3>
              </div>
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <TrendingDown size={24} />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Saldo em Caixa</p>
                <h3 className={`text-2xl font-bold ${data.balance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(data.balance)}
                </h3>
              </div>
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Wallet size={24} />
              </div>
            </div>
          </div>

          {/* Main Chart Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Fluxo de Caixa (Mensal)</h3>
              <CashFlowChart data={data.monthlyFlow} />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Categorias de Despesa</h3>
              <CategoryPieChart data={data.expensesByCategory} />
            </div>
          </div>

          {/* Top Entities Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-green-500" />
                Maiores Doadores
              </h3>
              <TopEntitiesChart data={data.topDonors} color="#10B981" title="Valor Doado (R$)" />
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DollarSign size={18} className="text-red-500" />
                Maiores Fornecedores
              </h3>
              <TopEntitiesChart data={data.topSuppliers} color="#EF4444" title="Valor Pago (R$)" />
            </div>
          </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Mobile Nav */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <LayoutDashboard className="text-blue-400" />
            PoliFin
          </h1>
          <p className="text-xs text-slate-400 mt-1">Gestão Partidária</p>
        </div>
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <PieChartIcon size={20} />
            <span>Visão Geral</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('incomes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'incomes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <TrendingUp size={20} />
            <span>Receitas</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('expenses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <TrendingDown size={20} />
            <span>Despesas</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold text-gray-800">Dashboard Financeiro - Progressistas (PP)</h2>
          <div className="text-sm text-gray-500">Última atualização: 17/12/2025</div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      <Chatbot data={data} />
    </div>
  );
}

export default App;
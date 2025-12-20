import React, { useEffect, useState, useMemo } from 'react';
import { LayoutDashboard, TrendingUp, TrendingDown, PieChart as PieChartIcon, DollarSign, Wallet, Upload, ChevronDown, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getDashboardData, getStoredParties, deletePartyData } from './services/dataService';
import Chatbot from './components/Chatbot';
import { CashFlowChart, TopEntitiesChart, CategoryPieChart } from './components/Charts';
import IncomeList from './components/IncomeList';
import ExpenseList from './components/ExpenseList';
import DataUpload from './components/DataUpload';
import { DashboardSummary } from './types';

type ViewState = 'dashboard' | 'incomes' | 'expenses' | 'upload';

function App() {
  console.log("[App] Rendering main component...");
  
  const [parties, setParties] = useState(() => {
    console.log("[App] Initial state: loading stored parties");
    return getStoredParties();
  });
  
  const [currentPartyName, setCurrentPartyName] = useState<string>(() => {
    const keys = Object.keys(parties);
    const initial = keys.length > 0 ? keys[0] : '';
    console.log(`[App] Initial state: selected party '${initial}'`);
    return initial;
  });
  
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load dashboard data whenever the selected party changes or parties list updates
  useEffect(() => {
    console.log(`[App] Effect triggered. Party: '${currentPartyName}', Total Parties: ${Object.keys(parties).length}`);
    
    if (currentPartyName && parties[currentPartyName]) {
      console.log(`[App] Calculating dashboard data for ${currentPartyName}`);
      const p = parties[currentPartyName];
      try {
        const summary = getDashboardData(p.incomeCsv, p.expenseCsv);
        setData(summary);
        console.log("[App] Data loaded successfully");
      } catch (err) {
        console.error("[App] Error calculating dashboard data:", err);
      }
    } else if (!currentPartyName && Object.keys(parties).length === 0) {
      console.log("[App] No parties available, switching to upload view");
      setData(null);
      setCurrentView('upload');
    }
  }, [currentPartyName, parties]);

  const handlePartyChange = (name: string) => {
    console.log(`[App] Changing party to: ${name}`);
    setCurrentPartyName(name);
    setIsMenuOpen(false);
    setCurrentView('dashboard');
  };

  const handleDataSaved = (newName: string) => {
    console.log(`[App] Data saved for: ${newName}, reloading parties...`);
    const updatedParties = getStoredParties();
    setParties(updatedParties);
    setCurrentPartyName(newName);
    setCurrentView('dashboard');
  };

  const handleDeleteParty = (e: React.MouseEvent, name: string) => {
    e.stopPropagation(); // Prevent triggering selection
    console.log(`[App] Request to delete: ${name}`);
    if (window.confirm(`Tem certeza que deseja excluir o dashboard de "${name}"?`)) {
      const updatedParties = deletePartyData(name);
      setParties(updatedParties);
      
      // If we deleted the current party, switch to another available one or clear
      if (currentPartyName === name) {
        const remainingKeys = Object.keys(updatedParties);
        if (remainingKeys.length > 0) {
          console.log(`[App] Deleted current party. Switching to: ${remainingKeys[0]}`);
          setCurrentPartyName(remainingKeys[0]);
        } else {
          console.log(`[App] All parties deleted.`);
          setCurrentPartyName('');
          setCurrentView('upload');
        }
      }
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const renderContent = () => {
    if (!data && currentView !== 'upload') return <div className="p-12 text-center text-gray-500">Nenhum dado selecionado. Importe um arquivo ou selecione um partido.</div>;

    switch(currentView) {
      case 'upload':
        return <DataUpload onDataSaved={handleDataSaved} />;
      case 'incomes':
        return data ? (
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
        ) : null;
      case 'expenses':
        return data ? (
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
        ) : null;
      case 'dashboard':
      default:
        return data ? (
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
        ) : null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar / Mobile Nav */}
      <aside 
        className={`bg-slate-900 text-white flex-shrink-0 transition-all duration-300 ease-in-out flex flex-col
          w-full md:h-screen sticky top-0
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        `}
      >
        <div className={`p-6 border-b border-slate-800 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden whitespace-nowrap">
              <h1 className="text-xl font-bold flex items-center gap-2">
                <LayoutDashboard className="text-blue-400 flex-shrink-0" />
                PoliFin
              </h1>
              <p className="text-xs text-slate-400 mt-1">Gestão Partidária</p>
            </div>
          )}
          {isSidebarCollapsed && (
            <LayoutDashboard className="text-blue-400 flex-shrink-0" size={24} />
          )}
          
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex text-slate-400 hover:text-white transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <button 
            onClick={() => setCurrentView('dashboard')}
            disabled={!data}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap overflow-hidden
              ${currentView === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'} 
              ${!data ? 'opacity-50 cursor-not-allowed' : ''}
              ${isSidebarCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isSidebarCollapsed ? "Visão Geral" : ""}
          >
            <PieChartIcon size={20} className="flex-shrink-0" />
            <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Visão Geral</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('incomes')}
            disabled={!data}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap overflow-hidden
              ${currentView === 'incomes' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'} 
              ${!data ? 'opacity-50 cursor-not-allowed' : ''}
              ${isSidebarCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isSidebarCollapsed ? "Receitas" : ""}
          >
            <TrendingUp size={20} className="flex-shrink-0" />
            <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Receitas</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('expenses')}
            disabled={!data}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap overflow-hidden
              ${currentView === 'expenses' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'} 
              ${!data ? 'opacity-50 cursor-not-allowed' : ''}
              ${isSidebarCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isSidebarCollapsed ? "Despesas" : ""}
          >
            <TrendingDown size={20} className="flex-shrink-0" />
            <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Despesas</span>
          </button>

          <hr className="border-slate-800 my-2" />

          <button 
            onClick={() => setCurrentView('upload')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors whitespace-nowrap overflow-hidden
              ${currentView === 'upload' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800'}
              ${isSidebarCollapsed ? 'justify-center px-2' : ''}
            `}
            title={isSidebarCollapsed ? "Importar Dados" : ""}
          >
            <Upload size={20} className="flex-shrink-0" />
            <span className={`transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>Importar Dados</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <div>
             {/* Party Selector */}
             <div className="relative">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 text-xl font-semibold text-gray-800 hover:text-blue-600 transition-colors"
                >
                  {currentPartyName || "Selecione um partido"}
                  <ChevronDown size={20} className="text-gray-400" />
                </button>

                {isMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-20">
                     <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                       Partidos Cadastrados
                     </div>
                     <div className="max-h-60 overflow-y-auto">
                       {Object.keys(parties).map(pName => (
                         <div key={pName} className="flex items-center justify-between px-2 hover:bg-gray-50 group">
                           <button
                             onClick={() => handlePartyChange(pName)}
                             className={`flex-1 text-left px-2 py-2 text-sm ${currentPartyName === pName ? 'text-blue-600 font-medium' : 'text-gray-700'}`}
                           >
                             {pName}
                           </button>
                           <button
                              onClick={(e) => handleDeleteParty(e, pName)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                              title="Excluir"
                           >
                              <Trash2 size={14} />
                           </button>
                         </div>
                       ))}
                       {Object.keys(parties).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-400 italic">Nenhum partido salvo.</div>
                       )}
                     </div>
                     <div className="border-t border-gray-100 mt-1 pt-1">
                        <button 
                          onClick={() => {
                            setIsMenuOpen(false);
                            setCurrentView('upload');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 font-medium flex items-center gap-2"
                        >
                          <Upload size={14} /> Novo Partido
                        </button>
                     </div>
                  </div>
                )}
             </div>
          </div>
          <div className="text-sm text-gray-500">Última atualização: {new Date().toLocaleDateString('pt-BR')}</div>
        </header>

        <div className="p-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Pass the dynamic data to the chatbot */}
      {data && <Chatbot data={data} />}
    </div>
  );
}

export default App;
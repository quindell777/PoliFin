import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { savePartyData } from '../services/dataService';

interface Props {
  onDataSaved: (newPartyName: string) => void;
}

const DataUpload: React.FC<Props> = ({ onDataSaved }) => {
  const [partyName, setPartyName] = useState('');
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [expenseFile, setExpenseFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'income' | 'expense') => {
    if (e.target.files && e.target.files[0]) {
      console.log(`[Upload] User selected ${type} file: ${e.target.files[0].name}`);
      if (type === 'income') setIncomeFile(e.target.files[0]);
      else setExpenseFile(e.target.files[0]);
    }
  };

  const readFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log(`[Upload] Starting to read file: ${file.name}`);
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log(`[Upload] Finished reading file: ${file.name}`);
        resolve(event.target?.result as string);
      };
      reader.onerror = (error) => {
        console.error(`[Upload] Error reading file ${file.name}:`, error);
        reject(error);
      };
      reader.readAsText(file); // Default encoding UTF-8, usually fine for CSV
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    console.log("[Upload] Submitting upload form...");
    
    if (!partyName.trim()) {
      setError('Por favor, informe o nome do partido.');
      return;
    }
    if (!incomeFile || !expenseFile) {
      setError('É necessário enviar ambos os arquivos CSV (Receitas e Despesas).');
      return;
    }

    setLoading(true);
    try {
      const incomeCsv = await readFile(incomeFile);
      const expenseCsv = await readFile(expenseFile);
      
      console.log("[Upload] Files read. Saving data...");
      savePartyData(partyName, incomeCsv, expenseCsv);
      
      console.log("[Upload] Data saved. Triggering callback...");
      onDataSaved(partyName);
      
      // Reset form
      setPartyName('');
      setIncomeFile(null);
      setExpenseFile(null);
    } catch (err) {
      console.error("[Upload] Upload failed:", err);
      setError('Erro ao processar arquivos. Verifique se são CSVs válidos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Upload className="text-blue-600" size={24} />
          Importar Dados do Partido
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Crie uma nova base de dados enviando as planilhas de receitas e despesas.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Partido</label>
          <input
            type="text"
            value={partyName}
            onChange={(e) => setPartyName(e.target.value)}
            placeholder="Ex: Partido Novo (NOVO)"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Income Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative group">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e, 'income')}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {incomeFile ? (
               <div className="text-green-600 flex flex-col items-center">
                 <Check size={32} className="mb-2" />
                 <span className="font-medium text-sm truncate max-w-[200px]">{incomeFile.name}</span>
                 <span className="text-xs text-gray-400">Receitas carregadas</span>
               </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center group-hover:text-gray-600">
                <FileText size={32} className="mb-2" />
                <span className="font-medium text-sm">Upload Receitas (.csv)</span>
              </div>
            )}
          </div>

          {/* Expense Input */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 transition-colors relative group">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileChange(e, 'expense')}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            {expenseFile ? (
               <div className="text-green-600 flex flex-col items-center">
                 <Check size={32} className="mb-2" />
                 <span className="font-medium text-sm truncate max-w-[200px]">{expenseFile.name}</span>
                 <span className="text-xs text-gray-400">Despesas carregadas</span>
               </div>
            ) : (
              <div className="text-gray-400 flex flex-col items-center group-hover:text-gray-600">
                <FileText size={32} className="mb-2" />
                <span className="font-medium text-sm">Upload Despesas (.csv)</span>
              </div>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-all shadow-md flex justify-center items-center"
        >
          {loading ? 'Processando...' : 'Salvar Base de Dados'}
        </button>
      </form>
    </div>
  );
};

export default DataUpload;
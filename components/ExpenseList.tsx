import React from 'react';
import { Expense } from '../types';

interface Props {
  data: Expense[];
}

const ExpenseList: React.FC<Props> = ({ data }) => {
  console.log(`[ExpenseList] Rendering list. Items: ${data?.length}`);
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800">Detalhamento de Despesas</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-3">Data</th>
              <th className="px-6 py-3">Fornecedor</th>
              <th className="px-6 py-3">Descrição</th>
              <th className="px-6 py-3 text-right">Valor</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="bg-white border-b hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.date)}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{item.providerName}</td>
                <td className="px-6 py-4 max-w-md">
                   <p className="truncate" title={item.description}>{item.description}</p>
                   <span className="text-xs text-gray-400">{item.nature}</span>
                </td>
                <td className="px-6 py-4 text-right font-bold text-red-600">{formatCurrency(item.value)}</td>
              </tr>
            ))}
             {data.length === 0 && (
               <tr>
                 <td colSpan={4} className="px-6 py-8 text-center text-gray-400">Nenhuma despesa encontrada.</td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpenseList;
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { CategoryData, MonthlyData } from '../types';

// Expanded color palette for better visual distinction
const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#84CC16', // Lime
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
];

// Helper to truncate long labels
const truncateLabel = (value: string, limit: number = 20) => {
  if (typeof value === 'string' && value.length > limit) {
    return `${value.substring(0, limit)}...`;
  }
  return value;
};

export const CashFlowChart: React.FC<{ data: MonthlyData[] }> = ({ data }) => {
  console.log(`[Charts] Rendering CashFlowChart. Data points: ${data?.length}`);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" stroke="#6B7280" tick={{fontSize: 12}} />
        <YAxis stroke="#6B7280" tick={{fontSize: 12}} tickFormatter={(value) => `R$${(value/1000).toFixed(0)}k`} />
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
        <Tooltip 
          formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)}
        />
        <Legend />
        <Area type="monotone" dataKey="income" name="Receitas" stroke="#10B981" fillOpacity={1} fill="url(#colorIncome)" />
        <Area type="monotone" dataKey="expense" name="Despesas" stroke="#EF4444" fillOpacity={1} fill="url(#colorExpense)" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export const TopEntitiesChart: React.FC<{ data: CategoryData[], color: string, title: string }> = ({ data, color, title }) => {
  console.log(`[Charts] Rendering TopEntitiesChart "${title}". Data points: ${data?.length}`);
  return (
    <div className="h-[300px] w-full">
      <h4 className="text-center text-sm font-medium text-gray-500 mb-2">{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            width={150} 
            tick={{fontSize: 11}} 
            tickFormatter={(val) => truncateLabel(val)}
          />
          <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
          <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export const CategoryPieChart: React.FC<{ data: CategoryData[] }> = ({ data }) => {
  console.log(`[Charts] Rendering CategoryPieChart. Raw categories: ${data?.length}`);
  // Take top 8 categories (increased from 5 for better granularity), group rest as "Outros"
  const topLimit = 8;
  const topCats = data.slice(0, topLimit);
  const othersValue = data.slice(topLimit).reduce((acc, curr) => acc + curr.value, 0);
  const finalData = othersValue > 0 ? [...topCats, { name: 'Outros', value: othersValue }] : topCats;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={finalData}
          cx="50%"
          cy="40%"
          labelLine={false}
          label={({ percent }) => percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {finalData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center" 
          wrapperStyle={{ fontSize: '12px', paddingTop: '40px' }} 
          formatter={(val) => truncateLabel(val)}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};
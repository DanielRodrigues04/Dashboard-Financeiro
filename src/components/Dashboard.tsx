import React, { useEffect, useState } from 'react';
import { Line, Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Wallet, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement
);

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: string;
}

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpense, setMonthlyExpense] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        type,
        date,
        categories (name)
      `)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações:', error);
      return;
    }

    const formattedData = data.map(t => ({
      amount: t.amount,
      type: t.type,
      date: t.date,
      category: t.categories?.name || 'Sem categoria'
    }));

    setTransactions(formattedData);
    calculateTotals(formattedData);
  }

  function calculateTotals(data: Transaction[]) {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyData = data.filter(t => 
      new Date(t.date) >= firstDayOfMonth
    );

    const income = monthlyData
      .filter(t => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expense = monthlyData
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    setMonthlyIncome(income);
    setMonthlyExpense(expense);
    setTotalBalance(income - expense);
  }

  const lineChartData = {
    labels: transactions
      .slice(0, 7)
      .reverse()
      .map(t => format(new Date(t.date), 'dd/MM', { locale: ptBR })),
    datasets: [
      {
        label: 'Saldo',
        data: transactions
          .slice(0, 7)
          .reverse()
          .map(t => t.type === 'income' ? t.amount : -t.amount),
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const pieChartData = {
    labels: ['Receitas', 'Despesas'],
    datasets: [
      {
        data: [monthlyIncome, monthlyExpense],
        backgroundColor: ['#10B981', '#EF4444'],
      },
    ],
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Visão Geral</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <div className="p-3 bg-blue-100 rounded-full">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Saldo Total</p>
            <p className="text-xl font-bold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalBalance)}
            </p>
          </div>
        </div>

        <div className="card bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <div className="p-3 bg-green-100 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Receitas do Mês</p>
            <p className="text-xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(monthlyIncome)}
            </p>
          </div>
        </div>

        <div className="card bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <div className="p-3 bg-red-100 rounded-full">
            <TrendingDown className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Despesas do Mês</p>
            <p className="text-xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(monthlyExpense)}
            </p>
          </div>
        </div>

        <div className="card bg-white p-6 rounded-xl shadow flex items-center space-x-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Wallet className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Transações</p>
            <p className="text-xl font-bold">{transactions.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa</h3>
          <Line data={lineChartData} options={{ maintainAspectRatio: false }} height={300} />
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Distribuição Mensal</h3>
          <Pie data={pieChartData} options={{ maintainAspectRatio: false }} height={300} />
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Últimas Transações</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3">Data</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Tipo</th>
              </tr>
            </thead>
            <tbody>
              {transactions.slice(0, 5).map((transaction, index) => (
                <tr key={index} className="border-b last:border-0">
                  <td className="py-3">
                    {format(new Date(transaction.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="py-3">{transaction.category}</td>
                  <td className="py-3">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(transaction.amount)}
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      transaction.type === 'income' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'income' ? 'Receita' : 'Despesa'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
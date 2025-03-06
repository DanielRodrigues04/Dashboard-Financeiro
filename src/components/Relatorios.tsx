import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Download } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  date: string;
  category: {
    name: string;
  };
}

export default function Relatorios() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchTransactions();
  }, [startDate, endDate]);

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        amount,
        type,
        date,
        category:categories (name)
      `)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');

    if (error) {
      console.error('Erro ao buscar transações:', error);
      return;
    }

    setTransactions(data);
  }

  function handlePeriodChange(newPeriod: string) {
    setPeriod(newPeriod);
    const now = new Date();

    switch (newPeriod) {
      case 'month':
        setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case '3months':
        setStartDate(format(startOfMonth(subMonths(now, 2)), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case '6months':
        setStartDate(format(startOfMonth(subMonths(now, 5)), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
      case 'year':
        setStartDate(format(startOfMonth(subMonths(now, 11)), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
        break;
    }
  }

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const categoryExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => {
      const category = t.category.name;
      acc[category] = (acc[category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const monthlyData = transactions.reduce((acc, t) => {
    const month = format(new Date(t.date), 'MM/yyyy');
    if (!acc[month]) {
      acc[month] = { income: 0, expense: 0 };
    }
    if (t.type === 'income') {
      acc[month].income += t.amount;
    } else {
      acc[month].expense += t.amount;
    }
    return acc;
  }, {} as Record<string, { income: number; expense: number }>);

  const barChartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: 'Receitas',
        data: Object.values(monthlyData).map(d => d.income),
        backgroundColor: '#10B981',
      },
      {
        label: 'Despesas',
        data: Object.values(monthlyData).map(d => d.expense),
        backgroundColor: '#EF4444',
      },
    ],
  };

  const doughnutChartData = {
    labels: Object.keys(categoryExpenses),
    datasets: [
      {
        data: Object.values(categoryExpenses),
        backgroundColor: [
          '#10B981',
          '#3B82F6',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#EC4899',
        ],
      },
    ],
  };

  function generatePDF() {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título
    doc.setFontSize(20);
    doc.text('Relatório Financeiro', pageWidth / 2, 20, { align: 'center' });
    
    // Período
    doc.setFontSize(12);
    doc.text(
      `Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}`,
      pageWidth / 2,
      30,
      { align: 'center' }
    );
    
    // Resumo
    doc.setFontSize(14);
    doc.text('Resumo Financeiro', 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Receitas Totais: ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(totalIncome)}`, 20, 60);
    
    doc.text(`Despesas Totais: ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(totalExpense)}`, 20, 70);
    
    doc.text(`Saldo: ${new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(balance)}`, 20, 80);
    
    // Despesas por Categoria
    doc.setFontSize(14);
    doc.text('Despesas por Categoria', 20, 100);
    
    let y = 110;
    Object.entries(categoryExpenses).forEach(([category, amount]) => {
      doc.setFontSize(12);
      doc.text(`${category}: ${new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(amount)}`, 20, y);
      y += 10;
    });
    
    doc.save(`relatorio_financeiro_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  return (
    <div className="space-y-6"> ```tsx
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatórios</h2>
        <button
          onClick={generatePDF}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Download size={20} />
          <span>Exportar PDF</span>
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="input max-w-xs"
            value={period}
            onChange={e => handlePeriodChange(e.target.value)}
          >
            <option value="month">Último mês</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="year">Último ano</option>
          </select>

          <input
            type="date"
            className="input max-w-xs"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />

          <input
            type="date"
            className="input max-w-xs"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="card bg-green-50">
            <h3 className="text-lg font-semibold text-green-700">Receitas Totais</h3>
            <p className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalIncome)}
            </p>
          </div>

          <div className="card bg-red-50">
            <h3 className="text-lg font-semibold text-red-700">Despesas Totais</h3>
            <p className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(totalExpense)}
            </p>
          </div>

          <div className="card bg-blue-50">
            <h3 className="text-lg font-semibold text-blue-700">Saldo</h3>
            <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(balance)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Receitas vs Despesas</h3>
            <Bar data={barChartData} options={{ maintainAspectRatio: false }} height={300} />
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Despesas por Categoria</h3>
            <Doughnut data={doughnutChartData} options={{ maintainAspectRatio: false }} height={300} />
          </div>
        </div>
      </div>
    </div>
  );
}
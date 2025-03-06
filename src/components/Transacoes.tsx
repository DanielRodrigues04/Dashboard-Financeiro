import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '../lib/supabase';
import Papa from 'papaparse';

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  category_id: string;
  status: 'pending' | 'completed' | 'cancelled';
  category: {
    name: string;
    color: string;
  };
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

export default function Transacoes() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    category: 'all',
  });
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    category_id: '',
    status: 'completed',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchCategories();
  }, []);

  async function fetchTransactions() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        category:categories (
          name,
          color
        )
      `)
      .order('date', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações:', error);
      return;
    }

    setTransactions(data);
  }

  async function fetchCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      return;
    }

    setCategories(data);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const transaction = {
      ...formData,
      amount: parseFloat(formData.amount),
    };

    let error;
    if (editingId) {
      const { error: updateError } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', editingId);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert(transaction);
      error = insertError;
    }

    if (error) {
      console.error('Erro ao salvar transação:', error);
      return;
    }

    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      description: '',
      amount: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense',
      category_id: '',
      status: 'completed',
    });
    fetchTransactions();
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir transação:', error);
      return;
    }

    fetchTransactions();
  }

  function handleEdit(transaction: Transaction) {
    setFormData({
      description: transaction.description,
      amount: transaction.amount.toString(),
      date: transaction.date,
      type: transaction.type,
      category_id: transaction.category_id,
      status: transaction.status,
    });
    setEditingId(transaction.id);
    setIsModalOpen(true);
  }

  function exportToCSV() {
    const csv = Papa.unparse(transactions.map(t => ({
      Data: format(new Date(t.date), 'dd/MM/yyyy'),
      Descrição: t.description,
      Categoria: t.category.name,
      Valor: t.amount,
      Tipo: t.type === 'income' ? 'Receita' : 'Despesa',
      Status: t.status,
    })));

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  }

  const filteredTransactions = transactions.filter(t => {
    if (filters.type !== 'all' && t.type !== filters.type) return false;
    if (filters.category !== 'all' && t.category_id !== filters.category) return false;
    if (filters.startDate && t.date < filters.startDate) return false;
    if (filters.endDate && t.date > filters.endDate) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Transações</h2>
        <div className="space-x-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Transação</span>
          </button>
          <button
            onClick={exportToCSV}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <Download size={20} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            className="input max-w-xs"
            value={filters.type}
            onChange={e => setFilters({ ...filters, type: e.target.value })}
          >
            <option value="all">Todos os tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>

          <select
            className="input max

-w-xs"
            value={filters.category}
            onChange={e => setFilters({ ...filters, category: e.target.value })}
          >
            <option value="all">Todas as categorias</option>
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            className="input max-w-xs"
            value={filters.startDate}
            onChange={e => setFilters({ ...filters, startDate: e.target.value })}
          />

          <input
            type="date"
            className="input max-w-xs"
            value={filters.endDate}
            onChange={e => setFilters({ ...filters, endDate: e.target.value })}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pb-3">Data</th>
                <th className="pb-3">Descrição</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="border-b last:border-0">
                  <td className="py-3">
                    {format(new Date(transaction.date), 'dd/MM/yyyy')}
                  </td>
                  <td className="py-3">{transaction.description}</td>
                  <td className="py-3">
                    <span
                      className="px-2 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: `${transaction.category.color}20`,
                        color: transaction.category.color,
                      }}
                    >
                      {transaction.category.name}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(transaction.amount)}
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      transaction.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : transaction.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.status === 'completed' ? 'Concluído' :
                       transaction.status === 'pending' ? 'Pendente' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Edit size={18} className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 size={18} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingId ? 'Editar Transação' : 'Nova Transação'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descrição</label>
                <input
                  type="text"
                  className="input"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Valor</label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={formData.amount}
                  onChange={e => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Data</label>
                <input
                  type="date"
                  className="input"
                  value={formData.date}
                  onChange={e => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  className="input"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select
                  className="input"
                  value={formData.category_id}
                  onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories
                    .filter(c => c.type === formData.type)
                    .map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as 'pending' | 'completed' | 'cancelled' })}
                  required
                >
                  <option value="completed">Concluído</option>
                  <option value="pending">Pendente</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingId(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
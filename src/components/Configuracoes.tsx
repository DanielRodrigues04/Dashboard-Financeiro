import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Profile {
  full_name: string;
  email: string;
  currency: string;
}

interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

export default function Configuracoes() {
  const [profile, setProfile] = useState<Profile>({
    full_name: '',
    email: '',
    currency: 'BRL',
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    type: 'expense',
    color: '#000000',
    icon: '',
  });

  useEffect(() => {
    fetchProfile();
    fetchCategories();
  }, []);

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, email, currency')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Erro ao buscar perfil:', error);
      return;
    }

    setProfile(data);
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

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update(profile)
      .eq('id', user.id);

    if (error) {
      console.error('Erro ao atualizar perfil:', error);
      return;
    }

    alert('Perfil atualizado com sucesso!');
  }

  async function handleCategorySubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingCategory) {
      const { error } = await supabase
        .from('categories')
        .update(categoryForm)
        .eq('id', editingCategory);

      if (error) {
        console.error('Erro ao atualizar categoria:', error);
        return;
      }
    } else {
      const { error } = await supabase
        .from('categories')
        .insert(categoryForm);

      if (error) {
        console.error('Erro ao criar categoria:', error);
        return;
      }
    }

    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      type: 'expense',
      color: '#000000',
      icon: '',
    });
    fetchCategories();
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao excluir categoria:', error);
      return;
    }

    fetchCategories();
  }

  function handleEditCategory(category: Category) {
    setCategoryForm({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    });
    setEditingCategory(category.id);
    setIsCategoryModalOpen(true);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-6">Configurações</h2>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Perfil</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome Completo</label>
              <input
                type="text"
                className="input"
                value={profile.full_name}
                onChange={e => setProfile({ ...profile, full_name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                className="input"
                value={profile.email}
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Moeda</label>
              <select
                className="input"
                value={profile.currency}
                onChange={e => setProfile({ ...profile, currency: e.target.value })}
              >
                <option value="BRL">Real (BRL)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary">
              Salvar Alterações
            </button>
          </form>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Categorias</h3>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Nova Categoria</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map(category => (
            <div
              key={category.id}
              className="card flex items-center justify-between"
              style={{ borderLeft: `4px solid ${category.color}` }}
            >
              <div className="flex items-center space-x-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${category.color}20`, color: category.color }}
                >
                  {category.icon}
                </span>
                <div>
                  <h4 className="font-medium">{category.name}</h4>
                  <p className="text-sm text-gray-500">
                    {category.type === 'income' ? 'Receita' : 'Despesa'}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEditCategory(category)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Edit2 size={18} className="text-gray-600" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <Trash2 size={18} className="text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">
              {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
            </h3>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome</label>
                <input
                  type="text"
                  className="input"
                  value={categoryForm.name}
                  onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  className="input"
                  value={categoryForm.type}
                  onChange={e => setCategoryForm({ ...categoryForm, type: e.target.value as 'income' | 'expense' })}
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cor</label>
                <input
                  type="color"
                  className="w-full h-10 p-1 rounded border"
                  value={categoryForm.color}
                  onChange={e => setCategoryForm({ ...categoryForm, color: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Ícone</label>
                <input
                  type="text"
                  className="input"
                  value={categoryForm.icon}
                  onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                  placeholder="Nome do ícone"
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="btn btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
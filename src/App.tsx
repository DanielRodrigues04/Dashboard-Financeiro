import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LayoutDashboard, PieChart, Wallet, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './lib/supabase';
import Dashboard from './components/Dashboard';
import Transacoes from './components/Transacoes';
import Relatorios from './components/Relatorios';
import Configuracoes from './components/Configuracoes';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    navigate('/');
  }

  async function handleSignUp() {
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    alert('Verifique seu email para confirmar o cadastro!');
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            Dashboard Financeiro
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Faça login para acessar sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              required
              className="input mt-1"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <input
              type="password"
              required
              className="input mt-1"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Carregando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="btn btn-secondary w-full"
            >
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Sidebar() {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="h-screen w-64 bg-gray-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-8">Dashboard Financeiro</h1>
      <nav className="space-y-4">
        <button onClick={() => navigate('/')} className="flex items-center space-x-3 w-full p-2 rounded hover:bg-gray-800">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </button>
        <button onClick={() => navigate('/transacoes')} className="flex items-center space-x-3 w-full p-2 rounded hover:bg-gray-800">
          <Wallet size={20} />
          <span>Transações</span>
        </button>
        <button onClick={() => navigate('/relatorios')} className="flex items-center space-x-3 w-full p-2 rounded hover:bg-gray-800">
          <PieChart size={20} />
          <span>Relatórios</span>
        </button>
        <button onClick={() => navigate('/configuracoes')} className="flex items-center space-x-3 w-full p-2 rounded hover:bg-gray-800">
          <Settings size={20} />
          <span>Configurações</span>
        </button>
        <button onClick={handleLogout} className="flex items-center space-x-3 w-full p-2 rounded hover:bg-gray-800 mt-auto">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </nav>
    </div>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-8 bg-gray-100">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <Layout>
            <Dashboard />
          </Layout>
        } />
        <Route path="/transacoes" element={
          <Layout>
            <Transacoes />
          </Layout>
        } />
        <Route path="/relatorios" element={
          <Layout>
            <Relatorios />
          </Layout>
        } />
        <Route path="/configuracoes" element={
          <Layout>
            <Configuracoes />
          </Layout>
        } />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
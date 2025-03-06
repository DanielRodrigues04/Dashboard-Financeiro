/*
  # Esquema Inicial do Dashboard Financeiro

  1. Novas Tabelas
    - `profiles`
      - Informações do perfil do usuário
      - Vinculado à tabela auth.users do Supabase
    - `transactions`
      - Registro de transações financeiras
      - Vinculado ao perfil do usuário
    - `categories`
      - Categorias para classificação de transações
    - `budgets`
      - Orçamentos definidos por categoria
    
  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas de acesso baseadas no usuário autenticado
*/

-- Profiles table
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  currency text DEFAULT 'BRL',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Categories table
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text,
  icon text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own categories"
  ON categories FOR ALL
  USING (auth.uid() = user_id);

-- Transactions table
CREATE TABLE transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  category_id uuid REFERENCES categories(id),
  description text NOT NULL,
  amount decimal(12,2) NOT NULL,
  date date NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id);

-- Budgets table
CREATE TABLE budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id),
  category_id uuid REFERENCES categories(id),
  amount decimal(12,2) NOT NULL,
  period text NOT NULL CHECK (period IN ('monthly', 'yearly')),
  start_date date NOT NULL,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own budgets"
  ON budgets FOR ALL
  USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
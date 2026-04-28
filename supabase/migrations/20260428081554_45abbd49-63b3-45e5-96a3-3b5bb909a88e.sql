
-- Categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  monthly_limit NUMERIC(14,2),
  color TEXT NOT NULL DEFAULT 'hsl(217 91% 60%)',
  icon TEXT NOT NULL DEFAULT 'Tag',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own categories" ON public.categories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own categories" ON public.categories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own categories" ON public.categories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own categories" ON public.categories FOR DELETE USING (auth.uid() = user_id);

-- Transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  source TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_transactions_user_date ON public.transactions(user_id, date DESC);
CREATE INDEX idx_categories_user ON public.categories(user_id);

-- Auto-seed default categories on signup
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, color, icon) VALUES
    (NEW.id, 'Food', 'hsl(25 95% 60%)', 'UtensilsCrossed'),
    (NEW.id, 'Transport', 'hsl(217 91% 60%)', 'Car'),
    (NEW.id, 'Shopping', 'hsl(330 81% 65%)', 'ShoppingBag'),
    (NEW.id, 'Bills', 'hsl(45 93% 58%)', 'Receipt'),
    (NEW.id, 'Entertainment', 'hsl(280 85% 65%)', 'Film'),
    (NEW.id, 'Others', 'hsl(220 9% 60%)', 'MoreHorizontal');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_seed_categories
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.seed_default_categories();

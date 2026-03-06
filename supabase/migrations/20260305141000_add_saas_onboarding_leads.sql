CREATE TABLE IF NOT EXISTS public.saas_onboarding_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  cpf_cnpj TEXT,
  team_size TEXT,
  use_case TEXT,
  plan_id TEXT NOT NULL CHECK (plan_id IN ('starter', 'pro', 'scale')),
  plan_amount NUMERIC(12,2) NOT NULL,
  billing_method TEXT NOT NULL CHECK (billing_method IN ('pix', 'boleto', 'cartao')),
  billing_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN ('initiated', 'checkout_created', 'failed')),
  checkout_url TEXT,
  asaas_customer_id TEXT,
  asaas_payment_id TEXT,
  utm JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saas_onboarding_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding leads"
ON public.saas_onboarding_leads
FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saas_onboarding_leads_email
  ON public.saas_onboarding_leads (email);

CREATE INDEX IF NOT EXISTS idx_saas_onboarding_leads_status_created
  ON public.saas_onboarding_leads (status, created_at DESC);

DROP TRIGGER IF EXISTS update_saas_onboarding_leads_updated_at ON public.saas_onboarding_leads;
CREATE TRIGGER update_saas_onboarding_leads_updated_at
  BEFORE UPDATE ON public.saas_onboarding_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

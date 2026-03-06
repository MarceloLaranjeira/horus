ALTER TABLE public.saas_onboarding_leads
  DROP CONSTRAINT IF EXISTS saas_onboarding_leads_plan_id_check;

ALTER TABLE public.saas_onboarding_leads
  ADD CONSTRAINT saas_onboarding_leads_plan_id_check
  CHECK (plan_id IN ('starter', 'pro', 'scale', 'horus'));

ALTER TABLE public.saas_onboarding_leads
  ADD COLUMN IF NOT EXISTS access_mode TEXT NOT NULL DEFAULT 'checkout',
  ADD COLUMN IF NOT EXISTS access_email TEXT,
  ADD COLUMN IF NOT EXISTS asaas_subscription_id TEXT;

ALTER TABLE public.saas_onboarding_leads
  DROP CONSTRAINT IF EXISTS saas_onboarding_leads_access_mode_check;

ALTER TABLE public.saas_onboarding_leads
  ADD CONSTRAINT saas_onboarding_leads_access_mode_check
  CHECK (access_mode IN ('login', 'sales_page', 'checkout'));

CREATE INDEX IF NOT EXISTS idx_saas_onboarding_leads_subscription
  ON public.saas_onboarding_leads (asaas_subscription_id);

CREATE INDEX IF NOT EXISTS idx_saas_onboarding_leads_access_mode
  ON public.saas_onboarding_leads (access_mode, created_at DESC);

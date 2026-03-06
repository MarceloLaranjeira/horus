ALTER TABLE public.saas_onboarding_leads
  DROP CONSTRAINT IF EXISTS saas_onboarding_leads_status_check;

ALTER TABLE public.saas_onboarding_leads
  ADD CONSTRAINT saas_onboarding_leads_status_check
  CHECK (
    status IN (
      'initiated',
      'checkout_created',
      'payment_pending',
      'paid',
      'overdue',
      'refunded',
      'cancelled',
      'failed'
    )
  );

ALTER TABLE public.saas_onboarding_leads
  ADD COLUMN IF NOT EXISTS payment_status TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payment_received_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.saas_payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asaas_event_id TEXT NOT NULL UNIQUE,
  asaas_payment_id TEXT,
  asaas_customer_id TEXT,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saas_payment_events_payment_id
  ON public.saas_payment_events (asaas_payment_id);

CREATE INDEX IF NOT EXISTS idx_saas_onboarding_payment_status
  ON public.saas_onboarding_leads (status, payment_status);
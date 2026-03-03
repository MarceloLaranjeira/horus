
-- Create table for WhatsApp messages
CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  contact_phone text NOT NULL,
  contact_name text,
  direction text NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_text text NOT NULL,
  wa_message_id text,
  status text DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own whatsapp_messages"
ON public.whatsapp_messages FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_whatsapp_messages_user_contact ON public.whatsapp_messages(user_id, contact_phone, created_at DESC);

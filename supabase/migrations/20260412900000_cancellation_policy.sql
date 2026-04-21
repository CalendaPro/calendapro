-- Create payments table if not exists
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pro_id text REFERENCES profiles(id) ON DELETE CASCADE,
  booking_id uuid,
  stripe_session_id text,
  client_email text,
  client_name text,
  amount integer NOT NULL,
  type text DEFAULT 'deposit',
  status text DEFAULT 'paid',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_pro_id ON payments(pro_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own payments" ON payments;
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (pro_id = auth.uid()::text);

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS allow_cancellations boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS cancellation_delay text DEFAULT '24h',
  ADD COLUMN IF NOT EXISTS cancellation_delay_custom_value integer,
  ADD COLUMN IF NOT EXISTS cancellation_delay_custom_unit text DEFAULT 'hours',
  ADD COLUMN IF NOT EXISTS keep_deposit_on_late_cancellation boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_reschedule boolean DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS auto_send_receipt_to_client boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS auto_send_receipt_to_pro boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS receipt_custom_message text;
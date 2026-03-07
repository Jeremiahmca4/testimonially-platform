-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS user_plans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  plan            text NOT NULL DEFAULT 'trial'
                  CHECK (plan IN ('trial','starter','growth','pro')),
  syncs_used      int  NOT NULL DEFAULT 0,
  period_start    timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plan"
  ON user_plans FOR SELECT USING (auth.uid() = user_id);

-- Auto-create trial plan on signup
CREATE OR REPLACE FUNCTION create_user_plan()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_plans (user_id, plan)
  VALUES (NEW.id, 'trial')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_plan();

-- To manually upgrade a user (run as needed):
-- UPDATE user_plans SET plan = 'starter' WHERE user_id = 'USER_UUID_HERE';
-- UPDATE user_plans SET plan = 'growth'  WHERE user_id = 'USER_UUID_HERE';
-- UPDATE user_plans SET plan = 'pro'     WHERE user_id = 'USER_UUID_HERE';

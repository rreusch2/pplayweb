-- Stripe Subscription Management Schema Updates
-- Run this when you're ready to enhance your database schema

-- Add missing Stripe-specific columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT,
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ;

-- Create stripe_webhook_events table for audit trail
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for efficient webhook processing
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_processed ON stripe_webhook_events(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_type ON stripe_webhook_events(type);

-- Create stripe_customers table for customer mapping
CREATE TABLE IF NOT EXISTS stripe_customers (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create subscription_history table for tracking changes
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  from_tier TEXT,
  to_tier TEXT NOT NULL,
  from_plan_type TEXT,
  to_plan_type TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  change_reason TEXT, -- 'upgrade', 'downgrade', 'renewal', 'cancellation', 'payment_failed'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_subscription_id ON profiles(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_expires_at ON profiles(subscription_expires_at);
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

-- Function to log subscription changes
CREATE OR REPLACE FUNCTION log_subscription_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if subscription-related fields changed
  IF (OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) OR
     (OLD.subscription_plan_type IS DISTINCT FROM NEW.subscription_plan_type) OR
     (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status) THEN
    
    INSERT INTO subscription_history (
      user_id,
      from_tier,
      to_tier,
      from_plan_type,
      to_plan_type,
      stripe_subscription_id,
      stripe_price_id,
      change_reason,
      metadata
    ) VALUES (
      NEW.id,
      OLD.subscription_tier,
      NEW.subscription_tier,
      OLD.subscription_plan_type,
      NEW.subscription_plan_type,
      NEW.stripe_subscription_id,
      NEW.stripe_price_id,
      CASE 
        WHEN OLD.subscription_tier = 'free' AND NEW.subscription_tier IN ('pro', 'elite') THEN 'upgrade'
        WHEN OLD.subscription_tier IN ('pro', 'elite') AND NEW.subscription_tier = 'free' THEN 'downgrade'
        WHEN OLD.subscription_tier = 'pro' AND NEW.subscription_tier = 'elite' THEN 'upgrade'
        WHEN OLD.subscription_tier = 'elite' AND NEW.subscription_tier = 'pro' THEN 'downgrade'
        WHEN NEW.subscription_status = 'canceled' THEN 'cancellation'
        WHEN OLD.subscription_status = 'past_due' AND NEW.subscription_status = 'active' THEN 'renewal'
        ELSE 'update'
      END,
      jsonb_build_object(
        'old_status', OLD.subscription_status,
        'new_status', NEW.subscription_status,
        'old_expires_at', OLD.subscription_expires_at,
        'new_expires_at', NEW.subscription_expires_at
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subscription change logging
DROP TRIGGER IF EXISTS trigger_log_subscription_change ON profiles;
CREATE TRIGGER trigger_log_subscription_change
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION log_subscription_change();

-- Create view for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
  subscription_tier,
  subscription_plan_type,
  COUNT(*) as user_count,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_count,
  COUNT(CASE WHEN subscription_expires_at > NOW() THEN 1 END) as non_expired_count,
  AVG(CASE WHEN subscription_started_at IS NOT NULL THEN 
    EXTRACT(EPOCH FROM (NOW() - subscription_started_at)) / 86400 
  END) as avg_subscription_days
FROM profiles 
GROUP BY subscription_tier, subscription_plan_type;

-- Create function to get user subscription info (for API)
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  tier TEXT,
  status TEXT,
  plan_type TEXT,
  expires_at TIMESTAMPTZ,
  max_daily_picks INTEGER,
  is_active BOOLEAN,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.subscription_tier,
    p.subscription_status,
    p.subscription_plan_type,
    p.subscription_expires_at,
    p.max_daily_picks,
    (p.subscription_status = 'active' AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW())) as is_active,
    p.stripe_customer_id,
    p.stripe_subscription_id
  FROM profiles p
  WHERE p.id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON stripe_webhook_events TO your_app_user;
-- GRANT SELECT, INSERT ON subscription_history TO your_app_user;
-- GRANT SELECT ON subscription_analytics TO your_app_user;

-- Add comments for documentation
COMMENT ON TABLE stripe_webhook_events IS 'Audit trail for Stripe webhook events';
COMMENT ON TABLE subscription_history IS 'Historical log of subscription changes';
COMMENT ON VIEW subscription_analytics IS 'Real-time subscription metrics and analytics';
COMMENT ON FUNCTION get_user_subscription IS 'Get comprehensive subscription info for a user';

-- Example queries for subscription management:

-- Get all users with expired subscriptions
-- SELECT id, email, subscription_tier, subscription_expires_at 
-- FROM profiles 
-- WHERE subscription_expires_at < NOW() AND subscription_tier != 'free';

-- Get subscription revenue potential
-- SELECT 
--   subscription_tier,
--   subscription_plan_type,
--   COUNT(*) * CASE 
--     WHEN subscription_plan_type = 'week' AND subscription_tier = 'pro' THEN 9.99
--     WHEN subscription_plan_type = 'month' AND subscription_tier = 'pro' THEN 24.99
--     WHEN subscription_plan_type = 'year' AND subscription_tier = 'pro' THEN 149.99
--     WHEN subscription_plan_type = 'week' AND subscription_tier = 'elite' THEN 14.99
--     WHEN subscription_plan_type = 'month' AND subscription_tier = 'elite' THEN 29.99
--     WHEN subscription_plan_type = 'year' AND subscription_tier = 'elite' THEN 199.99
--     ELSE 0
--   END as potential_revenue
-- FROM profiles 
-- WHERE subscription_status = 'active'
-- GROUP BY subscription_tier, subscription_plan_type;

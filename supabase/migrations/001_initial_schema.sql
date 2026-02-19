-- Users table (mapped by Solana wallet address)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT UNIQUE NOT NULL,
  free_requests_remaining INTEGER DEFAULT 10 NOT NULL,
  usdc_balance DECIMAL(20, 6) DEFAULT 0 NOT NULL,
  total_spent DECIMAL(20, 6) DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast wallet lookup
CREATE INDEX idx_users_wallet_address ON users(wallet_address);

-- API usage tracking (token usage and costs)
CREATE TABLE IF NOT EXISTS api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  request_type TEXT NOT NULL,

  -- Token usage
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  -- Cost calculation (in USD)
  input_cost DECIMAL(20, 8) DEFAULT 0,
  output_cost DECIMAL(20, 8) DEFAULT 0,
  total_cost DECIMAL(20, 8) DEFAULT 0,

  -- Request metadata
  is_free_request BOOLEAN DEFAULT FALSE,
  conversation_id TEXT,
  endpoint TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for api_usage
CREATE INDEX idx_api_usage_user_id ON api_usage(user_id);
CREATE INDEX idx_api_usage_created_at ON api_usage(created_at);
CREATE INDEX idx_api_usage_model ON api_usage(model);

-- USDC transactions (deposits and usage)
CREATE TABLE IF NOT EXISTS usdc_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount DECIMAL(20, 6) NOT NULL,

  -- Solana transaction details
  signature TEXT UNIQUE,
  from_address TEXT,
  to_address TEXT,

  -- Related to API usage
  api_usage_id UUID REFERENCES api_usage(id),

  -- Balance tracking
  balance_before DECIMAL(20, 6) NOT NULL,
  balance_after DECIMAL(20, 6) NOT NULL,

  status TEXT DEFAULT 'pending',
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for usdc_transactions
CREATE INDEX idx_usdc_transactions_user_id ON usdc_transactions(user_id);
CREATE INDEX idx_usdc_transactions_signature ON usdc_transactions(signature);
CREATE INDEX idx_usdc_transactions_created_at ON usdc_transactions(created_at);

-- Model pricing table (USD per 1M tokens)
CREATE TABLE IF NOT EXISTS model_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name TEXT UNIQUE NOT NULL,
  provider TEXT NOT NULL,

  -- Pricing per 1M tokens
  input_price_per_1m DECIMAL(10, 4) NOT NULL,
  output_price_per_1m DECIMAL(10, 4) NOT NULL,

  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert Claude pricing (Anthropic models only)
INSERT INTO model_pricing (model_name, provider, input_price_per_1m, output_price_per_1m) VALUES
  ('claude-opus-4-5-20251101', 'anthropic', 5.00, 25.00),
  ('claude-sonnet-4-5-20250929', 'anthropic', 3.00, 15.00),
  ('claude-haiku-4-5-20251001', 'anthropic', 1.00, 5.00)
ON CONFLICT (model_name) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for model_pricing table
CREATE TRIGGER update_model_pricing_updated_at
  BEFORE UPDATE ON model_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate API cost
CREATE OR REPLACE FUNCTION calculate_api_cost(
  p_model TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER
) RETURNS TABLE (
  input_cost DECIMAL(20, 8),
  output_cost DECIMAL(20, 8),
  total_cost DECIMAL(20, 8)
) AS $$
DECLARE
  v_input_price DECIMAL(10, 4);
  v_output_price DECIMAL(10, 4);
  v_input_cost DECIMAL(20, 8);
  v_output_cost DECIMAL(20, 8);
BEGIN
  -- Get pricing for model
  SELECT input_price_per_1m, output_price_per_1m
  INTO v_input_price, v_output_price
  FROM model_pricing
  WHERE model_name = p_model AND is_active = TRUE
  LIMIT 1;

  -- If model not found, use default pricing (Sonnet)
  IF v_input_price IS NULL THEN
    v_input_price := 3.00;
    v_output_price := 15.00;
  END IF;

  -- Calculate costs (price per 1M tokens)
  v_input_cost := (p_input_tokens::DECIMAL / 1000000) * v_input_price;
  v_output_cost := (p_output_tokens::DECIMAL / 1000000) * v_output_price;

  RETURN QUERY SELECT
    v_input_cost,
    v_output_cost,
    v_input_cost + v_output_cost;
END;
$$ LANGUAGE plpgsql;

-- Function to process API request (check balance and create usage record)
CREATE OR REPLACE FUNCTION process_api_request(
  p_wallet_address TEXT,
  p_model TEXT,
  p_request_type TEXT,
  p_input_tokens INTEGER,
  p_output_tokens INTEGER,
  p_conversation_id TEXT DEFAULT NULL,
  p_endpoint TEXT DEFAULT NULL
) RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  usage_id UUID,
  is_free BOOLEAN,
  cost DECIMAL(20, 8)
) AS $$
DECLARE
  v_user_id UUID;
  v_free_requests INTEGER;
  v_usdc_balance DECIMAL(20, 6);
  v_is_free BOOLEAN := FALSE;
  v_total_cost DECIMAL(20, 8);
  v_input_cost DECIMAL(20, 8);
  v_output_cost DECIMAL(20, 8);
  v_usage_id UUID;
BEGIN
  -- Get or create user
  INSERT INTO users (wallet_address)
  VALUES (p_wallet_address)
  ON CONFLICT (wallet_address) DO NOTHING;

  SELECT id, free_requests_remaining, usdc_balance
  INTO v_user_id, v_free_requests, v_usdc_balance
  FROM users
  WHERE wallet_address = p_wallet_address;

  -- Calculate cost
  SELECT * INTO v_input_cost, v_output_cost, v_total_cost
  FROM calculate_api_cost(p_model, p_input_tokens, p_output_tokens);

  -- Check if can use free request
  IF v_free_requests > 0 THEN
    v_is_free := TRUE;
    UPDATE users
    SET free_requests_remaining = free_requests_remaining - 1
    WHERE id = v_user_id;
  ELSE
    -- Check USDC balance
    IF v_usdc_balance < v_total_cost THEN
      RETURN QUERY SELECT FALSE, 'Insufficient USDC balance', NULL::UUID, FALSE, v_total_cost;
      RETURN;
    END IF;

    -- Deduct from balance
    UPDATE users
    SET usdc_balance = usdc_balance - v_total_cost,
        total_spent = total_spent + v_total_cost
    WHERE id = v_user_id;
  END IF;

  -- Create usage record
  INSERT INTO api_usage (
    user_id, model, request_type,
    input_tokens, output_tokens, total_tokens,
    input_cost, output_cost, total_cost,
    is_free_request, conversation_id, endpoint
  ) VALUES (
    v_user_id, p_model, p_request_type,
    p_input_tokens, p_output_tokens, p_input_tokens + p_output_tokens,
    v_input_cost, v_output_cost, v_total_cost,
    v_is_free, p_conversation_id, p_endpoint
  ) RETURNING id INTO v_usage_id;

  -- Create transaction record if paid
  IF NOT v_is_free THEN
    INSERT INTO usdc_transactions (
      user_id, transaction_type, amount,
      api_usage_id,
      balance_before, balance_after,
      status
    ) VALUES (
      v_user_id, 'usage', v_total_cost,
      v_usage_id,
      v_usdc_balance, v_usdc_balance - v_total_cost,
      'confirmed'
    );
  END IF;

  RETURN QUERY SELECT TRUE, 'Request processed successfully', v_usage_id, v_is_free, v_total_cost;
END;
$$ LANGUAGE plpgsql;

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE usdc_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users can only see their own data)
CREATE POLICY users_select_own ON users
  FOR SELECT USING (wallet_address = current_setting('app.wallet_address', TRUE));

CREATE POLICY api_usage_select_own ON api_usage
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', TRUE)));

CREATE POLICY usdc_transactions_select_own ON usdc_transactions
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE wallet_address = current_setting('app.wallet_address', TRUE)));

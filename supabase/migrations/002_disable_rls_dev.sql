-- DEVELOPMENT ONLY: Disable RLS for all tables
-- WARNING: This allows anyone with your service key to access all data
-- Only use this in development, NEVER in production

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage DISABLE ROW LEVEL SECURITY;
ALTER TABLE usdc_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE model_pricing DISABLE ROW LEVEL SECURITY;

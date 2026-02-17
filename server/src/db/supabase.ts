import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: SUPABASE_URL or SUPABASE_ANON_KEY');
}

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          wallet_address: string;
          free_requests_remaining: number;
          usdc_balance: number;
          total_spent: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wallet_address: string;
          free_requests_remaining?: number;
          usdc_balance?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wallet_address?: string;
          free_requests_remaining?: number;
          usdc_balance?: number;
          total_spent?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      api_usage: {
        Row: {
          id: string;
          user_id: string;
          model: string;
          request_type: string;
          input_tokens: number;
          output_tokens: number;
          total_tokens: number;
          input_cost: number;
          output_cost: number;
          total_cost: number;
          is_free_request: boolean;
          conversation_id: string | null;
          endpoint: string | null;
          status: string;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          model: string;
          request_type: string;
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          input_cost?: number;
          output_cost?: number;
          total_cost?: number;
          is_free_request?: boolean;
          conversation_id?: string | null;
          endpoint?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          model?: string;
          request_type?: string;
          input_tokens?: number;
          output_tokens?: number;
          total_tokens?: number;
          input_cost?: number;
          output_cost?: number;
          total_cost?: number;
          is_free_request?: boolean;
          conversation_id?: string | null;
          endpoint?: string | null;
          status?: string;
          error_message?: string | null;
          created_at?: string;
        };
      };
      usdc_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: string;
          amount: number;
          signature: string | null;
          from_address: string | null;
          to_address: string | null;
          api_usage_id: string | null;
          balance_before: number;
          balance_after: number;
          status: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: string;
          amount: number;
          signature?: string | null;
          from_address?: string | null;
          to_address?: string | null;
          api_usage_id?: string | null;
          balance_before: number;
          balance_after: number;
          status?: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: string;
          amount?: number;
          signature?: string | null;
          from_address?: string | null;
          to_address?: string | null;
          api_usage_id?: string | null;
          balance_before?: number;
          balance_after?: number;
          status?: string;
          metadata?: any;
          created_at?: string;
        };
      };
      model_pricing: {
        Row: {
          id: string;
          model_name: string;
          provider: string;
          input_price_per_1m: number;
          output_price_per_1m: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          model_name: string;
          provider: string;
          input_price_per_1m: number;
          output_price_per_1m: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          model_name?: string;
          provider?: string;
          input_price_per_1m?: number;
          output_price_per_1m?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      calculate_api_cost: {
        Args: {
          p_model: string;
          p_input_tokens: number;
          p_output_tokens: number;
        };
        Returns: {
          input_cost: number;
          output_cost: number;
          total_cost: number;
        }[];
      };
      process_api_request: {
        Args: {
          p_wallet_address: string;
          p_model: string;
          p_request_type: string;
          p_input_tokens: number;
          p_output_tokens: number;
          p_conversation_id?: string;
          p_endpoint?: string;
        };
        Returns: {
          success: boolean;
          message: string;
          usage_id: string | null;
          is_free: boolean;
          cost: number;
        }[];
      };
    };
  };
}

// Create Supabase client (untyped to avoid schema mismatch errors)
export const supabase = createClient(supabaseUrl, supabaseAnonKey) as any;

// Helper functions for database operations
export const db = {
  // Get or create user by wallet address
  async getOrCreateUser(walletAddress: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .single();

    if (error && error.code === 'PGRST116') {
      // User doesn't exist, create new one
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ wallet_address: walletAddress })
        .select()
        .single();

      if (createError) throw createError;
      return newUser;
    }

    if (error) throw error;
    return data;
  },

  // Process API request (uses PostgreSQL function)
  async processApiRequest(params: {
    walletAddress: string;
    model: string;
    requestType: string;
    inputTokens: number;
    outputTokens: number;
    conversationId?: string;
    endpoint?: string;
  }) {
    const { data, error } = await supabase.rpc('process_api_request', {
      p_wallet_address: params.walletAddress,
      p_model: params.model,
      p_request_type: params.requestType,
      p_input_tokens: params.inputTokens,
      p_output_tokens: params.outputTokens,
      p_conversation_id: params.conversationId || null,
      p_endpoint: params.endpoint || null
    });

    if (error) throw error;
    return data[0]; // Returns { success, message, usage_id, is_free, cost }
  },

  // Calculate API cost (uses PostgreSQL function)
  async calculateCost(model: string, inputTokens: number, outputTokens: number) {
    const { data, error } = await supabase.rpc('calculate_api_cost', {
      p_model: model,
      p_input_tokens: inputTokens,
      p_output_tokens: outputTokens
    });

    if (error) throw error;
    return data[0]; // Returns { input_cost, output_cost, total_cost }
  },

  // Add USDC deposit
  async addUsdcDeposit(params: {
    walletAddress: string;
    amount: number;
    signature: string;
    fromAddress: string;
    toAddress: string;
  }) {
    // Get user
    const user = await this.getOrCreateUser(params.walletAddress);

    // Create transaction record
    const { data, error } = await supabase
      .from('usdc_transactions')
      .insert({
        user_id: user.id,
        transaction_type: 'deposit',
        amount: params.amount,
        signature: params.signature,
        from_address: params.fromAddress,
        to_address: params.toAddress,
        balance_before: user.usdc_balance,
        balance_after: user.usdc_balance + params.amount,
        status: 'confirmed'
      })
      .select()
      .single();

    if (error) throw error;

    // Update user balance
    await supabase
      .from('users')
      .update({ usdc_balance: user.usdc_balance + params.amount })
      .eq('id', user.id);

    return data;
  },

  // Get user statistics
  async getUserStats(walletAddress: string) {
    const user = await this.getOrCreateUser(walletAddress);

    // Get total usage stats
    const { data: usageStats, error: usageError } = await supabase
      .from('api_usage')
      .select('total_tokens, total_cost, is_free_request')
      .eq('user_id', user.id);

    if (usageError) throw usageError;

    const totalTokens = usageStats?.reduce((sum: number, u: any) => sum + u.total_tokens, 0) || 0;
    const totalCost = usageStats?.reduce((sum: number, u: any) => sum + u.total_cost, 0) || 0;
    const freeRequests = usageStats?.filter((u: any) => u.is_free_request).length || 0;
    const paidRequests = usageStats?.filter((u: any) => !u.is_free_request).length || 0;

    return {
      user,
      stats: {
        totalRequests: usageStats?.length || 0,
        freeRequests,
        paidRequests,
        totalTokens,
        totalCost,
        freeRequestsRemaining: user.free_requests_remaining
      }
    };
  },

  // Get API usage history
  async getUsageHistory(walletAddress: string, limit: number = 50) {
    const user = await this.getOrCreateUser(walletAddress);

    const { data, error } = await supabase
      .from('api_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Get transaction history
  async getTransactionHistory(walletAddress: string, limit: number = 50) {
    const user = await this.getOrCreateUser(walletAddress);

    const { data, error } = await supabase
      .from('usdc_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Check if a deposit signature already exists (prevent double-spend)
  async getDepositBySignature(signature: string) {
    const { data, error } = await supabase
      .from('usdc_transactions')
      .select('id')
      .eq('signature', signature)
      .single();

    if (error && error.code === 'PGRST116') return null; // not found
    if (error) throw error;
    return data;
  },

  // Expose supabase client for advanced queries
  supabase,
};

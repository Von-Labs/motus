"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Verify Supabase DB has required tables and functions.
 * Run from server root: pnpm run verify-db
 */
require("dotenv/config");
const supabase_1 = require("../src/db/supabase");
const REQUIRED_TABLES = ['users', 'api_usage', 'usdc_transactions', 'model_pricing'];
const REQUIRED_RPC = ['calculate_api_cost', 'process_api_request'];
async function main() {
    console.log('Checking Supabase connection and schema...\n');
    const missing = [];
    // 1) Check tables exist (select limit 0 or 1)
    for (const table of REQUIRED_TABLES) {
        const { error } = await supabase_1.supabase.from(table).select('id').limit(1);
        if (error) {
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
                missing.push(`Table: ${table}`);
            }
            else {
                console.warn(`Table ${table}: ${error.message}`);
            }
        }
    }
    // 2) Check RPC calculate_api_cost (also needs model_pricing data)
    const { data: costData, error: costError } = await supabase_1.supabase.rpc('calculate_api_cost', {
        p_model: 'claude-sonnet-4-5-20250929',
        p_input_tokens: 0,
        p_output_tokens: 0
    });
    if (costError) {
        missing.push('Function: calculate_api_cost');
    }
    else if (!costData?.[0]) {
        missing.push('Function: calculate_api_cost (no row returned)');
    }
    // 3) Check getOrCreateUser (uses users table)
    try {
        const user = await supabase_1.db.getOrCreateUser('verify-db-check-' + Date.now());
        if (!user?.id)
            missing.push('Table: users (getOrCreateUser returned no user)');
    }
    catch (e) {
        missing.push('Table/users logic: ' + (e?.message || String(e)));
    }
    if (missing.length > 0) {
        console.error('Missing or invalid:\n  ' + missing.join('\n  '));
        console.error('\nRun migrations: SQL Editor → paste migrations/001_initial_schema.sql → Run');
        process.exit(1);
    }
    console.log('OK – Required tables and functions are present.');
    console.log('  Tables: ' + REQUIRED_TABLES.join(', '));
    console.log('  RPC: ' + REQUIRED_RPC.join(', '));
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});

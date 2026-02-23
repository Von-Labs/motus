/**
 * Test POST /api/sends/prepare for mainnet tokens (no real send).
 *
 * Modes:
 *   1. Static list only:  node scripts/test-send-prepare.js
 *   2. Jupiter tokens:   USE_JUPITER=1 node scripts/test-send-prepare.js
 *      Fetches tokens from GET /api/sends/tokens (Jupiter search) with many queries,
 *      dedupes, then runs prepare for each.
 *
 * Optional env: SENDER=... RECIPIENT=... API_URL=http://localhost:3050
 */

const BASE = process.env.API_URL || 'http://localhost:3050';
const SENDER = process.env.SENDER || '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU';
const RECIPIENT = process.env.RECIPIENT || '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYvAWrx';
const USE_JUPITER = process.env.USE_JUPITER === '1' || process.env.USE_JUPITER === 'true' || process.argv.includes('jupiter');

const MAINNET_TOKENS_STATIC = [
  { name: 'SOL', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', cluster: 'mainnet-beta' } },
  { name: 'USDC', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'USDT', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'BONK', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, cluster: 'mainnet-beta' } },
  { name: 'RAY', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'mSOL', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', decimals: 9, cluster: 'mainnet-beta' } },
  { name: 'JUP', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'stSOL', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', decimals: 9, cluster: 'mainnet-beta' } },
  { name: 'JitoSOL', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn', decimals: 9, cluster: 'mainnet-beta' } },
  { name: 'PYTH', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'WIF', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'ORCA', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'MNGO', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'STEP', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'StepAscQoEioFxx2nhGKUVuRa1KNHYFbpnk9QzU9o2d', decimals: 9, cluster: 'mainnet-beta' } },
  { name: 'COPE', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh', decimals: 6, cluster: 'mainnet-beta' } },
  { name: 'RENDER', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', decimals: 8, cluster: 'mainnet-beta' } },
];

// Search queries to fetch tokens from Jupiter via GET /api/sends/tokens
const JUPITER_SEARCH_QUERIES = [
  ...'abcdefghijklmnopqrstuvwxyz'.split(''),
  ...'0123456789'.split(''),
  'usd', 'sol', 'bonk', 'jup', 'ray', 'token', 'wrapped', 'staked', 'eth', 'btc',
  'dai', 'matic', 'avax', 'link', 'uni', 'aave', 'sushi', 'crv', 'comp', 'mkr',
  'pepe', 'doge', 'shib', 'floki', 'apt', 'arb', 'op', 'sei', 'sui', 'inj',
  'tia', 'strk', 'ftm', 'near', 'atom', 'luna', 'ada', 'xrp', 'dot', 'mana',
  'sand', 'axs', 'gala', 'ape', 'imx', 'ldo', 'ens', 'grt', 'bal', '1inch',
];

async function fetchJupiterTokens() {
  const byAddress = new Map();
  for (const q of JUPITER_SEARCH_QUERIES) {
    try {
      const res = await fetch(`${BASE}/api/sends/tokens?query=${encodeURIComponent(q)}`);
      if (!res.ok) continue;
      const list = await res.json();
      if (!Array.isArray(list)) continue;
      for (const t of list) {
        const addr = t.address || t.id || t.mint;
        if (!addr || addr.length < 32) continue;
        const decimals = typeof t.decimals === 'number' ? t.decimals : 6;
        const symbol = (t.symbol || '?').slice(0, 12);
        if (!byAddress.has(addr)) byAddress.set(addr, { symbol, name: t.name, decimals });
      }
    } catch (_) {}
  }
  return Array.from(byAddress.entries()).map(([address, { symbol, decimals }]) => ({
    name: symbol,
    body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', mint: address, decimals, cluster: 'mainnet-beta' },
  }));
}

async function run() {
  let tokens = MAINNET_TOKENS_STATIC;
  if (USE_JUPITER) {
    console.log('Fetching tokens from Jupiter (GET /api/sends/tokens)...\n');
    const jupiterTokens = await fetchJupiterTokens();
    tokens = [
      { name: 'SOL', body: { sender: SENDER, recipient: RECIPIENT, amount: '1000', cluster: 'mainnet-beta' } },
      ...jupiterTokens,
    ];
    console.log(`Loaded ${tokens.length} tokens (1 SOL + ${jupiterTokens.length} SPL from Jupiter).\n`);
  }

  console.log('Testing Send Prepare (no real transfer)\n');
  console.log('API:', BASE);
  console.log('Sender:', SENDER.slice(0, 8) + '...');
  console.log('Recipient:', RECIPIENT.slice(0, 8) + '...\n');

  let ok = 0;
  let fail = 0;

  for (const { name, body } of tokens) {
    const label = (name || body.mint?.slice(0, 6) || '?').toString().slice(0, 10).padEnd(10);
    try {
      const res = await fetch(`${BASE}/api/sends/prepare`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.ok && data.success && data.transaction) {
        console.log(`  ✅ ${label} type=${data.type} tx length=${(data.transaction || '').length}`);
        ok++;
      } else {
        console.log(`  ❌ ${label} ${res.status} ${data.error || data.message || ''}`);
        fail++;
      }
    } catch (e) {
      console.log(`  ❌ ${label} ${e.message}`);
      fail++;
    }
  }

  console.log('\n' + '-'.repeat(50));
  console.log(`Result: ${ok} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

run();

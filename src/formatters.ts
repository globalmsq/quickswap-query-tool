import type {
  Swap,
  Mint,
  Burn,
  UnifiedTransaction,
  Pool
} from './types.js';

/**
 * Format timestamp to human-readable date
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(parseInt(timestamp) * 1000);
  return date.toISOString();
}

/**
 * Format token amount based on decimals
 * The Graph subgraph returns amounts already in decimal form, not wei
 */
export function formatTokenAmount(amount: string, decimals: string): string {
  // Simply parse the already-converted amount and format to 6 decimals
  const amountNumber = parseFloat(amount);
  return amountNumber.toFixed(6);
}

/**
 * Format USD amount
 */
export function formatUSD(amount: string): string {
  const num = parseFloat(amount);
  if (num === 0) return '$0.00';
  if (num < 0.01) return `$${num.toFixed(6)}`;
  return `$${num.toFixed(2)}`;
}

/**
 * Shorten address for display
 */
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Convert swap to unified transaction
 */
export function swapToUnified(swap: Swap, pool: Pool): UnifiedTransaction {
  // Calculate actual exchange rate: token1/token0
  const amount0 = Math.abs(parseFloat(swap.amount0));
  const amount1 = Math.abs(parseFloat(swap.amount1));
  const exchangeRate = amount0 > 0 ? (amount1 / amount0).toFixed(6) : '0';

  return {
    type: 'SWAP',
    timestamp: formatTimestamp(swap.timestamp),
    txHash: swap.transaction.id,
    blockNumber: swap.transaction.blockNumber,
    from: swap.origin,  // Actual transaction initiator (user)
    to: pool.id,        // Pool address where the swap occurred
    amount0: swap.amount0,
    amount1: swap.amount1,
    amountUSD: swap.amountUSD,
    token0Symbol: pool.token0.symbol,
    token1Symbol: pool.token1.symbol,
    additionalInfo: {
      price: exchangeRate,  // Human-readable exchange rate (token1/token0)
      tick: swap.tick,
    },
  };
}

/**
 * Convert mint to unified transaction
 */
export function mintToUnified(mint: Mint, pool: Pool): UnifiedTransaction {
  return {
    type: 'MINT',
    timestamp: formatTimestamp(mint.timestamp),
    txHash: mint.transaction.id,
    blockNumber: mint.transaction.blockNumber,
    from: mint.sender,
    to: mint.owner,
    amount0: mint.amount0,
    amount1: mint.amount1,
    amountUSD: mint.amountUSD,
    token0Symbol: pool.token0.symbol,
    token1Symbol: pool.token1.symbol,
    additionalInfo: {
      tickLower: mint.tickLower,
      tickUpper: mint.tickUpper,
    },
  };
}

/**
 * Convert burn to unified transaction
 */
export function burnToUnified(burn: Burn, pool: Pool): UnifiedTransaction {
  return {
    type: 'BURN',
    timestamp: formatTimestamp(burn.timestamp),
    txHash: burn.transaction.id,
    blockNumber: burn.transaction.blockNumber,
    from: burn.owner,
    amount0: burn.amount0,
    amount1: burn.amount1,
    amountUSD: burn.amountUSD,
    token0Symbol: pool.token0.symbol,
    token1Symbol: pool.token1.symbol,
    additionalInfo: {
      tickLower: burn.tickLower,
      tickUpper: burn.tickUpper,
    },
  };
}

/**
 * Format transaction for console output
 */
export function formatTransactionForConsole(tx: UnifiedTransaction, pool: Pool): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(80)}`);
  lines.push(`Type: ${tx.type}`);
  lines.push(`Time: ${tx.timestamp}`);
  lines.push(`Block: ${tx.blockNumber}`);
  lines.push(`Transaction: ${tx.txHash}`);
  lines.push(`From: ${tx.from}`);
  if (tx.to) {
    lines.push(`To: ${tx.to}`);
  }

  // Format amounts
  const amount0Formatted = formatTokenAmount(tx.amount0, pool.token0.decimals);
  const amount1Formatted = formatTokenAmount(tx.amount1, pool.token1.decimals);

  lines.push(`\nAmounts:`);
  lines.push(`  ${tx.token0Symbol}: ${amount0Formatted}`);
  lines.push(`  ${tx.token1Symbol}: ${amount1Formatted}`);
  lines.push(`  USD Value: ${formatUSD(tx.amountUSD)}`);

  // Additional info based on type
  if (tx.additionalInfo) {
    lines.push(`\nAdditional Info:`);
    if (tx.additionalInfo.tick) {
      lines.push(`  Tick: ${tx.additionalInfo.tick}`);
    }
    if (tx.additionalInfo.tickLower && tx.additionalInfo.tickUpper) {
      lines.push(`  Tick Range: [${tx.additionalInfo.tickLower}, ${tx.additionalInfo.tickUpper}]`);
    }
  }

  return lines.join('\n');
}

/**
 * Format pool info for console output
 */
export function formatPoolInfo(pool: Pool): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(80)}`);
  lines.push(`POOL INFORMATION`);
  lines.push(`${'='.repeat(80)}`);
  lines.push(`Address: ${pool.id}`);
  lines.push(`Pair: ${pool.token0.symbol} / ${pool.token1.symbol}`);
  lines.push(`Fee: ${parseInt(pool.fee) / 10000}%`);
  lines.push(`Current Tick: ${pool.tick}`);
  lines.push(`Liquidity: ${pool.liquidity}`);
  lines.push(`${'='.repeat(80)}\n`);

  return lines.join('\n');
}

/**
 * Create summary statistics
 */
export function createSummary(transactions: UnifiedTransaction[]): string {
  const swaps = transactions.filter(tx => tx.type === 'SWAP');
  const mints = transactions.filter(tx => tx.type === 'MINT');
  const burns = transactions.filter(tx => tx.type === 'BURN');

  const totalVolumeUSD = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountUSD), 0);

  const lines: string[] = [];
  lines.push(`\n${'='.repeat(80)}`);
  lines.push(`SUMMARY`);
  lines.push(`${'='.repeat(80)}`);
  lines.push(`Total Transactions: ${transactions.length}`);
  lines.push(`  - Swaps: ${swaps.length}`);
  lines.push(`  - Add Liquidity (Mints): ${mints.length}`);
  lines.push(`  - Remove Liquidity (Burns): ${burns.length}`);
  lines.push(`Total Volume: ${formatUSD(totalVolumeUSD.toString())}`);
  lines.push(`${'='.repeat(80)}\n`);

  return lines.join('\n');
}

/**
 * Escape CSV field
 */
function escapeCSV(field: string): string {
  if (!field) return '';
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

/**
 * Convert transactions to CSV format
 */
export function convertToCSV(transactions: UnifiedTransaction[], pool: Pool): string {
  const lines: string[] = [];

  // CSV Header
  const headers = [
    'Type',
    'Timestamp',
    'Block',
    'Transaction Hash',
    'From (Initiator)',
    'To (Router/Pool)',
    'Token0 Symbol',
    'Token0 Amount',
    'Token1 Symbol',
    'Token1 Amount',
    `${pool.token0.symbol} Price (${pool.token1.symbol})`,
    'Tick Lower',
    'Tick Upper'
  ];
  lines.push(headers.join(','));

  // CSV Rows
  for (const tx of transactions) {
    const token0Amount = formatTokenAmount(tx.amount0, pool.token0.decimals);
    const token1Amount = formatTokenAmount(tx.amount1, pool.token1.decimals);

    // Calculate token0 price in terms of token1 (e.g., SUT price in USDT)
    // Price = |token1Amount| / |token0Amount|
    let token0Price = '';
    if (tx.type === 'SWAP' && tx.additionalInfo?.price) {
      token0Price = tx.additionalInfo.price;
    } else if (tx.type === 'MINT' || tx.type === 'BURN') {
      const amt0 = Math.abs(parseFloat(tx.amount0));
      const amt1 = Math.abs(parseFloat(tx.amount1));
      token0Price = amt0 > 0 ? (amt1 / amt0).toFixed(6) : '';
    }

    const row = [
      escapeCSV(tx.type),
      escapeCSV(tx.timestamp),
      escapeCSV(tx.blockNumber),
      escapeCSV(tx.txHash),
      escapeCSV(tx.from),
      escapeCSV(tx.to || ''),
      escapeCSV(tx.token0Symbol),
      escapeCSV(token0Amount),
      escapeCSV(tx.token1Symbol),
      escapeCSV(token1Amount),
      escapeCSV(token0Price),
      escapeCSV(tx.additionalInfo?.tickLower || ''),
      escapeCSV(tx.additionalInfo?.tickUpper || '')
    ];
    lines.push(row.join(','));
  }

  return lines.join('\n');
}

#!/usr/bin/env node
import 'dotenv/config';
import { GraphQLClient } from 'graphql-request';
import { writeFileSync } from 'fs';
import {
  GET_POSITION,
  GET_SWAPS,
  GET_MINTS,
  GET_BURNS,
  GET_POOL,
} from './queries.js';
import type {
  PositionResponse,
  SwapsResponse,
  MintsResponse,
  BurnsResponse,
  UnifiedTransaction,
  Pool,
  CLIOptions,
} from './types.js';
import {
  swapToUnified,
  mintToUnified,
  burnToUnified,
  formatTransactionForConsole,
  formatPoolInfo,
  createSummary,
  convertToCSV,
} from './formatters.js';

// QuickSwap V3 Subgraph endpoint on Polygon
const QUICKSWAP_V3_SUBGRAPH = 'https://gateway.thegraph.com/api/subgraphs/id/FqsRcH1XqSjqVx9GRTvEJe959aCbKrcyGgDWBrUkG24g';

// Get API key from environment variable
const API_KEY = process.env.GRAPH_API_KEY || '';

// GraphQL client
const client = new GraphQLClient(QUICKSWAP_V3_SUBGRAPH, {
  headers: API_KEY ? {
    'Authorization': `Bearer ${API_KEY}`,
  } : {},
});

/**
 * Retry helper with exponential backoff
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if it's a "bad indexers" error
      if (error instanceof Error && error.message.includes('bad indexers')) {
        const delay = initialDelay * Math.pow(2, i);
        console.log(`\n⚠️  The Graph indexers are temporarily unavailable. Retrying in ${delay / 1000}s... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // For other errors, throw immediately
      throw error;
    }
  }

  throw lastError;
}

// Batch size for pagination
const BATCH_SIZE = 1000;

/**
 * Convert date string (YYYY-MM-DD) to Unix timestamp
 */
function dateToTimestamp(dateString: string): number {
  const date = new Date(dateString + 'T00:00:00Z'); // UTC
  return Math.floor(date.getTime() / 1000);
}

/**
 * Get timestamp for N days ago
 */
function getDaysAgoTimestamp(days: number): number {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return Math.floor(past.getTime() / 1000);
}

/**
 * Get current timestamp
 */
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Calculate timestamp range from CLI options
 */
function getTimestampRange(options: CLIOptions): { fromTimestamp?: number; toTimestamp?: number } {
  let fromTimestamp: number | undefined;
  let toTimestamp: number | undefined;

  // Handle --days option
  if (options.days !== undefined) {
    if (options.fromDate || options.toDate) {
      throw new Error('Cannot use --days with --from-date or --to-date');
    }
    if (options.days <= 0) {
      throw new Error('--days must be greater than 0');
    }
    fromTimestamp = getDaysAgoTimestamp(options.days);
    toTimestamp = getCurrentTimestamp();
  }

  // Handle --from-date and --to-date
  if (options.fromDate) {
    if (!isValidDateString(options.fromDate)) {
      throw new Error(`Invalid --from-date format. Use YYYY-MM-DD (e.g., 2025-01-01)`);
    }
    fromTimestamp = dateToTimestamp(options.fromDate);
  }

  if (options.toDate) {
    if (!isValidDateString(options.toDate)) {
      throw new Error(`Invalid --to-date format. Use YYYY-MM-DD (e.g., 2025-01-31)`);
    }
    toTimestamp = dateToTimestamp(options.toDate) + 86400 - 1; // End of day
  }

  // Validate range
  if (fromTimestamp && toTimestamp && fromTimestamp > toTimestamp) {
    throw new Error('--from-date must be before or equal to --to-date');
  }

  return { fromTimestamp, toTimestamp };
}

/**
 * Fetch position and extract pool address
 */
async function getPoolFromPosition(positionId: string): Promise<Pool> {
  console.log(`\n🔍 Fetching position ${positionId}...`);

  const data = await retryWithBackoff(() =>
    client.request<PositionResponse>(GET_POSITION, {
      positionId,
    })
  );

  if (!data.position) {
    throw new Error(`Position ${positionId} not found`);
  }

  console.log(`✅ Found position in pool: ${data.position.pool.token0.symbol}/${data.position.pool.token1.symbol}`);

  return data.position.pool;
}

/**
 * Fetch all swaps for a pool with pagination
 */
async function fetchAllSwaps(
  poolId: string,
  limit?: number,
  fromTimestamp?: number,
  toTimestamp?: number
): Promise<SwapsResponse['swaps']> {
  const allSwaps: SwapsResponse['swaps'] = [];
  let skip = 0;
  let hasMore = true;

  console.log(`\n📊 Fetching swap transactions...`);

  while (hasMore && (!limit || allSwaps.length < limit)) {
    const batchSize = limit ? Math.min(BATCH_SIZE, limit - allSwaps.length) : BATCH_SIZE;

    // Build variables object with timestamp filters
    // Use 0 and very large future timestamp as defaults
    const data = await retryWithBackoff(() =>
      client.request<SwapsResponse>(GET_SWAPS, {
        poolId,
        first: batchSize,
        skip,
        fromTimestamp: fromTimestamp ?? 0,
        toTimestamp: toTimestamp ?? 2147483647, // Max 32-bit int (year 2038)
      })
    );

    if (data.swaps.length === 0) {
      hasMore = false;
    } else {
      allSwaps.push(...data.swaps);
      skip += data.swaps.length;
      console.log(`  Fetched ${allSwaps.length} swaps...`);

      if (data.swaps.length < batchSize) {
        hasMore = false;
      }
    }
  }

  console.log(`✅ Total swaps fetched: ${allSwaps.length}`);
  return allSwaps;
}

/**
 * Fetch all mints for a pool with pagination
 */
async function fetchAllMints(
  poolId: string,
  limit?: number,
  fromTimestamp?: number,
  toTimestamp?: number
): Promise<MintsResponse['mints']> {
  const allMints: MintsResponse['mints'] = [];
  let skip = 0;
  let hasMore = true;

  console.log(`\n📊 Fetching add liquidity transactions...`);

  while (hasMore && (!limit || allMints.length < limit)) {
    const batchSize = limit ? Math.min(BATCH_SIZE, limit - allMints.length) : BATCH_SIZE;

    // Build variables object with timestamp filters
    // Use 0 and very large future timestamp as defaults
    const data = await retryWithBackoff(() =>
      client.request<MintsResponse>(GET_MINTS, {
        poolId,
        first: batchSize,
        skip,
        fromTimestamp: fromTimestamp ?? 0,
        toTimestamp: toTimestamp ?? 2147483647, // Max 32-bit int (year 2038)
      })
    );

    if (data.mints.length === 0) {
      hasMore = false;
    } else {
      allMints.push(...data.mints);
      skip += data.mints.length;
      console.log(`  Fetched ${allMints.length} mints...`);

      if (data.mints.length < batchSize) {
        hasMore = false;
      }
    }
  }

  console.log(`✅ Total mints fetched: ${allMints.length}`);
  return allMints;
}

/**
 * Fetch all burns for a pool with pagination
 */
async function fetchAllBurns(
  poolId: string,
  limit?: number,
  fromTimestamp?: number,
  toTimestamp?: number
): Promise<BurnsResponse['burns']> {
  const allBurns: BurnsResponse['burns'] = [];
  let skip = 0;
  let hasMore = true;

  console.log(`\n📊 Fetching remove liquidity transactions...`);

  while (hasMore && (!limit || allBurns.length < limit)) {
    const batchSize = limit ? Math.min(BATCH_SIZE, limit - allBurns.length) : BATCH_SIZE;

    // Build variables object with timestamp filters
    // Use 0 and very large future timestamp as defaults
    const data = await retryWithBackoff(() =>
      client.request<BurnsResponse>(GET_BURNS, {
        poolId,
        first: batchSize,
        skip,
        fromTimestamp: fromTimestamp ?? 0,
        toTimestamp: toTimestamp ?? 2147483647, // Max 32-bit int (year 2038)
      })
    );

    if (data.burns.length === 0) {
      hasMore = false;
    } else {
      allBurns.push(...data.burns);
      skip += data.burns.length;
      console.log(`  Fetched ${allBurns.length} burns...`);

      if (data.burns.length < batchSize) {
        hasMore = false;
      }
    }
  }

  console.log(`✅ Total burns fetched: ${allBurns.length}`);
  return allBurns;
}

/**
 * Main function to fetch and display pool transactions
 */
async function fetchPoolTransactions(options: CLIOptions): Promise<void> {
  try {
    // 1. Get pool from position (or use pool address directly if provided)
    let pool: Pool;

    if (options.positionId.startsWith('0x')) {
      // If it looks like an address, treat it as pool address
      console.log(`\n🔍 Using pool address directly: ${options.positionId}...`);
      const poolId = options.positionId.toLowerCase();

      // For direct pool address, we need to fetch pool info separately
      const poolData = await retryWithBackoff(() =>
        client.request<any>(GET_POOL, { poolId })
      );
      if (!poolData.pool) {
        throw new Error(`Pool ${poolId} not found`);
      }
      pool = poolData.pool;
      console.log(`✅ Found pool: ${pool.token0.symbol}/${pool.token1.symbol}`);
    } else {
      // Otherwise, treat it as a position ID
      pool = await getPoolFromPosition(options.positionId);
    }

    // 2. Calculate timestamp range if date filtering is specified
    const { fromTimestamp, toTimestamp } = getTimestampRange(options);

    if (fromTimestamp || toTimestamp) {
      console.log(`\n📅 Date Filter:`);
      if (fromTimestamp) {
        console.log(`  From: ${new Date(fromTimestamp * 1000).toISOString()}`);
      }
      if (toTimestamp) {
        console.log(`  To: ${new Date(toTimestamp * 1000).toISOString()}`);
      }
    }

    // 3. Fetch all transaction types in parallel
    console.log(`\n🚀 Fetching all transactions for pool ${pool.id}...`);

    const [swaps, mints, burns] = await Promise.all([
      fetchAllSwaps(pool.id, options.limit, fromTimestamp, toTimestamp),
      fetchAllMints(pool.id, options.limit, fromTimestamp, toTimestamp),
      fetchAllBurns(pool.id, options.limit, fromTimestamp, toTimestamp),
    ]);

    // 4. Convert to unified format
    const allTransactions: UnifiedTransaction[] = [
      ...swaps.map(swap => swapToUnified(swap, pool)),
      ...mints.map(mint => mintToUnified(mint, pool)),
      ...burns.map(burn => burnToUnified(burn, pool)),
    ];

    // 5. Sort by timestamp (newest first)
    allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // 6. Apply limit if specified
    const finalTransactions = options.limit
      ? allTransactions.slice(0, options.limit)
      : allTransactions;

    // 7. Output results
    if (options.output === 'json') {
      const outputPath = options.outputPath || `pool_${pool.id}_transactions.json`;
      const output = {
        pool: {
          id: pool.id,
          token0: pool.token0,
          token1: pool.token1,
          fee: pool.fee,
        },
        transactionCount: finalTransactions.length,
        transactions: finalTransactions,
      };
      writeFileSync(outputPath, JSON.stringify(output, null, 2));
      console.log(`\n✅ Saved ${finalTransactions.length} transactions to ${outputPath}`);
    } else if (options.output === 'csv') {
      const outputPath = options.outputPath || `pool_${pool.id}_transactions.csv`;
      const csvContent = convertToCSV(finalTransactions, pool);
      writeFileSync(outputPath, csvContent);
      console.log(`\n✅ Saved ${finalTransactions.length} transactions to ${outputPath}`);
      console.log(`\nPool: ${pool.token0.symbol}/${pool.token1.symbol}`);
      console.log(`Fee: ${parseInt(pool.fee) / 10000}%`);
      console.log(`Total Transactions: ${finalTransactions.length}`);
    } else {
      // Console output
      console.log(formatPoolInfo(pool));
      console.log(createSummary(finalTransactions));

      console.log(`\n📋 TRANSACTIONS (${finalTransactions.length} total)\n`);
      finalTransactions.forEach((tx, index) => {
        console.log(`\n[${index + 1}/${finalTransactions.length}]`);
        console.log(formatTransactionForConsole(tx, pool));
      });

      console.log(`\n\n✅ Displayed ${finalTransactions.length} transactions`);
    }
  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

/**
 * Parse CLI arguments
 */
function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
Usage: npm start -- <positionId or poolAddress> [options]

Arguments:
  <positionId>             Position ID (e.g., 174446)
  <poolAddress>            Pool contract address (e.g., 0x...)

Options:
  --limit <number>         Limit the number of transactions to fetch
  --output json            Output to JSON file instead of console
  --output csv             Output to CSV file
  --output-path <path>     Specify output file path (default: pool_<id>_transactions.[json|csv])
  --from-date <date>       Start date in YYYY-MM-DD format (e.g., 2025-01-01)
  --to-date <date>         End date in YYYY-MM-DD format (e.g., 2025-01-31)
  --days <number>          Fetch transactions from the last N days

Environment Variables:
  GRAPH_API_KEY           The Graph API key (get one free at https://thegraph.com/studio)

Examples:
  # Using position ID
  npm start -- 174446
  npm start -- 174446 --limit 100

  # Using pool address directly
  npm start -- 0x55caabb0d2b704fd0ef8192a7e35d8837e678207

  # Date filtering
  npm start -- 174446 --days 7
  npm start -- 174446 --from-date 2025-01-01 --to-date 2025-01-31
  npm start -- 174446 --from-date 2025-01-01

  # With API key
  GRAPH_API_KEY=your_key npm start -- 174446

  # Save to JSON
  npm start -- 174446 --output json --output-path my_transactions.json

  # Save to CSV
  npm start -- 174446 --output csv
  npm start -- 174446 --output csv --output-path my_transactions.csv

  # Combined options
  npm start -- 174446 --days 30 --limit 100 --output csv

Note: You need a free API key from The Graph Studio to use this tool.
Visit: https://thegraph.com/studio/apikeys/
    `);
    process.exit(0);
  }

  const options: CLIOptions = {
    positionId: args[0],
  };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case '--limit':
        options.limit = parseInt(args[++i]);
        break;
      case '--output':
        const outputType = args[++i];
        if (outputType === 'json') {
          options.output = 'json';
        } else if (outputType === 'csv') {
          options.output = 'csv';
        }
        break;
      case '--output-path':
        options.outputPath = args[++i];
        break;
      case '--from-date':
        options.fromDate = args[++i];
        break;
      case '--to-date':
        options.toDate = args[++i];
        break;
      case '--days':
        options.days = parseInt(args[++i]);
        break;
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();

  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                  QuickSwap V3 Transaction Query Tool                  ║
║                         Polygon Network                                ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);

  await fetchPoolTransactions(options);
}

main().catch(console.error);

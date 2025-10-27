// Token information
export interface Token {
  id: string;
  symbol: string;
  name: string;
  decimals: string;
}

// Pool information
export interface Pool {
  id: string;
  token0: Token;
  token1: Token;
  fee: string;
  liquidity: string;
  sqrtPrice: string;
  tick: string;
}

// Position information
export interface Position {
  id: string;
  pool: Pool;
  tickLower: {
    tickIdx: string;
  };
  tickUpper: {
    tickIdx: string;
  };
  liquidity: string;
}

// Transaction base fields
export interface Transaction {
  id: string;
  blockNumber: string;
  timestamp: string;
  gasLimit: string;
  gasPrice: string;
}

// Swap transaction
export interface Swap {
  id: string;
  transaction: Transaction;
  timestamp: string;
  sender: string;
  recipient: string;
  origin: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  price: string;
  tick: string;
  logIndex: string;
}

// Mint transaction (Add Liquidity)
export interface Mint {
  id: string;
  transaction: Transaction;
  timestamp: string;
  sender: string;
  owner: string;
  origin: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  tickLower: string;
  tickUpper: string;
  logIndex: string;
}

// Burn transaction (Remove Liquidity)
export interface Burn {
  id: string;
  transaction: Transaction;
  timestamp: string;
  owner: string;
  origin: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  tickLower: string;
  tickUpper: string;
  logIndex: string;
}

// Unified transaction type
export type TransactionType = 'SWAP' | 'MINT' | 'BURN';

export interface UnifiedTransaction {
  type: TransactionType;
  timestamp: string;
  txHash: string;
  blockNumber: string;
  from: string;
  to?: string;
  amount0: string;
  amount1: string;
  amountUSD: string;
  token0Symbol: string;
  token1Symbol: string;
  additionalInfo?: {
    price?: string;
    tick?: string;
    tickLower?: string;
    tickUpper?: string;
  };
}

// GraphQL response types
export interface PositionResponse {
  position: Position | null;
}

export interface SwapsResponse {
  swaps: Swap[];
}

export interface MintsResponse {
  mints: Mint[];
}

export interface BurnsResponse {
  burns: Burn[];
}

// CLI options
export interface CLIOptions {
  positionId: string;
  limit?: number;
  output?: 'console' | 'json' | 'csv';
  outputPath?: string;
  fromDate?: string;  // YYYY-MM-DD format
  toDate?: string;    // YYYY-MM-DD format
  days?: number;      // Recent N days
}

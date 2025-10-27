# QuickSwap V3 Transaction Query Tool

A TypeScript CLI tool to query all transactions (Swap, Add Liquidity, Remove Liquidity) from QuickSwap V3 Pools.

## 🌟 Features

- **Complete Transaction History**: Query all Swap, Mint (Add Liquidity), Burn (Remove Liquidity) transactions from pools
- **QuickSwap V3 Subgraph Integration**: Fast and structured data queries through The Graph Protocol
- **Polygon Network Support**: QuickSwap V3 on Polygon mainnet
- **Flexible Output Formats**: Console output, JSON, or CSV file export
- **Pagination Support**: Automatic handling of large transaction datasets
- **Type Safety**: Secure code written in TypeScript

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- **The Graph API Key** (free) - [Get it here](https://thegraph.com/studio/apikeys/)

## 🚀 Installation

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build
```

## 🔑 API Key Setup

This tool uses The Graph's Subgraph, so you need a **free API key**.

### How to get an API Key:

1. Visit [The Graph Studio](https://thegraph.com/studio/apikeys/)
2. Create an account or log in
3. Click "Create API Key"
4. Copy your API Key

### How to use the API Key:

#### Option 1: Set as environment variable
```bash
export GRAPH_API_KEY=your_api_key_here
```

#### Option 2: Create .env file (Recommended)
```bash
# Copy .env.example to create .env file
cp .env.example .env

# Edit .env file to add your actual API key
# GRAPH_API_KEY=your_actual_api_key_here
```

#### Option 3: Specify directly when running command
```bash
GRAPH_API_KEY=your_key npm start -- 174446
```

## 💻 Usage

### Basic Usage

#### Using Position ID
Query all transactions from a pool using its Position ID:

```bash
GRAPH_API_KEY=your_key npm start -- 174446
```

#### Using Pool Address Directly
You can also use the pool's contract address directly:

```bash
GRAPH_API_KEY=your_key npm start -- 0x55caabb0d2b704fd0ef8192a7e35d8837e678207
```

### Options

#### Limit Transaction Count

Query only the most recent N transactions:

```bash
npm start -- 174446 --limit 100
```

#### Filter by Date Range

Query transactions for specific time periods:

```bash
# Transactions from the last 7 days
npm start -- 174446 --days 7

# Specific date range (YYYY-MM-DD format)
npm start -- 174446 --from-date 2025-01-01 --to-date 2025-01-31

# All transactions after a specific date
npm start -- 174446 --from-date 2025-01-01

# All transactions before a specific date
npm start -- 174446 --to-date 2025-01-31

# Combine date filtering with limit
npm start -- 174446 --days 30 --limit 100
```

**Note**: All dates are in UTC timezone using YYYY-MM-DD format.

#### Save to JSON File

Output to JSON file instead of console:

```bash
npm start -- 174446 --output json
```

#### Save to CSV File

Save in CSV format for analysis in Excel, etc.:

```bash
npm start -- 174446 --output csv
```

#### Specify Output File Path

```bash
# Specify JSON filename
npm start -- 174446 --output json --output-path my_transactions.json

# Specify CSV filename
npm start -- 174446 --output csv --output-path my_transactions.csv
```

### Development Mode

Run without building:

```bash
npm run dev -- 174446
```

## 📊 Output Format

### 1. Console Output (Default)

```
╔═══════════════════════════════════════════════════════════════════════╗
║                  QuickSwap V3 Transaction Query Tool                  ║
║                         Polygon Network                                ║
╚═══════════════════════════════════════════════════════════════════════╝

🔍 Fetching position 174446...
✅ Found position in pool: USDC/WETH

================================================================================
POOL INFORMATION
================================================================================
Address: 0x55caabb0d2b704fd0ef8192a7e35d8837e678207
Pair: USDC / WETH
Fee Tier: 0.05%
Current Tick: 201234
Liquidity: 123456789
================================================================================

================================================================================
SUMMARY
================================================================================
Total Transactions: 150
  - Swaps: 120
  - Add Liquidity (Mints): 20
  - Remove Liquidity (Burns): 10
Total Volume: $1,234,567.89
================================================================================

📋 TRANSACTIONS (150 total)

[1/150]
================================================================================
Type: SWAP
Time: 2025-10-27T12:34:56.000Z
Block: 12345678
Transaction: 0xabc123...
From: 0x1234...5678
To: 0xabcd...efgh

Amounts:
  USDC: 1000.000000
  WETH: 0.500000
  USD Value: $1000.00

Additional Info:
  Tick: 201234
...
```

### 2. JSON Output

```json
{
  "pool": {
    "id": "0x55caabb0d2b704fd0ef8192a7e35d8837e678207",
    "token0": {
      "id": "0x...",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": "6"
    },
    "token1": {
      "id": "0x...",
      "symbol": "WETH",
      "name": "Wrapped Ether",
      "decimals": "18"
    },
    "fee": "500"
  },
  "transactionCount": 150,
  "transactions": [
    {
      "type": "SWAP",
      "timestamp": "2025-10-27T12:34:56.000Z",
      "txHash": "0xabc123...",
      "blockNumber": "12345678",
      "from": "0x1234...5678",
      "to": "0xabcd...efgh",
      "amount0": "1000000000",
      "amount1": "-500000000000000000",
      "amountUSD": "1000.00",
      "token0Symbol": "USDC",
      "token1Symbol": "WETH",
      "additionalInfo": {
        "price": "...",
        "tick": "201234"
      }
    }
  ]
}
```

### 3. CSV Output

CSV files can be opened directly in Excel, Google Sheets, etc., and are optimized for data analysis.

```csv
Type,Timestamp,Block,Transaction Hash,From,To,Token0 Symbol,Token0 Amount,Token1 Symbol,Token1 Amount,USD Value,Tick,Price,Tick Lower,Tick Upper
SWAP,2025-10-27T00:25:11.000Z,78209942,0xe784a214a1ea6386c72a1fdf85032e47036eb60b952dabc9166b29c1d1afbee1,0xf5b509bb0909a69b1c207e495f687a596c168e12,0x1954e1d1039888731c3e0ea055746d6ddba37008,SUT,6.611992,USDT,14171690000000.000000,14.17,-268572,,,
MINT,2025-10-26T15:30:00.000Z,78150000,0x1234abcd...,0xaabbccdd...,0x11223344...,SUT,100.000000,USDT,200000000000000.000000,200.00,,,-276000,-260000
BURN,2025-10-25T10:15:30.000Z,78100000,0x5678efgh...,0x99887766...,,SUT,50.000000,USDT,100000000000000.000000,100.00,,,-276000,-260000
```

**CSV Column Descriptions:**
- **Type**: Transaction type (SWAP, MINT, BURN)
- **Timestamp**: Transaction timestamp (ISO 8601)
- **Block**: Block number
- **Transaction Hash**: Transaction hash
- **From**: Sender address
- **To**: Recipient address (for SWAP)
- **Token0/Token1 Symbol**: Token symbol
- **Token0/Token1 Amount**: Token amount (with decimals)
- **USD Value**: USD equivalent value
- **Tick**: Current tick (for SWAP)
- **Price**: Price (for SWAP)
- **Tick Lower/Upper**: Tick range (for MINT/BURN)
```

## 🔍 Transaction Types

### SWAP
- **Description**: Token exchange transaction
- **Included Information**: sender, recipient, amount0, amount1, price impact, tick

### MINT (Add Liquidity)
- **Description**: Liquidity addition transaction
- **Included Information**: sender, owner, amount0, amount1, tick range

### BURN (Remove Liquidity)
- **Description**: Liquidity removal transaction
- **Included Information**: owner, amount0, amount1, tick range

## 🏗️ Project Structure

```
quickswap-query-tool/
├── package.json          # Project config and dependencies
├── tsconfig.json         # TypeScript configuration
├── README.md            # This file
├── src/
│   ├── index.ts         # CLI main entry point
│   ├── queries.ts       # GraphQL query definitions
│   ├── types.ts         # TypeScript type definitions
│   └── formatters.ts    # Data formatting utilities
└── dist/                # Build output (generated)
```

## 🔧 Technical Details

### GraphQL Endpoint

```
https://gateway.thegraph.com/api/subgraphs/id/FqsRcH1XqSjqVx9GRTvEJe959aCbKrcyGgDWBrUkG24g
```

### Key Dependencies

- **graphql-request**: GraphQL client
- **typescript**: Type safety
- **tsx**: Development mode execution

## 📝 Examples

### Example 1: Basic Query
```bash
npm start -- 174446
```

### Example 2: Query Last 50 Transactions
```bash
npm start -- 174446 --limit 50
```

### Example 3: Save as JSON
```bash
npm start -- 174446 --output json --output-path quickswap_transactions.json
```

### Example 4: Save as CSV
```bash
npm start -- 174446 --output csv --output-path quickswap_transactions.csv
```

### Example 5: Large Dataset CSV Analysis
```bash
# Save the last 1000 transactions as CSV
npm start -- 174446 --limit 1000 --output csv
```

### Example 6: Date Range Analysis
```bash
# Save last month's transactions as CSV
npm start -- 174446 --days 30 --output csv

# Query all transactions from January 2025
npm start -- 174446 --from-date 2025-01-01 --to-date 2025-01-31

# Limit to 100 swaps from a specific period
npm start -- 174446 --from-date 2025-01-15 --limit 100 --output json
```

## 🐛 Troubleshooting

### "auth error: missing authorization header"
API key is not configured. Please check the following:

1. Verify the `.env` file exists in the project root
2. Ensure the `.env` file contains `GRAPH_API_KEY=your_key` format
3. Confirm the API key is valid at [The Graph Studio](https://thegraph.com/studio/apikeys/)

### Position not found
Verify the Position ID is correct. You can find it in the QuickSwap website URL:
```
https://dapp.quickswap.exchange/pool/positions/v3/174446?chainId=137
                                                      ^^^^^^
                                                  Position ID
```

Or try using the pool address directly:
```bash
GRAPH_API_KEY=your_key npm start -- 0x55caabb0d2b704fd0ef8192a7e35d8837e678207
```

### Rate limiting
If rate limiting occurs from the subgraph, please wait and try again. The Graph's free plan provides sufficient query limits.

## 📄 License

MIT

## 🤝 Contributing

Issues and Pull Requests are welcome!

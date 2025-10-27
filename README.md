# QuickSwap V3 Transaction Query Tool

QuickSwap V3 Pool의 모든 트랜잭션(Swap, Add Liquidity, Remove Liquidity)을 조회하는 TypeScript CLI 도구입니다.

## 🌟 Features

- **완전한 트랜잭션 히스토리**: Pool의 모든 Swap, Mint(Add Liquidity), Burn(Remove Liquidity) 트랜잭션 조회
- **QuickSwap V3 Subgraph 활용**: The Graph Protocol을 통한 빠르고 구조화된 데이터 조회
- **Polygon 네트워크 지원**: QuickSwap V3 (Polygon 메인넷)
- **유연한 출력 형식**: 콘솔 출력 또는 JSON 파일 저장
- **페이지네이션 지원**: 대량의 트랜잭션 데이터 자동 처리
- **타입 안정성**: TypeScript로 작성된 안전한 코드

## 📋 Prerequisites

- Node.js 18 이상
- npm 또는 yarn
- **The Graph API Key** (무료) - [여기서 발급](https://thegraph.com/studio/apikeys/)

## 🚀 Installation

```bash
# 의존성 설치
npm install

# TypeScript 빌드
npm run build
```

## 🔑 API Key 설정

이 도구는 The Graph의 Subgraph를 사용하므로 **무료 API key**가 필요합니다.

### API Key 발급 방법:

1. [The Graph Studio](https://thegraph.com/studio/apikeys/)에 접속
2. 계정 생성 또는 로그인
3. "Create API Key" 클릭
4. API Key 복사

### API Key 사용 방법:

#### 방법 1: 환경 변수로 설정
```bash
export GRAPH_API_KEY=your_api_key_here
```

#### 방법 2: .env 파일 생성 (권장)
```bash
# .env.example을 복사하여 .env 파일 생성
cp .env.example .env

# .env 파일을 편집하여 실제 API key 입력
# GRAPH_API_KEY=your_actual_api_key_here
```

#### 방법 3: 명령어 실행 시 직접 지정
```bash
GRAPH_API_KEY=your_key npm start -- 174446
```

## 💻 Usage

### 기본 사용법

#### Position ID 사용
Position ID를 사용하여 해당 Pool의 모든 트랜잭션을 조회합니다:

```bash
GRAPH_API_KEY=your_key npm start -- 174446
```

#### Pool 주소 직접 사용
Pool의 contract 주소를 직접 사용할 수도 있습니다:

```bash
GRAPH_API_KEY=your_key npm start -- 0x55caabb0d2b704fd0ef8192a7e35d8837e678207
```

### 옵션

#### 트랜잭션 개수 제한

최근 N개의 트랜잭션만 조회:

```bash
npm start -- 174446 --limit 100
```

#### 기간별 필터링

특정 기간의 트랜잭션만 조회:

```bash
# 최근 7일간의 트랜잭션
npm start -- 174446 --days 7

# 특정 날짜 범위 (YYYY-MM-DD 형식)
npm start -- 174446 --from-date 2025-01-01 --to-date 2025-01-31

# 특정 날짜 이후의 모든 트랜잭션
npm start -- 174446 --from-date 2025-01-01

# 특정 날짜 이전의 모든 트랜잭션
npm start -- 174446 --to-date 2025-01-31

# 기간 필터링과 개수 제한 함께 사용
npm start -- 174446 --days 30 --limit 100
```

**참고**: 모든 날짜는 UTC 기준이며, YYYY-MM-DD 형식을 사용합니다.

#### JSON 파일로 저장

콘솔 대신 JSON 파일로 출력:

```bash
npm start -- 174446 --output json
```

#### CSV 파일로 저장

CSV 형식으로 저장하여 Excel 등에서 분석:

```bash
npm start -- 174446 --output csv
```

#### 출력 파일 경로 지정

```bash
# JSON 파일명 지정
npm start -- 174446 --output json --output-path my_transactions.json

# CSV 파일명 지정
npm start -- 174446 --output csv --output-path my_transactions.csv
```

### 개발 모드

빌드 없이 바로 실행:

```bash
npm run dev -- 174446
```

## 📊 Output Format

### 1. Console Output (기본)

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

CSV 파일은 Excel, Google Sheets 등에서 바로 열 수 있으며, 데이터 분석에 최적화되어 있습니다.

```csv
Type,Timestamp,Block,Transaction Hash,From,To,Token0 Symbol,Token0 Amount,Token1 Symbol,Token1 Amount,USD Value,Tick,Price,Tick Lower,Tick Upper
SWAP,2025-10-27T00:25:11.000Z,78209942,0xe784a214a1ea6386c72a1fdf85032e47036eb60b952dabc9166b29c1d1afbee1,0xf5b509bb0909a69b1c207e495f687a596c168e12,0x1954e1d1039888731c3e0ea055746d6ddba37008,SUT,6.611992,USDT,14171690000000.000000,14.17,-268572,,,
MINT,2025-10-26T15:30:00.000Z,78150000,0x1234abcd...,0xaabbccdd...,0x11223344...,SUT,100.000000,USDT,200000000000000.000000,200.00,,,-276000,-260000
BURN,2025-10-25T10:15:30.000Z,78100000,0x5678efgh...,0x99887766...,,SUT,50.000000,USDT,100000000000000.000000,100.00,,,-276000,-260000
```

**CSV 컬럼 설명:**
- **Type**: 트랜잭션 타입 (SWAP, MINT, BURN)
- **Timestamp**: 트랜잭션 발생 시간 (ISO 8601)
- **Block**: 블록 번호
- **Transaction Hash**: 트랜잭션 해시
- **From**: 보내는 주소
- **To**: 받는 주소 (SWAP의 경우)
- **Token0/Token1 Symbol**: 토큰 심볼
- **Token0/Token1 Amount**: 토큰 수량 (소수점 포함)
- **USD Value**: USD 환산 가치
- **Tick**: 현재 틱 (SWAP의 경우)
- **Price**: 가격 (SWAP의 경우)
- **Tick Lower/Upper**: 틱 범위 (MINT/BURN의 경우)
```

## 🔍 Transaction Types

### SWAP
- **설명**: 토큰 교환 트랜잭션
- **포함 정보**: sender, recipient, amount0, amount1, price impact, tick

### MINT (Add Liquidity)
- **설명**: 유동성 추가 트랜잭션
- **포함 정보**: sender, owner, amount0, amount1, tick range

### BURN (Remove Liquidity)
- **설명**: 유동성 제거 트랜잭션
- **포함 정보**: owner, amount0, amount1, tick range

## 🏗️ Project Structure

```
search-quickswap/
├── package.json          # 프로젝트 설정 및 의존성
├── tsconfig.json         # TypeScript 설정
├── README.md            # 이 파일
├── src/
│   ├── index.ts         # CLI 메인 진입점
│   ├── queries.ts       # GraphQL 쿼리 정의
│   ├── types.ts         # TypeScript 타입 정의
│   └── formatters.ts    # 데이터 포맷팅 유틸리티
└── dist/                # 빌드 결과물 (생성됨)
```

## 🔧 Technical Details

### GraphQL Endpoint

```
https://gateway.thegraph.com/api/subgraphs/id/FqsRcH1XqSjqVx9GRTvEJe959aCbKrcyGgDWBrUkG24g
```

### Key Dependencies

- **graphql-request**: GraphQL 클라이언트
- **typescript**: 타입 안정성
- **tsx**: 개발 모드 실행

## 📝 Examples

### Example 1: 기본 조회
```bash
npm start -- 174446
```

### Example 2: 최근 50개만 조회
```bash
npm start -- 174446 --limit 50
```

### Example 3: JSON으로 저장
```bash
npm start -- 174446 --output json --output-path quickswap_transactions.json
```

### Example 4: CSV로 저장
```bash
npm start -- 174446 --output csv --output-path quickswap_transactions.csv
```

### Example 5: 대량 데이터 CSV 분석
```bash
# 최근 1000개 트랜잭션을 CSV로 저장
npm start -- 174446 --limit 1000 --output csv
```

### Example 6: 기간별 분석
```bash
# 최근 한 달간의 트랜잭션을 CSV로 저장
npm start -- 174446 --days 30 --output csv

# 2025년 1월의 모든 트랜잭션 조회
npm start -- 174446 --from-date 2025-01-01 --to-date 2025-01-31

# 특정 기간의 스왑만 100개 제한
npm start -- 174446 --from-date 2025-01-15 --limit 100 --output json
```

## 🐛 Troubleshooting

### "auth error: missing authorization header"
API key가 설정되지 않았습니다. 다음을 확인하세요:

1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. `.env` 파일에 `GRAPH_API_KEY=your_key` 형식으로 작성되어 있는지 확인
3. API key가 유효한지 [The Graph Studio](https://thegraph.com/studio/apikeys/)에서 확인

### Position not found
Position ID가 올바른지 확인하세요. QuickSwap 웹사이트의 URL에서 확인할 수 있습니다:
```
https://dapp.quickswap.exchange/pool/positions/v3/174446?chainId=137
                                                      ^^^^^^
                                                  Position ID
```

또는 Pool 주소를 직접 사용해보세요:
```bash
GRAPH_API_KEY=your_key npm start -- 0x55caabb0d2b704fd0ef8192a7e35d8837e678207
```

### Rate limiting
Subgraph에서 rate limiting이 발생하면 잠시 후 다시 시도하세요. The Graph의 무료 플랜은 충분한 쿼리 한도를 제공합니다.

## 📄 License

MIT

## 🤝 Contributing

Issues and Pull Requests are welcome!

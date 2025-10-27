import { gql } from 'graphql-request';

// Query to get position details and extract pool address
export const GET_POSITION = gql`
  query GetPosition($positionId: String!) {
    position(id: $positionId) {
      id
      pool {
        id
        token0 {
          id
          symbol
          name
          decimals
        }
        token1 {
          id
          symbol
          name
          decimals
        }
        fee
        liquidity
        sqrtPrice
        tick
      }
      tickLower {
        tickIdx
      }
      tickUpper {
        tickIdx
      }
      liquidity
    }
  }
`;

// Query to get swap transactions for a pool
export const GET_SWAPS = gql`
  query GetSwaps($poolId: String!, $first: Int!, $skip: Int!, $fromTimestamp: BigInt, $toTimestamp: BigInt) {
    swaps(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
      where: {
        pool: $poolId
        timestamp_gte: $fromTimestamp
        timestamp_lte: $toTimestamp
      }
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
        gasLimit
        gasPrice
      }
      timestamp
      sender
      recipient
      origin
      amount0
      amount1
      amountUSD
      price
      tick
      logIndex
    }
  }
`;

// Query to get mint transactions (add liquidity) for a pool
export const GET_MINTS = gql`
  query GetMints($poolId: String!, $first: Int!, $skip: Int!, $fromTimestamp: BigInt, $toTimestamp: BigInt) {
    mints(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
      where: {
        pool: $poolId
        timestamp_gte: $fromTimestamp
        timestamp_lte: $toTimestamp
      }
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
        gasLimit
        gasPrice
      }
      timestamp
      sender
      owner
      origin
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
      logIndex
    }
  }
`;

// Query to get burn transactions (remove liquidity) for a pool
export const GET_BURNS = gql`
  query GetBurns($poolId: String!, $first: Int!, $skip: Int!, $fromTimestamp: BigInt, $toTimestamp: BigInt) {
    burns(
      first: $first
      skip: $skip
      orderBy: timestamp
      orderDirection: desc
      where: {
        pool: $poolId
        timestamp_gte: $fromTimestamp
        timestamp_lte: $toTimestamp
      }
    ) {
      id
      transaction {
        id
        blockNumber
        timestamp
        gasLimit
        gasPrice
      }
      timestamp
      owner
      origin
      amount0
      amount1
      amountUSD
      tickLower
      tickUpper
      logIndex
    }
  }
`;

// Query to get pool basic information
export const GET_POOL = gql`
  query GetPool($poolId: String!) {
    pool(id: $poolId) {
      id
      token0 {
        id
        symbol
        name
        decimals
      }
      token1 {
        id
        symbol
        name
        decimals
      }
      fee
      liquidity
      sqrtPrice
      tick
      volumeUSD
      txCount
      totalValueLockedUSD
    }
  }
`;

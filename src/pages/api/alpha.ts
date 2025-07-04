import type { NextApiRequest, NextApiResponse } from 'next';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || 'd1cnlghr01qic6ler21gd1cnlghr01qic6ler220';

// Simple in-memory cache: { [ticker]: { data, timestamp } }
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { ticker } = req.query;
  console.log('[FINNHUB] Request received', { ticker });
  if (!ticker || typeof ticker !== 'string') {
    console.error('[FINNHUB] Missing ticker', { ticker });
    return res.status(400).json({ error: 'Missing ticker' });
  }

  // Check cache
  const now = Date.now();
  if (cache[ticker] && now - cache[ticker].timestamp < CACHE_TTL) {
    console.log('[FINNHUB] Returning cached result for', ticker);
    return res.status(200).json(cache[ticker].data);
  }

  try {
    const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`;
    console.log('[FINNHUB] Fetching from Finnhub:', url);
    const response = await fetch(url);
    const data = await response.json();
    console.log('[FINNHUB] Finnhub response', data);
    if (!data || data.c === undefined) {
      console.error('[FINNHUB] No quote found', { data });
      return res.status(404).json({ error: 'Ticker not found or Finnhub API error', raw: data });
    }
    // Normalize to previous structure
    const result = {
      symbol: ticker,
      shortName: ticker,
      regularMarketPrice: data.c,
      currency: 'USD',
      open: data.o,
      high: data.h,
      low: data.l,
      previousClose: data.pc,
      // Finnhub does not provide change/changePercent directly, so calculate:
      change: data.c - data.pc,
      changePercent: data.pc ? (((data.c - data.pc) / data.pc) * 100).toFixed(2) + '%' : undefined,
      // Finnhub does not provide volume or latestTradingDay in this endpoint
      volume: undefined,
      latestTradingDay: undefined,
    };
    // Store in cache
    cache[ticker] = { data: result, timestamp: now };
    console.log('[FINNHUB] Returning result', result);
    return res.status(200).json(result);
  } catch (e) {
    console.error('[FINNHUB] Failed to fetch Finnhub data', e);
    return res.status(500).json({ error: 'Failed to fetch Finnhub data', details: String(e) });
  }
} 
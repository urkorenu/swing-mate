"use client";
import { useEffect, useState } from "react";

interface TickerInfo {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  currency?: string;
  open?: number;
  high?: number;
  low?: number;
  previousClose?: number;
  change?: number;
  changePercent?: string;
  volume?: number;
  latestTradingDay?: string;
}

export default function WatchlistPage() {
  const [tickers, setTickers] = useState<string[]>([]);
  const [info, setInfo] = useState<Record<string, TickerInfo>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [holdings, setHoldings] = useState<{ticker:string, entryPrice:number}[]>([]);

  useEffect(() => {
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((holdings: { ticker: string, entryPrice: number }[]) => {
        setHoldings(holdings);
        const uniqueTickers: string[] = Array.from(new Set(holdings.map((h) => String(h.ticker).trim().toUpperCase())));
        setTickers(uniqueTickers);
        uniqueTickers.forEach((ticker) => fetchInfo(ticker));
      });
  }, []);

  const fetchInfo = async (ticker: string) => {
    const res = await fetch(`/api/alpha?ticker=${ticker}`);
    const data = await res.json();
    if (!data.error) {
      setInfo((prev) => ({ ...prev, [ticker]: data }));
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all(tickers.map((ticker) => fetchInfo(ticker)));
    setRefreshing(false);
  };

  // Calculate overall profit/loss %
  let totalProfit = 0;
  let count = 0;
  holdings.forEach(h => {
    const d = info[h.ticker] || {};
    if (d.regularMarketPrice && h.entryPrice) {
      totalProfit += ((d.regularMarketPrice - h.entryPrice) / h.entryPrice) * 100;
      count++;
    }
  });
  const avgProfit = count ? (totalProfit / count) : 0;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 0", fontFamily: 'Inter, Arial, sans-serif' }}>
      <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 24, textAlign: 'center', letterSpacing: -1 }}>Watchlist</h2>
      {count > 0 && (
        <div style={{
          background: avgProfit >= 0 ? '#f0fdf4' : '#fef2f2',
          color: avgProfit >= 0 ? '#16a34a' : '#dc2626',
          borderRadius: 10,
          fontWeight: 600,
          fontSize: 18,
          textAlign: 'center',
          marginBottom: 18,
          padding: '10px 0',
          border: '1px solid #e5e7eb',
        }}>
          Overall Profit/Loss: {avgProfit >= 0 ? '+' : ''}{avgProfit.toFixed(2)}%
        </div>
      )}
      <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
        <button onClick={handleRefresh} disabled={refreshing} style={{background:'#f3f4f6',color:'#2563eb',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:500,cursor:refreshing?'not-allowed':'pointer',fontSize:15}}>
          {refreshing ? 'Refreshing...' : 'Refresh All'}
        </button>
      </div>
      {tickers.length === 0 ? (
        <div style={{ background: "#f9fafb", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, textAlign: "center", color: '#888' }}>
          No tickers in your watchlist. Add a holding to get started.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tickers.map((ticker) => {
            const d = info[ticker] || {};
            return (
              <li key={ticker} style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 20, display: 'flex', alignItems: 'center', gap: 18, transition: 'box-shadow 0.2s', border: '1px solid #f1f1f1' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: -0.5 }}>{ticker} {d.shortName && <span style={{ color: '#888', fontWeight: 400, fontSize: 15 }}>({d.shortName})</span>}</div>
                  {d.regularMarketPrice && <div style={{ fontSize: 15, color: '#2563eb', marginTop: 2 }}>Current: <b>${d.regularMarketPrice}</b> {d.currency}</div>}
                  <div style={{ fontSize: 13, color: '#888', marginTop: 2, display: 'flex', gap: 12 }}>
                    {d.open !== undefined && <span>Open: ${d.open}</span>}
                    {d.high !== undefined && <span>High: ${d.high}</span>}
                    {d.low !== undefined && <span>Low: ${d.low}</span>}
                    {d.previousClose !== undefined && <span>Prev Close: ${d.previousClose}</span>}
                    {d.changePercent !== undefined && <span>Change: {d.changePercent}%</span>}
                  </div>
                  {!d.regularMarketPrice && <div style={{ color: '#e53e3e', fontSize: 14, marginTop: 2 }}>Could not load Alpha Vantage data for this ticker.</div>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
} 
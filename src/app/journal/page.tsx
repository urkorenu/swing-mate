"use client";
import { useEffect, useState } from "react";

interface Trade {
  id: string;
  ticker: string;
  entryPrice: number;
  dateEntry: string;
}

interface TickerInfo {
  symbol: string;
  regularMarketPrice?: number;
}

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [info, setInfo] = useState<Record<string, TickerInfo>>({});
  const [form, setForm] = useState({ ticker: "", entryPrice: "", dateEntry: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ticker: "", entryPrice: "", dateEntry: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => {
        setTrades(data);
        data.forEach((t: Trade) => fetchInfo(t.ticker));
      });
  }, []);

  const fetchInfo = async (ticker: string) => {
    const res = await fetch(`/api/alpha?ticker=${ticker}`);
    const data = await res.json();
    if (!data.error) {
      setInfo((prev) => ({ ...prev, [ticker]: {
        symbol: data.symbol,
        regularMarketPrice: data.regularMarketPrice,
      }}));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ticker = form.ticker.trim().toUpperCase();
    const res = await fetch("/api/holdings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, ticker }),
    });
    if (res.ok) {
      const newTrade = await res.json();
      setTrades([newTrade, ...trades]);
      fetchInfo(ticker);
      setForm({ ticker: "", entryPrice: "", dateEntry: "" });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this trade?")) return;
    await fetch(`/api/holdings?id=${id}`, { method: "DELETE" });
    setTrades(trades.filter((t) => t.id !== id));
  };

  const handleEdit = (t: Trade) => {
    setEditId(t.id);
    setEditForm({ ticker: t.ticker, entryPrice: String(t.entryPrice), dateEntry: t.dateEntry.slice(0, 10) });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    setLoading(true);
    const ticker = editForm.ticker.trim().toUpperCase();
    const res = await fetch(`/api/holdings?id=${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, ticker }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTrades(trades.map((t) => t.id === editId ? updated : t));
      fetchInfo(ticker);
      setEditId(null);
    }
    setLoading(false);
  };

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 0", fontFamily: 'Inter, Arial, sans-serif' }}>
      <h2 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: 24, textAlign: 'center', letterSpacing: -1 }}>Trade Journal</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32, background: "#fff", padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0001', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <input name="ticker" value={form.ticker} onChange={handleChange} placeholder="Ticker (AAPL)" required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, textTransform: 'uppercase' }} />
          <input name="entryPrice" value={form.entryPrice} onChange={handleChange} placeholder="Entry Price" type="number" required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
          <input name="dateEntry" value={form.dateEntry} onChange={handleChange} placeholder="Entry Date" type="date" required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 8, background: loading ? '#a5b4fc' : "#2563eb", color: "white", padding: "0.75rem 0", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
          {loading ? <span style={{display:'inline-block',width:18,height:18,border:'2px solid #fff',borderTop:'2px solid #2563eb',borderRadius:'50%',animation:'spin 1s linear infinite'}} /> : "Buy (Add to Holdings)"}
        </button>
      </form>
      {trades.length === 0 ? (
        <div style={{ background: "#f9fafb", borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 32, textAlign: "center", color: '#888' }}>
          No trades yet. Start by buying your first stock.
        </div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {trades.map((t) => {
            const d = info[t.ticker] || {};
            const profit = d.regularMarketPrice && t.entryPrice ? ((d.regularMarketPrice - t.entryPrice) / t.entryPrice) * 100 : undefined;
            return (
              <li key={t.id} style={{ background: profit === undefined ? '#f9fafb' : profit >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 12, boxShadow: "0 2px 8px #0001", padding: 20, display: 'flex', alignItems: 'center', gap: 18, border: '1px solid #f1f1f1' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 18, letterSpacing: -0.5 }}>{t.ticker}</div>
                  <div style={{ fontSize: 15, color: '#444', marginTop: 2 }}>Entry: <b>${t.entryPrice}</b> | Date: {t.dateEntry?.slice(0, 10)}</div>
                  {d.regularMarketPrice && <div style={{ fontSize: 15, color: '#2563eb', marginTop: 2 }}>Current: <b>${d.regularMarketPrice}</b></div>}
                  {profit !== undefined && <div style={{ fontSize: 15, color: profit >= 0 ? '#16a34a' : '#dc2626', marginTop: 2 }}>Profit: <b>{profit.toFixed(2)}%</b></div>}
                  {!d.regularMarketPrice && <div style={{ color: '#e53e3e', fontSize: 14, marginTop: 2 }}>Could not load Alpha Vantage data for this ticker.</div>}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="button" onClick={() => handleEdit(t)} style={{ background: "#2563eb", color: "white", padding: "0.25rem 0.75rem", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: 'background 0.2s' }}>Edit</button>
                  <button type="button" onClick={() => handleDelete(t.id)} style={{ background: "#dc2626", color: "white", padding: "0.25rem 0.75rem", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: 'background 0.2s' }}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {editId && (
        <form onSubmit={handleEditSubmit} style={{ marginTop: 32, background: "#fff", padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0001', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <input name="ticker" value={editForm.ticker} onChange={handleEditChange} placeholder="Ticker (AAPL)" required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, textTransform: 'uppercase' }} />
            <input name="entryPrice" value={editForm.entryPrice} onChange={handleEditChange} placeholder="Entry Price" type="number" required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
            <input name="dateEntry" value={editForm.dateEntry} onChange={handleEditChange} placeholder="Entry Date" type="date" required style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
          </div>
          <button type="submit" disabled={loading} style={{ marginTop: 8, background: loading ? '#a5b4fc' : "#2563eb", color: "white", padding: "0.75rem 0", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
            {loading ? <span style={{display:'inline-block',width:18,height:18,border:'2px solid #fff',borderTop:'2px solid #2563eb',borderRadius:'50%',animation:'spin 1s linear infinite'}} /> : "Save Changes"}
          </button>
        </form>
      )}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </main>
  );
} 
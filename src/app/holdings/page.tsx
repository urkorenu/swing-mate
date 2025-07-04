"use client";
import { useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Input, Table, Thead, Tbody, Tr, Th, Td, TableContainer, VStack, Text, useColorModeValue } from "@chakra-ui/react";

interface Holding {
  id: string;
  ticker: string;
  entryPrice: number;
  dateEntry: string;
  quantity: number;
  sellPrice?: number;
  sellDate?: string;
}

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

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [info, setInfo] = useState<Record<string, TickerInfo>>({});
  const [form, setForm] = useState({ ticker: "", entryPrice: "", dateEntry: "", quantity: "1", sellPrice: "", sellDate: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ ticker: "", entryPrice: "", dateEntry: "", quantity: "1", sellPrice: "", sellDate: "" });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetch("/api/holdings")
      .then((res) => res.json())
      .then((data) => {
        setHoldings(data);
        data.forEach((h: Holding) => fetchInfo(h.ticker));
      });
  }, []);

  const fetchInfo = async (ticker: string) => {
    const res = await fetch(`/api/alpha?ticker=${ticker}`);
    const data = await res.json();
    if (!data.error) {
      setInfo((prev) => ({ ...prev, [ticker]: data }));
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
      const newHolding = await res.json();
      setHoldings([newHolding, ...holdings]);
      fetchInfo(ticker);
      setForm({ ticker: "", entryPrice: "", dateEntry: "", quantity: "1", sellPrice: "", sellDate: "" });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this holding?")) return;
    await fetch(`/api/holdings?id=${id}`, { method: "DELETE" });
    setHoldings(holdings.filter((h) => h.id !== id));
  };

  const handleEdit = (h: Holding) => {
    setEditId(h.id);
    setEditForm({
      ticker: h.ticker,
      entryPrice: String(h.entryPrice),
      dateEntry: h.dateEntry.slice(0, 10),
      quantity: String(h.quantity || 1),
      sellPrice: h.sellPrice ? String(h.sellPrice) : "",
      sellDate: h.sellDate ? h.sellDate.slice(0, 10) : "",
    });
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
      setHoldings(holdings.map((h) => h.id === editId ? updated : h));
      fetchInfo(ticker);
      setEditId(null);
    }
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all(holdings.map((h) => fetchInfo(h.ticker)));
    setRefreshing(false);
  };

  // Analytics
  let totalValue = 0;
  let totalCost = 0;
  let totalRealized = 0;
  let totalUnrealized = 0;
  let wins = 0;
  let losses = 0;
  let holdTimes: number[] = [];
  holdings.forEach(h => {
    const d = info[h.ticker] || {};
    // Realized P/L
    if (h.sellPrice && h.sellDate) {
      const realized = (h.sellPrice - h.entryPrice) * h.quantity;
      totalRealized += realized;
      if (realized >= 0) wins++; else losses++;
      // Hold time in days
      const days = (new Date(h.sellDate).getTime() - new Date(h.dateEntry).getTime()) / (1000 * 60 * 60 * 24);
      holdTimes.push(days);
    } else if (d.regularMarketPrice && h.quantity) {
      // Unrealized P/L
      const value = d.regularMarketPrice * h.quantity;
      const cost = h.entryPrice * h.quantity;
      totalValue += value;
      totalCost += cost;
      totalUnrealized += value - cost;
    }
  });
  const totalPL = totalRealized + totalUnrealized;
  const totalPLPercent = (totalCost + totalRealized) ? (totalPL / (totalCost + totalRealized)) * 100 : 0;
  const winRate = (wins + losses) ? (wins / (wins + losses)) * 100 : 0;
  const avgHold = holdTimes.length ? (holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length) : 0;

  return (
    <Box maxW="900px" mx="auto" py={8} fontFamily="Inter, Arial, sans-serif" bg={useColorModeValue('#f8fafc', 'gray.900')} minH="100vh">
      <Heading as="h2" size="xl" fontWeight={700} mb={8} textAlign="center" letterSpacing={-1}>Holdings</Heading>
      <Flex gap={6} justify="center" mb={10} flexWrap="wrap">
        <Box bg={useColorModeValue('white', 'gray.800')} borderRadius={12} boxShadow="md" p={8} minW={200} textAlign="center">
          <Text color="gray.500" fontSize={15}>Total Value (Open)</Text>
          <Text fontWeight={700} fontSize={24} color="blue.600">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        </Box>
        <Box bg={useColorModeValue('white', 'gray.800')} borderRadius={12} boxShadow="md" p={8} minW={200} textAlign="center">
          <Text color="gray.500" fontSize={15}>Total Realized P/L</Text>
          <Text fontWeight={700} fontSize={24} color={totalRealized >= 0 ? 'green.500' : 'red.500'}>{totalRealized >= 0 ? '+' : ''}${totalRealized.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        </Box>
        <Box bg={useColorModeValue('white', 'gray.800')} borderRadius={12} boxShadow="md" p={8} minW={200} textAlign="center">
          <Text color="gray.500" fontSize={15}>Total Unrealized P/L</Text>
          <Text fontWeight={700} fontSize={24} color={totalUnrealized >= 0 ? 'green.500' : 'red.500'}>{totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        </Box>
        <Box bg={useColorModeValue('white', 'gray.800')} borderRadius={12} boxShadow="md" p={8} minW={200} textAlign="center">
          <Text color="gray.500" fontSize={15}>Win Rate</Text>
          <Text fontWeight={700} fontSize={24} color="blue.600">{winRate.toFixed(1)}%</Text>
        </Box>
        <Box bg={useColorModeValue('white', 'gray.800')} borderRadius={12} boxShadow="md" p={8} minW={200} textAlign="center">
          <Text color="gray.500" fontSize={15}>Avg Hold (days)</Text>
          <Text fontWeight={700} fontSize={24} color="blue.600">{avgHold.toFixed(1)}</Text>
        </Box>
      </Flex>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32, background: "#fff", padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0001', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: "flex", gap: 12, flexWrap: 'wrap' }}>
          <input name="ticker" value={form.ticker} onChange={handleChange} placeholder="Ticker (AAPL)" required style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16, textTransform: 'uppercase' }} />
          <input name="entryPrice" value={form.entryPrice} onChange={handleChange} placeholder="Entry Price" type="number" required style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
          <input name="dateEntry" value={form.dateEntry} onChange={handleChange} placeholder="Entry Date" type="date" required style={{ flex: 1, minWidth: 120, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
          <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" type="number" required style={{ flex: 1, minWidth: 100, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
          <input name="sellPrice" value={form.sellPrice} onChange={handleChange} placeholder="Sell Price" type="number" style={{ flex: 1, minWidth: 100, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
          <input name="sellDate" value={form.sellDate} onChange={handleChange} placeholder="Sell Date" type="date" style={{ flex: 1, minWidth: 100, padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 16 }} />
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: 8, background: loading ? '#a5b4fc' : "#2563eb", color: "white", padding: "0.75rem 0", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 16, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
          {loading ? <span style={{display:'inline-block',width:18,height:18,border:'2px solid #fff',borderTop:'2px solid #2563eb',borderRadius:'50%',animation:'spin 1s linear infinite'}} /> : "Add Holding"}
        </button>
      </form>
      <div style={{overflowX:'auto', background:'#fff', borderRadius:12, boxShadow:'0 2px 12px #0001', padding: 0}}>
        <table style={{width:'100%', borderCollapse:'collapse', minWidth:700}}>
          <thead>
            <tr style={{background:'#f3f4f6', color:'#64748b', fontWeight:600, fontSize:15}}>
              <th style={{padding:'12px 8px'}}>Ticker</th>
              <th style={{padding:'12px 8px'}}>Name</th>
              <th style={{padding:'12px 8px'}}>Quantity</th>
              <th style={{padding:'12px 8px'}}>Entry Price</th>
              <th style={{padding:'12px 8px'}}>Entry Date</th>
              <th style={{padding:'12px 8px'}}>Current Price</th>
              <th style={{padding:'12px 8px'}}>Value</th>
              <th style={{padding:'12px 8px'}}>P/L</th>
              <th style={{padding:'12px 8px'}}>P/L %</th>
              <th style={{padding:'12px 8px'}}>Sell Price</th>
              <th style={{padding:'12px 8px'}}>Sell Date</th>
              <th style={{padding:'12px 8px'}}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {holdings.length === 0 ? (
              <tr><td colSpan={12} style={{textAlign:'center', color:'#888', padding:32}}>No holdings yet. Start by adding your first stock.</td></tr>
            ) : holdings.map((h) => {
              const d = info[h.ticker] || {};
              const value = d.regularMarketPrice && h.quantity ? d.regularMarketPrice * h.quantity : 0;
              const pl = d.regularMarketPrice && h.entryPrice && h.quantity ? (d.regularMarketPrice - h.entryPrice) * h.quantity : 0;
              const plPercent = d.regularMarketPrice && h.entryPrice ? ((d.regularMarketPrice - h.entryPrice) / h.entryPrice) * 100 : 0;
              return editId === h.id ? (
                <tr key={h.id} style={{background:'#f9fafb'}}>
                  <td colSpan={12}>
                    <form onSubmit={handleEditSubmit} style={{display:'flex',gap:12,alignItems:'center',padding:'8px 0',flexWrap:'wrap'}}>
                      <input name="ticker" value={editForm.ticker} onChange={handleEditChange} placeholder="Ticker" required style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15, textTransform: 'uppercase' }} />
                      <input name="entryPrice" value={editForm.entryPrice} onChange={handleEditChange} placeholder="Entry Price" type="number" required style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15 }} />
                      <input name="dateEntry" value={editForm.dateEntry} onChange={handleEditChange} placeholder="Entry Date" type="date" required style={{ flex: 1, minWidth: 100, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15 }} />
                      <input name="quantity" value={editForm.quantity} onChange={handleEditChange} placeholder="Quantity" type="number" required style={{ flex: 1, minWidth: 60, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15 }} />
                      <input name="sellPrice" value={editForm.sellPrice} onChange={handleEditChange} placeholder="Sell Price" type="number" style={{ flex: 1, minWidth: 80, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15 }} />
                      <input name="sellDate" value={editForm.sellDate} onChange={handleEditChange} placeholder="Sell Date" type="date" style={{ flex: 1, minWidth: 100, padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', fontSize: 15 }} />
                      <button type="submit" disabled={loading} style={{ background: loading ? '#a5b4fc' : "#2563eb", color: "white", border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 600, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>Save</button>
                      <button type="button" onClick={()=>setEditId(null)} style={{ background: '#f3f4f6', color: '#64748b', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 500, fontSize: 15, cursor: 'pointer' }}>Cancel</button>
                    </form>
                  </td>
                </tr>
              ) : (
                <tr key={h.id} style={{borderBottom:'1px solid #f1f1f1'}}>
                  <td style={{padding:'10px 8px', fontWeight:600, fontSize:16}}>{h.ticker}</td>
                  <td style={{padding:'10px 8px', color:'#64748b'}}>{d.shortName || '-'}</td>
                  <td style={{padding:'10px 8px'}}>{h.quantity}</td>
                  <td style={{padding:'10px 8px'}}>${h.entryPrice}</td>
                  <td style={{padding:'10px 8px'}}>{h.dateEntry ? h.dateEntry.slice(0,10) : '-'}</td>
                  <td style={{padding:'10px 8px'}}>{d.regularMarketPrice ? `$${d.regularMarketPrice}` : <span style={{color:'#e53e3e',fontSize:14}}>N/A</span>}</td>
                  <td style={{padding:'10px 8px'}}>{d.regularMarketPrice ? `$${(d.regularMarketPrice * h.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}</td>
                  <td style={{padding:'10px 8px', color: h.sellPrice ? (h.sellPrice - h.entryPrice >= 0 ? '#16a34a' : '#dc2626') : (d.regularMarketPrice && d.regularMarketPrice - h.entryPrice >= 0 ? '#16a34a' : '#dc2626'), fontWeight:600 }}>
                    {h.sellPrice && h.sellDate
                      ? (h.sellPrice - h.entryPrice >= 0 ? '+' : '') + `$${((h.sellPrice - h.entryPrice) * h.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                      : d.regularMarketPrice
                        ? (d.regularMarketPrice - h.entryPrice >= 0 ? '+' : '') + `$${((d.regularMarketPrice - h.entryPrice) * h.quantity).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                        : '-'}
                  </td>
                  <td style={{padding:'10px 8px', color: h.sellPrice ? (h.sellPrice - h.entryPrice >= 0 ? '#16a34a' : '#dc2626') : (d.regularMarketPrice && d.regularMarketPrice - h.entryPrice >= 0 ? '#16a34a' : '#dc2626'), fontWeight:600 }}>
                    {h.sellPrice && h.sellDate
                      ? (h.sellPrice - h.entryPrice >= 0 ? '+' : '') + (((h.sellPrice - h.entryPrice) / h.entryPrice) * 100).toFixed(2) + '%'
                      : d.regularMarketPrice
                        ? (d.regularMarketPrice - h.entryPrice >= 0 ? '+' : '') + (((d.regularMarketPrice - h.entryPrice) / h.entryPrice) * 100).toFixed(2) + '%'
                        : '-'}
                  </td>
                  <td style={{padding:'10px 8px'}}>{h.sellPrice && h.sellDate ? `$${h.sellPrice}` : '-'}</td>
                  <td style={{padding:'10px 8px'}}>{h.sellDate ? h.sellDate.slice(0, 10) : '-'}</td>
                  <td style={{padding:'10px 8px'}}>
                    <button onClick={() => handleEdit(h)} style={{ background: '#f3f4f6', color: '#2563eb', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 500, cursor: 'pointer', fontSize: 15, marginRight: 6 }}>Edit</button>
                    <button onClick={() => handleDelete(h.id)} style={{ background: '#f3f4f6', color: '#dc2626', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 500, cursor: 'pointer', fontSize: 15 }}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:32}}>
        <button onClick={handleRefresh} disabled={refreshing} style={{background:'#f3f4f6',color:'#2563eb',border:'none',borderRadius:6,padding:'6px 16px',fontWeight:500,cursor:refreshing?'not-allowed':'pointer',fontSize:15}}>
          {refreshing ? 'Refreshing...' : 'Refresh All'}
        </button>
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          table { font-size: 13px; }
          th, td { padding: 6px 4px !important; }
        }
      `}</style>
    </Box>
  );
} 
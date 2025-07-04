"use client";
import { useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Input, VStack, Text, useColorModeValue } from "@chakra-ui/react";

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
    <Box maxW="520px" mx="auto" py={8} fontFamily="Inter, Arial, sans-serif">
      <Heading as="h2" size="xl" fontWeight={700} mb={8} textAlign="center" letterSpacing={-1}>Trade Journal</Heading>
      <form onSubmit={handleSubmit} style={{ marginBottom: 32, background: "#fff", padding: 24, borderRadius: 12, boxShadow: '0 2px 12px #0001', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Flex gap={3} mb={2}>
          <Input name="ticker" value={form.ticker} onChange={handleChange} placeholder="Ticker (AAPL)" required flex={1} size="md" borderRadius={8} fontSize={16} textTransform="uppercase" />
          <Input name="entryPrice" value={form.entryPrice} onChange={handleChange} placeholder="Entry Price" type="number" required flex={1} size="md" borderRadius={8} fontSize={16} />
          <Input name="dateEntry" value={form.dateEntry} onChange={handleChange} placeholder="Entry Date" type="date" required flex={1} size="md" borderRadius={8} fontSize={16} />
        </Flex>
        <Button type="submit" isLoading={loading} colorScheme="blue" size="md" borderRadius={8} fontWeight={600} fontSize={16} mt={2}>
          Buy (Add to Holdings)
        </Button>
      </form>
      {trades.length === 0 ? (
        <Box bg="gray.50" borderRadius={12} boxShadow="md" p={8} textAlign="center" color="gray.400">
          No trades yet. Start by buying your first stock.
        </Box>
      ) : (
        <VStack as="ul" spacing={4} align="stretch">
          {trades.map((t) => {
            const d = info[t.ticker] || {};
            const profit = d.regularMarketPrice && t.entryPrice ? ((d.regularMarketPrice - t.entryPrice) / t.entryPrice) * 100 : undefined;
            return (
              <Box as="li" key={t.id} bg={profit === undefined ? 'gray.50' : profit >= 0 ? 'green.50' : 'red.50'} borderRadius={12} boxShadow="md" p={6} display="flex" alignItems="center" gap={6} borderWidth={1} borderColor="gray.100">
                <Box flex={1}>
                  <Text fontWeight={600} fontSize={18} letterSpacing={-0.5}>{t.ticker}</Text>
                  <Text fontSize={15} color="gray.600" mt={1}>Entry: <b>${t.entryPrice}</b> | Date: {t.dateEntry?.slice(0, 10)}</Text>
                  {d.regularMarketPrice && <Text fontSize={15} color="blue.600" mt={1}>Current: <b>${d.regularMarketPrice}</b></Text>}
                  {profit !== undefined && <Text fontSize={15} color={profit >= 0 ? 'green.600' : 'red.600'} mt={1}>Profit: <b>{profit.toFixed(2)}%</b></Text>}
                  {!d.regularMarketPrice && <Text color="red.400" fontSize={14} mt={1}>Could not load Alpha Vantage data for this ticker.</Text>}
                </Box>
              </Box>
            );
          })}
        </VStack>
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
    </Box>
  );
} 
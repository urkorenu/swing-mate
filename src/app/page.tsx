"use client";
import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
  Box,
  Button,
  Center,
  Container,
  Flex,
  Heading,
  Stack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  Icon,
  chakra,
  List,
  ListItem,
  ListIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Input,
  FormControl,
  FormLabel,
  IconButton,
  Select
} from "@chakra-ui/react";
import { ArrowUpIcon, ArrowDownIcon, StarIcon, WarningIcon, TriangleUpIcon, TriangleDownIcon, EditIcon, DeleteIcon, SearchIcon } from "@chakra-ui/icons";
import { format } from 'date-fns';

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
}

interface Trade {
  id: string;
  ticker: string;
  quantity: number;
  entryPrice: number;
  entryDate: string;
  sellPrice?: number;
  sellDate?: string;
  notes?: string;
}

function SummaryCard({ label, value, color, icon }: { label: string; value: any; color: string; icon?: any }) {
  return (
    <Box
      bg="rgba(35,44,58,0.85)"
      borderRadius="2xl"
      boxShadow="0 4px 32px 0 rgba(0,0,0,0.25)"
      p={9}
      minW="220px"
      maxW="260px"
      textAlign="center"
      borderWidth={2}
      borderColor={color}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={3}
      backdropFilter="blur(8px)"
      transition="transform 0.18s, box-shadow 0.18s"
      _hover={{
        transform: 'translateY(-6px) scale(1.04)',
        boxShadow: '0 8px 40px 0 rgba(0,0,0,0.35)',
        borderColor: color,
      }}
      _active={{
        transform: 'scale(0.97)',
      }}
    >
      <Box fontSize="4xl" mb={3} display="flex" alignItems="center" justifyContent="center" color={color}>{icon}</Box>
      <Text fontSize="md" fontWeight="semibold" color="#a0aec0" mb={2} noOfLines={1} letterSpacing={0.5}>{label}</Text>
      <Text fontWeight="extrabold" fontSize="2.6xl" color={color} wordBreak="break-word" letterSpacing={-1}>{value}</Text>
    </Box>
  );
}

function PLValue({ value, percent, ticker }: { value: number; percent: number; ticker?: string }) {
  if (ticker) {
    return (
      <VStack spacing={0} align="center" justify="center" w="full">
        <Text fontWeight="bold" color="#63b3ed" fontSize={{ base: 'md', md: 'lg' }} wordBreak="break-word" maxW="120px" textAlign="center">{ticker}</Text>
        <Text fontWeight="bold" color={value >= 0 ? "#48bb78" : "#f56565"} fontSize={{ base: 'lg', md: 'xl' }}>{value >= 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        <Text fontWeight="bold" color={percent >= 0 ? "#48bb78" : "#f56565"} fontSize={{ base: 'sm', md: 'md' }}>({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)</Text>
      </VStack>
    );
  }
  return (
    <HStack spacing={1} justify="center">
      <Text fontWeight="bold" color={value >= 0 ? "#48bb78" : "#f56565"}>{value >= 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
      <Text fontWeight="bold" color={percent >= 0 ? "#48bb78" : "#f56565"}>({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)</Text>
    </HStack>
  );
}

function isHolding(obj: any): obj is Holding {
  return obj && typeof obj === 'object' && 'entryPrice' in obj && 'ticker' in obj;
}

export default function HomePage() {
  const bg = '#181f2a';
  const [trades, setTrades] = useState<Trade[]>([]);
  const [info, setInfo] = useState<Record<string, any>>({});
  const [form, setForm] = useState({ ticker: '', quantity: '', entryPrice: '', entryDate: '', sellPrice: '', sellDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("dateEntry");
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>("desc");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  // Utility for SSR-safe date formatting
  function formatDate(dateStr: string | undefined) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return format(d, 'MMM dd, yyyy');
  }

  // Chakra color mode values (hooks must be at top level)
  const rowHoverBg = '#232c3a';
  const editRowBg = '#232c3a';
  const tableHeaderBg = '#232c3a';

  useEffect(() => {
    fetch('/api/holdings')
      .then(res => res.json())
      .then(data => setTrades(data))
      .catch(() => setTrades([]));
  }, []);

  // Fetch ticker info for open trades
  useEffect(() => {
    trades.forEach((t) => {
      if (!t.sellPrice && !t.sellDate && !info[t.ticker]) {
        fetch(`/api/alpha?ticker=${t.ticker}`)
          .then(res => res.json())
          .then(data => setInfo(prev => ({ ...prev, [t.ticker]: data })))
          .catch(() => {});
      }
    });
  }, [trades]);

  // Analytics
  const analytics = useMemo(() => {
    const open = trades.filter(h => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      return sellPriceNum === undefined || h.sellDate == null || String(h.sellDate) === "";
    });
    const closed = trades.filter(h => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      return !(sellPriceNum === undefined || h.sellDate == null || String(h.sellDate) === "");
    });
    const total = trades.length;
    const win = closed.filter(h => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      return sellPriceNum !== undefined && sellPriceNum > h.entryPrice;
    }).length;
    const loss = closed.filter(h => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      return sellPriceNum !== undefined && sellPriceNum < h.entryPrice;
    }).length;
    const winRate = closed.length ? (win / closed.length) * 100 : 0;
    const avgEntry = total ? trades.reduce((sum, h) => sum + h.entryPrice, 0) / total : 0;
    // Average P/L (Open): average of (currentPrice - entryPrice) * quantity for open trades
    const openPLs = open.map(h => {
      const d = info[h.ticker] || {};
      const currentPrice = typeof d.regularMarketPrice === 'number' ? d.regularMarketPrice : h.entryPrice;
      return (currentPrice - h.entryPrice) * (h.quantity || 1);
    }).filter(x => typeof x === 'number' && !isNaN(x));
    const avgPLOpen = openPLs.length ? openPLs.reduce((a, b) => Number(a) + Number(b), 0) / openPLs.length : 0;
    // Average P/L (Closed): average of (sellPrice - entryPrice) * quantity for closed trades
    const closedPLs = closed.map(h => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      return sellPriceNum !== undefined ? (sellPriceNum - h.entryPrice) * (h.quantity || 1) : undefined;
    }).filter(x => typeof x === 'number' && !isNaN(x));
    const avgPLClosed = closedPLs.length ? closedPLs.reduce((a, b) => Number(a) + Number(b), 0) / closedPLs.length : 0;
    // Average P/L (Closed) %: average of ((sellPrice - entryPrice) / entryPrice) * 100 for closed trades
    const closedPLPercents = closed.map(h => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      return sellPriceNum !== undefined ? ((sellPriceNum - h.entryPrice) / h.entryPrice) * 100 : undefined;
    }).filter(x => typeof x === 'number' && !isNaN(x));
    const avgPLClosedPct = closedPLPercents.length ? closedPLPercents.reduce((a, b) => Number(a) + Number(b), 0) / closedPLPercents.length : 0;
    // Best and worst trade (by P/L)
    let bestPL = -Infinity, worstPL = Infinity;
    closed.forEach(h => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      const pl = sellPriceNum !== undefined ? (sellPriceNum - h.entryPrice) * (h.quantity || 1) : undefined;
      if (pl !== undefined && !isNaN(pl)) {
        if (pl > bestPL) bestPL = pl;
        if (pl < worstPL) worstPL = pl;
      }
    });
    // Total value (sum of all trade values)
    const totalValue = trades.reduce((sum, h) => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      const isClosed = !(sellPriceNum === undefined || h.sellDate == null || String(h.sellDate) === "");
      const d = info[h.ticker] || {};
      const currentPrice = isClosed ? sellPriceNum : d.regularMarketPrice;
      const value = (currentPrice !== undefined ? currentPrice : 0) * (h.quantity || 1);
      return sum + value;
    }, 0);
    const openValue = open.reduce((sum, h) => {
      const d = info[h.ticker] || {};
      const currentPrice = typeof d.regularMarketPrice === 'number' ? d.regularMarketPrice : h.entryPrice;
      return sum + (currentPrice * (h.quantity || 1));
    }, 0);
    const closedValue = closed.reduce((sum, h) => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      return sum + ((sellPriceNum !== undefined ? sellPriceNum : 0) * (h.quantity || 1));
    }, 0);
    const openDurations = open.map(h => {
      const entry = new Date(h.entryDate);
      const now = new Date();
      const diff = (now.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24); // days
      return isNaN(diff) ? undefined : diff;
    }).filter((x): x is number => typeof x === 'number' && !isNaN(x));
    const avgOpenDuration = openDurations.length ? openDurations.reduce((a: number, b: number) => a + b, 0) / openDurations.length : 0;
    const openPLPercents = open.map(h => {
      const d = info[h.ticker] || {};
      const currentPrice = typeof d.regularMarketPrice === 'number' ? d.regularMarketPrice : h.entryPrice;
      const pct = ((currentPrice - h.entryPrice) / h.entryPrice) * 100;
      return isNaN(pct) ? undefined : pct;
    }).filter((x): x is number => typeof x === 'number' && !isNaN(x));
    const avgPLOpenPct = openPLPercents.length ? openPLPercents.reduce((a: number, b: number) => a + b, 0) / openPLPercents.length : 0;
    const largestOpen = open.reduce((max, h) => {
      const d = info[h.ticker] || {};
      const currentPrice = typeof d.regularMarketPrice === 'number' ? d.regularMarketPrice : h.entryPrice;
      const value = currentPrice * (h.quantity || 1);
      return value > max ? value : max;
    }, 0);
    // Add total open P/L ($) and total open P/L (%)
    const totalOpenPL = open.reduce((sum, h) => {
      const d = info[h.ticker] || {};
      const currentPrice = typeof d.regularMarketPrice === 'number' ? d.regularMarketPrice : h.entryPrice;
      return sum + ((currentPrice - h.entryPrice) * (h.quantity || 1));
    }, 0);
    const totalOpenCost = open.reduce((sum, h) => sum + (h.entryPrice * (h.quantity || 1)), 0);
    const totalOpenPLPct = totalOpenCost > 0 ? (totalOpenPL / totalOpenCost) * 100 : 0;
    // Closed trades: total P/L ($) and total P/L (%)
    const totalClosedPL = closed.reduce((sum, h) => {
      const sellPriceNum = h.sellPrice == null || String(h.sellPrice) === "" ? undefined : Number(h.sellPrice);
      return sum + ((sellPriceNum !== undefined ? sellPriceNum : 0) - h.entryPrice) * (h.quantity || 1);
    }, 0);
    const totalClosedCost = closed.reduce((sum, h) => sum + (h.entryPrice * (h.quantity || 1)), 0);
    const totalClosedPLPct = totalClosedCost > 0 ? (totalClosedPL / totalClosedCost) * 100 : 0;
    return {
      openCount: open.length,
      closedCount: closed.length,
      total,
      win,
      loss,
      winRate,
      avgEntry,
      avgPLOpen,
      avgPLOpenPct,
      avgOpenDuration,
      largestOpen,
      avgPLClosed,
      avgPLClosedPct: avgPLClosedPct,
      bestPL: bestPL === -Infinity ? 0 : bestPL,
      worstPL: worstPL === Infinity ? 0 : worstPL,
      openValue,
      closedValue,
      totalOpenPL,
      totalOpenPLPct,
      totalClosedPL,
      totalClosedPLPct
    };
  }, [trades, info]);

  // Search and sort
  const filteredTrades = useMemo(() => {
    let filtered = trades.filter(t =>
      t.ticker.toLowerCase().includes(search.toLowerCase())
    );
    filtered = filtered.sort((a, b) => {
      const getVal = (t: Trade) => {
        const sellPriceNum = t.sellPrice == null || String(t.sellPrice) === "" ? undefined : Number(t.sellPrice);
        const isClosed = !(sellPriceNum === undefined || t.sellDate == null || String(t.sellDate) === "");
        const d = info[t.ticker] || {};
        let currentPrice: number | undefined;
        if (isClosed && sellPriceNum !== undefined) {
          currentPrice = Number(sellPriceNum);
        } else if (!isClosed && typeof d.regularMarketPrice === 'number') {
          currentPrice = d.regularMarketPrice;
        } else {
          currentPrice = t.entryPrice;
        }
        const value = (currentPrice !== undefined ? currentPrice : 0) * (t.quantity || 1);
        const pl = currentPrice !== undefined ? (currentPrice - t.entryPrice) * (t.quantity || 1) : null;
        const plPct = currentPrice !== undefined ? ((currentPrice - t.entryPrice) / t.entryPrice) * 100 : null;
        switch (sortBy) {
          case 'entryDate': return t.entryDate;
          case 'ticker': return t.ticker;
          case 'quantity': return Number(t.quantity);
          case 'entryPrice': return Number(t.entryPrice);
          case 'sellPrice': return t.sellPrice !== undefined ? Number(t.sellPrice) : undefined;
          case 'sellDate': return t.sellDate || '';
          case 'currentPrice': return currentPrice !== undefined ? Number(currentPrice) : undefined;
          case 'value': return value;
          case 'pl': return pl;
          case 'plPct': return plPct;
          case 'status': return isClosed ? (pl !== null && pl >= 0 ? 2 : 1) : 0; // 2: win, 1: loss, 0: open
          default: return undefined;
        }
      };
      const aVal = getVal(a!);
      const bVal = getVal(b!);
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return filtered;
  }, [trades, search, sortBy, sortDir]);

  // Add trade/holding
  const handleAddTrade = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: form?.ticker ?? '',
          quantity: form?.quantity ?? '',
          entryPrice: form?.entryPrice ?? '',
          dateEntry: form?.entryDate ?? '',
          sellPrice: form?.sellPrice ?? '',
          sellDate: form?.sellDate ?? ''
        })
      });
      if (!res.ok) throw new Error('Failed to add trade');
      const newTrade = await res.json();
      setTrades(prev => [newTrade, ...prev]);
      setForm({ ticker: '', quantity: '', entryPrice: '', entryDate: '', sellPrice: '', sellDate: '' });
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Edit trade
  const handleEdit = (trade: Trade) => {
    setEditId(trade.id);
    setEditForm({ ...trade });
  };
  const handleEditChange = (e: any) => {
    setEditForm((f: any) => ({ ...f, [e.target.name]: e.target.value }));
  };
  const handleEditSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/holdings?id=${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      if (!res.ok) throw new Error('Failed to update trade');
      const updated = await res.json();
      setTrades(prev => prev.map(t => t.id === editId ? updated : t));
      setEditId(null);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };
  // Delete trade
  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/holdings?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete trade');
      setTrades(prev => prev.filter(t => t.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  // Sorting handler for table headers
  function handleSort(column: string) {
    if (sortBy === column) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDir('asc');
    }
  }

  return (
    <>
      <Button
        position="fixed"
        top="24px"
        right="32px"
        zIndex={200}
        bg="#232c3a"
        color="#e2e8f0"
        px={7}
        py={2}
        fontSize="lg"
        borderRadius={16}
        boxShadow="0 4px 24px 0 rgba(0,0,0,0.35)"
        _hover={{ bg: '#2b3850', color: '#63b3ed', transform: 'scale(1.04)' }}
        _active={{ bg: '#181f2a' }}
        transition="all 0.15s"
        onClick={() => setShowAddForm(f => !f)}
      >
        {showAddForm ? 'Close' : 'Add Trade'}
      </Button>

      {showAddForm && (
        <Box
          maxW="700px"
          mx="auto"
          mt={10}
          mb={6}
          px={{ base: 4, md: 8 }}
          py={8}
          bg="#232c3a"
          borderRadius={20}
          boxShadow="0 8px 40px 0 rgba(0,0,0,0.35)"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Text fontSize="2xl" fontWeight={800} color="#63b3ed" mb={6} letterSpacing={-1}>Add Trade</Text>
          <form onSubmit={handleAddTrade} autoComplete="off" style={{ width: '100%' }}>
            <Flex gap={6} align="end" wrap="wrap">
              <FormControl isRequired minW={150} flex={1}>
                <FormLabel fontSize="lg">Ticker</FormLabel>
                <Input bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} value={form.ticker} onChange={e => setForm(f => ({...f, ticker: e.target.value.toUpperCase()}))} placeholder="AAPL" maxLength={8} autoComplete="off" />
              </FormControl>
              <FormControl isRequired minW={150} flex={1}>
                <FormLabel fontSize="lg">Quantity</FormLabel>
                <Input bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} type="number" value={form.quantity} onChange={e => setForm(f => ({...f, quantity: e.target.value}))} placeholder="Quantity" min={1} autoComplete="off" />
              </FormControl>
              <FormControl isRequired minW={150} flex={1}>
                <FormLabel fontSize="lg">Entry Price</FormLabel>
                <Input bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} type="number" value={form.entryPrice} onChange={e => setForm(f => ({...f, entryPrice: e.target.value}))} placeholder="Entry Price" step="0.01" min={0} autoComplete="off" inputMode="decimal" />
              </FormControl>
              <FormControl isRequired minW={180} flex={1}>
                <FormLabel fontSize="lg">Entry Date</FormLabel>
                <Input bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} type="date" value={form.entryDate} onChange={e => setForm(f => ({...f, entryDate: e.target.value}))} autoComplete="off" />
              </FormControl>
              <FormControl minW={150} flex={1}>
                <FormLabel fontSize="lg">Sell Price</FormLabel>
                <Input bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} type="number" value={form.sellPrice} onChange={e => setForm(f => ({...f, sellPrice: e.target.value}))} placeholder="Sell Price" step="0.01" min={0} autoComplete="off" />
              </FormControl>
              <FormControl minW={180} flex={1}>
                <FormLabel fontSize="lg">Sell Date</FormLabel>
                <Input bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} type="date" value={form.sellDate} onChange={e => setForm(f => ({...f, sellDate: e.target.value}))} autoComplete="off" />
              </FormControl>
            </Flex>
            <Flex mt={8} justify="flex-end" gap={4}>
              <Button bg="#232c3a" color="#e2e8f0" _hover={{ bg: '#2b3850', color: '#63b3ed' }} _active={{ bg: '#181f2a' }} boxShadow="md" borderRadius={10} fontSize="lg" type="submit" isLoading={loading}>Add</Button>
              <Button onClick={() => setShowAddForm(false)} ml={3}>Cancel</Button>
            </Flex>
            {error && <Text color="red.500" mt={4}>{error}</Text>}
          </form>
        </Box>
      )}
      <Box as="main" minH="100vh" pb={8} w="100%" maxW="1100px" px={{ base: 2, md: 6, xl: 10 }} py={{ base: 4, md: 6 }} my={10} borderRadius={24} boxShadow="0 4px 32px 0 rgba(0,0,0,0.35)" fontFamily="Inter, Arial, sans-serif" mx="auto" style={{overflowX:'auto', background: 'rgba(24,31,42,0.98)', backdropFilter: 'blur(12px)'}}>
        <Box w="100%" maxW="1200px" mx="auto" mb={6}>
          <Flex gap={8} flexWrap={{ base: 'wrap', md: 'nowrap' }} justify="center" align="stretch">
            {/* Open Trades Stats */}
            <Box flex={1} minW="290px" maxW="420px" bg="rgba(35,44,58,0.98)" borderRadius={24} boxShadow="0 4px 32px 0 rgba(99,179,237,0.10)" px={{ base: 4, md: 8 }} py={7} display="flex" flexDirection="column" alignItems="center">
              <Text fontSize="xl" fontWeight={800} color="#63b3ed" mb={4} letterSpacing={-1}>Open Trades</Text>
              <SimpleGrid columns={2} spacing={5} w="100%">
                <SummaryCard label="Count" value={analytics.openCount} color="#63b3ed" icon={<TriangleUpIcon />} />
                <SummaryCard label="Open Value" value={`$${analytics.openValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="#3182ce" icon={<StarIcon />} />
                <SummaryCard label="Avg P/L" value={`${analytics.avgPLOpen >= 0 ? '+' : ''}$${analytics.avgPLOpen.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color={analytics.avgPLOpen >= 0 ? '#48bb78' : '#f56565'} icon={<TriangleUpIcon />} />
                <SummaryCard label="Avg P/L %" value={`${analytics.avgPLOpenPct >= 0 ? '+' : ''}${analytics.avgPLOpenPct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`} color={analytics.avgPLOpenPct >= 0 ? '#48bb78' : '#f56565'} icon={<TriangleUpIcon />} />
                <SummaryCard label="Total P/L" value={`${analytics.totalOpenPL >= 0 ? '+' : ''}$${analytics.totalOpenPL.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color={analytics.totalOpenPL >= 0 ? '#48bb78' : '#f56565'} icon={<TriangleUpIcon />} />
                <SummaryCard label="Total P/L %" value={`${analytics.totalOpenPLPct >= 0 ? '+' : ''}${analytics.totalOpenPLPct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`} color={analytics.totalOpenPLPct >= 0 ? '#48bb78' : '#f56565'} icon={<TriangleUpIcon />} />
                <SummaryCard label="Avg Hold (days)" value={analytics.avgOpenDuration.toLocaleString(undefined, { maximumFractionDigits: 1 })} color="#805ad5" icon={<StarIcon />} />
                <SummaryCard label="Largest Open" value={`$${analytics.largestOpen.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="#f6ad55" icon={<StarIcon />} />
              </SimpleGrid>
            </Box>
            {/* Closed Trades Stats */}
            <Box flex={1} minW="290px" maxW="420px" bg="rgba(35,44,58,0.98)" borderRadius={24} boxShadow="0 4px 32px 0 rgba(99,179,237,0.10)" px={{ base: 4, md: 8 }} py={7} display="flex" flexDirection="column" alignItems="center">
              <Text fontSize="xl" fontWeight={800} color="#63b3ed" mb={4} letterSpacing={-1}>Closed Trades</Text>
              <SimpleGrid columns={2} spacing={5} w="100%">
                <SummaryCard label="Count" value={analytics.closedCount} color="#63b3ed" icon={<TriangleDownIcon />} />
                <SummaryCard label="Win Rate" value={`${analytics.winRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`} color="#48bb78" icon={<TriangleUpIcon />} />
                <SummaryCard label="Avg P/L" value={`${analytics.avgPLClosed >= 0 ? '+' : ''}$${analytics.avgPLClosed.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color={analytics.avgPLClosed >= 0 ? '#48bb78' : '#f56565'} icon={<TriangleUpIcon />} />
                <SummaryCard label="Avg P/L %" value={`${analytics.avgPLClosedPct >= 0 ? '+' : ''}${analytics.avgPLClosedPct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`} color={analytics.avgPLClosedPct >= 0 ? '#48bb78' : '#f56565'} icon={<TriangleUpIcon />} />
                <SummaryCard label="Total P/L" value={`${analytics.totalClosedPL >= 0 ? '+' : ''}$${analytics.totalClosedPL.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color={analytics.totalClosedPL >= 0 ? '#48bb78' : '#f56565'} icon={<TriangleUpIcon />} />
                <SummaryCard label="Total P/L %" value={`${analytics.totalClosedPLPct >= 0 ? '+' : ''}${analytics.totalClosedPLPct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`} color={analytics.totalClosedPLPct >= 0 ? '#48bb78' : '#f56565'} icon={<TriangleUpIcon />} />
                <SummaryCard label="Best Trade" value={`$${analytics.bestPL.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="#63b3ed" icon={<StarIcon />} />
                <SummaryCard label="Worst Trade" value={`$${analytics.worstPL.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="#f56565" icon={<WarningIcon />} />
              </SimpleGrid>
            </Box>
          </Flex>
        </Box>
        <Flex mb={6} align="center" gap={4} w="100%" flexWrap="wrap">
          <Input placeholder="Search by ticker..." value={search} onChange={e => setSearch(e.target.value)} maxW={300} size="lg" fontSize={18} bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} />
          <Select bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} maxW={200} size="lg" fontSize={18}>
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="win">Win</option>
            <option value="loss">Loss</option>
            <option value="closed">Closed</option>
          </Select>
        </Flex>
        <Box w="100%">
          <TableContainer borderRadius={14} boxShadow="0 2px 16px 0 rgba(0,0,0,0.18)" bg="rgba(35,44,58,0.95)" w="100%" border="1px solid" borderColor="#232c3a">
            <Table size="md" variant="unstyled" w="100%" minW="900px" sx={{'th,td':{color:'#e2e8f0', fontWeight:500, fontSize:'15px', textAlign:'center'},'tr':{background:'rgba(35,44,58,0.95)'},'tr:nth-of-type(even)':{background:'rgba(26,34,48,0.95)'}}}>
              <Thead position="sticky" top={0} zIndex={2}>
                <Tr fontSize={16} height={44} bg={tableHeaderBg}>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('ticker')} bg={sortBy === 'ticker' ? rowHoverBg : undefined}>Ticker {sortBy === 'ticker' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('quantity')} bg={sortBy === 'quantity' ? rowHoverBg : undefined}>Quantity {sortBy === 'quantity' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('entryPrice')} bg={sortBy === 'entryPrice' ? rowHoverBg : undefined}>Entry Price {sortBy === 'entryPrice' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('entryDate')} bg={sortBy === 'entryDate' ? rowHoverBg : undefined}>Entry Date {sortBy === 'entryDate' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('sellPrice')} bg={sortBy === 'sellPrice' ? rowHoverBg : undefined}>Sell Price {sortBy === 'sellPrice' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4}>Sell Date</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('currentPrice')} bg={sortBy === 'currentPrice' ? rowHoverBg : undefined}>Current Price {sortBy === 'currentPrice' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('value')} bg={sortBy === 'value' ? rowHoverBg : undefined}>Value {sortBy === 'value' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('pl')} bg={sortBy === 'pl' ? rowHoverBg : undefined}>P/L {sortBy === 'pl' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('plPct')} bg={sortBy === 'plPct' ? rowHoverBg : undefined}>P/L % {sortBy === 'plPct' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4} cursor="pointer" onClick={() => handleSort('status')} bg={sortBy === 'status' ? rowHoverBg : undefined}>Status {sortBy === 'status' ? (sortDir === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />) : null}</Th>
                  <Th py={3} px={4}>Actions</Th>
                </Tr>
              </Thead>
              <Tbody fontSize={15}>
                {Array.isArray(filteredTrades) && filteredTrades
                  .filter(trade => {
                    if (!statusFilter) return true;
                    const sellPriceNum = trade.sellPrice == null || String(trade.sellPrice) === "" ? undefined : Number(trade.sellPrice);
                    const isClosed = !(sellPriceNum === undefined || trade.sellDate == null || String(trade.sellDate) === "");
                    const pl = isClosed && sellPriceNum !== undefined ? (sellPriceNum - trade.entryPrice) * (trade.quantity || 1) : null;
                    if (statusFilter === 'open') return !isClosed;
                    if (statusFilter === 'win') return isClosed && pl !== null && pl >= 0;
                    if (statusFilter === 'loss') return isClosed && pl !== null && pl < 0;
                    if (statusFilter === 'closed') return isClosed;
                    return true;
                  })
                  .map((trade) => {
                    const sellPriceNum = trade.sellPrice == null || String(trade.sellPrice) === "" ? undefined : Number(trade.sellPrice);
                    const isClosed = !(sellPriceNum === undefined || trade.sellDate == null || String(trade.sellDate) === "");
                    const d = info[trade.ticker] || {};
                    let currentPrice: number | undefined;
                    if (isClosed && sellPriceNum !== undefined) {
                      currentPrice = Number(sellPriceNum);
                    } else if (!isClosed && typeof d.regularMarketPrice === 'number') {
                      currentPrice = d.regularMarketPrice;
                    } else {
                      currentPrice = trade.entryPrice;
                    }
                    const value = (currentPrice !== undefined ? currentPrice : 0) * (trade.quantity || 1);
                    const pl = currentPrice !== undefined ? (currentPrice - trade.entryPrice) * (trade.quantity || 1) : null;
                    const plPct = currentPrice !== undefined ? ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100 : null;
                    if (editId === trade.id) {
                      return (
                        <Tr key={trade.id} bg={editRowBg}>
                          <Td colSpan={12}>
                            <form onSubmit={handleEditSubmit} style={{display:'flex',gap:12,alignItems:'center',padding:'8px 0',flexWrap:'wrap'}}>
                              <Input name="ticker" value={editForm.ticker} onChange={handleEditChange} placeholder="Ticker" required maxLength={8} fontSize={16} width={100} bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} />
                              <Input name="quantity" value={editForm.quantity} onChange={handleEditChange} placeholder="Quantity" type="number" required fontSize={16} width={100} bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} />
                              <Input name="entryPrice" value={editForm.entryPrice} onChange={handleEditChange} placeholder="Entry Price" type="number" required fontSize={16} width={120} bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} />
                              <Input name="entryDate" value={editForm.entryDate} onChange={handleEditChange} placeholder="Entry Date" type="date" required fontSize={16} width={140} bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} />
                              <Input name="sellPrice" value={editForm.sellPrice} onChange={handleEditChange} placeholder="Sell Price" type="number" fontSize={16} width={120} bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} />
                              <Input name="sellDate" value={editForm.sellDate} onChange={handleEditChange} placeholder="Sell Date" type="date" fontSize={16} width={140} bg="rgba(26,34,48,0.95)" color="#e2e8f0" borderColor="#2d3748" _placeholder={{ color: '#718096' }} _focus={{ borderColor: '#63b3ed', boxShadow: '0 0 0 2px #63b3ed' }} />
                              <Button type="submit" isLoading={loading} fontSize={16}>Save</Button>
                              <Button type="button" onClick={()=>setEditId(null)} fontSize={16}>Cancel</Button>
                            </form>
                          </Td>
                        </Tr>
                      );
                    }
                    return (
                      <Tr key={trade.id} height={48} _hover={{ bg: rowHoverBg, boxShadow: '0 2px 8px 0 rgba(99,179,237,0.08)', transform: 'scale(1.01)' }} transition="background 0.2s, box-shadow 0.2s, transform 0.18s">
                        <Td fontWeight={600} fontSize={15} py={3} px={4} color="#63b3ed">{trade.ticker}</Td>
                        <Td fontSize={15} py={3} px={4}>{trade.quantity}</Td>
                        <Td fontSize={15} py={3} px={4}>${trade.entryPrice}</Td>
                        <Td fontSize={15} py={3} px={4}>{formatDate(trade.entryDate || (('dateEntry' in trade ? trade.dateEntry : undefined) as string | undefined))}</Td>
                        <Td fontSize={15} py={3} px={4}>{isClosed && sellPriceNum !== undefined ? `$${sellPriceNum}` : '-'}</Td>
                        <Td fontSize={15} py={3} px={4}>{isClosed && trade.sellDate ? formatDate(trade.sellDate) : '-'}</Td>
                        <Td fontSize={15} py={3} px={4}>{currentPrice !== undefined ? `$${currentPrice}` : '-'}</Td>
                        <Td fontSize={15} py={3} px={4} fontWeight={700} color="#e2e8f0">
                          {value !== null ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}
                        </Td>
                        <Td fontSize={15} py={3} px={4} fontWeight={700}
                            color={pl !== null ? (pl > 0 ? '#38d39f' : pl < 0 ? '#ff5c5c' : '#e2e8f0') : '#e2e8f0'}
                            bg={pl !== null ? (pl > 0 ? 'rgba(56,211,159,0.10)' : pl < 0 ? 'rgba(255,92,92,0.10)' : undefined) : undefined}
                            borderRadius={8}
                        >
                          {pl !== null ? (pl > 0 ? '+' : pl < 0 ? '' : '') + pl.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '-'}
                        </Td>
                        <Td fontSize={15} py={3} px={4} fontWeight={700}
                            color={plPct !== null ? (plPct > 0 ? '#38d39f' : plPct < 0 ? '#ff5c5c' : '#e2e8f0') : '#e2e8f0'}
                            bg={plPct !== null ? (plPct > 10 ? 'rgba(56,211,159,0.10)' : plPct < -10 ? 'rgba(255,92,92,0.10)' : undefined) : undefined}
                            borderRadius={8}
                        >
                          <span style={{ color: plPct !== null ? (plPct > 0 ? '#38d39f' : plPct < 0 ? '#ff5c5c' : '#e2e8f0') : '#e2e8f0' }}>
                            {plPct !== null ? (plPct > 0 ? '+' : plPct < 0 ? '' : '') + plPct.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%' : '-'}
                          </span>
                        </Td>
                        <Td fontSize={15} py={3} px={4} fontWeight={700} color={isClosed ? (pl !== null && pl >= 0 ? '#48bb78' : '#f56565') : '#e2e8f0'}>{isClosed ? (pl !== null && pl >= 0 ? 'Win' : 'Loss') : 'Open'}</Td>
                        <Td fontSize={15} py={3} px={4}>
                          <IconButton aria-label="Edit" icon={<EditIcon />} size="md" mr={3} px={3} py={3} onClick={() => handleEdit(trade)} bg="#232c3a" color="#63b3ed" _hover={{ bg: '#2b3850', color: '#e2e8f0' }} _active={{ bg: '#181f2a' }} />
                          <IconButton aria-label="Delete" icon={<DeleteIcon />} size="md" px={3} py={3} onClick={() => {
                            if (window.confirm('Are you sure you want to delete this trade? This action cannot be undone.')) handleDelete(trade.id);
                          }} bg="#232c3a" color="#f56565" _hover={{ bg: '#2b3850', color: '#e2e8f0' }} _active={{ bg: '#181f2a' }} />
                        </Td>
                      </Tr>
                    );
                  })}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </>
  );
}

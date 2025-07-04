"use client";
import { useEffect, useState, useMemo } from "react";
import { Box, Flex, Heading, Input, VStack, Text, useColorModeValue, Stat, StatLabel, StatNumber, StatHelpText, SimpleGrid, Select, Button } from "@chakra-ui/react";

interface Trade {
  id: string;
  ticker: string;
  entryPrice: number;
  dateEntry: string;
  quantity: number;
  sellPrice?: number;
  sellDate?: string;
}

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [profitFilter, setProfitFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/holdings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch trades");
        return res.json();
      })
      .then((data) => {
        setTrades(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, []);

  // Advanced search and filter
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const matchesSearch =
        t.ticker.toLowerCase().includes(search.toLowerCase()) ||
        t.dateEntry?.includes(search) ||
        t.sellDate?.includes(search);
      let matchesStatus = true;
      if (statusFilter === "open") matchesStatus = !t.sellPrice && !t.sellDate;
      if (statusFilter === "win") matchesStatus = t.sellPrice !== undefined && t.sellPrice > t.entryPrice;
      if (statusFilter === "loss") matchesStatus = t.sellPrice !== undefined && t.sellPrice < t.entryPrice;
      let matchesProfit = true;
      if (profitFilter === ">0") matchesProfit = t.sellPrice !== undefined && (t.sellPrice - t.entryPrice) * (t.quantity || 1) > 0;
      if (profitFilter === "<0") matchesProfit = t.sellPrice !== undefined && (t.sellPrice - t.entryPrice) * (t.quantity || 1) < 0;
      return matchesSearch && matchesStatus && matchesProfit;
    });
  }, [trades, search, statusFilter, profitFilter]);

  const stats = useMemo(() => {
    const count = trades.length;
    const closed = trades.filter(t => {
      const sellPriceNum = t.sellPrice == null || String(t.sellPrice) === "" ? undefined : Number(t.sellPrice);
      return !(sellPriceNum === undefined || t.sellDate == null || String(t.sellDate).trim() === "");
    });
    const wins = closed.filter(t => {
      const sellPriceNum = t.sellPrice == null || String(t.sellPrice) === "" ? undefined : Number(t.sellPrice);
      return sellPriceNum !== undefined && sellPriceNum > t.entryPrice;
    }).length;
    const losses = closed.filter(t => {
      const sellPriceNum = t.sellPrice == null || String(t.sellPrice) === "" ? undefined : Number(t.sellPrice);
      return sellPriceNum !== undefined && sellPriceNum < t.entryPrice;
    }).length;
    const avgEntry = count ? trades.reduce((sum, t) => sum + t.entryPrice, 0) / count : 0;
    const avgPL = closed.length ? closed.reduce((sum, t) => {
      const sellPriceNum = t.sellPrice == null || String(t.sellPrice) === "" ? undefined : Number(t.sellPrice);
      return sum + (sellPriceNum !== undefined ? (sellPriceNum - t.entryPrice) * (t.quantity || 1) : 0);
    }, 0) / closed.length : 0;
    const winRate = closed.length ? (wins / closed.length) * 100 : 0;
    return { count, avgEntry, avgPL, winRate, wins, losses, closed: closed.length };
  }, [trades]);

  return (
    <Box maxW="700px" mx="auto" py={8} fontFamily="Inter, Arial, sans-serif">
      <Heading as="h2" size="xl" fontWeight={700} mb={8} textAlign="center" letterSpacing={-1}>Trade Journal</Heading>
      <Text mb={6} color="gray.500" textAlign="center">Here you can review, search, and analyze your trading history.</Text>
      {/* Advanced Search Bar */}
      <Flex gap={3} mb={8} flexWrap="wrap" align="center" justify="center">
        <Input placeholder="Search by ticker or date" value={search} onChange={e => setSearch(e.target.value)} maxW={200} />
        <Select placeholder="Status" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} maxW={150}>
          <option value="open">Open</option>
          <option value="win">Win</option>
          <option value="loss">Loss</option>
        </Select>
        <Select placeholder="Profit" value={profitFilter} onChange={e => setProfitFilter(e.target.value)} maxW={150}>
          <option value=">0">Profit</option>
          <option value="<0">Loss</option>
        </Select>
        <Button onClick={() => { setSearch(""); setStatusFilter(""); setProfitFilter(""); }} variant="outline" size="sm">Clear</Button>
      </Flex>
      {loading && <Flex justify="center" py={8}><Text color="gray.400">Loading trades...</Text></Flex>}
      {error && <Text color="red.500" textAlign="center" py={4}>{error}</Text>}
      {!loading && !error && (
        <>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} my={8}>
            <Stat>
              <StatLabel>Total Trades</StatLabel>
              <StatNumber>{stats.count}</StatNumber>
              <StatHelpText>All time</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Closed Trades</StatLabel>
              <StatNumber>{stats.closed}</StatNumber>
              <StatHelpText>All time</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Win Rate</StatLabel>
              <StatNumber>{stats.winRate.toFixed(1)}%</StatNumber>
              <StatHelpText>Closed trades</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Average Entry Price</StatLabel>
              <StatNumber>${stats.avgEntry.toLocaleString(undefined, { maximumFractionDigits: 2 })}</StatNumber>
              <StatHelpText>All trades</StatHelpText>
            </Stat>
            <Stat>
              <StatLabel>Average P/L (Closed)</StatLabel>
              <StatNumber color={stats.avgPL >= 0 ? 'green.600' : 'red.600'}>{stats.avgPL >= 0 ? '+' : ''}${stats.avgPL.toLocaleString(undefined, { maximumFractionDigits: 2 })}</StatNumber>
              <StatHelpText>Closed trades</StatHelpText>
            </Stat>
          </SimpleGrid>
          <VStack as="ul" spacing={4} align="stretch">
            {filteredTrades.length === 0 ? (
              <Text color="gray.400" textAlign="center">No trades found.</Text>
            ) : (
              filteredTrades.map((t) => {
                const sellPriceNum = t.sellPrice == null || String(t.sellPrice) === "" ? undefined : Number(t.sellPrice);
                const isOpen = sellPriceNum === undefined || t.sellDate == null || String(t.sellDate) === "";
                const isClosed = !isOpen;
                let isWin = false, isLoss = false, pl = 0, plPercent = 0;
                if (isClosed && sellPriceNum !== undefined) {
                  isWin = sellPriceNum > t.entryPrice;
                  isLoss = sellPriceNum < t.entryPrice;
                  pl = (sellPriceNum - t.entryPrice) * (t.quantity || 1);
                  plPercent = ((sellPriceNum - t.entryPrice) / t.entryPrice) * 100;
                }
                return (
                  <Box as="li" key={t.id} bg={isOpen ? 'blue.50' : isWin ? 'green.50' : isLoss ? 'red.50' : 'gray.50'} borderRadius={12} boxShadow="md" p={6} display="flex" alignItems="center" gap={6} borderWidth={1} borderColor="gray.100">
                    <Box flex={1}>
                      <Text fontWeight={600} fontSize={18} letterSpacing={-0.5}>{t.ticker}</Text>
                      <Text fontSize={15} color="gray.600" mt={1}>Entry: <b>${t.entryPrice}</b> | Date: {t.dateEntry?.slice(0, 10)}</Text>
                      {isOpen && <Text fontSize={15} color="blue.600" mt={1}>Still in trade</Text>}
                      {isClosed && isWin && (
                        <Text fontSize={15} color="green.600" mt={1}>Win: +${pl.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({plPercent.toFixed(2)}%)</Text>
                      )}
                      {isClosed && isLoss && (
                        <Text fontSize={15} color="red.600" mt={1}>Loss: -${Math.abs(pl).toLocaleString(undefined, { maximumFractionDigits: 2 })} ({plPercent.toFixed(2)}%)</Text>
                      )}
                    </Box>
                  </Box>
                );
              })
            )}
          </VStack>
        </>
      )}
    </Box>
  );
} 
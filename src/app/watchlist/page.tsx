"use client";
import { useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Text, VStack, useColorModeValue } from "@chakra-ui/react";

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
    <Box maxW="520px" mx="auto" py={8} fontFamily="Inter, Arial, sans-serif">
      <Heading as="h2" size="xl" fontWeight={700} mb={8} textAlign="center" letterSpacing={-1}>Watchlist</Heading>
      {count > 0 && (
        <Box bg={avgProfit >= 0 ? 'green.50' : 'red.50'} color={avgProfit >= 0 ? 'green.600' : 'red.600'} borderRadius={10} fontWeight={600} fontSize={18} textAlign="center" mb={6} py={2} borderWidth={1} borderColor="gray.200">
          Overall Profit/Loss: {avgProfit >= 0 ? '+' : ''}{avgProfit.toFixed(2)}%
        </Box>
      )}
      <Flex justify="flex-end" mb={4}>
        <Button onClick={handleRefresh} isLoading={refreshing} colorScheme="blue" variant="outline" size="sm">
          {refreshing ? 'Refreshing...' : 'Refresh All'}
        </Button>
      </Flex>
      {tickers.length === 0 ? (
        <Box bg="gray.50" borderRadius={12} boxShadow="md" p={8} textAlign="center" color="gray.400">
          No tickers in your watchlist. Add a holding to get started.
        </Box>
      ) : (
        <VStack as="ul" spacing={4} align="stretch">
          {tickers.map((ticker) => {
            const d = info[ticker] || {};
            return (
              <Box as="li" key={ticker} bg={useColorModeValue('white', 'gray.800')} borderRadius={12} boxShadow="md" p={6} display="flex" alignItems="center" gap={6} borderWidth={1} borderColor="gray.100">
                <Box flex={1}>
                  <Text fontWeight={600} fontSize={18} letterSpacing={-0.5}>{ticker} {d.shortName && <Text as="span" color="gray.400" fontWeight={400} fontSize={15}>({d.shortName})</Text>}</Text>
                  {d.regularMarketPrice && <Text fontSize={15} color="blue.600" mt={1}>Current: <b>${d.regularMarketPrice}</b> {d.currency}</Text>}
                  <Flex fontSize={13} color="gray.400" mt={1} gap={4} wrap="wrap">
                    {d.open !== undefined && <Text>Open: ${d.open}</Text>}
                    {d.high !== undefined && <Text>High: ${d.high}</Text>}
                    {d.low !== undefined && <Text>Low: ${d.low}</Text>}
                    {d.previousClose !== undefined && <Text>Prev Close: ${d.previousClose}</Text>}
                    {d.changePercent !== undefined && <Text>Change: {d.changePercent}%</Text>}
                  </Flex>
                  {!d.regularMarketPrice && <Text color="red.400" fontSize={14} mt={1}>Could not load Alpha Vantage data for this ticker.</Text>}
                </Box>
              </Box>
            );
          })}
        </VStack>
      )}
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </Box>
  );
} 
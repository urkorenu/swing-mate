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
  useColorModeValue,
  SimpleGrid,
  VStack,
  HStack,
  Divider,
  Icon,
  chakra,
  List,
  ListItem,
  ListIcon
} from "@chakra-ui/react";
import { ArrowUpIcon, ArrowDownIcon, StarIcon, WarningIcon, TriangleUpIcon, TriangleDownIcon } from "@chakra-ui/icons";

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

function SummaryCard({ label, value, color, icon }: { label: string; value: any; color: string; icon?: any }) {
  return (
    <Box
      bgGradient={useColorModeValue(
        'linear(to-br, white, blue.50, gray.100)',
        'linear(to-br, gray.700, blue.900, gray.800)'
      )}
      borderRadius="2xl"
      boxShadow="2xl"
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
      transition="transform 0.18s, box-shadow 0.18s"
      _hover={{
        transform: 'translateY(-6px) scale(1.04)',
        boxShadow: '3xl',
        borderColor: useColorModeValue('blue.400', 'blue.300'),
      }}
      _active={{
        transform: 'scale(0.97)',
      }}
    >
      <Box fontSize="4xl" mb={3} display="flex" alignItems="center" justifyContent="center">{icon}</Box>
      <Text fontSize="md" fontWeight="semibold" color={useColorModeValue('gray.600', 'gray.300')} mb={2} noOfLines={1} letterSpacing={0.5}>{label}</Text>
      <Text fontWeight="extrabold" fontSize="2.6xl" color={color} wordBreak="break-word" letterSpacing={-1}>{value}</Text>
    </Box>
  );
}

function PLValue({ value, percent, ticker }: { value: number; percent: number; ticker?: string }) {
  if (ticker) {
    // For Best/Worst cards: stack vertically for clarity
    return (
      <VStack spacing={0} align="center" justify="center" w="full">
        <Text fontWeight="bold" color="blue.600" fontSize={{ base: 'md', md: 'lg' }} wordBreak="break-word" maxW="120px" textAlign="center">{ticker}</Text>
        <Text fontWeight="bold" color={value >= 0 ? "green.600" : "red.600"} fontSize={{ base: 'lg', md: 'xl' }}>{value >= 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
        <Text fontWeight="bold" color={percent >= 0 ? "green.600" : "red.600"} fontSize={{ base: 'sm', md: 'md' }}>({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)</Text>
      </VStack>
    );
  }
  // Default: horizontal for other cards
  return (
    <HStack spacing={1} justify="center">
      <Text fontWeight="bold" color={value >= 0 ? "green.600" : "red.600"}>{value >= 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
      <Text fontWeight="bold" color={percent >= 0 ? "green.600" : "red.600"}>({percent >= 0 ? '+' : ''}{percent.toFixed(2)}%)</Text>
    </HStack>
  );
}

export default function Dashboard() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [info, setInfo] = useState<Record<string, TickerInfo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>("ticker");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch("/api/holdings")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch holdings");
        return res.json();
      })
      .then((data) => {
        setHoldings(data);
        data.forEach((h: Holding) => {
          if (!h.sellPrice && !h.sellDate) fetchInfo(h.ticker);
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Unknown error");
        setLoading(false);
      });
  }, []);

  const fetchInfo = async (ticker: string) => {
    const res = await fetch(`/api/alpha?ticker=${ticker}`);
    const data = await res.json();
    if (!data.error) {
      setInfo((prev) => ({ ...prev, [ticker]: data }));
    }
  };

  // Memoized openHoldings and summary calculations
  const memo = useMemo(() => {
    let openHoldings = holdings.filter(h => !h.sellPrice && !h.sellDate);
    openHoldings = [...openHoldings].sort((a, b) => {
      let aVal: any;
      let bVal: any;
      switch (sortBy) {
        case "ticker":
          aVal = a.ticker.toUpperCase();
          bVal = b.ticker.toUpperCase();
          break;
        case "quantity":
          aVal = a.quantity;
          bVal = b.quantity;
          break;
        case "entryPrice":
          aVal = a.entryPrice;
          bVal = b.entryPrice;
          break;
        case "dateEntry":
          aVal = a.dateEntry;
          bVal = b.dateEntry;
          break;
        case "currentPrice":
          aVal = (info[a.ticker]?.regularMarketPrice ?? 0);
          bVal = (info[b.ticker]?.regularMarketPrice ?? 0);
          break;
        case "value":
          aVal = (info[a.ticker]?.regularMarketPrice ?? 0) * a.quantity;
          bVal = (info[b.ticker]?.regularMarketPrice ?? 0) * b.quantity;
          break;
        case "pl":
          aVal = (info[a.ticker]?.regularMarketPrice ?? 0 - a.entryPrice) * a.quantity;
          bVal = (info[b.ticker]?.regularMarketPrice ?? 0 - b.entryPrice) * b.quantity;
          break;
        case "plPercent":
          aVal = a.entryPrice ? ((info[a.ticker]?.regularMarketPrice ?? 0 - a.entryPrice) / a.entryPrice) * 100 : 0;
          bVal = b.entryPrice ? ((info[b.ticker]?.regularMarketPrice ?? 0 - b.entryPrice) / b.entryPrice) * 100 : 0;
          break;
        default:
          aVal = a.ticker.toUpperCase();
          bVal = b.ticker.toUpperCase();
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    let totalValue = 0;
    let totalCost = 0;
    let best: Holding | null = null;
    let worst: Holding | null = null;
    let bestPL = -Infinity;
    let worstPL = Infinity;
    let bestPLValue = 0;
    let worstPLValue = 0;
    openHoldings.forEach(h => {
      const d = info[h.ticker] || {};
      if (d.regularMarketPrice && h.quantity) {
        const value = d.regularMarketPrice * h.quantity;
        const cost = h.entryPrice * h.quantity;
        const pl = value - cost;
        totalValue += value;
        totalCost += cost;
        const plPercent = h.entryPrice ? ((d.regularMarketPrice - h.entryPrice) / h.entryPrice) * 100 : null;
        if (plPercent !== null) {
          if (plPercent > bestPL) { bestPL = plPercent; best = h; bestPLValue = pl; }
          if (plPercent < worstPL) { worstPL = plPercent; worst = h; worstPLValue = pl; }
        }
      }
    });
    const hasValidOpen = openHoldings.some(h => {
      const d = info[h.ticker] || {};
      return d.regularMarketPrice && h.entryPrice;
    });
    if (!hasValidOpen) {
      best = null;
      worst = null;
    }
    const totalPL = totalValue - totalCost;
    const totalPLPercent = totalCost ? (totalPL / totalCost) * 100 : 0;
    return {
      openHoldings,
      totalValue,
      totalCost,
      best,
      worst,
      bestPL,
      worstPL,
      bestPLValue,
      worstPLValue,
      hasValidOpen,
      totalPL,
      totalPLPercent
    };
  }, [holdings, info, sortBy, sortDir]);

  // Recently closed holdings (sold)
  const closedHoldings = holdings.filter(h => h.sellPrice && h.sellDate)
    .sort((a, b) => (b.sellDate || '').localeCompare(a.sellDate || ''));

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  function renderSortIcon(column: string) {
    if (sortBy !== column) return null;
    return sortDir === "asc" ? <TriangleUpIcon ml={1} boxSize={3} /> : <TriangleDownIcon ml={1} boxSize={3} />;
  }

  return (
    <Box as="main" minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')} pb={12}>
      <Center py={16} flexDir="column">
        <Heading as="h1" size="2xl" fontWeight="extrabold" mb={4} color={useColorModeValue('gray.800', 'gray.100')} letterSpacing="tight">SwingMate</Heading>
        <Text mb={8} maxW="xl" mx="auto" fontSize="lg" color={useColorModeValue('gray.500', 'gray.300')}>
          Your minimalist, Dockerized swing trading dashboard. Track trades and monitor your performance with live market data.
        </Text>
        <Button as={Link} href="/holdings" colorScheme="blue" size="lg" px={8} py={6} fontWeight="semibold" shadow="md" mb={4}>
          Add Holding
        </Button>
        <Button as={Link} href="#holdings" colorScheme="gray" size="md" px={6} py={4} fontWeight="semibold" shadow="sm">
          View Open Holdings
        </Button>
      </Center>
      <Container maxW="5xl">
        {loading && <Text textAlign="center" color="gray.400" fontSize="xl" py={12}>Loading holdings...</Text>}
        {error && <Text textAlign="center" color="red.500" fontSize="xl" py={12}>{error}</Text>}
        {!loading && !error && (
          <>
            <SimpleGrid columns={{ base: 1, md: 3, lg: 5 }} spacing={6} mb={10} justifyContent="center">
              <SummaryCard label="Total Value" value={`$${memo.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} color="blue.500" icon={<Icon as={ArrowUpIcon} color="blue.400" boxSize={6} />} />
              <SummaryCard label="Total P/L" value={<PLValue value={memo.totalPL} percent={memo.totalPLPercent} />} color={memo.totalPL >= 0 ? "green.500" : "red.500"} icon={memo.totalPL >= 0 ? <Icon as={ArrowUpIcon} color="green.400" boxSize={6} /> : <Icon as={ArrowDownIcon} color="red.400" boxSize={6} />} />
              <SummaryCard label="Open Holdings" value={memo.openHoldings.length} color="gray.500" icon={<Icon as={StarIcon} color="gray.400" boxSize={6} />} />
              {memo.hasValidOpen ? (
                <>
                  {memo.best !== null && <SummaryCard label="Best" value={<PLValue value={memo.bestPLValue} percent={memo.bestPL} ticker={(memo.best as Holding).ticker} />} color="green.400" icon={<Icon as={StarIcon} color="green.400" boxSize={9} />} />}
                  {memo.worst !== null && <SummaryCard label="Worst" value={<PLValue value={memo.worstPLValue} percent={memo.worstPL} ticker={(memo.worst as Holding).ticker} />} color="red.400" icon={<Icon as={WarningIcon} color="red.400" boxSize={9} />} />}
                </>
              ) : (
                <SummaryCard label="Best/Worst" value="No open holdings" color="gray.400" icon={<Icon as={WarningIcon} color="gray.400" boxSize={6} />} />
              )}
            </SimpleGrid>
            <Box id="holdings" bg={useColorModeValue('white', 'gray.800')} rounded="2xl" shadow="lg" p={8} overflowX="auto" mb={10}>
              <Flex justify="space-between" align="center" mb={4}>
                <Heading as="h2" size="md" color={useColorModeValue('gray.700', 'gray.200')}>Open Holdings</Heading>
                <Button as={Link} href="/holdings" colorScheme="blue" size="sm">Add Holding</Button>
              </Flex>
              <TableContainer>
                <Table size="sm" variant="simple">
                  <Thead>
                    <Tr bg={useColorModeValue('gray.100', 'gray.700')}>
                      <Th cursor="pointer" onClick={() => handleSort("ticker")}>Ticker {renderSortIcon("ticker")}</Th>
                      <Th cursor="pointer" onClick={() => handleSort("quantity")}>Quantity {renderSortIcon("quantity")}</Th>
                      <Th cursor="pointer" onClick={() => handleSort("entryPrice")}>Entry Price {renderSortIcon("entryPrice")}</Th>
                      <Th cursor="pointer" onClick={() => handleSort("dateEntry")}>Entry Date {renderSortIcon("dateEntry")}</Th>
                      <Th cursor="pointer" onClick={() => handleSort("currentPrice")}>Current Price {renderSortIcon("currentPrice")}</Th>
                      <Th cursor="pointer" onClick={() => handleSort("value")}>Value {renderSortIcon("value")}</Th>
                      <Th cursor="pointer" onClick={() => handleSort("pl")}>P/L {renderSortIcon("pl")}</Th>
                      <Th cursor="pointer" onClick={() => handleSort("plPercent")}>P/L % {renderSortIcon("plPercent")}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {memo.openHoldings.length === 0 ? (
                      <Tr><Td colSpan={8} textAlign="center" color="gray.400" py={8}>No open holdings.</Td></Tr>
                    ) : memo.openHoldings.map(h => {
                      const d = info[h.ticker] || {};
                      const value = d.regularMarketPrice && h.quantity ? d.regularMarketPrice * h.quantity : 0;
                      const pl = d.regularMarketPrice && h.entryPrice && h.quantity ? (d.regularMarketPrice - h.entryPrice) * h.quantity : 0;
                      const plPercent = d.regularMarketPrice && h.entryPrice ? ((d.regularMarketPrice - h.entryPrice) / h.entryPrice) * 100 : 0;
                      return (
                        <Tr key={h.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                          <Td fontWeight="bold" color="blue.600">{h.ticker}</Td>
                          <Td>{h.quantity}</Td>
                          <Td>${h.entryPrice}</Td>
                          <Td>{h.dateEntry ? h.dateEntry.slice(0,10) : '-'}</Td>
                          <Td>{d.regularMarketPrice ? `$${d.regularMarketPrice}` : <Text color="red.400">N/A</Text>}</Td>
                          <Td>{d.regularMarketPrice ? `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}</Td>
                          <Td fontWeight="bold" color={pl >= 0 ? "green.600" : "red.600"}>{d.regularMarketPrice ? (pl >= 0 ? '+' : '') + `$${pl.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '-'}</Td>
                          <Td fontWeight="bold" color={plPercent >= 0 ? "green.600" : "red.600"}>{d.regularMarketPrice ? (plPercent >= 0 ? '+' : '') + plPercent.toFixed(2) + '%' : '-'}</Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </TableContainer>
            </Box>
            {/* Recent Activity */}
            <Box bg={useColorModeValue('white', 'gray.800')} rounded="2xl" shadow="lg" p={8} mb={10}>
              <Heading as="h2" size="md" mb={6} color={useColorModeValue('gray.700', 'gray.200')}>Recent Activity</Heading>
              <VStack align="start" spacing={3}>
                {holdings.slice(0,5).map(h => (
                  <Text key={h.id} color={useColorModeValue('gray.700', 'gray.200')}>
                    <chakra.span fontWeight="bold" color="blue.600" textTransform="uppercase">{h.ticker}</chakra.span> — Bought {h.quantity} @ ${h.entryPrice} on {h.dateEntry?.slice(0,10)}
                    {h.sellPrice && h.sellDate && (
                      <chakra.span ml={2} fontWeight="semibold" color={h.sellPrice - h.entryPrice >= 0 ? "green.600" : "red.600"}>
                        Sold @ ${h.sellPrice} on {h.sellDate.slice(0,10)} ({h.sellPrice - h.entryPrice >= 0 ? '▲' : '▼'}{((h.sellPrice - h.entryPrice) / h.entryPrice * 100).toFixed(2)}%)
                      </chakra.span>
                    )}
                  </Text>
                ))}
                {holdings.length === 0 && <Text color="gray.400">No recent activity.</Text>}
              </VStack>
            </Box>
            {/* Recently Closed Holdings */}
            {closedHoldings.length > 0 && (
              <Box bg={useColorModeValue('white', 'gray.800')} rounded="2xl" shadow="lg" p={8}>
                <Heading as="h2" size="md" mb={6} color={useColorModeValue('gray.700', 'gray.200')}>Recently Closed Holdings</Heading>
                <VStack align="start" spacing={3}>
                  {closedHoldings.slice(0,5).map(h => (
                    <Text key={h.id} color={useColorModeValue('gray.700', 'gray.200')}>
                      <chakra.span fontWeight="bold" color="blue.600" textTransform="uppercase">{h.ticker}</chakra.span> — Sold {h.quantity} @ ${h.sellPrice} on {h.sellDate?.slice(0,10)}
                      <chakra.span ml={2} fontWeight="semibold" color={h.sellPrice && h.entryPrice && h.sellPrice - h.entryPrice >= 0 ? "green.600" : "red.600"}>
                        ({h.sellPrice && h.entryPrice ? (h.sellPrice - h.entryPrice >= 0 ? '▲' : '▼') + (((h.sellPrice - h.entryPrice) / h.entryPrice) * 100).toFixed(2) + '%' : ''})
                      </chakra.span>
                    </Text>
                  ))}
                </VStack>
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  );
}

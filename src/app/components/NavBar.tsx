"use client";
import { Box, Flex, HStack, Link as ChakraLink, Text, useColorModeValue } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Holdings', href: '/holdings' },
  { label: 'Journal', href: '/journal' },
];

export default function NavBar() {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return (
    <Box as="header" w="full" bg={useColorModeValue('white', 'gray.900')} borderBottomWidth={1} borderColor={useColorModeValue('gray.200', 'gray.700')} boxShadow="sm" mb={8}>
      <Flex maxW="6xl" mx="auto" px={6} h={20} align="center" justify="space-between">
        <HStack spacing={8} align="center">
          <ChakraLink href="/" _hover={{ textDecoration: 'none' }}>
            <Text fontWeight="bold" fontSize="2xl" color="blue.600" letterSpacing="tight">SwingMate</Text>
          </ChakraLink>
          <HStack spacing={2} as="nav">
            {navItems.map((item) => (
              <ChakraLink
                key={item.href}
                href={item.href}
                px={4}
                py={2}
                rounded="md"
                fontWeight={pathname === item.href ? 'bold' : 'medium'}
                color={pathname === item.href ? 'white' : 'gray.700'}
                bg={pathname === item.href ? 'blue.600' : 'transparent'}
                _hover={{ bg: pathname === item.href ? 'blue.700' : 'gray.100', color: pathname === item.href ? 'white' : 'blue.700' }}
                transition="all 0.2s"
              >
                {item.label}
              </ChakraLink>
            ))}
          </HStack>
        </HStack>
      </Flex>
    </Box>
  );
} 
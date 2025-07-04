import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { ChakraProvider } from '@chakra-ui/react';
import { usePathname } from 'next/navigation';
import { Box, Flex, HStack, Link as ChakraLink, Text, useColorModeValue } from '@chakra-ui/react';
import NavBar from "./components/NavBar";

const inter = Inter({
  subsets: ["latin"],
});



export const metadata: Metadata = {
  title: "SwingMate",
  description: "Your Personal Swing Trade Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  // Nav items
  const navItems = [
    { label: 'Home', href: '/' },
    { label: 'Holdings', href: '/holdings' },
    { label: 'Journal', href: '/journal' },
  ];
  return (
	<html lang="en">
	  <body className={`${inter.variable} bg-gray-50`}>
		<ChakraProvider>
		  <NavBar />
		  {children}
		</ChakraProvider>
	  </body>
	</html>
  );
}
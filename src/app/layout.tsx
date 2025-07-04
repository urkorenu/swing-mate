import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import Link from "next/link";
import { ChakraProvider } from '@chakra-ui/react';

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
  return (
	<html lang="en">
	  <body className={`${inter.variable} bg-gray-50`}>
		<ChakraProvider>
		  <header className="w-full py-4 bg-white border-b border-slate-200 mb-6 shadow-sm">
			<nav className="max-w-5xl mx-auto flex items-center justify-between px-4">
			  <div className="flex gap-4 items-center">
				<Link
				  href="/"
				  className="font-bold text-2xl text-blue-700 hover:text-blue-800 transition"
				>
				  SwingMate
				</Link>
				<Link
				  href="#holdings"
				  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
				>
				  Holdings
				</Link>
			  </div>
			  <Link
				href="/"
				className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
			  >
				Home
			  </Link>
			</nav>
		  </header>
		  {children}
		</ChakraProvider>
	  </body>
	</html>
  );
}
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

// For MVP: use a dummy userId for all trades
const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // List all trades
    const trades = await prisma.trade.findMany({ orderBy: { dateEntry: 'desc' } });
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(trades);
  }
  if (req.method === 'POST') {
    const { ticker, entryPrice, exitPrice, dateEntry, dateExit, stopLoss, notes, strategyUsed, outcome } = req.body;
    try {
      // Ensure dummy user exists
      await prisma.user.upsert({
        where: { id: DUMMY_USER_ID },
        update: {},
        create: { id: DUMMY_USER_ID, email: 'demo@swingmate.local', watchlist: [], settings: {} },
      });
      const trade = await prisma.trade.create({
        data: {
          userId: DUMMY_USER_ID,
          ticker,
          entryPrice: parseFloat(entryPrice),
          exitPrice: exitPrice ? parseFloat(exitPrice) : null,
          dateEntry: new Date(dateEntry),
          dateExit: dateExit ? new Date(dateExit) : null,
          stopLoss: stopLoss ? parseFloat(stopLoss) : null,
          notes,
          strategyUsed,
          outcome,
        },
      });
      return res.status(201).json(trade);
    } catch (e) {
      return res.status(400).json({ error: 'Failed to create trade', details: e });
    }
  }
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 
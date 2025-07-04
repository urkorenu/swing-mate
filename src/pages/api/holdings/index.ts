import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

const DUMMY_USER_ID = '00000000-0000-0000-0000-000000000001';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const holdings = await prisma.trade.findMany({
      where: { userId: DUMMY_USER_ID },
      orderBy: { dateEntry: 'desc' },
    });
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json(holdings);
  }
  if (req.method === 'POST') {
    const { ticker, entryPrice, dateEntry, quantity, sellPrice, sellDate } = req.body;
    if (!ticker || !entryPrice || !dateEntry) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
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
        dateEntry: new Date(dateEntry),
        quantity: quantity ? parseFloat(quantity) : 1,
        sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
        sellDate: sellDate ? new Date(sellDate) : undefined,
      },
    });
    // Upsert to watchlist
    const user = await prisma.user.findUnique({ where: { id: DUMMY_USER_ID } });
    if (user && !user.watchlist.includes(ticker)) {
      await prisma.user.update({
        where: { id: DUMMY_USER_ID },
        data: { watchlist: { set: [...user.watchlist, ticker] } },
      });
    }
    return res.status(201).json(trade);
  }
  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing id' });
    }
    await prisma.trade.delete({ where: { id } });
    return res.status(204).end();
  }
  if (req.method === 'PUT') {
    const { id } = req.query;
    const { ticker, entryPrice, dateEntry, quantity, sellPrice, sellDate } = req.body;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Missing id' });
    }
    const updated = await prisma.trade.update({
      where: { id },
      data: {
        ticker,
        entryPrice: parseFloat(entryPrice),
        dateEntry: new Date(dateEntry),
        quantity: quantity ? parseFloat(quantity) : 1,
        sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
        sellDate: sellDate ? new Date(sellDate) : undefined,
      },
    });
    return res.status(200).json(updated);
  }
  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 
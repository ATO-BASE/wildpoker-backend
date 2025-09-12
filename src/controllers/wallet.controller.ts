import { Request, Response, NextFunction } from 'express';
import { Transaction, User } from '../models';
import { Op } from 'sequelize';

export async function depositFunds(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { amount, currency = 'USDT' } = req.body;
    const userId = (req as any).user.id;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      type: 'deposit',
      provider: 'system', // For now, using system. Later will be 'oxapay'
      amount: amount.toString(),
      currency,
      status: 'confirmed', // For now, auto-confirm. Later will be 'pending' until oxapay confirms
      ref: `DEP_${Date.now()}_${userId}`,
      meta: { source: 'manual_deposit' }
    });

    // Update user balance
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const currentBalance = parseFloat(user.balance || '0');
    const newBalance = currentBalance + parseFloat(amount);
    
    await user.update({ balance: newBalance.toFixed(2) });

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      newBalance: newBalance.toFixed(2)
    });
  } catch (err) {
    next(err);
  }
}

export async function withdrawFunds(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { amount, currency = 'USDT' } = req.body;
    const userId = (req as any).user.id;

    if (!amount || amount <= 0) {
      res.status(400).json({ error: 'Invalid amount' });
      return;
    }

    // Check user balance
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const currentBalance = parseFloat(user.balance || '0');
    if (currentBalance < parseFloat(amount)) {
      res.status(400).json({ error: 'Insufficient funds' });
      return;
    }

    // Create transaction record
    const transaction = await Transaction.create({
      userId,
      type: 'withdrawal',
      provider: 'system',
      amount: amount.toString(),
      currency,
      status: 'confirmed', // For now, auto-confirm. Later will be 'pending' until admin approves
      ref: `WTH_${Date.now()}_${userId}`,
      meta: { source: 'manual_withdrawal' }
    });

    // Update user balance
    const newBalance = currentBalance - parseFloat(amount);
    await user.update({ balance: newBalance.toFixed(2) });

    res.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        createdAt: transaction.createdAt
      },
      newBalance: newBalance.toFixed(2)
    });
  } catch (err) {
    next(err);
  }
}

export async function getWalletHistory(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = (req as any).user.id;
    const { limit = 20, offset = 0 } = req.query;

    const transactions = await Transaction.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
      attributes: ['id', 'type', 'amount', 'currency', 'status', 'provider', 'createdAt', 'ref']
    });

    res.json({
      transactions,
      total: await Transaction.count({ where: { userId } })
    });
  } catch (err) {
    next(err);
  }
} 
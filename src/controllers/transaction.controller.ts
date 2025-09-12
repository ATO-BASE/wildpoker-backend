import { Request, Response, NextFunction } from 'express';
import { Transaction, User } from '../models';

export async function listAllTransactions(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { type, status, limit = 50, offset = 0 } = req.query;

    const where: any = {};
    if (typeof type === 'string') where.type = type;
    if (typeof status === 'string') where.status = status;

    const transactions = await Transaction.findAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'email'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset)
    });

    res.json(transactions);
  } catch (err) {
    next(err);
  }
}

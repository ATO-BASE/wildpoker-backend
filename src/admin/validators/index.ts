import { z } from 'zod';

export const Paginate = z.object({
  page: z.coerce.number().min(1).default(1),
  per:  z.coerce.number().min(5).max(100).default(20),
  q:    z.string().optional(),
});

export const UserPatch = z.object({
  status:  z.enum(['active', 'banned', 'suspended']).optional(),
  balance: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
});

export const TournamentUpsert = z.object({
  name:           z.string().min(3),
  theme:          z.string().max(64).optional(),
  startsAt:       z.string().datetime(),
  entryFee:       z.string(),
  currency:       z.enum(['USDT', 'USDC', 'BTC', 'ETH']),
  startingStack:  z.number().int().positive(),
  blindInterval:  z.number().int().positive(),
  minPlayers:     z.number().int().positive(),
  maxPlayers:     z.number().int().positive().optional(),
  prizePlaces:    z.number().int().min(1).max(8),
  lateRegMin:     z.number().int().min(0),
  prizeStructure: z.array(z.object({ place: z.number(), pct: z.number() })),
});

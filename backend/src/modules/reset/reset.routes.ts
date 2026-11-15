import { Router } from 'express';
import { parse } from '../../lib/validate.js';
import { resetSchema, resetSlots } from './reset.service.js';

export const resetRoutes = Router();

resetRoutes.post('/', async (req, res) => {
  const { slots } = parse(resetSchema, req.body);
  await resetSlots(slots);
  res.json({ ok: true, slots: slots.length });
});

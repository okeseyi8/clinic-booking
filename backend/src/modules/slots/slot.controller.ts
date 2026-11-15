import type { RequestHandler } from 'express';
import { parse } from '../../lib/validate.js';
import { listSlotsQuerySchema } from './slot.schema.js';
import * as slotService from './slot.service.js';

export const list: RequestHandler = async (req, res) => {
  const { provider } = parse(listSlotsQuerySchema, req.query);
  res.json({ slots: await slotService.listSlots(provider) });
};

import { Router } from 'express';
import * as slots from './slot.controller.js';

export const slotRoutes = Router();

slotRoutes.get('/', slots.list);

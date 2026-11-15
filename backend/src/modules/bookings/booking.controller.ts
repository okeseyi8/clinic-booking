import type { RequestHandler } from 'express';
import { parse } from '../../lib/validate.js';
import { createBookingSchema, listBookingsQuerySchema } from './booking.schema.js';
import * as bookingService from './booking.service.js';

/** Controllers only translate HTTP <-> service calls. Rules live in the service. */

export const create: RequestHandler = async (req, res) => {
  const { slot_id, name, email } = parse(createBookingSchema, req.body);
  const booking = await bookingService.createBooking({ slotId: slot_id, name, email });
  res.status(201).json(booking);
};

export const list: RequestHandler = async (req, res) => {
  const query = parse(listBookingsQuerySchema, req.query);
  res.json(await bookingService.listBookings(query));
};

export const get: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await bookingService.getBooking(req.params.id));
};

export const cancel: RequestHandler<{ id: string }> = async (req, res) => {
  res.json(await bookingService.cancelBooking(req.params.id));
};

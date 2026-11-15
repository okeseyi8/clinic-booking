import Joi from 'joi';

export interface CreateBookingInput {
  slot_id: string;
  name: string;
  email: string;
}

/** Level 2: required, non-blank, valid email; name/email trimmed and email lower-cased. */
export const createBookingSchema = Joi.object<CreateBookingInput>({
  slot_id: Joi.string().trim().max(100).required(),
  name: Joi.string().trim().max(200).required(),
  email: Joi.string().trim().lowercase().max(254).email().required(),
});

export interface ListBookingsQuery {
  email: string;
  limit: number;
  cursor?: string;
}

export const listBookingsQuerySchema = Joi.object<ListBookingsQuery>({
  email: Joi.string().trim().lowercase().max(254).email().required(),
  limit: Joi.number().integer().min(1).max(50).default(10),
  cursor: Joi.string().max(500).empty(''),
});

import type Joi from 'joi';
import { badRequest } from './http-error.js';

/**
 * Validate + normalise untrusted input against a Joi schema.
 * Returns the converted value (trimmed, lower-cased, defaults applied, unknown keys stripped)
 * or throws a 400 with the first problem, e.g. `{"error": "email must be a valid email"}`.
 */
export function parse<T>(schema: Joi.Schema<T>, input: unknown): T {
  const { value, error } = schema.validate(input ?? {}, {
    abortEarly: true,
    stripUnknown: true,
    errors: { wrap: { label: false } },
  });
  if (error) throw badRequest(error.details[0]?.message ?? 'invalid request');
  return value;
}

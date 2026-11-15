import Joi from 'joi';

export interface SlotInput {
  id: string;
  provider: string;
  start: Date;
  end: Date;
}

export const slotInputSchema = Joi.object<SlotInput>({
  id: Joi.string().trim().max(100).required(),
  provider: Joi.string().trim().max(200).required(),
  start: Joi.date().iso().required(),
  end: Joi.date().iso().greater(Joi.ref('start')).required(),
});

export interface ListSlotsQuery {
  provider?: string;
}

export const listSlotsQuerySchema = Joi.object<ListSlotsQuery>({
  provider: Joi.string().empty(''), // exact match; `?provider=` means "no filter"
});

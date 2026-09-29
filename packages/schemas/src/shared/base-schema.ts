import { z } from 'zod';

const dateTimeSchema = z.iso.datetime();

export type TBaseEvent<TId extends string = string> = {
  id: TId;
  createdAt: string;
};

export type TBaseEntity<TId extends string = string> = TBaseEvent<TId> & {
  updatedAt: string;
};

export type TEventOf<TValue extends TBaseEvent> = TValue;

export type TEntityOf<TValue extends TBaseEntity> = TValue;

export const eventSchema = <TIdSchema extends z.ZodType<string>>(
  idSchema: TIdSchema
): z.ZodObject<{
  id: TIdSchema;
  createdAt: typeof dateTimeSchema;
}> =>
  z.object({
    id: idSchema,
    createdAt: dateTimeSchema,
  });

export const baseSchema = <TIdSchema extends z.ZodType<string>>(
  idSchema: TIdSchema
): z.ZodObject<{
  id: TIdSchema;
  createdAt: typeof dateTimeSchema;
  updatedAt: typeof dateTimeSchema;
}> => eventSchema(idSchema).extend({ updatedAt: dateTimeSchema });

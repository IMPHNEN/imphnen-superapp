import { Context, Effect, Layer } from 'effect';
import { bindings, env } from '#/platform/config/env.ts';
import { SERVICE_TAG } from '#/platform/service-tags.ts';
import { EMail } from '#/shared/errors.ts';
import type { TServiceId } from '#/shared/service-id.ts';

const MAIL_FROM_PATTERN = /^(.*)<(.+)>$/;

export type TMailMessage = {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
};

export type TMailService = {
  readonly send: (message: TMailMessage) => Effect.Effect<void, EMail>;
};

export type TMailServiceId = TServiceId<typeof SERVICE_TAG.MAIL>;

export const MailService = Context.Service<TMailServiceId, TMailService>(
  SERVICE_TAG.MAIL
);

const senderOf = (from: string): string | EmailAddress => {
  const found = MAIL_FROM_PATTERN.exec(from);
  return found === null
    ? from.trim()
    : { email: (found[2] ?? '').trim(), name: (found[1] ?? '').trim() };
};

export const mailServiceLayer = Layer.effect(
  MailService,
  Effect.sync(() =>
    MailService.of({
      send: (message) =>
        Effect.tryPromise({
          try: async (): Promise<void> => {
            await bindings.EMAIL.send({
              from: senderOf(env.MAIL_FROM),
              to: message.to,
              subject: message.subject,
              html: message.html,
              text: message.text,
            });
          },
          catch: (cause) => new EMail({ cause }),
        }),
    })
  )
);

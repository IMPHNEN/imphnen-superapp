import { implementer } from '#/platform/orpc/implementer.ts';

const qrRouter = implementer.qr.router({});

export type TQrRouter = typeof qrRouter;

export const qrRouterBuild = (): TQrRouter => qrRouter;

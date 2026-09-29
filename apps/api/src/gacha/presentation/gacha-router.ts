import { implementer } from '#/platform/orpc/implementer.ts';

const gachaRouter = implementer.gacha.router({});

export type TGachaRouter = typeof gachaRouter;

export const gachaRouterBuild = (): TGachaRouter => gachaRouter;

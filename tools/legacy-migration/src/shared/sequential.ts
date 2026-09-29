import { A } from '@mobily/ts-belt';

export const sequential = <TInput, TOutput>(
  items: readonly TInput[],
  run: (item: TInput) => Promise<TOutput>
): Promise<readonly TOutput[]> =>
  A.reduce(
    items,
    Promise.resolve([] as readonly TOutput[]),
    async (previous, item): Promise<readonly TOutput[]> =>
      A.append(await previous, await run(item))
  );

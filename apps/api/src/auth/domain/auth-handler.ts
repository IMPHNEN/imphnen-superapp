export type TAuthHandler = {
  readonly handler: (request: Request) => Promise<Response>;
};

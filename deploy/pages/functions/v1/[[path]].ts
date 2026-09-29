// Pages Function shared by every app: forwards /v1/* to the API so the
// SPAs keep calling a same-origin /v1, as they did behind nginx.
// API_ORIGIN can be overridden per Pages project; it defaults to production.

interface Env {
  API_ORIGIN?: string;
}

const DEFAULT_API_ORIGIN = 'https://api.imphnen.dev';

export const onRequest = async ({
  request,
  env,
}: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const incoming = new URL(request.url);
  const target = new URL(
    incoming.pathname + incoming.search,
    env.API_ORIGIN ?? DEFAULT_API_ORIGIN
  );
  return fetch(new Request(target, request));
};

export const ERROR_MESSAGE = {
  SERVER_UNREACHABLE_TITLE: "Can't reach the server",
  SERVER_UNREACHABLE_BODY:
    'You have not been signed out. This is a connection problem, so nothing has been lost.',
  SERVER_UNREACHABLE_NEXT:
    'Your session is still valid. Try again once the connection is back.',
  INTERNAL: 'Something went wrong on our side. The failure has been logged.',
  UNEXPECTED_TITLE: 'Something went wrong',
  UNEXPECTED_BODY: 'This page could not be loaded.',
  UNEXPECTED_NEXT: 'Nothing was saved or lost. Try again.',
  FORBIDDEN_TITLE: "You don't have access to this page",
  FORBIDDEN_BODY: 'Your account does not have the permission this page needs.',
  FORBIDDEN_NEXT: 'If you think you should, ask an administrator to grant it.',
  NOT_FOUND_TITLE: 'Page not found',
  NOT_FOUND_BODY: "That page doesn't exist, or it has moved.",
  RETRY: 'Try again',
  RETRYING: 'Retrying…',
  GO_HOME: 'Back to home',
  TOO_MANY_REQUESTS: 'Too many requests. Please wait a moment and try again.',
} as const;

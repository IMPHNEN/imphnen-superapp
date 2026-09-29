import type { ReactElement } from 'react';

export const PageLoader = (): ReactElement => (
  <div className="flex justify-center items-center min-h-screen bg-gray-50">
    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
  </div>
);

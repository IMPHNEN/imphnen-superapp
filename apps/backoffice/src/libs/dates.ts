const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const DATE_LENGTH = 10;

export const toWibDateInput = (iso: string): string =>
  new Date(new Date(iso).getTime() + WIB_OFFSET_MS)
    .toISOString()
    .slice(0, DATE_LENGTH);

export const formatDate = (iso: string): string =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

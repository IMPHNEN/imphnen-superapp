import type { TEventItem, TEventWriteInput } from '../../_hooks/use-events';
import { toWibDateInput } from '../../../../libs/dates';

export type TEventForm = {
  name: string;
  description: string;
  detailLink: string;
  location: string;
  price: number;
  startDate: string;
  endDate: string;
  isOnline: boolean;
};

export const EMPTY_EVENT_FORM: TEventForm = {
  name: '',
  description: '',
  detailLink: '',
  location: '',
  price: 0,
  startDate: '',
  endDate: '',
  isOnline: false,
};

export const eventFormOf = (event: TEventItem): TEventForm => ({
  name: event.name,
  description: event.description,
  detailLink: event.detailLink,
  location: event.location ?? '',
  price: event.price,
  startDate: toWibDateInput(event.startDate),
  endDate: toWibDateInput(event.endDate),
  isOnline: event.isOnline,
});

export const eventInputOf = (form: TEventForm): TEventWriteInput => ({
  name: form.name.trim(),
  description: form.description.trim(),
  detailLink: form.detailLink.trim(),
  location: form.location.trim() || null,
  price: Number(form.price),
  startDate: form.startDate,
  endDate: form.endDate,
  isOnline: form.isOnline,
});

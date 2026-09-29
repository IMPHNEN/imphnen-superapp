import {
  GACHA_CLAIM_STATUS,
  type TGachaClaim,
  type TGachaClaimStatus,
} from '@app/schemas';
import type { FC, ReactElement } from 'react';

const STATUS_LABEL: Record<TGachaClaimStatus, string> = {
  [GACHA_CLAIM_STATUS.PENDING]: 'Menunggu pengiriman',
  [GACHA_CLAIM_STATUS.FULFILLED]: 'Sudah dikirim',
};

const STATUS_CLASS: Record<TGachaClaimStatus, string> = {
  [GACHA_CLAIM_STATUS.PENDING]: 'bg-amber-100 text-amber-700',
  [GACHA_CLAIM_STATUS.FULFILLED]: 'bg-green-100 text-green-700',
};

const dateFormat = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

type TMyPrizes = {
  prizes: readonly TGachaClaim[];
};

export const MyPrizes: FC<TMyPrizes> = ({ prizes }): ReactElement => (
  <div className="col-span-4 md:col-span-8 lg:col-span-12 w-full text-primary-500 bg-white rounded-lg md:rounded-xl p-5 md:py-9 md:px-13 shadow">
    <header className="mb-4">
      <h3 className="font-semibold text-p3 md:text-h2">Hadiahku</h3>
    </header>
    {prizes.length === 0 ? (
      <p className="text-base md:text-p2">
        Kamu belum punya hadiah. Spin dulu ya!
      </p>
    ) : (
      <ul className="divide-y divide-primary-100">
        {prizes.map((prize) => (
          <li
            key={prize.id}
            className="flex flex-wrap items-center justify-between gap-2 py-3"
          >
            <div>
              <p className="font-semibold text-base md:text-p2">
                {prize.item.name}
              </p>
              <p className="text-sm text-neutral-500">
                {dateFormat.format(new Date(prize.createdAt))}
              </p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_CLASS[prize.status]}`}
            >
              {STATUS_LABEL[prize.status]}
            </span>
          </li>
        ))}
      </ul>
    )}
  </div>
);

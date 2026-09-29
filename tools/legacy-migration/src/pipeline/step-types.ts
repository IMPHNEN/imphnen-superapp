import type { TLegacyDataset } from '../legacy/legacy-dataset.ts';
import type { TLegacyTable } from '../legacy/legacy-table.ts';
import type { TSqlRow, TSqlValue } from '../target/target-rows.ts';
import type { TTargetTable } from '../target/target-table.ts';
import type { TAdjustmentRule, TRejectReason } from './report-codes.ts';

export const STEP_NAME = {
  IAM: 'iam',
  DIMENTORIN: 'dimentorin',
  GACHA: 'gacha',
  CMS: 'cms',
  HACKATHON: 'hackathon',
} as const;

export type TStepName = (typeof STEP_NAME)[keyof typeof STEP_NAME];

export type TReject = {
  readonly table: TLegacyTable;
  readonly id: string;
  readonly reason: TRejectReason;
  readonly detail: string;
  readonly blocking: boolean;
};

export type TAdjustment = {
  readonly table: TLegacyTable;
  readonly id: string;
  readonly rule: TAdjustmentRule;
  readonly detail: string;
};

export const FILE_SOURCE_KIND = {
  S3: 's3',
  INLINE: 'inline',
  URL: 'url',
} as const;

export type TFileSource =
  | { readonly kind: typeof FILE_SOURCE_KIND.S3; readonly key: string }
  | { readonly kind: typeof FILE_SOURCE_KIND.INLINE; readonly base64: string }
  | { readonly kind: typeof FILE_SOURCE_KIND.URL; readonly url: string };

export const FILE_REF_MODE = {
  VALUE: 'value',
  ARRAY: 'array',
} as const;

export type TFileRefMode = (typeof FILE_REF_MODE)[keyof typeof FILE_REF_MODE];

export type TFileRef = {
  readonly table: TTargetTable;
  readonly key: string;
  readonly column: string;
  readonly mode: TFileRefMode;
  readonly stored: TSqlValue;
  readonly fallback: TSqlValue;
};

export type TFileCopy = {
  readonly targetKey: string;
  readonly contentType: string;
  readonly source: TFileSource;
  readonly refs: readonly TFileRef[];
};

export type TTableRows = {
  readonly table: TTargetTable;
  readonly rows: readonly TSqlRow[];
};

export type TRowPatch = {
  readonly table: TTargetTable;
  readonly key: string;
  readonly set: TSqlRow;
};

export type TStepOutput = {
  readonly inserts: readonly TTableRows[];
  readonly patches: readonly TRowPatch[];
  readonly rejects: readonly TReject[];
  readonly adjustments: readonly TAdjustment[];
  readonly files: readonly TFileCopy[];
};

export type TMigrationOptions = {
  readonly now: number;
  readonly storagePublicUrl: string;
  readonly legacyFileUrlPrefixes: readonly string[];
  readonly gachaZeroStockUnpooled: boolean;
  readonly gachaRetireTestItem: boolean;
};

export type TMigrationState = {
  readonly tables: ReadonlyMap<TTargetTable, readonly TSqlRow[]>;
};

export type TStepInput = {
  readonly legacy: TLegacyDataset;
  readonly state: TMigrationState;
  readonly options: TMigrationOptions;
};

export type TStep = {
  readonly name: TStepName;
  readonly run: (input: TStepInput) => TStepOutput;
};

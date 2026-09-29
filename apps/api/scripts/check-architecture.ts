import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { A } from '@mobily/ts-belt';
import { match } from 'ts-pattern';
import { violationsFor, type TViolation } from './architecture-check.ts';

const SRC = new URL('../src', import.meta.url).pathname;
const EXIT_FAILURE = 1;
const SOURCE_EXTENSIONS: readonly string[] = ['.ts', '.tsx', '.mts', '.cts'];

const filesUnder = (dir: string): readonly string[] =>
  A.flat(
    A.map(readdirSync(dir), (entry) => {
      const full = join(dir, entry);
      return statSync(full).isDirectory()
        ? filesUnder(full)
        : A.some(SOURCE_EXTENSIONS, (ext) => full.endsWith(ext))
          ? [full]
          : [];
    })
  );

const report = (violations: readonly TViolation[]): void => {
  A.forEach(violations, (v) => {
    process.stdout.write(
      `${v.file}:${v.line}\n  ${v.rule}\t${v.edge}\n  import "${v.specifier}"\n  ${v.remedy}\n\n`
    );
  });
  process.stdout.write(
    `${violations.length} violation${violations.length === 1 ? '' : 's'}\n`
  );
};

const violations = A.flat(
  A.map(filesUnder(SRC), (file) =>
    violationsFor(relative(SRC, file), readFileSync(file, 'utf8'))
  )
);

report(violations);

match(A.isEmpty(violations))
  .with(false, () => process.exit(EXIT_FAILURE))
  .otherwise(() => undefined);

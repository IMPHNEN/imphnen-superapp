import { describe, expect, it } from 'vitest';
import {
  resolveSpecifier,
  specifiersOf,
  TARGET_KIND,
  uncheckedSpecifiersOf,
} from './architecture-specifiers.ts';

describe('specifiersOf', () => {
  it('finds a static import', () => {
    expect(
      specifiersOf('import { a } from "#/user/domain/user.ts";')
    ).toMatchObject([{ line: 1, specifier: '#/user/domain/user.ts' }]);
  });

  it('finds a dynamic import with a literal specifier', () => {
    expect(
      specifiersOf('await import("#/user/domain/user.ts");')
    ).toMatchObject([{ specifier: '#/user/domain/user.ts' }]);
  });

  it('finds a single-quoted specifier', () => {
    expect(
      specifiersOf("import { a } from '#/user/domain/user.ts';")
    ).toMatchObject([{ specifier: '#/user/domain/user.ts' }]);
  });

  it('finds a re-export', () => {
    expect(
      specifiersOf('export { a } from "#/user/domain/user.ts";')
    ).toMatchObject([{ specifier: '#/user/domain/user.ts' }]);
  });

  it('finds a side-effect import and a require', () => {
    expect(specifiersOf('import "#/user/domain/user.ts";')).toHaveLength(1);
    expect(specifiersOf('require("#/user/domain/user.ts")')).toHaveLength(1);
  });

  it('reports the line each import sits on', () => {
    expect(
      specifiersOf('\n\nimport { a } from "#/user/index.ts";')
    ).toMatchObject([{ line: 3 }]);
  });

  it('finds a specifier that sits on the line after from', () => {
    expect(
      specifiersOf('import {\n\ta,\n} from\n\t"#/user/index.ts";')
    ).toMatchObject([{ line: 4, specifier: '#/user/index.ts' }]);
  });

  it('finds an import written without spaces', () => {
    expect(specifiersOf('import{a}from"#/user/index.ts"')).toMatchObject([
      { specifier: '#/user/index.ts' },
    ]);
  });

  it('finds relative and package specifiers alike', () => {
    expect(
      specifiersOf(
        'import { a } from "./auth.ts";\nimport { b } from "effect";'
      )
    ).toMatchObject([{ specifier: './auth.ts' }, { specifier: 'effect' }]);
  });

  it('ignores methods that happen to be called from, import or require', () => {
    expect(
      specifiersOf(
        'Array.from("abc");\nBuffer.from("./x");\nloader.import("#/x");\nmodule.require("#/y");'
      )
    ).toEqual([]);
  });
});

describe('uncheckedSpecifiersOf', () => {
  it('flags a dynamic import whose specifier is not a literal', () => {
    expect(uncheckedSpecifiersOf('await import(name);')).toMatchObject([
      { line: 1, specifier: 'import(name)' },
    ]);
  });

  it('flags a template literal specifier', () => {
    expect(uncheckedSpecifiersOf(`await import(\`#/\${name}\`);`)).toHaveLength(
      1
    );
  });

  it('flags a require without a literal', () => {
    expect(uncheckedSpecifiersOf('require(path)')).toHaveLength(1);
  });

  it('leaves a literal dynamic import alone, on one line or several', () => {
    expect(uncheckedSpecifiersOf('import("#/user/index.ts")')).toEqual([]);
    expect(uncheckedSpecifiersOf('import(\n\t"#/user/index.ts",\n)')).toEqual(
      []
    );
  });
});

describe('resolveSpecifier', () => {
  it('normalises a parent segment inside an absolute specifier', () => {
    expect(
      resolveSpecifier('shared/errors.ts', '#/note/../platform/db/client.ts')
    ).toEqual({ kind: TARGET_KIND.INSIDE, path: 'platform/db/client.ts' });
  });

  it('treats an absolute specifier that climbs out of src as an escape', () => {
    expect(
      resolveSpecifier('note/domain/note.ts', '#/../secrets.ts')
    ).toMatchObject({ kind: TARGET_KIND.ESCAPE });
  });

  it('keeps a sibling import inside', () => {
    expect(resolveSpecifier('platform/db/tables/note.ts', './auth.ts')).toEqual(
      { kind: TARGET_KIND.INSIDE, path: 'platform/db/tables/auth.ts' }
    );
  });

  it('keeps a child directory import inside', () => {
    expect(
      resolveSpecifier('platform/db/schema.ts', './tables/note.ts')
    ).toEqual({ kind: TARGET_KIND.INSIDE, path: 'platform/db/tables/note.ts' });
  });

  it('treats ./../ as the escape it is', () => {
    expect(
      resolveSpecifier('note/domain/note.ts', './../application/x.ts')
    ).toMatchObject({ kind: TARGET_KIND.ESCAPE });
  });

  it('treats a parent import as an escape', () => {
    expect(
      resolveSpecifier('note/domain/note.ts', '../../user/domain/user.ts')
    ).toEqual({ kind: TARGET_KIND.ESCAPE, path: 'user/domain/user.ts' });
  });

  it('normalises a detour that ends in the same directory', () => {
    expect(
      resolveSpecifier('note/domain/note.ts', './sub/../note-id.ts')
    ).toEqual({ kind: TARGET_KIND.INSIDE, path: 'note/domain/note-id.ts' });
  });

  it('leaves package specifiers alone', () => {
    expect(resolveSpecifier('note/domain/note.ts', 'effect')).toEqual({
      kind: TARGET_KIND.PACKAGE,
    });
    expect(resolveSpecifier('note/domain/note.ts', '@app/messages')).toEqual({
      kind: TARGET_KIND.PACKAGE,
    });
  });
});

import { describe, expect, it } from 'vitest';
import { VALID_METADATA } from '../../testing/fixtures/iam-users-fixture.ts';
import { METADATA_PROBLEM, profileMetadataParse } from './profile-metadata.ts';

describe('profile metadata', () => {
  it('maps a valid Rust profile extension to columns', (): void => {
    const parsed = profileMetadataParse(VALID_METADATA);
    expect(parsed.problem).toBeNull();
    expect(parsed.metadata.text).toMatchObject({
      phone_number: '081234567890',
      phone_for_verification: null,
      domicile: 'Bandung',
      last_education: null,
      career_status: 'employed',
    });
    expect(parsed.metadata.skills).toBe('["Rust","TypeScript"]');
    expect(JSON.parse(parsed.metadata.experience)).toEqual([
      {
        id: 'e1',
        company: 'PT Contoh',
        position: 'Engineer',
        duration: '2y',
        period: '2021-2023',
      },
    ]);
    expect(parsed.metadata.education).toBe('[]');
  });

  it('logs NULL metadata and the JSON null literal', (): void => {
    expect(profileMetadataParse(null).problem).toBe(METADATA_PROBLEM.NULL);
    expect(profileMetadataParse('null').problem).toBe(METADATA_PROBLEM.NULL);
  });

  it('treats malformed JSON as absent', (): void => {
    const parsed = profileMetadataParse('{"skills": ["Go"');
    expect(parsed.problem).toBe(METADATA_PROBLEM.NOT_JSON);
    expect(parsed.metadata.skills).toBe('[]');
    expect(parsed.metadata.text.bio).toBeNull();
  });

  it('treats a shape Rust could not read as absent, like Rust did', (): void => {
    const missingField = profileMetadataParse(
      '{"experience":[{"id":"x","company":"Acme"}],"bio":"hi"}'
    );
    expect(missingField.problem).toBe(METADATA_PROBLEM.WRONG_SHAPE);
    expect(missingField.metadata.text.bio).toBeNull();
    expect(profileMetadataParse('{"bio":42}').problem).toBe(
      METADATA_PROBLEM.WRONG_SHAPE
    );
    expect(profileMetadataParse('["not","an","object"]').problem).toBe(
      METADATA_PROBLEM.WRONG_SHAPE
    );
  });

  it('accepts missing keys and ignores unknown ones', (): void => {
    const parsed = profileMetadataParse('{"bio":"halo","legacy_key":true}');
    expect(parsed.problem).toBeNull();
    expect(parsed.metadata.text.bio).toBe('halo');
    expect(parsed.metadata.text.gender).toBeNull();
  });
});

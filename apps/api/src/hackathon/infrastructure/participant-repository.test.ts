import { describe, expect, it } from 'vitest';
import { ParticipantRepo } from '#/hackathon/domain/participant-repo.ts';
import { seededDbCreate } from '#/hackathon/infrastructure/testing/seed.ts';

const PHONE = '+62 812 0000 0000';
const LOCATION = 'Medan';

describe('participant profile on D1', () => {
  it('answers from the platform user before the profile exists, then upserts and clears fields', async (): Promise<void> => {
    const seeded = await seededDbCreate(1);
    const [userId = ''] = seeded.users;

    const before = await seeded.run(
      ParticipantRepo.use((repo) => repo.find(userId))
    );
    const created = await seeded.run(
      ParticipantRepo.use((repo) =>
        repo.upsert({ phoneNumber: PHONE, location: LOCATION }, userId)
      )
    );
    const cleared = await seeded.run(
      ParticipantRepo.use((repo) =>
        repo.upsert({ phoneNumber: null, skills: ['rust'] }, userId)
      )
    );

    expect(before).toMatchObject({ registered: false, skills: [] });
    expect(created).toMatchObject({
      registered: true,
      phoneNumber: PHONE,
      location: LOCATION,
    });
    expect(cleared).toMatchObject({
      phoneNumber: null,
      location: LOCATION,
      skills: ['rust'],
    });
  });
});

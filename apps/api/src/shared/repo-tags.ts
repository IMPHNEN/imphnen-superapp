import { GACHA_REPO_TAG } from '#/shared/repo-tags/gacha.ts';
import { EVENT_REPO_TAG } from '#/shared/repo-tags/event.ts';
import { TESTIMONIAL_REPO_TAG } from '#/shared/repo-tags/testimonial.ts';
import { ROADMAP_REPO_TAG } from '#/shared/repo-tags/roadmap.ts';
import { QR_REPO_TAG } from '#/shared/repo-tags/qr.ts';
import { MENTOR_REPO_TAG } from '#/shared/repo-tags/mentor.ts';
import { MENTORING_REPO_TAG } from '#/shared/repo-tags/mentoring.ts';
import { HACKATHON_REPO_TAG } from '#/shared/repo-tags/hackathon.ts';
import { PROFILE_REPO_TAG } from '#/shared/repo-tags/profile.ts';

export const REPO_TAG = {
  NOTE: 'app/NoteRepo',
  NOTE_ATTACHMENT: 'app/NoteAttachmentRepo',
  NOTE_ATTACHMENT_STORE: 'app/NoteAttachmentStore',
  USER: 'app/UserRepo',
  CUSTOM_ROLE: 'app/CustomRoleRepo',
  ACTIVITY: 'app/ActivityRepo',
  ACTIVITY_RECORDER: 'app/ActivityRecorder',
  ACTIVITY_PRUNER: 'app/ActivityPruner',
  ...GACHA_REPO_TAG,
  ...EVENT_REPO_TAG,
  ...TESTIMONIAL_REPO_TAG,
  ...ROADMAP_REPO_TAG,
  ...QR_REPO_TAG,
  ...MENTOR_REPO_TAG,
  ...MENTORING_REPO_TAG,
  ...HACKATHON_REPO_TAG,
  ...PROFILE_REPO_TAG,
} as const;

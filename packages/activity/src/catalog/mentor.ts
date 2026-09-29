export const MENTOR_ACTIVITY_RESOURCE_TYPE = {
  MENTOR: 'mentor',
} as const;

export const MENTOR_ACTIVITY_ACTION = {
  MENTOR_REGISTER: 'mentor.register',
  MENTOR_APPROVE: 'mentor.approve',
  MENTOR_REJECT: 'mentor.reject',
  MENTOR_UPDATE: 'mentor.update',
  MENTOR_DELETE: 'mentor.delete',
  MENTOR_DOCUMENT_UPLOAD: 'mentor.document_upload',
} as const;

export interface SocialLink {
  platform: string;
  placeholder: string;
  value: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  duration: string;
  period: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field: string;
  period: string;
}

export interface Language {
  name: string;
  level: string;
}

export interface PersonalInfo {
  fullname: string;
  title: string;
  bio: string;
  birthdate: string;
  gender: string;
}

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
}

export interface CvResume {
  cvUrl: string;
  resumeUrl: string;
}

export interface NotificationState {
  isOpen: boolean;
  type: 'success' | 'error';
  title: string;
  message?: string;
}

export interface ProfileFormProps {
  showNotification: (
    type: 'success' | 'error',
    title: string,
    message?: string
  ) => void;
}

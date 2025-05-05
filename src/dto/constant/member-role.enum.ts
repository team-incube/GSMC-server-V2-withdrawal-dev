export const MemberRole = {
  ROLE_STUDENT: 'ROLE_STUDENT',
  ROLE_TEACHER: 'ROLE_TEACHER',
  ROLE_ADMIN: 'ROLE_ADMIN',
} as const;

export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

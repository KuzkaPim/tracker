export interface User {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'MEMBER';
  companyId: string;
}
import { UserRole } from '@/utils/constant';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  createdAt: string;
  email: string | null;
  username: string | null;
  avatarUrl: string | null;
}

import { UserProfile } from '@/interface/user.interface';
import { createStoreSelectors } from '@/utils/store-utils';
import { create } from 'zustand';

interface UserStoreState {
  profile: null | UserProfile;
}
interface UserStoreActions {
  $reset(): void;
  setProfile(profile: UserProfile | null): void;
  updateProfile(profile: Partial<UserProfile>): void;
  setState<T extends keyof UserStoreState>(
    key: T,
    value: UserStoreState[T],
  ): void;
}

export type ProfileStore = UserStoreState & UserStoreActions;

const initialData: UserStoreState = {
  profile: null,
};

const useUserStoreBase = create<ProfileStore>((set, get) => ({
  ...initialData,
  setProfile(profile) {
    set({ profile });
  },
  setState(key, value) {
    set({ [key]: value });
  },
  updateProfile(profile) {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    set({ profile: { ...currentProfile, ...profile } });
  },
  $reset() {
    set({ ...initialData });
  },
}));

export const useUserStore = createStoreSelectors(useUserStoreBase);

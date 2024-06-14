import { UserProfile } from '@/interface/user.interface';
import APIService from '@/services/api.service';
import { createStoreSelectors } from '@/utils/store-utils';
import { create } from 'zustand';

interface UserStoreState {
  profile: null | UserProfile;
}
interface UserStoreActions {
  $reset(): void;
  fetchProfile(): Promise<UserProfile | null>;
  setProfile(profile: UserProfile | null): void;
  updateProfile(profile: Partial<UserProfile>): void;
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
  updateProfile(profile) {
    const currentProfile = get().profile;
    if (!currentProfile) return;

    set({ profile: { ...currentProfile, ...profile } });
  },
  async fetchProfile() {
    const profile = await APIService.instance.getProfile();
    set({ profile });

    return profile;
  },
  $reset() {
    set({ ...initialData });
  },
}));

export const useUserStore = createStoreSelectors(useUserStoreBase);

import { UserProfile } from '@/interface/user.interface';
import APIService from '@/services/api.service';
import { createStoreSelectors } from '@/utils/store-utils';
import { create } from 'zustand';

interface UserStoreState {
  profileFetched: boolean;
  state: 'fetching' | 'idle';
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
  state: 'fetching',
  profileFetched: false,
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
    try {
      const state = get();
      if (state.profileFetched) return state.profile;

      const profile = await APIService.instance.me.get();
      set({ profile, state: 'idle', profileFetched: true });

      return profile;
    } catch (error) {
      set({ state: 'idle', profileFetched: true });
      throw error;
    }
  },
  $reset() {
    set({ ...initialData });
  },
}));

export const useUserStore = createStoreSelectors(useUserStoreBase);

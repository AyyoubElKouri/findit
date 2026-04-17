import { create } from 'zustand';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import axios from 'axios';

export interface NotificationsState {
  hasPermission: boolean | null;
  expoPushToken: string | null;
}

export interface NotificationsActions {
  requestPermission: () => Promise<void>;
  registerToken: () => Promise<void>;
}

export const useNotificationsStore = create<NotificationsState & NotificationsActions>((set, get) => ({
  hasPermission: null,
  expoPushToken: null,

  requestPermission: async () => {
    if (!Device.isDevice) {
      set({ hasPermission: false });
      return;
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const res = await Notifications.requestPermissionsAsync();
      status = res.status;
    }
    set({ hasPermission: status === 'granted' });
  },

  registerToken: async () => {
    const hasPermission = get().hasPermission;
    if (!hasPermission) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    set({ expoPushToken: token.data });
    // Envoi au backend
    try {
      const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
      await axios.patch(`${API_URL}/users/me/push-token`, { push_token: token.data });
    } catch (e) {
      // Optionnel: gestion d'erreur
    }
  },
}));

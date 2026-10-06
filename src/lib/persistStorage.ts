import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// Armazenamento assíncrono para o cache offline do React Query
export const persistStorage = Capacitor.isNativePlatform()
  ? {
      getItem: async (key: string) => (await Preferences.get({ key })).value,
      setItem: async (key: string, value: string) => {
        await Preferences.set({ key, value });
      },
      removeItem: async (key: string) => {
        await Preferences.remove({ key });
      },
    }
  : {
      getItem: async (key: string) => localStorage.getItem(key),
      setItem: async (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: async (key: string) => localStorage.removeItem(key),
    };

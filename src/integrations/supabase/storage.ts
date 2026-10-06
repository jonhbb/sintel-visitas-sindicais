import { Capacitor } from "@capacitor/core";
import { Preferences } from "@capacitor/preferences";

// No Android o localStorage do WebView pode ser limpo pelo sistema;
// Preferences usa SharedPreferences, que é persistente.
export const authStorage = Capacitor.isNativePlatform()
  ? {
      getItem: async (key: string) => (await Preferences.get({ key })).value,
      setItem: async (key: string, value: string) => {
        await Preferences.set({ key, value });
      },
      removeItem: async (key: string) => {
        await Preferences.remove({ key });
      },
    }
  : localStorage;

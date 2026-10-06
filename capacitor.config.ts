import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "br.org.sintel.visitas",
  appName: "SINTEL Visitas",
  webDir: "dist",
  android: {
    allowMixedContent: false,
  },
};

export default config;

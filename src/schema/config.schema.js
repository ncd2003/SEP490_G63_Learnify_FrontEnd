import { z } from "zod";

const configSchema = z.object({
  VITE_BASE_API_URL: z.string().min(1, "VITE_BASE_API_URL is required"),
  VITE_WS_URL: z.string().optional(),
  VITE_JITSI_ENABLED: z.coerce.boolean().default(false),
  VITE_JITSI_DOMAIN: z.string().default("meet.jit.si"),
  VITE_JITSI_APP_ID: z.string().optional(),
});

const envConfig = configSchema.parse({
  VITE_BASE_API_URL: import.meta.env.VITE_BASE_API_URL,
  VITE_WS_URL: import.meta.env.VITE_WS_URL,
  VITE_JITSI_ENABLED: import.meta.env.VITE_JITSI_ENABLED,
  VITE_JITSI_DOMAIN: import.meta.env.VITE_JITSI_DOMAIN,
  VITE_JITSI_APP_ID: import.meta.env.VITE_JITSI_APP_ID,
});

export default envConfig;

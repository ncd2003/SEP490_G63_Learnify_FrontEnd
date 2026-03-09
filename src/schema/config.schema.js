import { z } from "zod";

const configSchema = z.object({
  VITE_BASE_API_URL: z.string().min(1, "VITE_BASE_API_URL is required"),
});

const envConfig = configSchema.parse({
  VITE_BASE_API_URL: import.meta.env.VITE_BASE_API_URL,
});

export default envConfig;

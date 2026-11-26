import type { NextConfig } from "next";
const config: NextConfig = {
  outputFileTracingIncludes: {
    "/api/developer": ["./supabase/schema.sql", "./supabase/migrations/*.sql"],
  },
};
export default config;

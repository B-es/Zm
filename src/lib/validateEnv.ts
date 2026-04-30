export function validateEnv() {
  const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"];
  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error("\nCopy .env.example to .env and fill in the values.");
    throw new Error("Missing required environment variables");
  }
}

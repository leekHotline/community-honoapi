import 'dotenv/config'
import { defineConfig } from 'drizzle-kit'

const connectionString =
  process.env.SUPABASE_CONNECTION_STRING ?? process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('Missing env var: SUPABASE_CONNECTION_STRING')
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionString,
  },
})

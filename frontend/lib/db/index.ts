import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema"

const getDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined in environment variables")
  }

  // Add sslmode if not present
  if (!databaseUrl.includes("sslmode=")) {
    const separator = databaseUrl.includes("?") ? "&" : "?"
    return `${databaseUrl}${separator}sslmode=disable`
  }

  return databaseUrl
}

const connectionString = getDatabaseUrl()

const sql = postgres(connectionString, {
  max: 15,
  idle_timeout: 20,
  connect_timeout: 30,
  ssl: false,
})

export const db = drizzle(sql, { schema })

export async function closeDatabase() {
  await sql.end()
}

if (typeof window === "undefined") {
  const safeUrl = connectionString.split("@")[1]?.split("?")[0] || "unknown"
  console.log("Database connecting to:", safeUrl)
}

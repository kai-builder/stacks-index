import postgres from "postgres"
import fs from "fs"
import path from "path"

const getDatabaseUrl = () => {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not defined")
  }
  if (!databaseUrl.includes("sslmode=")) {
    const separator = databaseUrl.includes("?") ? "&" : "?"
    return `${databaseUrl}${separator}sslmode=disable`
  }
  return databaseUrl
}

async function migrate() {
  const sql = postgres(getDatabaseUrl(), {
    max: 1,
    ssl: false,
  })

  console.log("Running migrations...")

  const migrationPath = path.join(__dirname, "migrations", "0001_create_tables.sql")
  const migrationSql = fs.readFileSync(migrationPath, "utf8")

  try {
    await sql.unsafe(migrationSql)
    console.log("Migrations completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  } finally {
    await sql.end()
  }
}

migrate()

import fs from "node:fs"
import { Client } from "pg"

const client = new Client({
  connectionString: "postgresql://rowan@127.0.0.1:5432/postgres?sslmode=disable",
})

const BATCH_SIZE = 500

await client.connect()

try {
  await client.query(`
    CREATE TABLE IF NOT EXISTS city (
      geoname_id BIGINT PRIMARY KEY,
      name TEXT NOT NULL,
      country_code TEXT NOT NULL,
      lat DOUBLE PRECISION NOT NULL,
      lon DOUBLE PRECISION NOT NULL,
      timezone TEXT
    )
  `)

  const lines = fs.readFileSync("cities5000.txt", "utf8").split("\n")
  const rows = []
  let skipped = 0

  for (const line of lines) {
    if (!line) continue

    const cols = line.split("\t")

    if (cols.length < 18) {
      skipped += 1
      continue
    }

    const geonameId = Number(cols[0])
    const lat = Number(cols[4])
    const lon = Number(cols[5])
    const name = cols[1]
    const countryCode = cols[8]

    if (
      !Number.isFinite(geonameId) ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      !name ||
      !countryCode
    ) {
      skipped += 1
      continue
    }

    rows.push([geonameId, name, countryCode, lat, lon, cols[17] || null])
  }

  await client.query("BEGIN")

  try {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE)
      const values = []
      const placeholders = batch
        .map((row, rowIndex) => {
          const base = rowIndex * 6
          values.push(...row)
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
        })
        .join(", ")

      await client.query(
        `INSERT INTO city (geoname_id, name, country_code, lat, lon, timezone)
         VALUES ${placeholders}
         ON CONFLICT (geoname_id) DO UPDATE
         SET name = EXCLUDED.name,
             country_code = EXCLUDED.country_code,
             lat = EXCLUDED.lat,
             lon = EXCLUDED.lon,
             timezone = EXCLUDED.timezone`,
        values
      )
    }

    await client.query("COMMIT")
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  }

  console.log(`done: upserted=${rows.length}, skipped=${skipped}`)
} finally {
  await client.end()
}

/**
 * Skrip migrasi MongoDB sederhana untuk koleksi affiliate.
 * Jalankan: node scripts/migrate_affiliate.js
 * Pastikan MONGODB_URL ter-set pada environment atau file .env
 */
const { MongoClient } = require("mongodb")

async function run() {
  const uri = process.env.MONGODB_URL || process.env.MONGODB_URL || "mongodb://localhost:27017"
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const dbName = process.env.RESELLER_DB_NAME || "Congor"
    const db = client.db(dbName)

    console.log("Membuat koleksi dan index untuk fitur affiliate...")

    // affiliate_profiles
    const affiliateProfiles = db.collection("affiliate_profiles")
    await affiliateProfiles.createIndex({ userId: 1 }, { unique: true })
    await affiliateProfiles.createIndex({ status: 1 })

    // affiliate_package_prices
    const affiliatePrices = db.collection("affiliate_package_prices")
    await affiliatePrices.createIndex({ affiliateId: 1 })
    await affiliatePrices.createIndex({ packageId: 1 })
    await affiliatePrices.createIndex({ affiliateId: 1, packageId: 1 }, { unique: true })

    // withdrawal_requests
    const withdrawals = db.collection("withdrawal_requests")
    await withdrawals.createIndex({ affiliateId: 1 })
    await withdrawals.createIndex({ status: 1 })

    // transaction logs
    const logs = db.collection("affiliate_transactions")
    await logs.createIndex({ affiliateId: 1 })
    await logs.createIndex({ createdAt: -1 })

    console.log("Migrasi selesai. Koleksi dan index dibuat pada DB:", dbName)
  } catch (err) {
    console.error("Migrasi gagal:", err)
  } finally {
    await client.close()
  }
}

if (require.main === module) run()

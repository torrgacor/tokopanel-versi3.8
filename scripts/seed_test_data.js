#!/usr/bin/env node

/**
 * Script populate test data untuk affiliate system
 * Usage: node scripts/seed_test_data.js
 */

import clientPromise from "../lib/mongodb.js"
import { appConfig } from "../data/config.ts"

async function seedData() {
  console.log("🌱 Seeding test data...")

  const client = await clientPromise
  const db = client.db(appConfig.mongodb.dbName)

  try {
    // 1. Buat affiliate profile
    const affiliateProfile = {
      userId: "test-affiliate-001",
      storeName: "Toko Test Affiliate",
      ownerName: "Test Owner",
      email: "test@example.com",
      wallet: {
        balance: 500000,
        pending: 0,
        total: 500000,
      },
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.collection("affiliateProfiles").deleteMany({ userId: "test-affiliate-001" })
    const resInsert = await db.collection("affiliateProfiles").insertOne(affiliateProfile)
    console.log("✓ Affiliate profile created:", resInsert.insertedId)

    // 2. Buat package pricing
    const packages = [
      { packageId: "pak-1", name: "Paket Starter", basePrice: 100000, markupAmount: 20000 },
      { packageId: "pak-2", name: "Paket Pro", basePrice: 250000, markupAmount: 50000 },
      { packageId: "pak-3", name: "Paket Premium", basePrice: 500000, markupAmount: 100000 },
    ]

    await db.collection("affiliatePackagePrices").deleteMany({ affiliateId: "test-affiliate-001" })

    for (const pkg of packages) {
      await db.collection("affiliatePackagePrices").insertOne({
        affiliateId: "test-affiliate-001",
        packageId: pkg.packageId,
        name: pkg.name,
        basePrice: pkg.basePrice,
        markupAmount: pkg.markupAmount,
        finalPrice: pkg.basePrice + pkg.markupAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
    console.log(`✓ Package prices created: ${packages.length} packages`)

    // 3. Buat sample transactions
    const transactions = [
      {
        transactionId: "txn-001",
        affiliateId: "test-affiliate-001",
        buyerId: "buyer-001",
        planId: "pak-1",
        basePrice: 100000,
        finalPrice: 120000,
        commission: 20000,
        type: "purchase",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      },
      {
        transactionId: "txn-002",
        affiliateId: "test-affiliate-001",
        buyerId: "buyer-002",
        planId: "pak-2",
        basePrice: 250000,
        finalPrice: 300000,
        commission: 50000,
        type: "purchase",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      },
    ]

    await db.collection("affiliateTransactions").deleteMany({ affiliateId: "test-affiliate-001" })
    await db.collection("affiliateTransactions").insertMany(transactions)
    console.log(`✓ Sample transactions created: ${transactions.length} transactions`)

    // 4. Buat sample pending withdrawal
    const pendingWithdraw = {
      affiliateId: "test-affiliate-001",
      amount: 100000,
      method: "Transfer Bank BCA",
      accountNumber: "1234567890",
      accountName: "Test Owner",
      status: "pending",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    }

    await db.collection("withdrawalRequests").deleteMany({
      affiliateId: "test-affiliate-001",
      status: "pending",
    })
    const withdrawInsert = await db.collection("withdrawalRequests").insertOne(pendingWithdraw)
    console.log("✓ Pending withdrawal request created:", withdrawInsert.insertedId)

    // 5. Update wallet untuk test (kurangi pending)
    await db.collection("affiliateProfiles").updateOne(
      { userId: "test-affiliate-001" },
      {
        $set: {
          "wallet.balance": 400000,
          "wallet.pending": 100000,
          "wallet.total": 500000,
        },
      }
    )
    console.log("✓ Wallet updated for pending withdrawal test")

    console.log("\n✅ Test data seeded successfully!")
    console.log("\n📋 Created resources:")
    console.log("  Affiliate ID: test-affiliate-001")
    console.log("  Affiliate Email: test@example.com")
    console.log("  Initial Balance: 500000")
    console.log("  Pending Withdraw: 100000")
    console.log("  Available Balance: 400000")
    console.log("  Packages: 3 (Starter, Pro, Premium)")
    console.log("  Sample Transactions: 2")
    console.log("\n🔗 Access at: http://localhost:3000/affiliate")
  } catch (error) {
    console.error("❌ Error seeding data:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seedData()

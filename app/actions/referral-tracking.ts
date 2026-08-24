"use server"

import clientPromise from "@/lib/mongodb"
import { appConfig } from "@/data/config"
import { calculateAffiliateCommission, getCollections, syncAffiliateLevel } from "@/lib/affiliate"

/**
 * Track referral click dari customer
 */
export async function trackReferralClick(referralCode: string) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const affiliateProfiles = db.collection("affiliate_profiles")

    await affiliateProfiles.findOneAndUpdate(
      { referralCode, status: "active" },
      {
        $inc: { "referralStats.clicks": 1 },
      }
    )

    return { success: true }
  } catch (error) {
    console.error("trackReferralClick error:", error)
    return { success: false }
  }
}

/**
 * Record order yang berasal dari referral
 * Dipanggil setelah payment berhasil
 */
export async function recordReferralOrder(
  referralCode: string,
  orderId: string,
  customerId: string,
  planId: string,
  amount: number
) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const { affiliateProfiles, affiliateTransactions } = await getCollections()

    // Cari affiliate berdasarkan referral code
    const affiliate = await affiliateProfiles.findOne({
      referralCode,
      status: "active",
    })

    if (!affiliate) {
      return {
        success: false,
        error: "Referral code tidak valid",
        affiliateId: null,
      }
    }

    // Hitung komisi berdasarkan markup yang sudah di-set
    const { affiliatePackagePrices } = await getCollections()
    const priceEntry = await affiliatePackagePrices.findOne({
      affiliateId: affiliate.userId,
      packageId: planId,
    })

    // Jika tidak ada markup custom, gunakan default (0% - tidak ada komisi dari admin, hanya dari referral)
    const finalPrice = priceEntry?.finalPrice || amount

    // Komisi affiliate = selisih antara finalPrice dan base price
    // Untuk referral order, kita bisa apply additional komisi/bonus
    const plans = await db.collection("plans").findOne({ id: planId })
    const basePrice = plans?.price || 0

    const commission = await calculateAffiliateCommission(finalPrice, affiliate.userId)

    // Record transaksi
    const transaction = {
      transactionId: orderId,
      affiliateId: affiliate.userId,
      buyerId: customerId,
      planId,
      basePrice,
      finalPrice,
      commission,
      type: "referral",
      referralCode,
      createdAt: new Date(),
    }

    // Update affiliate wallet dan stats (atomic transaction)
    const session = client.startSession()
    try {
      await session.withTransaction(async () => {
        // Update wallet
        await affiliateProfiles.findOneAndUpdate(
          { userId: affiliate.userId },
          {
            $inc: {
              "wallet.balance": commission,
              "referralStats.conversions": 1,
              "referralStats.successfulTransactions": 1,
              "referralStats.totalCommission": commission,
            },
            $set: { updatedAt: new Date() },
          },
          { session }
        )

        // Record transaksi
        await affiliateTransactions.insertOne(transaction, { session })
        await syncAffiliateLevel(affiliate.userId, (affiliate.referralStats?.conversions ?? 0) + 1, session)
      })
    } finally {
      await session.endSession()
    }

    return {
      success: true,
      affiliateId: affiliate.userId,
      commission,
      message: `Komisi Rp ${commission.toLocaleString("id-ID")} berhasil ditambahkan ke akun affiliate`,
    }
  } catch (error) {
    console.error("recordReferralOrder error:", error)
    return { success: false, error: "Gagal merekam referral order", affiliateId: null }
  }
}

/**
 * Dapatkan statistik referral affiliate
 */
export async function getAffiliateStats(affiliateId: string) {
  try {
    const { affiliateProfiles, affiliateTransactions } = await getCollections()

    const affiliate = await affiliateProfiles.findOne({ userId: affiliateId })
    if (!affiliate) {
      return { success: false, error: "Affiliate tidak ditemukan" }
    }

    // Hitung statistik dari transaction
    const transactions = await affiliateTransactions
      .find({ affiliateId })
      .sort({ createdAt: -1 })
      .toArray()

    const referralTransactions = transactions.filter((t) => t.type === "referral")

    const totalCommission = transactions.reduce((sum, t) => sum + (t.commission || 0), 0)
    const referralCommission = referralTransactions.reduce((sum, t) => sum + (t.commission || 0), 0)
    const directCommission = totalCommission - referralCommission

    return {
      success: true,
      data: {
        userId: affiliate.userId,
        storeName: affiliate.storeName,
        email: affiliate.email,
        status: affiliate.status,
        referralCode: affiliate.referralCode,
        wallet: affiliate.wallet,
        referralStats: affiliate.referralStats,
        // Calculate from transactions
        stats: {
          totalOrders: transactions.length,
          referralOrders: referralTransactions.length,
          totalCommission,
          referralCommission,
          directCommission,
          avgCommissionPerOrder: transactions.length > 0 ? totalCommission / transactions.length : 0,
        },
      },
    }
  } catch (error) {
    console.error("getAffiliateStats error:", error)
    return { success: false, error: "Gagal mengambil statistik affiliate" }
  }
}

/**
 * Dapatkan semua affiliate (untuk admin)
 */
export async function getAllAffiliates(page: number = 1, limit: number = 10, filter?: { status?: string }) {
  try {
    const { affiliateProfiles, affiliateTransactions } = await getCollections()

    const query: any = {}
    if (filter?.status) {
      query.status = filter.status
    }

    const total = await affiliateProfiles.countDocuments(query)
    const statusSummaryData = await affiliateProfiles.aggregate([
      { $match: query },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]).toArray()

    const statusSummary = {
      total,
      active: 0,
      pending: 0,
      suspended: 0,
      rejected: 0,
    }

    statusSummaryData.forEach((item) => {
      const statusKey = item._id as keyof typeof statusSummary
      if (statusKey in statusSummary) {
        statusSummary[statusKey] = item.count
      }
    })

    const affiliates = await affiliateProfiles
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    const transactionStats = await affiliateTransactions
      .aggregate([
        { $group: { _id: "$affiliateId", transactionCount: { $sum: 1 }, totalCommission: { $sum: "$commission" } } },
      ])
      .toArray()

    const transactionMap = new Map(transactionStats.map((item) => [item._id, item]))

    const enrichedAffiliates = affiliates.map((affiliate) => {
      const stats = transactionMap.get(affiliate.userId)
      return {
        ...affiliate,
        transactionCount: stats?.transactionCount ?? 0,
        totalCommission: stats?.totalCommission ?? 0,
      }
    })

    return {
      success: true,
      data: enrichedAffiliates,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
      statusSummary,
    }
  } catch (error) {
    console.error("getAllAffiliates error:", error)
    return { success: false, error: "Gagal mengambil data affiliate" }
  }
}

/**
 * Adjust saldo affiliate secara manual (admin)
 */
export async function adjustAffiliateBalance(
  affiliateId: string,
  amount: number,
  reason: string,
  adminId: string
) {
  try {
    const { affiliateProfiles } = await getCollections()

    const result = await affiliateProfiles.findOneAndUpdate(
      { userId: affiliateId },
      {
        $inc: { "wallet.balance": amount },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: "after" }
    )

    if (!result.value) {
      return { success: false, error: "Affiliate tidak ditemukan" }
    }

    // Log adjustment ke collection terpisah untuk audit trail
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    await db.collection("balance_adjustments").insertOne({
      affiliateId,
      amount,
      reason,
      adjustedBy: adminId,
      newBalance: result.value.wallet.balance + amount,
      createdAt: new Date(),
    })

    return {
      success: true,
      message: "Saldo berhasil diupdate",
      newBalance: result.value.wallet.balance + amount,
    }
  } catch (error) {
    console.error("adjustAffiliateBalance error:", error)
    return { success: false, error: "Gagal mengupdate saldo" }
  }
}

/**
 * Suspend/unsuspend affiliate
 */
export async function toggleAffiliateStatus(
  affiliateId: string,
  newStatus: "active" | "suspended" | "rejected",
  reason?: string
) {
  try {
    const { affiliateProfiles } = await getCollections()

    const result = await affiliateProfiles.findOneAndUpdate(
      { userId: affiliateId },
      {
        $set: {
          status: newStatus,
          suspensionReason: reason,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    )

    if (!result.value) {
      return { success: false, error: "Affiliate tidak ditemukan" }
    }

    return {
      success: true,
      message: `Status affiliate berhasil diperbarui`,
    }
  } catch (error) {
    console.error("toggleAffiliateStatus error:", error)
    return { success: false, error: "Gagal mengupdate status affiliate" }
  }
}

export async function updateAffiliateProfile(
  affiliateId: string,
  data: {
    storeName?: string
    email?: string
    ownerName?: string
    phoneNumber?: string
    withdrawMethod?: string
    accountNumber?: string
    accountName?: string
  }
) {
  try {
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: "Format email tidak valid" }
    }

    const { affiliateProfiles } = await getCollections()

    if (data.email) {
      const emailDipakai = await affiliateProfiles.findOne({
        email: data.email,
        userId: { $ne: affiliateId },
      })
      if (emailDipakai) {
        return { success: false, error: "Email sudah dipakai affiliate lain" }
      }
    }

    const updateData: Record<string, any> = { updatedAt: new Date() }
    if (data.storeName !== undefined) updateData.storeName = data.storeName
    if (data.email !== undefined) updateData.email = data.email
    if (data.ownerName !== undefined) updateData.ownerName = data.ownerName
    if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber
    if (data.withdrawMethod !== undefined) updateData.withdrawMethod = data.withdrawMethod
    if (data.accountNumber !== undefined) updateData.accountNumber = data.accountNumber
    if (data.accountName !== undefined) updateData.accountName = data.accountName

    const result = await affiliateProfiles.findOneAndUpdate(
      { userId: affiliateId },
      { $set: updateData },
      { returnDocument: "after" }
    )

    if (!result.value) {
      return { success: false, error: "Affiliate tidak ditemukan" }
    }

    return { success: true, message: "Data affiliate berhasil diperbarui", data: result.value }
  } catch (error) {
    console.error("updateAffiliateProfile error:", error)
    return { success: false, error: "Gagal memperbarui data affiliate" }
  }
}

export async function deleteAffiliate(affiliateId: string) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const { affiliateProfiles } = await getCollections()

    const affiliate = await affiliateProfiles.findOne({ userId: affiliateId })
    if (!affiliate) {
      return { success: false, error: "Affiliate tidak ditemukan" }
    }

    await affiliateProfiles.deleteOne({ userId: affiliateId })
    await db.collection("affiliate_package_prices").deleteMany({ affiliateId })
    await db.collection("withdrawal_requests").deleteMany({ affiliateId })
    await db.collection("affiliate_transactions").deleteMany({ affiliateId })

    return { success: true, message: "Affiliate berhasil dihapus" }
  } catch (error) {
    console.error("deleteAffiliate error:", error)
    return { success: false, error: "Gagal menghapus affiliate" }
  }
      }

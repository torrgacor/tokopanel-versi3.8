"use server"
 
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export type DiscountType = "percentage" | "nominal"

export interface Voucher {
  _id?: ObjectId
  code: string
  discountType: DiscountType
  discountValue: number // Persentase (0-100) atau nominal (Rp)
  maxUses?: number
  currentUses: number
  minimumPurchase?: number
  downloadUrl?: string
  expiryDate?: Date
  active: boolean
  createdAt: Date
  description?: string
}

export interface UserVoucher {
  _id?: ObjectId
  userId: string // username atau email
  voucherId: ObjectId
  code: string
  claimedAt: Date
  usedAt?: Date
  used: boolean
}

// Create voucher (admin only)
export async function createVoucher(data: {
  code: string
  discountType: DiscountType
  discountValue: number
  maxUses?: number
  minimumPurchase?: number
  downloadUrl?: string
  expiryDate?: string
  description?: string
}) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    // Check if code already exists
    const existing = await vouchersCollection.findOne({ code: data.code.toUpperCase() })
    if (existing) {
      throw new Error("Voucher code sudah ada")
    }

    // Validate discount value
    if (data.discountType === "percentage") {
      if (data.discountValue < 0 || data.discountValue > 100) {
        throw new Error("Persentase diskon harus antara 0-100")
      }
    } else if (data.discountValue < 0) {
      throw new Error("Nominal diskon tidak boleh negatif")
    }

    if (!data.downloadUrl && data.discountValue <= 0) {
      throw new Error("Nilai diskon harus lebih besar dari 0 atau berikan link unduhan")
    }

    const voucher: Voucher = {
      code: data.code.toUpperCase(),
      discountType: data.discountType,
      discountValue: data.discountValue,
      maxUses: data.maxUses,
      currentUses: 0,
      minimumPurchase: data.minimumPurchase,
      downloadUrl: data.downloadUrl?.trim() || undefined,
      expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
      active: true,
      createdAt: new Date(),
      description: data.description,
    }

    const result = await vouchersCollection.insertOne(voucher)

    return {
      success: true,
      message: "Voucher berhasil dibuat",
      voucherId: result.insertedId,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal membuat voucher",
    }
  }
}

// Claim voucher (user)
export async function claimVoucher(data: { userIdentifier: string; code: string }) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")
    const userVouchersCollection = db.collection<UserVoucher>("userVouchers")

    // Find voucher
    const voucher = await vouchersCollection.findOne({
      code: data.code.toUpperCase(),
      active: true,
    })

    if (!voucher) {
      throw new Error("Voucher tidak ditemukan atau tidak aktif")
    }

    // Check if voucher is expired
    if (voucher.expiryDate && new Date() > voucher.expiryDate) {
      throw new Error("Voucher sudah expired")
    }

    // Check max uses
    if (voucher.maxUses && voucher.currentUses >= voucher.maxUses) {
      throw new Error("Voucher telah mencapai batas penggunaan maksimal")
    }

    // Check if user already claimed this voucher
    const alreadyClaimed = await userVouchersCollection.findOne({
      userId: data.userIdentifier,
      code: data.code.toUpperCase(),
    })

    if (alreadyClaimed) {
      throw new Error("Username yang digunakan sudah pernah claim voucher ini, ubah dengan Username lain")
    }

    // Add to user vouchers
    const userVoucher: UserVoucher = {
      userId: data.userIdentifier,
      voucherId: voucher._id!,
      code: data.code.toUpperCase(),
      claimedAt: new Date(),
      used: false,
    }

    await userVouchersCollection.insertOne(userVoucher)

    return {
      success: true,
      message: "Voucher berhasil di-claim!",
      voucher: {
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minimumPurchase: voucher.minimumPurchase,
        downloadUrl: voucher.downloadUrl,
        description: voucher.description,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal claim voucher",
    }
  }
}

// Get user vouchers
export async function getUserVouchers(userIdentifier: string) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const userVouchersCollection = db.collection<UserVoucher>("userVouchers")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    const userVouchers = await userVouchersCollection
      .find({ userId: userIdentifier, used: false })
      .toArray()

    const vouchersWithDetails = await Promise.all(
      userVouchers.map(async (uv) => {
        const voucher = await vouchersCollection.findOne({ _id: uv.voucherId })
        return {
          ...uv,
          voucherDetails: voucher,
        }
      })
    )

    return {
      success: true,
      data: vouchersWithDetails,
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengambil voucher",
      data: [],
    }
  }
}

// Validate and get voucher details for checkout
export async function validateVoucher(code: string) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    const voucher = await vouchersCollection.findOne({
      code: code.toUpperCase(),
      active: true,
    })

    if (!voucher) {
      throw new Error("Voucher tidak ditemukan atau tidak aktif")
    }

    // Check if voucher is expired
    if (voucher.expiryDate && new Date() > voucher.expiryDate) {
      throw new Error("Voucher sudah expired")
    }

    // Check max uses
    if (voucher.maxUses && voucher.currentUses >= voucher.maxUses) {
      throw new Error("Voucher telah mencapai batas penggunaan maksimal")
    }

    return {
      success: true,
      voucher: {
        code: voucher.code,
        discountType: voucher.discountType,
        discountValue: voucher.discountValue,
        minimumPurchase: voucher.minimumPurchase,
        downloadUrl: voucher.downloadUrl,
        description: voucher.description,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal validasi voucher",
    }
  }
}

// Mark voucher as used
export async function markVoucherAsUsed(userIdentifier: string | undefined, code: string) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const userVouchersCollection = db.collection<UserVoucher>("userVouchers")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    const codeUpper = code.toUpperCase()
    let query: any = {
      code: codeUpper,
      used: false,
    }

    if (userIdentifier) {
      query.userId = userIdentifier
    }

    let result = await userVouchersCollection.updateOne(
      query,
      {
        $set: { used: true, usedAt: new Date() },
      }
    )

    if (result.modifiedCount === 0 && userIdentifier) {
      result = await userVouchersCollection.updateOne(
        {
          code: codeUpper,
          used: false,
        },
        {
          $set: { used: true, usedAt: new Date() },
        }
      )
    }

    const voucherUpdateResult = await vouchersCollection.updateOne(
      { code: codeUpper, active: true },
      { $inc: { currentUses: 1 } }
    )

    if (voucherUpdateResult.matchedCount === 0) {
      throw new Error("Voucher tidak ditemukan")
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menandai voucher terpakai",
    }
  }
}

// Get all vouchers with pagination and filters
export async function getAllVouchers(
  page: number = 1,
  limit: number = 10,
  filters?: {
    status?: "active" | "inactive" | "expired"
    search?: string
  }
) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    // Build filter query
    let query: any = {}

    if (filters?.search) {
      query.code = { $regex: filters.search.toUpperCase(), $options: "i" }
    }

    if (filters?.status === "active") {
      query.active = true
      query.$expr = {
        $or: [
          { $eq: [{ $type: "$expiryDate" }, "missing"] },
          { $gte: ["$expiryDate", new Date()] },
        ],
      }
    } else if (filters?.status === "inactive") {
      query.active = false
    } else if (filters?.status === "expired") {
      query.$expr = {
        $and: [{ $ne: [{ $type: "$expiryDate" }, "missing"] }, { $lt: ["$expiryDate", new Date()] }],
      }
    }

    // Count total
    const total = await vouchersCollection.countDocuments(query)

    // Fetch paginated results
    const skip = (page - 1) * limit
    const vouchers = await vouchersCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    return {
      success: true,
      data: vouchers.map((v) => ({
        ...v,
        _id: v._id?.toString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengambil voucher",
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }
  }
}

// Get voucher by ID
export async function getVoucherById(voucherId: string) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    const voucher = await vouchersCollection.findOne({
      _id: new ObjectId(voucherId),
    })

    if (!voucher) {
      throw new Error("Voucher tidak ditemukan")
    }

    return {
      success: true,
      data: {
        ...voucher,
        _id: voucher._id?.toString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengambil voucher",
    }
  }
}

// Update voucher
export async function updateVoucher(
  voucherId: string,
  data: {
    discountValue?: number
    maxUses?: number | null
    minimumPurchase?: number | null
    downloadUrl?: string | null
    expiryDate?: string | null
    description?: string
    active?: boolean
  }
) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    const updateData: any = {}

    if (data.discountValue !== undefined) {
      updateData.discountValue = data.discountValue
    }
    if (data.maxUses !== undefined) {
      updateData.maxUses = data.maxUses
    }
    if (data.expiryDate !== undefined) {
      updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null
    }
    if (data.description !== undefined) {
      updateData.description = data.description
    }
    if (data.minimumPurchase !== undefined) {
      updateData.minimumPurchase = data.minimumPurchase
    }
    if (data.downloadUrl !== undefined) {
      updateData.downloadUrl = data.downloadUrl?.trim() ? data.downloadUrl.trim() : null
    }
    if (data.active !== undefined) {
      updateData.active = data.active
    }

    const result = await vouchersCollection.updateOne(
      { _id: new ObjectId(voucherId) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      throw new Error("Voucher tidak ditemukan")
    }

    return {
      success: true,
      message: "Voucher berhasil diperbarui",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengupdate voucher",
    }
  }
}

// Deactivate voucher
export async function deactivateVoucher(voucherId: string) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    const result = await vouchersCollection.updateOne(
      { _id: new ObjectId(voucherId) },
      { $set: { active: false } }
    )

    if (result.matchedCount === 0) {
      throw new Error("Voucher tidak ditemukan")
    }

    return {
      success: true,
      message: "Voucher berhasil dinonaktifkan",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menonaktifkan voucher",
    }
  }
}

// Activate voucher
export async function activateVoucher(voucherId: string) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")

    const result = await vouchersCollection.updateOne(
      { _id: new ObjectId(voucherId) },
      { $set: { active: true } }
    )

    if (result.matchedCount === 0) {
      throw new Error("Voucher tidak ditemukan")
    }

    return {
      success: true,
      message: "Voucher berhasil diaktifkan",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengaktifkan voucher",
    }
  }
}

// Delete voucher
export async function deleteVoucher(voucherId: string) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")
    const userVouchersCollection = db.collection<UserVoucher>("userVouchers")

    // Delete related user vouchers first
    await userVouchersCollection.deleteMany({
      voucherId: new ObjectId(voucherId),
    })

    // Delete the voucher
    const result = await vouchersCollection.deleteOne({
      _id: new ObjectId(voucherId),
    })

    if (result.deletedCount === 0) {
      throw new Error("Voucher tidak ditemukan")
    }

    return {
      success: true,
      message: "Voucher berhasil dihapus",
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal menghapus voucher",
    }
  }
}

// Get voucher usage details
export async function getVoucherUsageDetails(voucherId: string) {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const userVouchersCollection = db.collection<UserVoucher>("userVouchers")

    const usageDetails = await userVouchersCollection
      .find({ voucherId: new ObjectId(voucherId) })
      .sort({ claimedAt: -1 })
      .toArray()

    return {
      success: true,
      data: usageDetails.map((u) => ({
        ...u,
        _id: u._id?.toString(),
        voucherId: u.voucherId.toString(),
      })),
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengambil detail penggunaan voucher",
      data: [],
    }
  }
}

// Get voucher statistics
export async function getVoucherStatistics() {
  try {
    const client = await clientPromise
    const db = client.db("pterodactyl")
    const vouchersCollection = db.collection<Voucher>("vouchers")
    const userVouchersCollection = db.collection<UserVoucher>("userVouchers")

    const now = new Date()

    const totalVouchers = await vouchersCollection.countDocuments()
    const activeVouchers = await vouchersCollection.countDocuments({
      active: true,
      $expr: {
        $or: [
          { $eq: [{ $type: "$expiryDate" }, "missing"] },
          { $gte: ["$expiryDate", now] },
        ],
      },
    })
    const expiredVouchers = await vouchersCollection.countDocuments({
      $expr: {
        $and: [
          { $ne: [{ $type: "$expiryDate" }, "missing"] },
          { $lt: ["$expiryDate", now] },
        ],
      },
    })
    const inactiveVouchers = await vouchersCollection.countDocuments({
      active: false,
    })

    const totalClaims = await userVouchersCollection.countDocuments()
    const totalUsed = await userVouchersCollection.countDocuments({ used: true })
    const totalUnused = await userVouchersCollection.countDocuments({ used: false })

    return {
      success: true,
      data: {
        vouchers: {
          total: totalVouchers,
          active: activeVouchers,
          expired: expiredVouchers,
          inactive: inactiveVouchers,
        },
        usage: {
          totalClaims,
          totalUsed,
          totalUnused,
          conversionRate: totalClaims > 0 ? ((totalUsed / totalClaims) * 100).toFixed(2) : "0",
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Gagal mengambil statistik voucher",
      data: null,
    }
  }
  }

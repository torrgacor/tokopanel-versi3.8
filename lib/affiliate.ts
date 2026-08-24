import clientPromise from "./mongodb"
import { appConfig } from "@/data/config"
import { ObjectId } from "mongodb"

// Interface dan helper untuk koleksi Affiliate
export interface AffiliateProfile {
  _id?: any
  userId: string
  storeName: string
  email?: string
  ownerName?: string
  status: "active" | "suspended" | "pending"
  wallet: {
    balance: number
    pending: number
  }
  referralStats?: {
    clicks?: number
    conversions?: number
    totalCommission?: number
    successfulTransactions?: number
  }
  levelId?: string | null
  levelName?: string | null
  levelThreshold?: number | null
  levelCommissionPercent?: number | null
  createdAt: Date
  updatedAt?: Date
}

export interface AffiliatePackagePrice {
  _id?: any
  affiliateId: string
  packageId: string
  markupAmount: number
  finalPrice: number
  updatedAt: Date
}

export interface AffiliateLevel {
  _id?: any
  name: string
  threshold: number
  commissionPercent: number
  sortOrder: number
  createdAt: Date
  updatedAt?: Date
}

export interface WithdrawalRequest {
  _id?: any
  affiliateId: string
  amount: number
  method: string
  accountNumber: string
  accountName: string
  status: "pending" | "approved" | "rejected"
  adminNote?: string
  txId?: string
  proof?: {
    url: string
    fileName?: string
  } | null
  createdAt: Date
  processedAt?: Date
}

function parseCommissionRate(value?: string | number) {
  if (value === undefined || value === null || value === "") return 0.15

  const numericValue = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numericValue)) return 0.15

  return numericValue > 1 ? numericValue / 100 : numericValue
}

export const RESELLER_COMMISSION_RATE = parseCommissionRate(process.env.RESELLER_COMMISSION_RATE)

const SETTING_KEY_KOMISI = "affiliate_commission_percent"

export interface AppSetting {
  _id?: any
  key: string
  value: number
  updatedAt: Date
}

export async function getCollections() {
  const client = await clientPromise
  const db = client.db(appConfig.mongodb.dbName)
  return {
    affiliateProfiles: db.collection<AffiliateProfile>("affiliate_profiles"),
    affiliatePackagePrices: db.collection<AffiliatePackagePrice>("affiliate_package_prices"),
    withdrawalRequests: db.collection<WithdrawalRequest>("withdrawal_requests"),
    affiliateTransactions: db.collection<any>("affiliate_transactions"),
    appSettings: db.collection<AppSetting>("app_settings"),
    affiliateLevels: db.collection<AffiliateLevel>("affiliate_levels"),
  }
}

const DEFAULT_RESELLER_LEVELS: Array<Omit<AffiliateLevel, "_id" | "createdAt" | "updatedAt">> = [
  { name: "Bronze", threshold: 0, commissionPercent: 10, sortOrder: 1 },
  { name: "Silver", threshold: 20, commissionPercent: 15, sortOrder: 2 },
  { name: "Gold", threshold: 50, commissionPercent: 20, sortOrder: 3 },
]

async function ensureDefaultAffiliateLevels() {
  const { affiliateLevels } = await getCollections()
  const existingCount = await affiliateLevels.countDocuments()
  if (existingCount > 0) {
    return
  }

  await affiliateLevels.insertMany(
    DEFAULT_RESELLER_LEVELS.map((level) => ({
      ...level,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  )
}

export async function getAffiliateLevels(): Promise<AffiliateLevel[]> {
  await ensureDefaultAffiliateLevels()
  const { affiliateLevels } = await getCollections()
  return affiliateLevels.find({}).sort({ threshold: 1, sortOrder: 1 }).toArray()
}

export async function createAffiliateLevel(input: { name: string; threshold: number; commissionPercent: number }) {
  const normalizedName = input.name?.trim()
  const threshold = Math.max(0, Math.round(Number(input.threshold || 0)))
  const commissionPercent = Math.max(0, Math.min(100, Math.round(Number(input.commissionPercent || 0))))

  if (!normalizedName) {
    throw new Error("Nama level wajib diisi")
  }

  const { affiliateLevels } = await getCollections()
  const existing = await affiliateLevels.findOne({ name: { $regex: new RegExp(`^${normalizedName}$`, "i") } })
  if (existing) {
    throw new Error("Nama level sudah ada")
  }

  const highestOrder = await affiliateLevels.find({}).sort({ sortOrder: -1 }).limit(1).next()
  const sortOrder = (highestOrder?.sortOrder ?? 0) + 1

  const level: AffiliateLevel = {
    name: normalizedName,
    threshold,
    commissionPercent,
    sortOrder,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  const result = await affiliateLevels.insertOne(level)
  await resyncAllAffiliateLevels()
  return { ...level, _id: result.insertedId }
}

export async function updateAffiliateLevel(levelId: string, input: Partial<{ name: string; threshold: number; commissionPercent: number }>) {
  const { affiliateLevels } = await getCollections()
  const update: Record<string, any> = { updatedAt: new Date() }

  if (input.name !== undefined) {
    const normalizedName = input.name?.trim()
    if (!normalizedName) {
      throw new Error("Nama level wajib diisi")
    }
    update.name = normalizedName
  }

  if (input.threshold !== undefined) {
    update.threshold = Math.max(0, Math.round(Number(input.threshold)))
  }

  if (input.commissionPercent !== undefined) {
    update.commissionPercent = Math.max(0, Math.min(100, Math.round(Number(input.commissionPercent))))
  }

  const query = ObjectId.isValid(levelId) ? { _id: new ObjectId(levelId) } : { _id: levelId }
  const result = await affiliateLevels.findOneAndUpdate(query, { $set: update }, { returnDocument: "after" })
  if (!result.value) {
    throw new Error("Level tidak ditemukan")
  }

  await resyncAllAffiliateLevels()

  return result.value
}

export async function deleteAffiliateLevel(levelId: string) {
  const { affiliateLevels } = await getCollections()
  const query = ObjectId.isValid(levelId) ? { _id: new ObjectId(levelId) } : { _id: levelId }
  const level = await affiliateLevels.findOne(query)
  if (!level) {
    throw new Error("Level tidak ditemukan")
  }

  await affiliateLevels.deleteOne(query)
  await resyncAllAffiliateLevels()

  return { success: true }
}

export async function resyncAllAffiliateLevels() {
  const { affiliateProfiles } = await getCollections()
  const levels = await getAffiliateLevels()
  const affiliates = await affiliateProfiles.find({}, { projection: { userId: 1, referralStats: 1 } }).toArray()

  await Promise.all(
    affiliates.map((affiliate) => {
      const count =
        affiliate.referralStats?.conversions ?? affiliate.referralStats?.successfulTransactions ?? 0
      const selectedLevel = resolveAffiliateLevel(count, levels)

      return affiliateProfiles.updateOne(
        { userId: affiliate.userId },
        {
          $set: {
            levelId: selectedLevel?._id?.toString?.() ?? null,
            levelName: selectedLevel?.name ?? null,
            levelThreshold: selectedLevel?.threshold ?? null,
            levelCommissionPercent: selectedLevel?.commissionPercent ?? null,
            updatedAt: new Date(),
          },
        }
      )
    })
  )

  return { success: true, affected: affiliates.length }
}

function resolveAffiliateLevel(transactionCount: number, levels: AffiliateLevel[]) {
  const sortedLevels = [...levels].sort((a, b) => a.threshold - b.threshold)
  let selectedLevel: AffiliateLevel | null = null

  for (const level of sortedLevels) {
    if (transactionCount >= level.threshold) {
      selectedLevel = level
    }
  }

  return selectedLevel
}

export async function getActiveAffiliateLevel(affiliateId: string) {
  const { affiliateProfiles } = await getCollections()
  const affiliate = await affiliateProfiles.findOne({ userId: affiliateId })
  const count = affiliate?.referralStats?.conversions ?? affiliate?.referralStats?.successfulTransactions ?? 0
  const levels = await getAffiliateLevels()
  const level = resolveAffiliateLevel(count, levels)
  return { level, count, levels }
}

export async function syncAffiliateLevel(affiliateId: string, transactionCount?: number, session?: any) {
  const { affiliateProfiles } = await getCollections()
  const affiliate = await affiliateProfiles.findOne({ userId: affiliateId })
  if (!affiliate) {
    return null
  }

  const count = transactionCount ?? affiliate.referralStats?.conversions ?? affiliate.referralStats?.successfulTransactions ?? 0
  const levels = await getAffiliateLevels()
  const selectedLevel = resolveAffiliateLevel(count, levels)

  const update: Record<string, any> = {
    updatedAt: new Date(),
    levelId: selectedLevel?._id?.toString?.() ?? null,
    levelName: selectedLevel?.name ?? null,
    levelThreshold: selectedLevel?.threshold ?? null,
    levelCommissionPercent: selectedLevel?.commissionPercent ?? null,
  }

  await affiliateProfiles.updateOne({ userId: affiliateId }, { $set: update }, session ? { session } : undefined)
  return { ...update, transactionCount: count }
}

export async function getAffiliateLevelProgress(affiliateId: string) {
  const { affiliateProfiles, affiliateLevels } = await getCollections()
  const affiliate = await affiliateProfiles.findOne({ userId: affiliateId })
  if (!affiliate) {
    throw new Error("Affiliate tidak ditemukan")
  }

  const count = affiliate.referralStats?.conversions ?? affiliate.referralStats?.successfulTransactions ?? 0
  const levels = await getAffiliateLevels()
  const sortedLevels = [...levels].sort((a, b) => a.threshold - b.threshold)
  const currentLevel = resolveAffiliateLevel(count, sortedLevels)
  const nextLevel = sortedLevels.find((level) => level.threshold > (currentLevel?.threshold ?? -1)) ?? null
  const activeCommissionPercent = currentLevel?.commissionPercent ?? (await getAffiliateCommissionPercent())

  if (!nextLevel) {
    return {
      success: true,
      currentLevel: currentLevel ? { name: currentLevel.name, threshold: currentLevel.threshold, commissionPercent: currentLevel.commissionPercent } : null,
      nextLevel: null,
      currentCount: count,
      targetThreshold: null,
      progressPercent: 100,
      remainingTransactions: 0,
      activeCommissionPercent,
      levels: sortedLevels.map((l) => ({ name: l.name, threshold: l.threshold, commissionPercent: l.commissionPercent })),
      message: currentLevel ? `Anda sudah berada di level ${currentLevel.name}` : "Belum ada level yang aktif",
    }
  }

  const remainingTransactions = Math.max(0, nextLevel.threshold - count)
  const progressPercent = nextLevel.threshold <= 0 ? 100 : Math.min(100, Math.round((count / nextLevel.threshold) * 100))
  
  return {
    success: true,
    currentLevel: currentLevel ? { name: currentLevel.name, threshold: currentLevel.threshold, commissionPercent: currentLevel.commissionPercent } : null,
    nextLevel: { name: nextLevel.name, threshold: nextLevel.threshold, commissionPercent: nextLevel.commissionPercent },
    currentCount: count,
    targetThreshold: nextLevel.threshold,
    progressPercent,
    remainingTransactions,
    activeCommissionPercent,
    levels: sortedLevels.map((l) => ({ name: l.name, threshold: l.threshold, commissionPercent: l.commissionPercent })),
    message: `Anda sudah mencapai ${count}/${nextLevel.threshold} transaksi untuk naik ke level ${nextLevel.name}`,
  }
}

export async function getAffiliateCommissionPercent(): Promise<number> {
  try {
    const { appSettings } = await getCollections()
    const setting = await appSettings.findOne({ key: SETTING_KEY_KOMISI })
    if (setting && Number.isFinite(setting.value)) {
      return setting.value
    }
  } catch (error) {
    console.error("getAffiliateCommissionPercent error:", error)
  }

  return RESELLER_COMMISSION_RATE * 100
}

export async function setAffiliateCommissionPercent(percent: number) {
  const clamped = Math.min(100, Math.max(0, Number(percent)))
  const { appSettings } = await getCollections()

  await appSettings.updateOne(
    { key: SETTING_KEY_KOMISI },
    { $set: { key: SETTING_KEY_KOMISI, value: clamped, updatedAt: new Date() } },
    { upsert: true }
  )

  return clamped
}

export async function calculateAffiliateCommission(amount: number, affiliateId?: string) {
  let percent: number | null = null

  if (affiliateId) {
    const { level } = await getActiveAffiliateLevel(affiliateId)
    if (level) {
      percent = level.commissionPercent
    }
  }

  if (percent === null) {
    percent = await getAffiliateCommissionPercent()
  }

  const rate = percent / 100
  return Math.max(0, Math.round(amount * rate))
}

const SETTING_KEY_MIN_WITHDRAW = "affiliate_min_withdraw"

function parseDefaultMinWithdraw() {
  const numericValue = Number(process.env.RESELLER_MIN_WITHDRAW)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 50000
}

export const RESELLER_MIN_WITHDRAW_DEFAULT = parseDefaultMinWithdraw()

export async function getAffiliateMinWithdraw(): Promise<number> {
  try {
    const { appSettings } = await getCollections()
    const setting = await appSettings.findOne({ key: SETTING_KEY_MIN_WITHDRAW })
    if (setting && Number.isFinite(setting.value) && setting.value > 0) {
      return setting.value
    }
  } catch (error) {
    console.error("getAffiliateMinWithdraw error:", error)
  }

  return RESELLER_MIN_WITHDRAW_DEFAULT
}

export async function setAffiliateMinWithdraw(amount: number) {
  const clamped = Math.max(0, Math.round(Number(amount)))
  const { appSettings } = await getCollections()

  await appSettings.updateOne(
    { key: SETTING_KEY_MIN_WITHDRAW },
    { $set: { key: SETTING_KEY_MIN_WITHDRAW, value: clamped, updatedAt: new Date() } },
    { upsert: true }
  )

  return clamped
}

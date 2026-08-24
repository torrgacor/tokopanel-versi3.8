"use server"

import { calculateFee, generateTransactionId, calculateDiscount, formatRupiah, calculateDurationAdjustedPrice } from "@/lib/utils"
import { plans } from "@/data/plans"
import { Pterodactyl, EggOption } from "@/lib/pterodactyl"
import { revalidatePath } from "next/cache"
import clientPromise from "@/lib/mongodb"
import { appConfig } from "@/data/config"
import type { ObjectId } from "mongodb"
import crypto from "crypto"
import { validateVoucher, markVoucherAsUsed, type Voucher } from "@/app/actions/voucher-actions"

const SAKURU_API_URL = "https://sakurupiah.id/api/create.php"

export interface PaymentData {
  _id?: ObjectId
  transactionId: string
  vpediaId: string
  planId: string
  username: string
  email: string
  serverType: "public" | "private"
  accessType: "regular" | "admin"
  amount: number
  fee: number
  total: number
  qrImageUrl: string
  expirationTime: string
  status: "pending" | "paid" | "completed" | "failed" | "expired"
  selectedEggId?: number
  voucherCode?: string
  voucherDownloadUrl?: string
  discountType?: "percentage" | "nominal"
  discountValue?: number
  discountAmount?: number
  quantity: number
  durationDays?: number
  referralCode?: string
  panelDetails?: {
    username: string
    password: string
    serverId: number
  }
  panelUserId?: number
  panelServerIds?: number[]
  expiresAt?: string
  reminderSent?: boolean
  expiredProcessed?: boolean
  isRenewal?: boolean
  renewalForTransactionId?: string
  renewalDays?: 15 | 30
}

export async function createPayment(data: {
  planId: string
  username: string
  email: string
  serverType: "public" | "private"
  accessType: "regular" | "admin"
  selectedEggId: number | null
  voucherCode?: string
  quantity: number
  durationDays?: number
  referralCode?: string
}) {
  try {
    const { planId, username, email, serverType, accessType, quantity = 1 } = data
    const durationDays = [15, 30, 45].includes(data.durationDays ?? 30) ? (data.durationDays ?? 30) : 30

    const SAKURU_API_ID = appConfig.pay.api_id
    const SAKURU_API_KEY = appConfig.pay.api_key
    if (!SAKURU_API_ID || !SAKURU_API_KEY) {
      throw new Error("Sakurupiah API credentials belum disetel")
    }

    let eggPrice = 0
    if (data.selectedEggId) {
      const pterodactylAccessType = accessType === "admin" ? "admin" : "reguler"
      const pterodactyl = new Pterodactyl(serverType, pterodactylAccessType)
      const eggs = await pterodactyl.getEggs()
      const selectedEgg = eggs.find((e) => e.id === data.selectedEggId)
      eggPrice = selectedEgg?.harga || 0
    }
      
    const plan = plans.find((p) => p.id === planId)
    if (!plan) throw new Error("Plan tidak ditemukan")

    /** validasi tambahan (safety) */
    if (plan.type !== serverType || plan.access !== accessType) {
      throw new Error("Plan tidak sesuai dengan tipe server atau akses")
    }

    const adjustedPlanPrice = calculateDurationAdjustedPrice(plan.price, durationDays)
    const basePrice = (adjustedPlanPrice + eggPrice) * quantity 
    
    // Handle voucher if provided
    let discountAmount = 0
    let discountType: "percentage" | "nominal" | undefined
    let discountValue: number | undefined
    let voucherCode: string | undefined
    let voucherDownloadUrl: string | undefined

    if (data.voucherCode) {
      const voucherValidation = await validateVoucher(data.voucherCode)
      if (voucherValidation.success && voucherValidation.voucher) {
        const voucher = voucherValidation.voucher
        voucherCode = voucher.code
        voucherDownloadUrl = voucher.downloadUrl
        if (voucher.minimumPurchase && basePrice < voucher.minimumPurchase) {
          throw new Error(`Voucher ini berlaku untuk pembelian minimal ${formatRupiah(voucher.minimumPurchase)}`)
        }
        discountType = voucher.discountType
        discountValue = voucher.discountValue
        discountAmount = calculateDiscount(basePrice, discountType, discountValue)
      } else {
        throw new Error(`Voucher tidak valid: ${voucherValidation.message}`)
      }
    }
    
    const nominal = Math.max(0, basePrice - discountAmount)
    const transactionId = generateTransactionId()
    const method = "QRIS2"
    const internalFee = calculateFee(nominal)
    const paymentAmount = nominal + internalFee

    const signature = crypto
      .createHmac("sha256", SAKURU_API_KEY)
      .update(SAKURU_API_ID + method + transactionId + paymentAmount)
      .digest("hex")

    const bodyData = new URLSearchParams()
    bodyData.append("api_id", SAKURU_API_ID)
    bodyData.append("method", method)
    bodyData.append("name", username)
    bodyData.append("email", email)
    bodyData.append("phone", "6280000000000")
    bodyData.append("amount", paymentAmount.toString())
    bodyData.append("merchant_fee", "2")
    bodyData.append("merchant_ref", transactionId)
    bodyData.append("expired", "24")
    bodyData.append("produk[]", plan.name)
    bodyData.append("qty[]", quantity.toString())
    bodyData.append("harga[]", basePrice.toString())
    bodyData.append(
      "callback_url",
      "https://panelshopv3.mts4you.biz.id/callback"
    )
    bodyData.append(
      "return_url",
      `https://panelshopv3.mts4you.biz.id/invoice/${transactionId}`
    )
    bodyData.append("signature", signature)

    const response = await fetch(SAKURU_API_URL, {
      method: "POST",
      body: bodyData,
      headers: {
        Authorization: `Bearer ${SAKURU_API_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    const raw = await response.text()

    let json: any
    try {
      json = JSON.parse(raw)
    } catch {
      console.error("Sakurupiah NON-JSON:", raw)
      throw new Error("API Sakurupiah tidak mengembalikan JSON")
    }

    if (json.status !== "200") {
      throw new Error(json.message || "Gagal membuat invoice")
    }

    const pay = json.data[0]

    const paymentData: PaymentData = {
      transactionId,
      vpediaId: pay.trx_id,
      planId,
      username,
      email,
      serverType,
      accessType,
      amount: nominal,
      fee: pay.fee + internalFee,
      total: pay.total,
      qrImageUrl: pay.qr,
      expirationTime: new Date(pay.expired).toISOString(),
      status: pay.payment_status === "pending" ? "pending" : "failed",
      createdAt: new Date().toISOString(),
      selectedEggId: data.selectedEggId ?? null,
      voucherCode: data.voucherCode,
      voucherDownloadUrl,
      quantity,
      referralCode: data.referralCode,
      discountType,
      discountValue,
      discountAmount,
      durationDays,
    }

    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)

    await db.collection<PaymentData>("payments").insertOne(paymentData)

    revalidatePath(`/invoice/${transactionId}`)

    return { success: true, transactionId }
  } catch (error) {
    console.error("Error createPayment:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Terjadi kesalahan",
    }
  }
}

export async function getPayment(
  transactionId: string
): Promise<PaymentData | null> {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    return (await db
      .collection("payments")
      .findOne({ transactionId })) as PaymentData | null
  } catch (error) {
    console.error("Error getPayment:", error)
    return null
  }
}

export async function createRenewalPayment(data: {
  transactionId: string
  email: string
  renewalDays: 15 | 30
}) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const originalPayment = await db.collection<PaymentData>("payments").findOne({
      transactionId: data.transactionId.trim(),
      status: "completed",
    })

    if (!originalPayment || originalPayment.email.trim().toLowerCase() !== data.email.trim().toLowerCase()) {
      return { success: false, error: "Transaksi tidak ditemukan, email tidak cocok, atau panel sudah expired" }
    }

    const expiresAt = originalPayment.expiresAt ? new Date(originalPayment.expiresAt).getTime() : 0
    const remainingMs = expiresAt - Date.now()
    if (!expiresAt || remainingMs <= 0) {
      return { success: false, error: "Panel sudah expired dan tidak dapat diperpanjang melalui transaksi ini" }
    }
    if (remainingMs > 2 * 24 * 60 * 60 * 1000) {
      return { success: false, error: "Perpanjangan hanya dapat dilakukan saat masa aktif tersisa maksimal 2 hari" }
    }

    const plan = plans.find((item) => item.id === originalPayment.planId)
    if (!plan) return { success: false, error: "Paket transaksi tidak ditemukan" }

    const basePrice = Math.round(plan.price * (originalPayment.quantity || 1) * (data.renewalDays === 15 ? 0.5 : 1))
    const internalFee = calculateFee(basePrice)
    const paymentAmount = basePrice + internalFee
    const transactionId = generateTransactionId()
    const method = "QRIS2"
    const apiId = appConfig.pay.api_id
    const apiKey = appConfig.pay.api_key

    if (!apiId || !apiKey) throw new Error("Sakurupiah API credentials belum disetel")

    const signature = crypto.createHmac("sha256", apiKey)
      .update(apiId + method + transactionId + paymentAmount)
      .digest("hex")
    const bodyData = new URLSearchParams()
    bodyData.append("api_id", apiId)
    bodyData.append("method", method)
    bodyData.append("name", originalPayment.username)
    bodyData.append("email", originalPayment.email)
    bodyData.append("phone", "6280000000000")
    bodyData.append("amount", paymentAmount.toString())
    bodyData.append("merchant_fee", "2")
    bodyData.append("merchant_ref", transactionId)
    bodyData.append("expired", "24")
    bodyData.append("produk[]", `${plan.name} - Perpanjangan ${data.renewalDays} Hari`)
    bodyData.append("qty[]", "1")
    bodyData.append("harga[]", basePrice.toString())
    bodyData.append("callback_url", "https://panelshopv3.mts4you.biz.id/callback")
    bodyData.append("return_url", `https://panelshopv3.mts4you.biz.id/invoice/${transactionId}`)
    bodyData.append("signature", signature)

    const response = await fetch("https://sakurupiah.id/api/create.php", {
      method: "POST",
      body: bodyData,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    })
    const raw = await response.text()
    let json: any
    try {
      json = JSON.parse(raw)
    } catch {
      throw new Error("API Sakurupiah tidak mengembalikan JSON")
    }
    if (json.status !== "200") throw new Error(json.message || "Gagal membuat invoice perpanjangan")

    const pay = json.data[0]
    await db.collection<PaymentData>("payments").insertOne({
      transactionId,
      vpediaId: pay.trx_id,
      planId: originalPayment.planId,
      username: originalPayment.username,
      email: originalPayment.email,
      serverType: originalPayment.serverType,
      accessType: originalPayment.accessType,
      amount: basePrice,
      fee: pay.fee + internalFee,
      total: pay.total,
      qrImageUrl: pay.qr,
      expirationTime: new Date(pay.expired).toISOString(),
      status: pay.payment_status === "pending" ? "pending" : "failed",
      createdAt: new Date().toISOString(),
      quantity: 1,
      durationDays: data.renewalDays,
      isRenewal: true,
      renewalForTransactionId: originalPayment.transactionId,
      renewalDays: data.renewalDays,
      panelUserId: originalPayment.panelUserId,
      panelServerIds: originalPayment.panelServerIds,
    })

    return { success: true, transactionId }
  } catch (error) {
    console.error("Error createRenewalPayment:", error)
    return { success: false, error: error instanceof Error ? error.message : "Terjadi kesalahan" }
  }
}

export async function updatePaymentStatus(
  transactionId: string,
  status: "pending" | "paid" | "completed" | "failed" | "expired",
  panelDetails?: {
    username: string
    password: string
    serverId: number
  },
  extra?: {
    panelUserId?: number
    panelServerIds?: number[]
    expiresAt?: string
  }
): Promise<boolean> {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)

    const updateData: Partial<PaymentData> = { status }
    if (panelDetails) updateData.panelDetails = panelDetails
    if (extra?.panelUserId !== undefined) updateData.panelUserId = extra.panelUserId
    if (extra?.panelServerIds !== undefined) updateData.panelServerIds = extra.panelServerIds
    if (extra?.expiresAt !== undefined) updateData.expiresAt = extra.expiresAt

    const result = await db
      .collection("payments")
      .updateOne({ transactionId }, { $set: updateData })

    if (result.matchedCount > 0) {
      revalidatePath(`/invoice/${transactionId}`)
      return true
    }
    return false
  } catch (error) {
    console.error("Error updatePaymentStatus:", error)
    return false
  }
  }

"use server"

import clientPromise from "@/lib/mongodb"
import { appConfig } from "@/data/config"
import { sendEmail } from "@/lib/email-service"
import { sendTelegramAdminMessage } from "@/lib/telegram-service"
import { syncAffiliateLevel } from "@/lib/affiliate"
import crypto from "crypto"

export interface RegisterAffiliateInput {
  storeName: string
  email: string
  ownerName: string
  phoneNumber: string
  withdrawMethod: string
  accountNumber: string
  accountName: string
}

export async function registerAffiliate(input: RegisterAffiliateInput) {
  try {
    // Validate input
    if (!input.storeName?.trim()) {
      return { success: false, error: "Nama toko harus diisi" }
    }
    if (!input.email?.trim()) {
      return { success: false, error: "Email harus diisi" }
    }
    if (!input.ownerName?.trim()) {
      return { success: false, error: "Nama pemilik harus diisi" }
    }
    if (!input.phoneNumber?.trim()) {
      return { success: false, error: "Nomor telepon harus diisi" }
    }
    if (!input.withdrawMethod?.trim()) {
      return { success: false, error: "Metode withdraw harus dipilih" }
    }
    if (!input.accountNumber?.trim()) {
      return { success: false, error: "Nomor akun harus diisi" }
    }
    if (!input.accountName?.trim()) {
      return { success: false, error: "Nama akun harus diisi" }
    }

    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const affiliateProfiles = db.collection("affiliate_profiles")

    // Check if email already exists
    const existing = await affiliateProfiles.findOne({ email: input.email })
    if (existing) {
      return { success: false, error: "Email sudah terdaftar sebagai affiliate" }
    }

    // Generate unique userId and referral code
    const userId = `affiliate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const referralCode = generateReferralCode()

    // Create affiliate profile
    const affiliateData = {
      userId,
      storeName: input.storeName,
      email: input.email,
      ownerName: input.ownerName,
      phoneNumber: input.phoneNumber,
      withdrawMethod: input.withdrawMethod,
      accountNumber: input.accountNumber,
      accountName: input.accountName,
      referralCode,
      status: "pending" as const,
      wallet: {
        balance: 0,
        pending: 0,
      },
      referralStats: {
        clicks: 0,
        conversions: 0,
        successfulTransactions: 0,
        totalCommission: 0,
      },
      levelName: "Bronze",
      levelThreshold: 0,
      levelCommissionPercent: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await affiliateProfiles.insertOne(affiliateData)
    await syncAffiliateLevel(userId)

    // Send email to affiliate
    await sendEmail({
      to: input.email,
      subject: "Registrasi Affiliate Berhasil",
      html: `
        <h2>Pendaftaran Affiliate Berhasil!</h2>
        <p>Terima kasih telah mendaftar sebagai affiliate di ${appConfig.nameHost}</p>
        
        <h3>Detail Akun Anda:</h3>
        <ul>
          <li><strong>Nama Toko:</strong> ${input.storeName}</li>
          <li><strong>Email:</strong> ${input.email} (Data Login)</li>
          <li><strong>Nomor Telepon:</strong> ${input.phoneNumber} (Data Login)</li>
          <li><strong>User ID:</strong> ${userId}</li>
          <li><strong>Referral Code:</strong> ${referralCode}</li>
        </ul>
        
        <p>Proses verifikasi biasanya memakan waktu 1×24 jam.</p>
        <p>Untuk pertanyaan, silakan hubungi support kami.</p>
      `,
    })

    // Send notification to admin
    await sendTelegramAdminMessage(
      `🆕 REGISTRASI AFFILIATE BARU\n\nNama Toko: ${input.storeName}\nEmail: ${input.email}\nUser ID: ${userId}\nStatus: Pending Approval\n\nSilakan review di admin panel.`
    )

    return {
      success: true,
      message: "Registrasi berhasil! Tunggu email konfirmasi dari admin.",
      userId,
      referralCode,
    }
  } catch (error) {
    console.error("registerAffiliate error:", error)
    return { success: false, error: "Gagal mendaftar affiliate" }
  }
}

export async function approveAffiliate(userId: string, adminNotes?: string) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const affiliateProfiles = db.collection("affiliate_profiles")

    const result = await affiliateProfiles.findOneAndUpdate(
      { userId },
      {
        $set: {
          status: "active",
          adminNotes,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    )

    if (!result.value) {
      return { success: false, error: "Affiliate tidak ditemukan" }
    }

    // Send email to affiliate
    await sendEmail({
      to: result.value.email,
      subject: "Akun Affiliate Disetujui - Siap Digunakan",
      html: `
        <h2>Selamat! Akun Affiliate Anda Telah Disetujui 🎉</h2>
        <p>Akun affiliate Anda di ${appConfig.nameHost} telah disetujui dan siap digunakan.</p>
        
        <h3>Informasi Akun:</h3>
        <ul>
          <li><strong>Nama Toko:</strong> ${result.value.storeName}</li>
          <li><strong>Referral Code:</strong> ${result.value.referralCode}</li>
          <li><strong>Status:</strong> Active</li>
        </ul>
        
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/affiliate">Klik di sini untuk akses dashboard affiliate Anda</a></p>
      `,
    })

    return { success: true, message: "Affiliate berhasil disetujui" }
  } catch (error) {
    console.error("approveAffiliate error:", error)
    return { success: false, error: "Gagal mengsetujui affiliate" }
  }
}

export async function rejectAffiliate(userId: string, reason?: string) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const affiliateProfiles = db.collection("affiliate_profiles")

    const result = await affiliateProfiles.findOneAndUpdate(
      { userId },
      {
        $set: {
          status: "rejected",
          rejectionReason: reason,
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" }
    )

    if (!result.value) {
      return { success: false, error: "Affiliate tidak ditemukan" }
    }

    // Send email
    await sendEmail({
      to: result.value.email,
      subject: "Pendaftaran Affiliate Ditolak",
      html: `
        <h2>Pendaftaran Affiliate Ditolak</h2>
        <p>Maaf, pendaftaran affiliate Anda telah ditolak.</p>
        ${reason ? `<p><strong>Alasan:</strong> ${reason}</p>` : ""}
        <p>Untuk informasi lebih lanjut, silakan hubungi support kami.</p>
      `,
    })

    return { success: true, message: "Affiliate berhasil ditolak" }
  } catch (error) {
    console.error("rejectAffiliate error:", error)
    return { success: false, error: "Gagal menolak affiliate" }
  }
}

export async function getAffiliateByCode(referralCode: string) {
  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const affiliateProfiles = db.collection("affiliate_profiles")

    const affiliate = await affiliateProfiles.findOne({
      referralCode,
      status: "active",
    })

    if (!affiliate) {
      return { success: false, error: "Referral code tidak valid" }
    }

    return {
      success: true,
      data: {
        userId: affiliate.userId,
        storeName: affiliate.storeName,
        referralCode: affiliate.referralCode,
      },
    }
  } catch (error) {
    console.error("getAffiliateByCode error:", error)
    return { success: false, error: "Gagal memvalidasi referral code" }
  }
}

function generateReferralCode(): string {
  return `ref_${crypto.randomBytes(6).toString("hex").toUpperCase()}`
}

"use server"

import clientPromise from "@/lib/mongodb"
import { calculateAffiliateCommission, getCollections, getAffiliateMinWithdraw, syncAffiliateLevel } from "@/lib/affiliate"
import { plans } from "@/data/plans"
import { appConfig } from "@/data/config"
import { formatRupiah } from "@/lib/utils"
import { sendEmail, sendWithdrawalStatusEmail } from "@/lib/email-service"
import { sendTelegramAdminMessage } from "@/lib/telegram-service"

/**
 * Proses pembelian lewat affiliate.
 * - Menghitung komisi sebagai selisih antara harga jual dan harga dasar admin
 * - Menambahkan komisi ke saldo aktif affiliate secara atomic (transaction)
 */
export async function processAffiliatePurchase({
  transactionId,
  buyerId,
  affiliateId,
  planId,
  amountPaid,
}: {
  transactionId: string
  buyerId: string
  affiliateId: string
  planId: string
  amountPaid: number
}) {
  const client = await clientPromise
  const session = client.startSession()
  try {
    const db = client.db(appConfig.mongodb.dbName)
    const { affiliateProfiles, affiliatePackagePrices, affiliateTransactions } = await getCollections()

    let result: any = null

    await session.withTransaction(async () => {
      // Ambil harga dasar dari konfigurasi paket
      const plan = plans.find((p) => p.id === planId)
      const basePrice = plan ? plan.price : 0

      // Jika affiliate menyimpan harga custom, gunakan finalPrice dari koleksi
      const priceEntry = await affiliatePackagePrices.findOne({ affiliateId, packageId: planId })
      const finalPrice = priceEntry ? priceEntry.finalPrice : amountPaid

      // Komisi affiliate dihitung berdasarkan persentase level affiliate yang aktif
      const commission = await calculateAffiliateCommission(finalPrice, affiliateId)

      // Update wallet & statistik referral secara atomic
      const upd = await affiliateProfiles.findOneAndUpdate(
        { userId: affiliateId },
        {
          $inc: {
            "wallet.balance": commission,
            "referralStats.conversions": 1,
            "referralStats.successfulTransactions": 1,
            "referralStats.totalCommission": commission,
          },
          $set: { updatedAt: new Date() },
        },
        { returnDocument: "after", session }
      )

      // Catat transaksi affiliate
      await affiliateTransactions.insertOne(
        {
          transactionId,
          affiliateId,
          buyerId,
          planId,
          basePrice,
          finalPrice,
          commission,
          createdAt: new Date(),
        },
        { session }
      )

      await syncAffiliateLevel(affiliateId, upd.value?.referralStats?.conversions, session)

      result = { success: true, newWallet: upd.value?.wallet }
    })

    return result
  } catch (error) {
    console.error("processAffiliatePurchase error:", error)
    return { success: false, error: (error as Error).message }
  } finally {
    await session.endSession()
  }
}

/**
 * Affiliate mengajukan permintaan withdraw.
 * - Validasi batas minimal withdraw
 * - Pastikan saldo mencukupi
 * - Gunakan transaksi untuk mencegah race conditions
 */
export async function createWithdrawalRequest({
  affiliateId,
  amount,
  method,
  accountNumber,
  accountName,
}: {
  affiliateId: string
  amount: number
  method: string
  accountNumber: string
  accountName: string
}) {
  const MIN_WITHDRAW = await getAffiliateMinWithdraw()
  if (amount < MIN_WITHDRAW) {
    return { success: false, error: `Minimal penarikan adalah ${MIN_WITHDRAW}` }
  }

  const client = await clientPromise
  const session = client.startSession()
  try {
    const { affiliateProfiles, withdrawalRequests, affiliateTransactions } = await getCollections()
    let result: any = null
    let createdProfile: any = null

    await session.withTransaction(async () => {
      const profile = await affiliateProfiles.findOne({ userId: affiliateId }, { session })
      if (!profile) throw new Error("Affiliate tidak ditemukan")

      if ((profile.wallet?.balance || 0) < amount) {
        throw new Error("Saldo tidak mencukupi untuk penarikan")
      }

      createdProfile = profile

      // Potong saldo aktif dan tambahkan ke pending (locked)
      await affiliateProfiles.updateOne(
        { userId: affiliateId },
        {
          $inc: { "wallet.balance": -amount, "wallet.pending": amount },
          $set: { updatedAt: new Date() },
        },
        { session }
      )

      const req = {
        affiliateId,
        amount,
        method,
        accountNumber,
        accountName,
        status: "pending",
        createdAt: new Date(),
      }

      const insert = await withdrawalRequests.insertOne(req, { session })
      result = { success: true, requestId: insert.insertedId }
    })

    if (createdProfile?.email) {
      await sendEmail({
        to: createdProfile.email,
        subject: "Pengajuan Withdraw Affiliate Diterima",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <div style="background: #111827; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
              <h2 style="margin: 0; font-size: 20px;">Permintaan Withdraw Diterima</h2>
            </div>
            <div style="padding: 20px; background: #f9fafb; color: #111827;">
              <p>Halo ${createdProfile.ownerName || createdProfile.storeName || "Affiliate"},</p>
              <p>Permintaan withdraw Anda sebesar <strong>${formatRupiah(amount)}</strong> sedang diproses oleh admin.</p>
              <p>Detail pengajuan:</p>
              <ul>
                <li><strong>Metode:</strong> ${method}</li>
                <li><strong>Nomor Akun:</strong> ${accountNumber}</li>
                <li><strong>Nama Pemilik:</strong> ${accountName}</li>
              </ul>
              <p>Silakan tunggu notifikasi selanjutnya setelah admin mengonfirmasi penarikan.</p>
              <p>Salam,<br/>Tim ${appConfig.nameHost}</p>
            </div>
          </div>
        `,
      })
    }

    await sendTelegramAdminMessage(
      `*New Withdraw Request*
Affiliate: ${createdProfile?.storeName || affiliateId}
Amount: ${formatRupiah(amount)}
Method: ${method}
Account: ${accountNumber}
Name: ${accountName}`
    ).catch(() => null)

    return result
  } catch (error) {
    console.error("createWithdrawalRequest error:", error)
    return { success: false, error: (error as Error).message }
  } finally {
    await session.endSession()
  }
}

/**
 * Admin memproses permintaan withdraw: approve atau reject.
 * - Jika approve: masukkan txId/bukti dan kurangi pending
 * - Jika reject: kembalikan utuh saldo ke wallet.balance dan kurangi pending
 */
 export async function adminProcessWithdrawal({
  requestId,
  approve,
  adminNote,
  txId,
  proofUrl,
}: {
  requestId: string
  approve: boolean
  adminNote?: string
  txId?: string
  proofUrl?: string
}) {
  const client = await clientPromise
  const session = client.startSession()
  try {
    const { affiliateProfiles, withdrawalRequests, affiliateTransactions } = await getCollections()
    let result: any = null

    let profile: any = null
    await session.withTransaction(async () => {
      const req = await withdrawalRequests.findOne({ _id: new (require("mongodb").ObjectId)(requestId) }, { session })
      if (!req) throw new Error("Request withdraw tidak ditemukan")
      
      if (req.status !== "pending") {
        result = { success: true, alreadyProcessed: true, request: req }
        return
      }

      profile = await affiliateProfiles.findOne({ userId: req.affiliateId }, { session })
      if (!profile) throw new Error("Affiliate tidak ditemukan")

      if (approve) {
        const proofData = proofUrl ? { url: proofUrl } : null

        await withdrawalRequests.updateOne(
          { _id: req._id },
          {
            $set: {
              status: "approved",
              adminNote: adminNote || null,
              txId: txId || null,
              proof: proofData,
              processedAt: new Date(),
            },
          },
          { session }
        )

        await affiliateProfiles.updateOne(
          { userId: req.affiliateId },
          { $inc: { "wallet.pending": -req.amount }, $set: { updatedAt: new Date() } },
          { session }
        )

        await affiliateTransactions.insertOne({
          type: "withdraw_approved",
          affiliateId: req.affiliateId,
          requestId: req._id,
          amount: req.amount,
          txId: txId || null,
          adminNote: adminNote || null,
          proof: proofData,
          createdAt: new Date(),
        }, { session })

        result = { success: true, request: req }
      } else {
        await withdrawalRequests.updateOne(
          { _id: req._id },
          {
            $set: { status: "rejected", adminNote: adminNote || null, processedAt: new Date() },
          },
          { session }
        )

        await affiliateProfiles.updateOne(
          { userId: req.affiliateId },
          { $inc: { "wallet.pending": -req.amount, "wallet.balance": req.amount }, $set: { updatedAt: new Date() } },
          { session }
        )

        await affiliateTransactions.insertOne({
          type: "withdraw_rejected",
          affiliateId: req.affiliateId,
          requestId: req._id,
          amount: req.amount,
          adminNote: adminNote || null,
          createdAt: new Date(),
        }, { session })

        result = { success: true, request: req }
      }
    })

    if (result?.alreadyProcessed) {
      return result
    }
    if (profile?.email) {
      let emailAttachment = undefined
      if (approve && proofUrl) {
        try {
          const response = await fetch(proofUrl)
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer()
            const contentType = response.headers.get("content-type") || "image/png"
            const extension = contentType.split("/")[1] || "png"

            emailAttachment = {
              filename: `bukti-transfer-${requestId}.${extension}`,
              content: Buffer.from(arrayBuffer),
              contentType: contentType,
            }
          }
        } catch (fetchError) {
          console.error("Gagal mengambil gambar proofUrl untuk attachment:", fetchError)
        }
      }

      await sendWithdrawalStatusEmail(
        profile.email,
        profile.ownerName || profile.storeName || "Affiliate",
        result.request.amount,
        approve ? "approved" : "rejected",
        txId,
        adminNote,
        emailAttachment
      )
    }

    await sendTelegramAdminMessage(
      `*Withdraw ${approve ? "Approved" : "Rejected"}*
Affiliate: ${profile?.storeName || profile?.userId}
Amount: ${formatRupiah(result.request.amount)}
Status: ${approve ? "Approved" : "Rejected"}
${txId ? `TxID: ${txId}` : ""}`
    ).catch(() => null)

    return result
  } catch (error) {
    console.error("adminProcessWithdrawal error:", error)
    return { success: false, error: (error as Error).message }
  } finally {
    await session.endSession()
  }
}

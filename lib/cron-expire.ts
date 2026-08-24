import clientPromise from "./mongodb"
import { appConfig } from "@/data/config"
import { Pterodactyl } from "./pterodactyl"
import { sendEmail } from "./email-service"
import { simpanCronLog, type CronLogEntry } from "./cron-log"

const DUA_HARI_MS = 2 * 24 * 60 * 60 * 1000

function ambilAksesPterodactyl(accessType: string): "reguler" | "admin" {
  return accessType === "admin" ? "admin" : "reguler"
}

export async function jalankanCronExpirePanel(sumber: "otomatis" | "manual" = "otomatis") {
  const sekarang = new Date()
  const rawResponseSemua: Record<string, any> = {}

  const log: CronLogEntry = {
    tanggal: sekarang.toISOString().slice(0, 10),
    dijalankanPada: sekarang,
    sumber,
    sukses: true,
    pesanError: null,
    panelExpiredDitemukan: [],
    serverDihapus: [],
    akunPanelDihapus: [],
    pengingatDikirim: [],
    rawResponse: rawResponseSemua,
  }

  try {
    const client = await clientPromise
    const db = client.db(appConfig.mongodb.dbName)
    const payments = db.collection("payments")

    const kandidatExpired = await payments
      .find({
        status: "completed",
        expiresAt: { $exists: true, $lte: sekarang.toISOString() },
      })
      .toArray()

    rawResponseSemua.kandidatExpired = kandidatExpired.map((p) => ({
      transactionId: p.transactionId,
      expiresAt: p.expiresAt,
    }))

    for (const payment of kandidatExpired) {
      const detailExpired = {
        transactionId: payment.transactionId,
        username: payment.username,
        email: payment.email,
        planId: payment.planId,
        serverType: payment.serverType,
        expiresAt: payment.expiresAt,
      }
      log.panelExpiredDitemukan.push(detailExpired)

      const daftarServerId: number[] = Array.isArray(payment.panelServerIds)
        ? payment.panelServerIds
        : []

      const pterodactyl = new Pterodactyl(payment.serverType, ambilAksesPterodactyl(payment.accessType))

      for (const serverId of daftarServerId) {
        try {
          const respon = await pterodactyl.deleteServer(serverId)
          log.serverDihapus.push({ transactionId: payment.transactionId, serverId, respon: respon ?? { status: "deleted" } })
        } catch (error) {
          log.serverDihapus.push({
            transactionId: payment.transactionId,
            serverId,
            respon: { error: error instanceof Error ? error.message : "Gagal menghapus server" },
          })
        }
      }

      if (payment.panelUserId) {
        const sisaPanelAktif = await payments.countDocuments({
          panelUserId: payment.panelUserId,
          serverType: payment.serverType,
          status: "completed",
          transactionId: { $ne: payment.transactionId },
        })

        if (sisaPanelAktif === 0) {
          try {
            const respon = await pterodactyl.deleteUser(payment.panelUserId)
            log.akunPanelDihapus.push({
              transactionId: payment.transactionId,
              panelUserId: payment.panelUserId,
              username: payment.username,
              respon: respon ?? { status: "deleted" },
            })
          } catch (error) {
            log.akunPanelDihapus.push({
              transactionId: payment.transactionId,
              panelUserId: payment.panelUserId,
              username: payment.username,
              respon: { error: error instanceof Error ? error.message : "Gagal menghapus akun panel" },
            })
          }
        }
      }

      await payments.updateOne(
        { transactionId: payment.transactionId },
        { $set: { status: "expired", expiredProcessed: true } }
      )

      if (payment.email) {
        await sendEmail({
          to: payment.email,
          subject: `Masa Aktif Panel Anda Telah Berakhir - ${appConfig.nameHost}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="background: #111827; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 20px;">Panel Anda Sudah Expired</h2>
              </div>
              <div style="padding: 20px; background: #f9fafb; color: #111827;">
                <p>Halo ${payment.username},</p>
                <p>Masa aktif panel Anda dengan ID transaksi <strong>${payment.transactionId}</strong> sudah berakhir dan server telah dihapus secara otomatis dari sistem kami.</p>
                <p>Silakan lakukan pemesanan ulang jika Anda masih membutuhkan layanan ini.</p>
                <p>Salam,<br/>Tim ${appConfig.nameHost}</p>
              </div>
            </div>
          `,
        }).catch(() => null)
      }
    }

    const batasPengingat = new Date(sekarang.getTime() + DUA_HARI_MS)
    const kandidatPengingat = await payments
      .find({
        status: "completed",
        expiresAt: { $exists: true, $gt: sekarang.toISOString(), $lte: batasPengingat.toISOString() },
        reminderSent: { $ne: true },
      })
      .toArray()

    rawResponseSemua.kandidatPengingat = kandidatPengingat.map((p) => ({
      transactionId: p.transactionId,
      expiresAt: p.expiresAt,
    }))

    for (const payment of kandidatPengingat) {
      if (payment.email) {
        await sendEmail({
          to: payment.email,
          subject: `Pengingat: Panel Anda Akan Expired 2 Hari Lagi - ${appConfig.nameHost}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="background: #111827; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 20px;">Pengingat Masa Aktif Panel</h2>
              </div>
              <div style="padding: 20px; background: #f9fafb; color: #111827;">
                <p>Halo ${payment.username},</p>
                <p>Panel Anda dengan ID transaksi <strong>${payment.transactionId}</strong> akan berakhir masa aktifnya pada <strong>${new Date(payment.expiresAt).toLocaleString("id-ID")}</strong>.</p>
                <p>Silakan lakukan perpanjangan sebelum tanggal tersebut agar panel tidak terhapus otomatis.</p>
                <p>Salam,<br/>Tim ${appConfig.nameHost}</p>
              </div>
            </div>
          `,
        }).catch(() => null)
      }

      await payments.updateOne(
        { transactionId: payment.transactionId },
        { $set: { reminderSent: true } }
      )

      log.pengingatDikirim.push({
        transactionId: payment.transactionId,
        username: payment.username,
        email: payment.email,
        expiresAt: payment.expiresAt,
      })
    }
  } catch (error) {
    log.sukses = false
    log.pesanError = error instanceof Error ? error.message : "Terjadi kesalahan pada cron job"
    rawResponseSemua.error = log.pesanError
  }

  const logId = await simpanCronLog(log)

  return {
    logId: logId.toString(),
    ringkasan: {
      totalExpired: log.panelExpiredDitemukan.length,
      totalServerDihapus: log.serverDihapus.length,
      totalAkunDihapus: log.akunPanelDihapus.length,
      totalPengingat: log.pengingatDikirim.length,
      sukses: log.sukses,
    },
    detail: log,
  }
}

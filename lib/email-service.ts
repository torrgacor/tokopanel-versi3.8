import nodemailer from "nodemailer"
import { appConfig } from "@/data/config"
import { pterodactylConfig } from "@/data/config"
import { formatRupiah } from "@/lib/utils"

type ServerType = "public" | "private"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: appConfig.emailSender.auth.user,
    pass: appConfig.emailSender.auth.pass,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  try {
    await transporter.verify()
    const info = await transporter.sendMail({
      from: appConfig.emailSender.from,
      to,
      subject,
      html,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendWithdrawalRequestEmail(
  to: string,
  ownerName: string,
  amount: number,
  method: string,
  accountNumber: string,
  accountName: string,
  status: "pending"
) {
  const subject = `Permintaan Withdraw ${status === "pending" ? "Diterima" : "Ditolak"}`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #111827; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">Permintaan Withdraw Affiliate</h2>
      </div>
      <div style="padding: 20px; background: #f9fafb; color: #111827;">
        <p>Halo ${ownerName},</p>
        <p>Permintaan withdraw Anda telah dicatat dengan detail berikut:</p>
        <ul>
          <li><strong>Jumlah:</strong> ${formatRupiah(amount)}</li>
          <li><strong>Metode:</strong> ${method}</li>
          <li><strong>Nomor Akun:</strong> ${accountNumber}</li>
          <li><strong>Nama Pemilik:</strong> ${accountName}</li>
          <li><strong>Status:</strong> ${status}</li>
        </ul>
        <p>Silakan tunggu proses dari admin. Kami akan menginformasikan jika statusnya berubah.</p>
        <p>Salam,<br/>Tim ${appConfig.nameHost}</p>
      </div>
    </div>
  `
  return sendEmail({ to, subject, html })
}

export async function sendWithdrawalStatusEmail(
  to: string,
  ownerName: string,
  amount: number,
  status: "approved" | "rejected",
  txId?: string,
  adminNote?: string,
  attachment?: { filename: string; content: Buffer; contentType?: string }
) {
  const subject = `Withdraw ${status === "approved" ? "Disetujui" : "Ditolak"}`
  const attachmentNote = attachment ? `<p><strong>Bukti transfer terlampir pada email ini.</strong></p>` : ""
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <div style="background: #111827; color: white; padding: 16px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0; font-size: 20px;">Status Withdraw Anda</h2>
      </div>
      <div style="padding: 20px; background: #f9fafb; color: #111827;">
        <p>Halo ${ownerName},</p>
        <p>Permintaan withdraw Anda sebesar <strong>${formatRupiah(amount)}</strong> telah <strong>${status}</strong>.</p>
        ${txId ? `<p><strong>TxID/Bukti:</strong> ${txId}</p>` : ""}
        ${adminNote ? `<p><strong>Catatan Admin:</strong> ${adminNote}</p>` : ""}
        ${attachmentNote}
        <p>Terima kasih telah menggunakan layanan kami.</p>
        <p>Salam,<br/>Tim ${appConfig.nameHost}</p>
      </div>
    </div>
  `

  try {
    await transporter.verify()
    const mailOptions: any = {
      from: appConfig.emailSender.from,
      to,
      subject,
      html,
    }
    if (attachment) {
      mailOptions.attachments = [
        {
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType || undefined,
        },
      ]
    }
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending withdrawal status email:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

export async function sendPanelDetailsEmail(
  to: string,
  idtransaksi: string,
  username: string,
  password: string,
  serverId: number,
  planName: string,
  serverType: ServerType,
) {
  const panelUrl =
    serverType === "private"
      ? pterodactylConfig.private.domain
      : pterodactylConfig.public.domain

  const mailOptions = {
    from: appConfig.emailSender.from,
    to,
    subject: `Detail Akun Panel Pterodactyl ${appConfig.nameHost}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="background: linear-gradient(to right, #e53e3e, #c53030); padding: 15px; border-radius: 5px 5px 0 0;">
          <h2 style="color: white; margin: 0; text-align: center;">${appConfig.nameHost} - Detail Panel Pterodactyl</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f8f9fa;">
          <p>Halo,</p>
          <p>Terima kasih telah membeli panel Pterodactyl di ${appConfig.nameHost}. Berikut adalah detail akun panel Anda:</p>
          <p><strong>ID Transaksi:</strong> ${idtransaksi}</p>
          
          <div style="background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p><strong>Paket:</strong> ${planName}</p>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> <code style="background-color: #f0f0f0; padding: 2px 4px; border-radius: 3px;">${password}</code></p>
            <p><strong>Tipe Server:</strong> Private</p>
            <p><strong>Server ID:</strong> ${serverId}</p>
            <p><strong>URL Panel:</strong> <a href="${panelUrl}" style="color: #e53e3e;">${panelUrl}</a></p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${panelUrl}" style="background-color: #e53e3e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Login Sekarang
            </a>
          </div>
          
          <p>Jika Anda membutuhkan bantuan, silakan hubungi tim support kami.</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${appConfig.whatsappGroupLink}" style="background-color: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Gabung Saluran WhatsApp
            </a>
          </div>
          
          <p>Salam,<br>Tim ${appConfig.nameHost}</p>
        </div>
        
        <div style="background-color: #2d3748; color: white; text-align: center; padding: 10px; border-radius: 0 0 5px 5px;">
          <p style="margin: 0;">&copy; ${new Date().getFullYear()} ${appConfig.nameHost}</p>
        </div>
      </div>
    `,
  }

  try {
    await transporter.verify()
    const info = await transporter.sendMail(mailOptions)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending smtp:", error)
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
  }
}

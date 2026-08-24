import { appConfig } from "@/data/config"
import sharp from "sharp"

export async function sendTelegramNotification(
  userId: number,
  transactionId: string,
  invoiceDate: string,
  price: number,
  planName: string,
  email: string,
  quantity: number = 1
) {
  try {
    if (!appConfig?.telegram?.botToken || !appConfig?.telegram?.ownerId) {
      console.error("Telegram config missing")
      return { success: false, error: "Missing telegram config" }
    }

    const totalServerText = quantity > 1 ? ` (${quantity} Server)` : ""
    const message =
  `*NEW PANEL CREATED*\n\n` +
  `*User ID:* \`${escapeMarkdown(String(userId))}\`\n` +
  `*Transaction ID:* \`${escapeMarkdown(transactionId)}\`\n` +
  `*Invoice Date:* ${escapeMarkdown(formatDate(invoiceDate))}\n` +
  `*Price:* ${escapeMarkdown(formatRupiah(price))}\n` +
  `*Plan:* ${escapeMarkdown(planName)}${escapeMarkdown(totalServerText)}\n` +
  `*Email:* ${escapeMarkdown(email)}`

    const response = await fetch(
      `https://api.telegram.org/bot${appConfig.telegram.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: appConfig.telegram.ownerId,
          text: message,
          parse_mode: "MarkdownV2",
        }),
      }
    )

    const data = await response.json()
    if (!data.ok) throw new Error(data.description)

    return { success: true }
  } catch (error) {
    console.error("Error sending Telegram notification:", error)
    return { success: false, error }
  }
}

export async function sendTelegramTestimonial(
  transactionId: string,
  planName: string,
  price: number,
  email: string,
  quantity: number = 1,
  username: string = email.split("@")[0],
  total: number = price,
  durationDays: number = 30,
  completedAt: string = new Date().toISOString(),
) {
  try {
    const channelId = appConfig?.telegram?.channelId
    const botToken = appConfig?.telegram?.botToken

    if (!botToken || !channelId) {
      console.error("Telegram testimonial config missing")
      return { success: false, error: "Missing channelId or botToken" }
    }

    const normalizedDuration = durationDays || 30
    const image = await createTransactionImage({
      transactionId,
      planName,
      username,
      email,
      total,
      quantity,
      durationDays: normalizedDuration,
      completedAt,
    })
    const form = new FormData()
    form.append("chat_id", channelId)
    form.append("photo", new Blob([image], { type: "image/png" }), "transaksi-berhasil.png")
    form.append("caption", createTransactionCaption({
      transactionId,
      planName,
      username,
      email,
      total,
      quantity,
      durationDays: normalizedDuration,
      completedAt,
    }))
    form.append("parse_mode", "HTML")

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        body: form,
      }
    )

    const data = await response.json()
    if (!data.ok) throw new Error(data.description)

    return { success: true }
  } catch (error) {
    console.error("Error sending Telegram testimonial:", error)
    return { success: false, error }
  }
}

async function createTransactionImage(data: {
  transactionId: string
  planName: string
  username: string
  email: string
  total: number
  quantity: number
  durationDays: number
  completedAt: string
}) {
  const safe = (value: string) => value.replace(/[&<>\"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;", "'": "&apos;" })[character] || character)
  const truncate = (value: string, maxLength: number) => value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value
  const dateValue = new Date(data.completedAt)
  const date = Number.isNaN(dateValue.getTime())
    ? "Tanggal tidak tersedia"
    : dateValue.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })
  const planName = truncate(data.planName || "Paket Panel", 30)
  const username = truncate(data.username || "Pelanggan", 24)
  const email = truncate(maskEmail(data.email || ""), 30)
  const transactionId = truncate(data.transactionId || "-", 28)
  const svg = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
    }
    body {
      width: 420px;
      background-color: #0d0608;
      color: #ffffff;
      padding: 16px;
    }
    .card {
      background: #160b0e;
      border: 2px solid #e11d48;
      border-radius: 16px;
      padding: 24px 20px;
      box-shadow: 0 0 15px rgba(225, 29, 72, 0.2);
    }
    /* Header: Icon & Nama Toko */
    .header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .header-icon {
      font-size: 42px;
      color: #e11d48;
    }
    .brand-title {
      font-size: 14px;
      letter-spacing: 1px;
      color: #94a3b8;
      text-transform: uppercase;
    }
    /* Sub Header & Garis */
    .section-title {
      font-size: 16px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 6px;
    }
    .section-subtitle {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 16px;
    }
    .divider {
      border: none;
      height: 1px;
      background: rgba(225, 29, 72, 0.4);
      margin: 16px 0 20px 0;
    }
    /* Inner Detail (Kanan & Kiri) */
    .detail-header {
      text-align: right;
      font-size: 13px;
      color: #94a3b8;
      font-weight: bold;
      margin-bottom: 14px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
      font-size: 13px;
    }
    .label {
      color: #94a3b8;
      font-weight: bold;
    }
    .val {
      color: #ffffff;
      font-weight: bold;
      text-align: right;
    }
    .total-val {
      color: #e11d48;
      font-size: 15px;
    }
    /* Tombol Status Merah di Bawah */
    .status-btn {
      background: #e11d48;
      color: #ffffff;
      text-align: center;
      padding: 12px;
      border-radius: 10px;
      font-weight: bold;
      margin-top: 24px;
      font-size: 13px;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-icon">
        <i class="fa-solid fa-cart-shopping"></i>
      </div>
      <div>
        <div class="section-title">TokoPanel Official</div>
        <div class="brand-title">PEMBELIAN PANEL</div>
      </div>
    </div>

    <div class="section-subtitle">PEMBELIAN ${safe(planName)} BERHASIL DI ORDER OLEH ${safe(username)}</div>
    
    <hr class="divider">

    <div class="detail-header">DETAIL TRANSAKSI</div>

    <div class="row">
      <span class="label">PRODUK</span>
      <span class="val">${safe(planName)}</span>
    </div>

    <div class="row">
      <span class="label">TOTAL BIAYA</span>
      <span class="val" style="color: #e11d48;">${safe(formatRupiah(data.total))}</span>
    </div>

    <div class="row">
      <span class="label">JUMLAH PANEL</span>
      <span class="val">${data.quantity} Panel</span>
    </div>

    <div class="row">
      <span class="label">DURASI MASA AKTIF</span>
      <span class="val">${data.durationDays} Hari</span>
    </div>

    <div class="row">
      <span class="label">METODE</span>
      <span class="val">Qris</span>
    </div>

    <div class="row">
      <span class="label">WAKTU</span>
      <span class="val" style="font-size: 11px;">${safe(date)}</span>
    </div>

    <div class="status-btn">
      ✓ TRANSAKSI BERHASIL
    </div>
  </div>
</body>
</html>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

function createTransactionCaption(data: {
  transactionId: string
  planName: string
  username: string
  email: string
  total: number
  quantity: number
  durationDays: number
  completedAt: string
}) {
  const safe = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character)
  return [
    "<b>🎉 TRANSAKSI BERHASIL</b>",
    "",
    `🧾 <b>ID Transaksi:</b> <code>${safe(data.transactionId)}</code>`,
    `👤 <b>Pelanggan:</b> ${safe(data.username)}`,
    `📧 <b>Email:</b> ${safe(maskEmail(data.email || ""))}`,
    `📦 <b>Produk:</b> ${safe(data.planName)}`,
    `🖥️ <b>Jumlah Panel:</b> ${data.quantity} panel`,
    `⏳ <b>Masa Aktif:</b> ${data.durationDays} hari`,
    `💰 <b>Total Pembayaran:</b> ${formatRupiah(data.total)}`,
    `📅 <b>Waktu:</b> ${safe(formatDate(data.completedAt))}`,
    "",
    "Terima kasih sudah order di <b>TokoPanel</b> ❤️",
  ].join("\n")
}

function maskEmail(email: string): string {
  const [username, domain] = email.split("@")
  if (username.length <= 3) return `${username}***@${domain}`
  const visiblePart = username.substring(0, Math.ceil(username.length / 2))
  return `${visiblePart}***@${domain}`
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
export async function sendTelegramAdminMessage(text: string) {
  try {
    if (!appConfig?.telegram?.botToken || !appConfig?.telegram?.ownerId) {
      console.error("Telegram config missing")
      return { success: false, error: "Missing telegram config" }
    }

    const response = await fetch(
      `https://api.telegram.org/bot${appConfig.telegram.botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: appConfig.telegram.ownerId,
          text,
          parse_mode: "MarkdownV2",
        }),
      }
    )

    const data = await response.json()
    if (!data.ok) throw new Error(data.description)

    return { success: true }
  } catch (error) {
    console.error("Error sending Telegram admin message:", error)
    return { success: false, error }
  }
}
function escapeMarkdown(str: string): string {
  return String(str).replace(/([_*\[\]()~`>#+=|{}.!\\-])/g, "\\$1")
}

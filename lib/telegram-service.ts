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
  const rows = [
    ["PRODUK", planName],
    ["TOTAL BIAYA", formatRupiah(data.total)],
    ["JUMLAH PANEL", `${data.quantity} Panel`],
    ["DURASI MASA AKTIF", `${data.durationDays} Hari`],
    ["METODE", "Qris"],
    ["WAKTU", date],
  ]
  const rowMarkup = rows.map(([label, value], index) => {
    const y = 254 + index * 34
    const valueSize = label === "WAKTU" ? 11 : label === "TOTAL BIAYA" ? 15 : 13
    const valueColor = label === "TOTAL BIAYA" ? "#e11d48" : "#ffffff"
    return `<text x="40" y="${y}" class="label">${safe(label)}</text>
    <text x="380" y="${y}" text-anchor="end" fill="${valueColor}" font-size="${valueSize}" class="value">${safe(value)}</text>`
  }).join("\n")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="500" viewBox="0 0 420 500">
  <rect width="420" height="500" fill="#0d0608"/>
  <rect x="16" y="16" width="388" height="468" rx="16" fill="#160b0e" stroke="#e11d48" stroke-width="2"/>
  <style>
    .title, .value { font-family: Arial, Helvetica, sans-serif; font-weight: bold; }
    .label { font-family: Arial, Helvetica, sans-serif; font-size: 13px; font-weight: bold; fill: #94a3b8; }
  </style>
  <circle cx="58" cy="64" r="24" fill="#e11d48"/>
  <path d="M45 53h5l4 18h17l4-13H53m7 19h.01M70 77h.01" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="96" y="62" class="title" font-size="16" fill="#ffffff">TokoPanel Official</text>
  <text x="96" y="82" font-family="Arial, Helvetica, sans-serif" font-size="14" letter-spacing="1" fill="#94a3b8">PEMBELIAN PANEL</text>
  <text x="40" y="124" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#64748b">PEMBELIAN ${safe(planName)} BERHASIL DI ORDER OLEH ${safe(username)}</text>
  <line x1="40" y1="154" x2="380" y2="154" stroke="#e11d48" stroke-opacity="0.4"/>
  <text x="380" y="190" text-anchor="end" class="label">DETAIL TRANSAKSI</text>
  ${rowMarkup}
  <rect x="40" y="440" width="340" height="34" rx="10" fill="#e11d48"/>
  <text x="210" y="462" text-anchor="middle" class="title" font-size="13" fill="#ffffff">TRANSAKSI BERHASIL</text>
</svg>`
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

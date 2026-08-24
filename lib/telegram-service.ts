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
  const svg = `<svg width="1080" height="1080" viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1080" fill="#110f12"/><rect x="34" y="34" width="1012" height="1012" rx="28" fill="#1d171b" stroke="#b51f2e" stroke-width="4"/><rect x="34" y="34" width="1012" height="18" fill="#e12d3f"/>
    <path d="M100 175h42l18 105h190l22-78H158" fill="none" stroke="#f04455" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/><circle cx="184" cy="314" r="15" fill="#f04455"/><circle cx="326" cy="314" r="15" fill="#f04455"/>
    <text x="390" y="245" fill="#ffffff" font-family="Arial, sans-serif" font-size="64" font-weight="700">TokoPanel</text>
    <text x="100" y="405" fill="#ffffff" font-family="Arial, sans-serif" font-size="42" font-weight="700">PEMBELIAN ${safe(planName)}</text><text x="100" y="465" fill="#ef9aa3" font-family="Arial, sans-serif" font-size="32">BERHASIL DI ORDER OLEH ${safe(username)}</text><line x1="100" y1="525" x2="980" y2="525" stroke="#71303a" stroke-width="3"/>
    <text x="100" y="590" fill="#d8c7ca" font-family="Arial, sans-serif" font-size="30">PRODUK</text><text x="980" y="590" text-anchor="end" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="700">${safe(planName)}</text>
    <text x="100" y="655" fill="#d8c7ca" font-family="Arial, sans-serif" font-size="30">TOTAL BIAYA</text><text x="980" y="655" text-anchor="end" fill="#ff5968" font-family="Arial, sans-serif" font-size="30" font-weight="700">${safe(formatRupiah(data.total))}</text>
    <text x="100" y="720" fill="#d8c7ca" font-family="Arial, sans-serif" font-size="30">JUMLAH PANEL</text><text x="980" y="720" text-anchor="end" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="700">${data.quantity} panel</text>
    <text x="100" y="785" fill="#d8c7ca" font-family="Arial, sans-serif" font-size="30">DURASI MASA AKTIF</text><text x="980" y="785" text-anchor="end" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="700">${data.durationDays} hari</text>
    <text x="100" y="850" fill="#d8c7ca" font-family="Arial, sans-serif" font-size="30">EMAIL</text><text x="980" y="850" text-anchor="end" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="700">${safe(email)}</text>
    <text x="100" y="915" fill="#d8c7ca" font-family="Arial, sans-serif" font-size="30">BERHASIL PADA</text><text x="980" y="915" text-anchor="end" fill="#ffffff" font-family="Arial, sans-serif" font-size="27" font-weight="700">${safe(date)}</text>
    <rect x="100" y="955" width="880" height="60" rx="12" fill="#c92738"/><text x="540" y="996" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="700">TRANSAKSI BERHASIL</text>
    <text x="100" y="1040" fill="#cbaeb3" font-family="Arial, sans-serif" font-size="22">ID: ${safe(transactionId)}</text>
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

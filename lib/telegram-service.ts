import { appConfig } from "@/data/config"
import { pterodactylConfig } from "@/data/config"

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
  details?: {
    serverType?: "public" | "private"
    selectedEggId?: number | null
    memory?: number
    cpu?: number
    basePrice?: number
    discountAmount?: number
    fee?: number
  },
) {
  try {
    const channelId = appConfig?.telegram?.channelId
    const botToken = appConfig?.telegram?.botToken

    if (!botToken || !channelId) {
      console.error("Telegram testimonial config missing")
      return { success: false, error: "Missing channelId or botToken" }
    }

    const normalizedDuration = durationDays || 30
    const message = createTransactionCaption({
      transactionId,
      planName,
      username,
      email,
      total,
      quantity,
      durationDays: normalizedDuration,
      completedAt,
      details,
    })

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: channelId, text: message, parse_mode: "HTML" }),
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

function createTransactionCaption(data: {
  transactionId: string
  planName: string
  username: string
  email: string
  total: number
  quantity: number
  durationDays: number
  completedAt: string
  details?: {
    serverType?: "public" | "private"
    selectedEggId?: number | null
    memory?: number
    cpu?: number
    basePrice?: number
    discountAmount?: number
    fee?: number
  }
}) {
  const safe = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character)
  const details = data.details || {}
  const config = details.serverType ? pterodactylConfig[details.serverType] : undefined
  const egg = config?.eggs?.find((item) => item.id === details.selectedEggId)
  const basePrice = details.basePrice ?? data.total
  const discountAmount = details.discountAmount ?? 0
  const fee = details.fee ?? 0
  const productPrice = basePrice - (egg?.harga || 0) * data.quantity
  const ram = details.memory !== undefined ? `${details.memory} MB` : "Tidak tersedia"
  const cpu = details.cpu !== undefined ? `${details.cpu}%` : "Tidak tersedia"
  return [
    `<code>PEMBELIAN ${safe(data.planName?.toUpperCase())}</code>`,
    `<code>BERHASIL DI ORDER OLEH ${safe(data.username?.toUpperCase())}</code>`,
    "",
    "<b>┏━━━━━━━━━━━━━━━━━━━┓</b>",
    "<b>ㅤㅤㅤㅤ  TOKO PANEL</b>",
    "<b>   ✅ TRANSAKSI BERHASIL ✅</b>",
    "<b>┗━━━━━━━━━━━━━━━━━━━┛</b>",
    `   ${safe(formatDate(data.completedAt))}`,
    "━━━━━━━━━━━━━━━━━━━━━",
    `ID Transaksi : <code>${safe(data.transactionId)}</code>`,
    `Pelanggan : ${safe(data.username)}`,
    `Email : ${safe(maskEmail(data.email || ""))}`,
    "━━━━━━━━━━━━━━━━━━━━━",
    "<b>DETAIL PRODUK</b>",
    `Produk :ㅤㅤㅤㅤ   ${safe(data.planName)}`,
    `Spesifikasi :ㅤㅤㅤ${formatHitung(ram)}MB / ${formatHitung(cpu)}%`,
    `Type Egg :ㅤㅤㅤㅤ${safe(egg?.nama || (details.selectedEggId ? `ID ${details.selectedEggId}` : "Default"))}`,
    `Jumlah Produk :ㅤ${data.quantity} Panel`,
    `Masa Aktif :ㅤㅤㅤ${data.durationDays} Hari`,
    "━━━━━━━━━━━━━━━━━━━━━",
    "<b>RINCIAN PEMBAYARAN</b>",
    `<b>Harga Produk :</b>ㅤㅤ        ${formatRupiah(productPrice / Math.max(data.quantity, 1))}`,
    `<b>Biaya Tambahan Egg :</b>  ${formatRupiah((egg?.harga || 0) * data.quantity)}`,
    `<b>Harga Produk (${data.quantity}x) :</b>ㅤㅤ${formatRupiah(basePrice)}`,
    `<b>Voucher Diskon :</b>ㅤㅤ   -${formatRupiah(discountAmount)}`,
    `<b>Biaya Admin :</b>ㅤㅤㅤㅤ   ${formatRupiah(fee)}`,
    "━━━━━━━━━━━━━━━━━━━━━",
    `<b>TOTAL BIAYA :     ㅤㅤ    ${formatRupiah(data.total)}</b>`,
    "<code>Qris All Payment</code>",
    "",
    "Terima Kasih Sudah Order Layanan",
    "Panel Pterodactyl Kami. 😇🙏🏻",
    "",
    "<b>Kunjungi Website :</b>",
    "${appConfig.LinkWebsite}",
    "ㅤㅤ",
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

function formatHitung(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
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

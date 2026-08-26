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
  const serverType = details.serverType === "public" ? "Public" : details.serverType === "private" ? "Private" : "Tidak tersedia"
  return [
    "<b>╔════════════════════╗</b>",
    "<b>      TOKOPANEL      </b>",
    "<b>   STRUK PEMBELIAN   </b>",
    "<b>╚════════════════════╝</b>",
    "",
    `🧾 <b>ID Transaksi</b>  <code>${safe(data.transactionId)}</code>`,
    `👤 <b>Pelanggan</b>     ${safe(data.username)}`,
    `📦 <b>Produk</b>        ${safe(data.planName)}`,
    `🖥️ <b>Tipe Nodes</b>    ${serverType}`,
    `🥚 <b>Tipe Egg</b>      ${safe(egg?.nama || (details.selectedEggId ? `ID ${details.selectedEggId}` : "Default"))}`,
    `🔢 <b>Jumlah Produk</b> ${data.quantity} unit`,
    `⏳ <b>Masa Aktif</b>    ${data.durationDays} hari`,
    "",
    "<b>RINCIAN PEMBAYARAN</b>",
    `Harga asli/satuan     ${formatRupiah(productPrice / Math.max(data.quantity, 1))}`,
    `Harga produk (${data.quantity}x)  ${formatRupiah(basePrice)}`,
    `Biaya tambahan Egg    ${formatRupiah((egg?.harga || 0) * data.quantity)}`,
    `Diskon harga          -${formatRupiah(discountAmount)}`,
    `Biaya admin           ${formatRupiah(fee)}`,
    `<b>TOTAL BIAYA         ${formatRupiah(data.total)}</b>`,
    "",
    `📅 ${safe(formatDate(data.completedAt))}`,
    "✅ <b>TRANSAKSI BERHASIL</b>",
    "",
    "Terima kasih telah berbelanja di <b>TokoPanel</b>.",
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

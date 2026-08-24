import { appConfig } from "@/data/config"

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
  quantity: number = 1
) {
  try {
    const channelId = appConfig?.telegram?.channelId
    const botToken = appConfig?.telegram?.botToken

    if (!botToken || !channelId) {
      console.error("Telegram testimonial config missing")
      return { success: false, error: "Missing channelId or botToken" }
    }

    const totalServerText = quantity > 1 ? ` sebanyak *${quantity}x*` : ""
    const maskedEmail = maskEmail(email)

    const message =
      `*Pembelian panel berhasil*\\.\n\n` +
      `*ID Transaksi:* \`${escapeMarkdown(transactionId)}\`\n` +
      `*Produk:* ${escapeMarkdown(planName)}${totalServerText}\n` +
      `*Total Biaya:* ${escapeMarkdown(formatRupiah(price))}\n` +
      `*Email:* ${escapeMarkdown(maskedEmail)}\n` +
      `*Status:* \`Berhasil Diaktifkan\`\n\n` +
      `Terima kasih telah menggunakan layanan kami\\. Hubungi admin atau kunjungi website utama untuk pemesanan lainnya\\.`

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: channelId,
          text: message,
          parse_mode: "MarkdownV2",
        }),
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

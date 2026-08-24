import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { appConfig } from "@/data/config"

export function generatePassword(length: number): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let password = ""

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length)
    password += charset[randomIndex]
  }

  return password
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatHitung(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateTransactionId(): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function calculateFee(amount: number): number {
  return Math.ceil(amount * appConfig.fee) 
}

export function formatDate(date: Date | string): string {
  try {
    const d = new Date(date)

    // Check if date is valid
    if (isNaN(d.getTime())) {
      return "Tanggal tidak valid"
    }

    return d.toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch (error) {
    return "Tanggal tidak valid"
  }
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / (3600 * 24))
  const hours = Math.floor((seconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

export function calculateDiscount(
  amount: number,
  discountType: "percentage" | "nominal",
  discountValue: number
): number {
  if (discountType === "percentage") {
    return Math.floor((amount * discountValue) / 100)
  } else {
    // Nominal discount
    return Math.min(discountValue, amount) // Diskon tidak boleh melebihi harga
  }
}

export function calculateDurationAdjustedPrice(basePrice: number, durationDays: number): number {
  const normalizedDuration = [15, 30, 45].includes(durationDays) ? durationDays : 30

  if (normalizedDuration === 15) {
    return Math.max(0, Math.round(basePrice * 0.5))
  }

  if (normalizedDuration === 45) {
    return Math.round(basePrice * 1.5)
  }

  return Math.round(basePrice)
}

export function applyDiscount(
  amount: number,
  discountType: "percentage" | "nominal",
  discountValue: number
): { discountAmount: number; finalAmount: number } {
  const discountAmount = calculateDiscount(amount, discountType, discountValue)
  const finalAmount = Math.max(0, amount - discountAmount)

  return {
    discountAmount,
    finalAmount,
  }
}

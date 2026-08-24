"use client"

import { formatRupiah } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Ticket } from "lucide-react"
import { motion } from "framer-motion"

interface DiscountSummaryProps {
  basePrice: number
  discountType?: "percentage" | "nominal"
  discountValue?: number
  discountAmount?: number
  fee: number
  totalPrice: number
}

export function DiscountSummary({
  basePrice,
  discountType,
  discountValue,
  discountAmount,
  fee,
  totalPrice,
}: DiscountSummaryProps) {
  return (
    <Card className="bg-dark-400 border-dark-300">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">Ringkasan Pembayaran</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between text-dark-100">
          <span>Harga Panel:</span>
          <span className="text-white">{formatRupiah(basePrice)}</span>
        </div>

        {discountAmount && discountAmount > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="flex justify-between text-green-400 border-t border-dark-300 pt-2"
          >
            <span className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              Diskon
              {discountType === "percentage"
                ? ` (${discountValue}%)`
                : ""}
            </span>
            <span>-{formatRupiah(discountAmount)}</span>
          </motion.div>
        )}

        <div className="flex justify-between text-dark-100">
          <span>Biaya Admin:</span>
          <span className="text-white">{formatRupiah(fee)}</span>
        </div>

        <div className="border-t border-dark-300 pt-2 flex justify-between font-semibold">
          <span className="text-white">Total Pembayaran:</span>
          <span className="text-amber-400">{formatRupiah(totalPrice)}</span>
        </div>

        {discountAmount && discountAmount > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs text-green-400/80 pt-2 text-center"
          >
            ✓ Anda menghemat {formatRupiah(discountAmount)}
          </motion.div>
        )}
      </CardContent>
    </Card>
  )
}

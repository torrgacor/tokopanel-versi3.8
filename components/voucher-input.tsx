"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { claimVoucher, type DiscountType } from "@/app/actions/voucher-actions"
import { useToast } from "@/hooks/use-toast"
import { Check, Loader2, Ticket, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface VoucherInput {
  code: string
  discountType: DiscountType
  discountValue: number
  minimumPurchase?: number
  downloadUrl?: string
  description?: string
}

interface VoucherInputProps {
  userIdentifier: string
  onVoucherApplied?: (voucher: VoucherInput) => void
  onVoucherRemoved?: () => void
}

export function VoucherInput({ userIdentifier, onVoucherApplied, onVoucherRemoved }: VoucherInputProps) {
  const [code, setCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherInput | null>(null)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleClaimVoucher = async () => {
    if (!code.trim()) {
      setError("Masukkan kode voucher")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await claimVoucher({
        userIdentifier,
        code: code.toUpperCase(),
      })

      if (result.success) {
        const voucher: VoucherInput = {
          code: result.voucher!.code,
          discountType: result.voucher!.discountType,
          discountValue: result.voucher!.discountValue,
          minimumPurchase: result.voucher!.minimumPurchase,
          downloadUrl: result.voucher!.downloadUrl,
          description: result.voucher!.description,
        }
        setAppliedVoucher(voucher)
        setCode("")
        toast({
          title: "Berhasil!",
          description: result.message,
          variant: "default",
        })
        onVoucherApplied?.(voucher)
      } else {
        setError(result.message)
        toast({
          title: "Gagal",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan"
      setError(message)
      toast({
        title: "Gagal",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setCode("")
    setError("")
    onVoucherRemoved?.()
  }

  return (
    <Card className="bg-dark-400 border-dark-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Ticket className="w-5 h-5 text-amber-500" />
          Kode Diskon/Voucher
        </CardTitle>
        <CardDescription className="text-dark-200">
          Masukkan kode voucher untuk mendapatkan diskon
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!appliedVoucher ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Masukkan kode voucher"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setError("")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleClaimVoucher()
                    }
                  }}
                  disabled={isLoading}
                  className="bg-dark-500 border-dark-200 text-white placeholder:text-dark-100"
                />
                <Button
                  onClick={handleClaimVoucher}
                  disabled={isLoading || !code.trim()}
                  className="bg-amber-600 hover:bg-amber-700 text-white whitespace-nowrap"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Claim"
                  )}
                </Button>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-red-400 text-sm p-2 rounded bg-red-900/20 border border-red-900/50"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="applied"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="p-4 rounded-lg bg-green-900/20 border border-green-800/50">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <Check className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-300">{appliedVoucher.code}</p>
                      {appliedVoucher.description && (
                        <p className="text-sm text-green-200/70 mt-1">{appliedVoucher.description}</p>
                      )}
                      <p className="text-sm text-green-200 mt-1 font-medium">
                        Diskon{" "}
                        {appliedVoucher.discountType === "percentage"
                          ? `${appliedVoucher.discountValue}%`
                          : `Rp ${appliedVoucher.discountValue.toLocaleString("id-ID")}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleRemoveVoucher}
                    variant="ghost"
                    size="sm"
                    className="text-gray-400 hover:text-white hover:bg-dark-500"
                  >
                    Hapus
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}

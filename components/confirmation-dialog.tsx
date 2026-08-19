"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatRupiah, calculateDiscount } from "@/lib/utils"
import { plans } from "@/data/plans"
import { Loader2 } from "lucide-react"
import { EggOption } from "@/lib/pterodactyl"
import { VoucherInput } from "./voucher-input"
import { DiscountSummary } from "./discount-summary"
import type { DiscountType } from "@/app/actions/voucher-actions"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  planId: string
  onConfirm: () => void
  isLoading: boolean
  serverType?: "private" | "public"
  accessType?: "regular" | "admin"
  selectedEggId?: number
  eggs?: EggOption[]
  quantity: number
  userIdentifier?: string
  appliedVoucher?: {
    code: string
    discountType: DiscountType
    discountValue: number
    description?: string
  } | null
  durationDays?: number
  onVoucherApplied?: (voucher: { code: string; discountType: DiscountType; discountValue: number; description?: string }) => void
  onVoucherRemoved?: () => void
}

export function ConfirmationDialog({ 
  open, 
  onOpenChange, 
  planId, 
  onConfirm, 
  isLoading, 
  serverType, 
  accessType,
  selectedEggId,
  eggs = [],
  quantity = 1,
  userIdentifier = "",
  appliedVoucher,
  onVoucherApplied,
  onVoucherRemoved,
  durationDays = 20,
}: ConfirmationDialogProps) {
  const plan = plans.find((p) => p.id === planId)
  const selectedEgg = eggs.find(egg => egg.id === selectedEggId)
  const eggPrice = selectedEgg?.harga || 0
  const durationMultiplier = durationDays === 15 ? 0.5 : durationDays === 45 ? 1.5 : 1
  const adjustedPlanPrice = (plan?.price || 0) * durationMultiplier
  const basePrice = (adjustedPlanPrice + eggPrice) * quantity
  
  // Calculate discount if voucher is applied
  const discountAmount = appliedVoucher 
    ? calculateDiscount(basePrice, appliedVoucher.discountType, appliedVoucher.discountValue)
    : 0
  
  const finalPrice = basePrice - discountAmount

  if (!plan) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-dark-400 border-dark-300 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-red-400">Konfirmasi Pembelian</DialogTitle>
          <DialogDescription className="text-gray-400">
            Anda akan membeli paket <span className="font-semibold text-white">{plan.name}</span> sebanyak <span className="font-semibold text-red-400">{quantity}x Server</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Detail Paket */}
          <div className="bg-dark-500 p-4 rounded-lg border border-dark-300">
            <h3 className="font-medium text-white mb-2">Detail Paket</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-400">Tipe Server:</div>
              <div className="font-medium text-white">{serverType === "private" ? "Private" : "Public"}</div>
              <div className="text-gray-400">Akses Panel:</div>
              <div className="font-medium text-white">{accessType === "regular" ? "Akses Biasa" : "Akses Admin"}</div>
              <div className="text-gray-400">RAM:</div>
              <div className="font-medium text-white">{plan.memory} MB</div>
              <div className="text-gray-400">Disk:</div>
              <div className="font-medium text-white">{plan.disk} MB</div>
              <div className="text-gray-400">CPU:</div>
              <div className="font-medium text-white">{plan.cpu}%</div>
              <div className="text-gray-400">Harga Paket Dasar:</div>
              <div className="font-medium text-white">{formatRupiah(adjustedPlanPrice)}</div>
              <div className="text-gray-400">Durasi Aktif:</div>
              <div className="font-medium text-white">{durationDays} Hari</div>
              
              {/* Info Egg Tambahan */}
              {selectedEgg && (
                <>
                  <div className="text-gray-400">Egg Terpilih:</div>
                  <div className="font-medium text-white">{selectedEgg.nama}</div>
                  <div className="text-gray-400">Biaya Egg Satuan:</div>
                  <div className="font-medium text-red-400">+{formatRupiah(eggPrice)}</div>
                </>
              )}
              
              {/* Info Multiplier Server */}
              {quantity > 1 && (
                <>
                  <div className="col-span-2 border-t border-dark-300/40 my-1"></div>
                  <div className="text-gray-400 font-medium">Jumlah Pengali Server:</div>
                  <div className="font-bold text-white text-base">x {quantity}</div>
                </>
              )}
              
              {/* Garis Pembatas Final */}
              <div className="col-span-2 border-t border-dark-300 my-2"></div>
              
              {/* Subtotal Sebelum Potongan Voucher */}
              <div className="text-gray-400 font-semibold">Subtotal:</div>
              <div className="font-bold text-red-400 text-base">{formatRupiah(basePrice)}</div>
            </div>
          </div>
          
          {/* Info Default Egg */}
          {!selectedEgg && eggs.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                💡 Egg default akan digunakan: <span className="font-semibold">{eggs[0]?.nama}</span> (Gratis)
              </p>
            </div>
          )}

          {/* Voucher Input Section */}
          {userIdentifier && (
            <VoucherInput
              userIdentifier={userIdentifier}
              onVoucherApplied={onVoucherApplied}
              onVoucherRemoved={onVoucherRemoved}
            />
          )}

          {/* Discount Summary */}
          <DiscountSummary
            basePrice={basePrice}
            discountType={appliedVoucher?.discountType}
            discountValue={appliedVoucher?.discountValue}
            discountAmount={discountAmount}
            fee={0}
            totalPrice={finalPrice}
          />
          
          <p className="text-sm text-gray-400">
            Dengan mengklik tombol "Lanjutkan Pembayaran", Anda akan diarahkan ke halaman pembayaran.
          </p>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-dark-500 border-dark-300 hover:bg-dark-600 text-white"
          >
            Batal
          </Button>
          <Button onClick={onConfirm} className="w-full sm:w-auto bg-red-600 hover:bg-red-700" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              `Lanjutkan (${formatRupiah(finalPrice)})`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import React, { useEffect, useState } from "react"
import { Drawer } from "vaul"
import { Check, Info, X } from "lucide-react"
import { formatRupiah } from "@/lib/utils"

interface EggOption {
  id: number
  nama: string
  harga: number
  catatan: string
  description?: string
}

interface AdvancedSettingsBottomSheetProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (selectedEggId: number | undefined, quantity: number) => void 
  onSkip: (quantity: number) => void
  eggs: EggOption[]
  isLoading: boolean
  selectedPlanPrice: number
}

export function AdvancedSettingsBottomSheet({
  isOpen,
  onClose,
  onConfirm,
  onSkip,
  eggs,
  isLoading,
  selectedPlanPrice,
}: AdvancedSettingsBottomSheetProps) {
  const [selectedEggId, setSelectedEggId] = useState<number | undefined>(undefined)
  const [quantity, setQuantity] = useState<number>(1)
  const [totalPrice, setTotalPrice] = useState(selectedPlanPrice)

  useEffect(() => {
    const selectedEgg = eggs.find(egg => egg.id === selectedEggId)
    const eggPrice = selectedEgg?.harga || 0
    setTotalPrice((selectedPlanPrice + eggPrice) * quantity)
  }, [selectedEggId, selectedPlanPrice, eggs, quantity])

  // Reset selected egg when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEggId(undefined)
      setQuantity(1)
    }
  }, [isOpen])

  const handleConfirm = () => {
    onConfirm(selectedEggId, quantity)
  }

  const handleSkip = () => {
    onSkip(quantity)
  }
  
  const increment = () => setQuantity(prev => prev + 1)
  const decrement = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1))

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
        <Drawer.Content className="bg-dark-600 flex flex-col rounded-t-xl fixed bottom-0 left-0 right-0 z-50 outline-none max-h-[85vh] border-t border-dark-300">
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 bg-dark-400 rounded-full" />
          </div>

          {/* Hidden Title for Accessibility */}
          <Drawer.Title className="sr-only">
            Pengaturan Lanjutan - Pilih Egg untuk Server
          </Drawer.Title>

          {/* Optional Description for Accessibility */}
          <Drawer.Description className="sr-only">
            Pilih konfigurasi tambahan untuk server Anda termasuk pemilihan egg dan melihat rincian pembelian
          </Drawer.Description>

          {/* Header */}
          <div className="p-4 border-b border-dark-300">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">Pengaturan Lanjutan</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Pilih konfigurasi tambahan untuk server Anda
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-dark-500 rounded-full transition-colors"
                aria-label="Tutup"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="bg-dark-500 border border-dark-400 rounded-xl p-4 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white">Jumlah Panel / Server</h3>
                <p className="text-xs text-gray-400 mt-0.5">Tentukan berapa banyak panel yang ingin Anda buat</p>
              </div>
              <div className="flex items-center gap-3 bg-dark-600 p-1.5 rounded-lg border border-dark-300">
                <button
                  type="button"
                  onClick={decrement}
                  className="w-8 h-8 flex items-center justify-center rounded bg-dark-500 text-white hover:bg-dark-400 active:scale-95 transition-all font-bold disabled:opacity-40"
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className="w-8 text-center text-white font-bold text-lg select-none">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={increment}
                  className="w-8 h-8 flex items-center justify-center rounded bg-red-600 text-white hover:bg-red-500 active:scale-95 transition-all font-bold"
                >
                  +
                </button>
              </div>
            </div>
            {/* Egg Selection Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-red-500" />
                Pilih Egg (Opsional)
              </h3>
              <p className="text-sm text-gray-400 mb-4">
                Pilih jenis egg untuk server Anda. Jika tidak dipilih, akan menggunakan egg default:{" "}
                <span className="text-white font-medium">{eggs[0]?.nama || "Default"}</span> (Gratis)
              </p>
              
              <div className="space-y-3" role="listbox" aria-label="Daftar egg yang tersedia">
                {eggs.map((egg) => (
                  <button
                    key={egg.id}
                    onClick={() => setSelectedEggId(egg.id)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedEggId === egg.id
                        ? "border-red-500 bg-red-500/10"
                        : "border-dark-400 bg-dark-500 hover:border-red-500/50"
                    }`}
                    role="option"
                    aria-selected={selectedEggId === egg.id}
                    aria-label={`Pilih egg ${egg.nama} ${egg.harga > 0 ? `dengan biaya tambahan ${formatRupiah(egg.harga)}` : "gratis"}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">{egg.nama}</h4>
                          {selectedEggId === egg.id && (
                            <Check className="w-4 h-4 text-red-500" aria-hidden="true" />
                          )}
                        </div>
                        <p className="text-sm text-gray-400">
                          {egg.description || `Egg ${egg.nama} ${egg.catatan}`}
                        </p>
                      </div>
                      <div className="text-right">
                        {egg.harga > 0 ? (
                          <>
                            <span className="text-red-400 font-semibold">
                              +{formatRupiah(egg.harga)}
                            </span>
                            <p className="text-xs text-gray-500">biaya tambahan</p>
                          </>
                        ) : (
                          <span className="text-green-400 text-sm font-medium">Gratis</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase Details Section */}
            <div className="border-t border-dark-300 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Rincian Pembelian</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Harga Paket</span>
                  <span className="text-white">{formatRupiah(selectedPlanPrice)}</span>
                </div>
                {selectedEggId && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">
                      Biaya Egg ({eggs.find(e => e.id === selectedEggId)?.nama})
                    </span>
                    <span className="text-red-400">
                      +{formatRupiah(eggs.find(e => e.id === selectedEggId)?.harga || 0)}
                    </span>
                  </div>
                )}
                {/* Info Jumlah Pengali */}
                <div className="flex justify-between text-sm border-t border-dark-400/50 pt-2 text-gray-300">
                  <span>Jumlah Panel</span>
                  <span className="font-medium text-white">x {quantity}</span>
                </div>
                
                <div className="border-t border-dark-300 pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-white">Total</span>
                    <span className="text-red-500 text-lg">{formatRupiah(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3" role="note">
              <p className="text-xs text-blue-300">
                💡 Egg menentukan environment dan fitur yang tersedia di server Anda. 
                Pilihan egg akan mempengaruhi total harga pembelian.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-dark-300 bg-dark-600 rounded-b-xl">
            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 px-4 py-3 rounded-lg bg-dark-500 text-gray-300 font-medium hover:bg-dark-400 transition-colors"
                disabled={isLoading}
                aria-label="Lewati pemilihan egg dan lanjutkan dengan egg default"
              >
                Lewati (Pakai Default)
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-red-600 to-red-800 text-white font-medium hover:from-red-700 hover:to-red-900 transition-all disabled:opacity-50"
                disabled={isLoading}
                aria-label={`Lanjutkan pembayaran dengan total ${formatRupiah(totalPrice)}`}
              >
                {isLoading ? "Memproses..." : `Lanjutkan (${formatRupiah(totalPrice)})`}
              </button>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

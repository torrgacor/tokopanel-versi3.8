"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Clock3, Loader2, Mail, ReceiptText } from "lucide-react"
import { createRenewalPayment } from "@/app/actions/create-payment"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const renewalOptions = [
  { days: 15 as const, label: "15 Hari", description: "Diskon 50% dari harga paket" },
  { days: 30 as const, label: "30 Hari", description: "Harga normal paket" },
]

export function RenewalForm() {
  const router = useRouter()
  const [transactionId, setTransactionId] = useState("")
  const [email, setEmail] = useState("")
  const [renewalDays, setRenewalDays] = useState<15 | 30>(30)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      const result = await createRenewalPayment({ transactionId, email, renewalDays })
      if (result.success && result.transactionId) {
        router.push(`/invoice/${result.transactionId}`)
      } else {
        setError(result.error || "Gagal membuat invoice perpanjangan")
      }
    } catch {
      setError("Gagal membuat invoice perpanjangan")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="border-dark-300 bg-dark-400 shadow-2xl">
      <div className="h-3 bg-gradient-to-r from-red-600 to-red-800" />
      <CardContent className="p-6 sm:p-8">
        <div className="mb-8">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-red-400">Panel renewal</p>
          <h1 className="text-3xl font-bold text-white">Perpanjang masa aktif</h1>
          <p className="mt-2 text-gray-400">Gunakan ID transaksi dan email saat pembelian panel.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="transactionId" className="text-gray-200">ID Transaksi</Label>
            <div className="relative">
              <ReceiptText className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input id="transactionId" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="Contoh: a1b2c3d4" required className="h-11 border-dark-300 bg-dark-500 pl-10 text-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-200">Email pembelian</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
              <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@contoh.com" required className="h-11 border-dark-300 bg-dark-500 pl-10 text-white" />
            </div>
          </div>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium text-gray-200">Pilih masa perpanjangan</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {renewalOptions.map((option) => (
                <button key={option.days} type="button" onClick={() => setRenewalDays(option.days)} className={`rounded-lg border p-4 text-left transition ${renewalDays === option.days ? "border-red-500 bg-red-500/10" : "border-dark-300 bg-dark-500 hover:border-gray-500"}`}>
                  <span className="flex items-center justify-between font-semibold text-white">
                    {option.label}
                    <Clock3 className="h-4 w-4 text-red-400" />
                  </span>
                  <span className="mt-1 block text-sm text-gray-400">{option.description}</span>
                </button>
              ))}
            </div>
          </fieldset>

          {error && <p className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
          <Button type="submit" disabled={isSubmitting} className="h-12 w-full bg-gradient-to-r from-red-600 to-red-800 text-base hover:from-red-700 hover:to-red-900">
            {isSubmitting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Membuat invoice...</> : "Lanjut ke pembayaran"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
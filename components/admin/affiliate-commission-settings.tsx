"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { formatRupiah } from "@/lib/utils"

export default function AffiliateCommissionSettings() {
  const [percent, setPercent] = useState("15")
  const [minWithdraw, setMinWithdraw] = useState("50000")
  const [loading, setLoading] = useState(true)
  const [savingPercent, setSavingPercent] = useState(false)
  const [savingMinWithdraw, setSavingMinWithdraw] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch("/api/admin/affiliate/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setPercent(String(data.percent))
          setMinWithdraw(String(data.minWithdraw))
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function simpanPercent() {
    const nilai = Number(percent)
    if (!Number.isFinite(nilai) || nilai < 0 || nilai > 100) {
      toast({ title: "Nilai tidak valid", description: "Masukkan angka antara 0 sampai 100", variant: "destructive" })
      return
    }

    setSavingPercent(true)
    try {
      const res = await fetch("/api/admin/affiliate/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percent: nilai }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Tersimpan", description: `Persentase bagi hasil sekarang ${data.percent}%` })
        setPercent(String(data.percent))
      } else {
        toast({ title: "Gagal menyimpan", description: data.error || "Coba lagi", variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal menyimpan", description: "Tidak dapat terhubung ke server", variant: "destructive" })
    } finally {
      setSavingPercent(false)
    }
  }

  async function simpanMinWithdraw() {
    const nilai = Number(minWithdraw)
    if (!Number.isFinite(nilai) || nilai < 0) {
      toast({ title: "Nilai tidak valid", description: "Masukkan nominal yang benar", variant: "destructive" })
      return
    }

    setSavingMinWithdraw(true)
    try {
      const res = await fetch("/api/admin/affiliate/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minWithdraw: nilai }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Tersimpan", description: `Minimal withdraw sekarang ${formatRupiah(data.minWithdraw)}` })
        setMinWithdraw(String(data.minWithdraw))
      } else {
        toast({ title: "Gagal menyimpan", description: data.error || "Coba lagi", variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal menyimpan", description: "Tidak dapat terhubung ke server", variant: "destructive" })
    } finally {
      setSavingMinWithdraw(false)
    }
  }

  const contohHarga = 2000
  const nilaiPersen = Number(percent) || 0
  const contohKomisi = Math.max(0, Math.round(contohHarga * (nilaiPersen / 100)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Affiliate</CardTitle>
        <CardDescription>
          Atur besaran bagi hasil yang masuk ke wallet affiliate dan batas minimal penarikan saldo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="komisi-persen">Persentase Bagi Hasil (%)</Label>
              <Input
                id="komisi-persen"
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={percent}
                onChange={(e) => setPercent(e.target.value)}
                disabled={loading}
                className="w-40"
              />
            </div>
            <Button onClick={simpanPercent} disabled={savingPercent || loading}>
              {savingPercent ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Simulasi: harga {formatRupiah(contohHarga)} × {nilaiPersen}% = {formatRupiah(contohKomisi)} masuk ke saldo affiliate.
          </p>
        </div>

        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-withdraw">Minimal Withdraw (Rp)</Label>
              <Input
                id="min-withdraw"
                type="number"
                min={0}
                step="1000"
                value={minWithdraw}
                onChange={(e) => setMinWithdraw(e.target.value)}
                disabled={loading}
                className="w-48"
              />
            </div>
            <Button onClick={simpanMinWithdraw} disabled={savingMinWithdraw || loading}>
              {savingMinWithdraw ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Affiliate hanya bisa mengajukan penarikan jika saldo aktif sudah mencapai nominal ini.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

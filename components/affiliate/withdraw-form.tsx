"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

const PAYMENT_METHODS = ["DANA", "OVO", "GoPay", "ShopeePay", "LinkAja", "Bank BCA", "Bank Mandiri", "Bank BRI", "Bank Jago", "Lainnya"]

export default function WithdrawForm({ affiliateId }: { affiliateId: string }) {
  const [amount, setAmount] = useState(0)
  const [method, setMethod] = useState("")
  const [accountNumber, setAccountNumber] = useState("")
  const [accountName, setAccountName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!amount || amount <= 0) {
      toast({ title: "Jumlah tidak valid", description: "Masukkan jumlah penarikan yang benar", variant: "destructive" })
      return
    }
    if (!method || !accountNumber || !accountName) {
      toast({ title: "Data belum lengkap", description: "Lengkapi semua field sebelum mengirim", variant: "destructive" })
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`/api/affiliate/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId, amount, method, accountNumber, accountName }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Berhasil dikirim", description: "Pengajuan withdraw berhasil dibuat", variant: "default" })
        setAmount(0)
        setMethod("")
        setAccountNumber("")
        setAccountName("")
      } else {
        toast({ title: "Gagal mengajukan", description: data.error || "Silakan coba lagi", variant: "destructive" })
      }
    } catch (error) {
      toast({ title: "Gagal mengajukan", description: "Tidak dapat terhubung ke server", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="space-y-4">
      <CardHeader>
        <CardTitle>Ajukan Withdraw</CardTitle>
        <CardDescription>Pengajuan ditangani manual oleh admin. Pastikan data rekening benar.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Jumlah (Rp)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="50000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdraw-method">Metode Pembayaran</Label>
            <select
              id="withdraw-method"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="">Pilih Metode</option>
              {PAYMENT_METHODS.map((methodOption) => (
                <option key={methodOption} value={methodOption}>
                  {methodOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="withdraw-account">Nomor Rekening / E-Wallet</Label>
            <Input
              id="withdraw-account"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="Contoh: 081234567890"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdraw-owner">Nama Rekening</Label>
            <Input
              id="withdraw-owner"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Nama terdaftar"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Pastikan jumlah melebihi batas minimal withdraw dan tidak lebih dari saldo Anda.</p>
          <Button type="submit" onClick={submit} disabled={loading}>
            {loading ? "Mengirim..." : "Ajukan Withdraw"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

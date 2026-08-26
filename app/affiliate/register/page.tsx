"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { registerAffiliate } from "@/app/actions/affiliate-registration"
import { Loader2, Check, ArrowLeft, BadgeCheck, Sparkles, ArrowRight } from "lucide-react"

export default function AffiliateRegisterPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [registrationData, setRegistrationData] = useState<any>(null)

  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    ownerName: "",
    phoneNumber: "",
    withdrawMethod: "transfer_bank",
    accountNumber: "",
    accountName: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      withdrawMethod: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await registerAffiliate(formData)

      if (result.success) {
        setRegistrationData(result)
        setIsSuccess(true)
        toast({
          title: "Sukses!",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mendaftar affiliate",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess && registrationData) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_35%),linear-gradient(135deg,_#07111f_0%,_#111827_100%)] px-4 py-10 text-white">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-3xl border border-emerald-400/20 bg-slate-950/70 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
            <Check className="h-8 w-8 text-white" />
          </div>
          <CardHeader className="px-0 text-center">
            <CardTitle className="text-2xl">Registrasi Berhasil!</CardTitle>
            <CardDescription className="text-slate-400">Tunggu email konfirmasi dari admin untuk memulai perjalanan affiliate Anda.</CardDescription>
          </CardHeader>
          <CardContent className="w-full space-y-4 px-0">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 space-y-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">User ID</p>
                <p className="font-mono text-sm font-medium text-white">{registrationData.userId}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Referral Code</p>
                <p className="font-mono text-sm font-medium text-white">{registrationData.referralCode}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm text-sky-100">
              <div className="flex items-center gap-2 font-medium">
                <BadgeCheck className="h-4 w-4" />
                Email konfirmasi sedang dikirim ke {formData.email}
              </div>
            </div>
            <Button onClick={() => router.push("/affiliate/login")} className="w-full bg-emerald-600 hover:bg-emerald-500">
              Login Sekarang
            </Button>
            <Button onClick={() => router.push("/affiliate")} className="w-full bg-sky-600 hover:bg-sky-500">
              Kembali ke Beranda
            </Button>         
          </CardContent>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_45%),linear-gradient(135deg,_#07111f_0%,_#111827_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start">
        <div className="max-w-xl space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-100">
            <Sparkles className="h-4 w-4" />
            Program Affiliate Baru
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight">Daftar sebagai affiliate dan raih komisi dari setiap penjualan</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Bangun jaringan Anda, bagikan referral link, dan pantau hasilnya dari dashboard yang terintegrasi.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Komisi real-time</p>
              <p className="mt-1 font-semibold text-white">Pantau saldo dan transaksi langsung</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm text-slate-400">Akses cepat</p>
              <p className="mt-1 font-semibold text-white">Panel khusus untuk mitra aktif</p>
            </div>
          </div>
        </div>

        <Card className="w-full max-w-2xl border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-end px-6 pt-4">
            <Button variant="ghost" className="text-slate-300 hover:text-white" onClick={() => router.push("/affiliate/login")}>
              Sudah punya akun? Login
            </Button>
          </div>
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Daftar Sebagai Affiliate</CardTitle>
            <CardDescription className="text-slate-400">Isi data berikut untuk memulai menjadi mitra kami.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-white">Informasi Toko</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="storeName" className="text-slate-200">Nama Toko</Label>
                    <Input id="storeName" name="storeName" placeholder="Toko Bot Keren" value={formData.storeName} onChange={handleInputChange} disabled={isLoading} className="border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-slate-200">Nama Pemilik</Label>
                    <Input id="ownerName" name="ownerName" placeholder="John Doe" value={formData.ownerName} onChange={handleInputChange} disabled={isLoading} className="border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500" />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Email (Data Login)</Label>
                    <Input id="email" name="email" type="email" placeholder="affiliate@example.com" value={formData.email} onChange={handleInputChange} disabled={isLoading} className="border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-slate-200">Nomor Telepon (Data Login)</Label>
                    <Input id="phoneNumber" name="phoneNumber" placeholder="62812345678" value={formData.phoneNumber} onChange={handleInputChange} disabled={isLoading} className="border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-white">Informasi Penarikan</h3>
                <div className="space-y-2">
                  <Label htmlFor="withdrawMethod" className="text-slate-200">Metode Penarikan</Label>
                  <Select value={formData.withdrawMethod} onValueChange={handleSelectChange} disabled={isLoading}>
                    <SelectTrigger className="border-white/10 bg-slate-900/70 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer_bank">Transfer Bank</SelectItem>
                      <SelectItem value="e_wallet">E-Wallet (OVO/Dana/Gopay)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="accountNumber" className="text-slate-200">Nomor Rekening / No. HP</Label>
                    <Input id="accountNumber" name="accountNumber" placeholder="123456789" value={formData.accountNumber} onChange={handleInputChange} disabled={isLoading} className="border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="accountName" className="text-slate-200">Nama Rekening / Nama Penerima</Label>
                    <Input id="accountName" name="accountName" placeholder="John Doe" value={formData.accountName} onChange={handleInputChange} disabled={isLoading} className="border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-4 text-sm text-sky-100">
                Setelah mendaftar, akun Anda akan berstatus <strong>Pending</strong> dan menunggu approval admin. Anda akan menerima email konfirmasi setelah disetujui.
              </div>

              <Button type="submit" disabled={isLoading} className="w-full bg-sky-600 hover:bg-sky-500 h-11 text-white">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  <>
                    Daftar Sebagai Affiliate
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

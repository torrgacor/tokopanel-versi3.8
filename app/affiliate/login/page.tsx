"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, BadgeCheck, Sparkles } from "lucide-react"

export default function AffiliateLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [form, setForm] = useState({ email: "", phoneNumber: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const res = await fetch("/api/affiliate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Sukses", description: "Login berhasil" })
        router.push("/affiliate/dashboard")
      } else {
        toast({ title: "Gagal", description: data.error || "Login gagal", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Error", description: "Gagal terhubung ke server", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.2),_transparent_45%),linear-gradient(135deg,_#07111f_0%,_#111827_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-6 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-3 py-1 text-sm text-sky-200">
            <Sparkles className="h-4 w-4" />
            Panel Affiliate Premium
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold leading-tight">Masuk ke akun affiliate Anda</h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Pantau komisi, transaksi, dan penarikan dari satu dashboard yang cepat dan nyaman.
            </p>
          </div>
          <div className="space-y-2 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <div className="flex items-center gap-2 font-medium">
              <BadgeCheck className="h-4 w-4" />
              Akses cepat ke laporan dan saldo
            </div>
            <p className="text-emerald-50/80">Nikmati pengalaman login yang aman dan modern untuk mitra affiliate kami.</p>
          </div>
        </div>

        <Card className="w-full max-w-md border-white/10 bg-slate-950/70 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Login Affiliate</CardTitle>
            <CardDescription className="text-slate-400">Masuk menggunakan email dan nomor telepon terdaftar.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-200">Email</Label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500"
                  placeholder="affiliate@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">Nomor Telepon</Label>
                <Input
                  value={form.phoneNumber}
                  onChange={(e) => setForm((p) => ({ ...p, phoneNumber: e.target.value }))}
                  className="border-white/10 bg-slate-900/70 text-white placeholder:text-slate-500"
                  placeholder="62812345678"
                />
              </div>
              <Button type="submit" className="w-full bg-sky-600 hover:bg-sky-500" disabled={isLoading}>
                {isLoading ? "Memproses..." : "Masuk ke Dashboard"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

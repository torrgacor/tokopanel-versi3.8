"use client"

import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Copy, ExternalLink, TrendingUp, Users, Zap, BarChart3, Crown, Wallet } from "lucide-react"

interface ReferralStats {
  clicks: number
  conversions: number
  successfulTransactions?: number
  totalCommission: number
}

interface LevelInfo {
  name: string
  commissionPercent: number
}

export default function AffiliateStatsCard({
  referralCode,
  stats,
  level,
}: {
  referralCode: string
  stats: ReferralStats
  level?: LevelInfo
}) {
  const { toast } = useToast()
  const [referralLink, setReferralLink] = useState("")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (referralCode) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      setReferralLink(`${baseUrl}?ref=${referralCode}`)
    }
  }, [referralCode])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast({
        title: "Berhasil!",
        description: "Link referral berhasil disalin",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Error",
        description: "Gagal menyalin link",
        variant: "destructive",
      })
    }
  }, [referralLink, toast])

  return (
    <>
      {/* Referral Link Section */}
      <Card className="border border-border bg-card col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Link Referral Anda
          </CardTitle>
          <CardDescription>Bagikan link ini ke customer untuk mendapatkan komisi</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              readOnly
              value={referralLink}
              className="font-mono text-sm bg-muted"
            />
            <Button
              onClick={handleCopyLink}
              variant={copied ? "default" : "outline"}
              className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Copy className="w-4 h-4 mr-2" />
              {copied ? "Disalin!" : "Salin"}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            💡 Bagikan link ini di media sosial, grup, atau website Anda. Setiap customer yang order melalui link ini akan memberikan komisi untuk Anda.
          </p>
        </CardContent>
      </Card>

      {/* Referral Stats */}
      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            Level Reseller
          </CardTitle>
          <CardDescription>Level & Persentase Komisi Aktif Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{level?.name ?? "Bronze"}</div>
          <p className="text-sm text-muted-foreground mt-2">Komisi {level?.commissionPercent ?? 0}% Per Transaksi</p>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-500" />
            Total Pengunjung
          </CardTitle>
          <CardDescription>Jumlah Customer Yang Mengunjungi Link Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{stats?.clicks || 0}</div>
          <p className="text-sm text-muted-foreground mt-2">Mengunjungi Link Anda</p>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Total Transaksi
          </CardTitle>
          <CardDescription>Jumlah Customer Yang Order Di Link Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{stats?.conversions || 0}</div>
          <p className="text-sm text-muted-foreground mt-2">
            {stats?.clicks ? `${((stats.conversions / stats.clicks) * 100).toFixed(1)}% Tingkat Konversi` : "0% Tingkat Konversi"}
          </p>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-500" />
            Total Komisi
          </CardTitle>
          <CardDescription>Total Komisi Dari Link Referral Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              minimumFractionDigits: 0,
            }).format(stats?.totalCommission || 0)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Dari {stats?.conversions || 0} Penjualan</p>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-yellow-500" />
            Rata-Rata Komisi
          </CardTitle>
          <CardDescription>Nilai Dari Rata-Rata Tiap Transaksi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {stats?.conversions
              ? new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(stats.totalCommission / stats.conversions)
              : new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(0)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">Komisi Per Order</p>
        </CardContent>
      </Card>
    </>
  )
}

import Link from "next/link"
import { ArrowRight, BadgeCheck, CreditCard, Gift, ShieldCheck, TrendingUp, Wallet, Zap } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getAffiliateCommissionPercent, getAffiliateLevels, getAffiliateMinWithdraw, getCollections } from "@/lib/affiliate"
import { formatRupiah } from "@/lib/utils"
 
const paymentMethods = [
  {
    title: "Transfer Bank",
    description: "Tersedia Bank BCA, Bank Mandiri, Bank BRI, dan Bank Jago.",
  },
  {
    title: "E-Wallet",
    description: "Tersedia Dana, OVO, Gopay, ShopeePay, dan LinkAja.",
  }
]

const features = [
  {
    title: "Dashboard Real-Time",
    description: "Pantau klik, konversi, komisi, dan saldo secara langsung dari satu tempat.",
    icon: TrendingUp,
  },
  {
    title: "Komisi Otomatis",
    description: "Setiap transaksi referral yang berhasil akan langsung masuk ke saldo affiliate Anda.",
    icon: Wallet,
  },
  {
    title: "Bonus Level",
    description: "Naikkan level Anda untuk mendapatkan persentase komisi yang lebih tinggi.",
    icon: Gift,
  },
  {
    title: "Aman dan Terpercaya",
    description: "Proses penarikan diawasi dengan sistem yang transparan dan aman.",
    icon: ShieldCheck,
  },
]

export default async function AffiliateLandingPage() {
  let commissionPercent = 15
  let levels: Array<{ name: string; threshold: number; commissionPercent: number }> = [
    { name: "Bronze", threshold: 0, commissionPercent: 10 },
    { name: "Silver", threshold: 20, commissionPercent: 15 },
    { name: "Gold", threshold: 50, commissionPercent: 20 },
  ]
  let minWithdraw = 50000

  let activeCount = 0
  let affiliateStats: any[] = []
  let totalTransactions = 0

  try {
    const [basePercent, affiliateLevels, minimumWithdraw] = await Promise.all([
      getAffiliateCommissionPercent(),
      getAffiliateLevels(),
      getAffiliateMinWithdraw(),
    ])

    commissionPercent = basePercent
    levels = affiliateLevels.map((level) => ({
      name: level.name,
      threshold: level.threshold,
      commissionPercent: level.commissionPercent,
    }))
    minWithdraw = minimumWithdraw
    try {
      const { affiliateProfiles, affiliateTransactions } = await getCollections()
      activeCount = await affiliateProfiles.countDocuments({ status: "active" })
      
      const allAffiliates = await affiliateProfiles.find({}).toArray()
      const transactionStats = await affiliateTransactions
        .aggregate([
          { $group: { _id: "$affiliateId", transactionCount: { $sum: 1 }, totalCommission: { $sum: "$commission" } } },
        ])
        .toArray()

      const statsMap = new Map(transactionStats.map((s) => [s._id, s]))
      totalTransactions = transactionStats.reduce((sum, s) => sum + s.transactionCount, 0)

      affiliateStats = allAffiliates
        .map((a) => ({
          storeName: a.storeName,
          transactionCount: statsMap.get(a.userId)?.transactionCount ?? 0,
          totalCommission: statsMap.get(a.userId)?.totalCommission ?? 0,
        }))
        .filter((a) => a.transactionCount > 0)
        .sort((a, b) => b.transactionCount - a.transactionCount)
        .slice(0, 10)
    } catch (e) {
      console.error("Failed to load active affiliate count", e)
    }
  } catch (error) {
    console.error("Failed to load affiliate landing data", error)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <section className="border-b border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-20 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl space-y-6">
            <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/20">
              Program Affiliate Resmi
            </Badge>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Raih Penghasilan Tambahan Dari Setiap Referral Yang Berhasil.
              </h1>
              <p className="text-lg text-slate-300 sm:text-xl">
                Bergabunglah sebagai affiliate di TokoPanel dan dapatkan komisi menarik, akses dashboard lengkap, serta penarikan yang praktis.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600">
                <Link href="/affiliate/register">
                  Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-700 bg-slate-900/70 text-white hover:bg-slate-800">
                <Link href="/affiliate/login">Login Akun</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-slate-700 bg-slate-900/70 text-white hover:bg-slate-800">
                <Link href="/affiliate/dashboard">Ke Dashboard</Link>
              </Button>
            </div>
          </div>

          <Card className="w-full max-w-xl border-slate-800 bg-slate-900/70 shadow-2xl shadow-black/30">
            <CardHeader>
              <CardTitle className="text-2xl">Ringkasan Program</CardTitle>
              <CardDescription className="text-slate-400">
                Mulai dari komisi dasar hingga level premium, semua tersedia untuk mendukung pertumbuhan bisnis Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm text-emerald-300">Minimal Penarikan</p>
                <p className="text-2xl font-semibold text-white">Rp {minWithdraw.toLocaleString("id-ID")}</p>
              </div>
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="text-sm text-sky-300">Persentase Komisi</p>
                <p className="text-2xl font-semibold text-white">15% - 35%</p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center">
                  <p className="text-sm text-slate-400">Total Affiliator</p>
                  <p className="text-2xl font-semibold text-white">{activeCount}</p>
                  <p className="text-sm font-semibold text-emerald-300">Pengguna Aktif</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3 text-center">
                  <p className="text-sm text-slate-400">Total Transaksi</p>
                  <p className="text-2xl font-semibold text-white">{totalTransactions}</p>
                  <p className="text-sm font-semibold text-sky-300">Transaksi Affiliator</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <Card key={feature.title} className="border-slate-800 bg-slate-900/60">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-400">{feature.description}</p>
                </CardContent>
              </Card>
            )
          })}
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-2xl">Tingkat Komisi & Level Affiliate</CardTitle>
              <CardDescription className="text-slate-400">
                Semakin banyak transaksi referral yang berhasil, semakin tinggi level dan keuntungan Anda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {levels.map((level) => (
                <div key={level.name} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3">
                  <div>
                    <p className="font-semibold text-white">{level.name}</p>
                    <p className="text-sm text-slate-400">Minimal {level.threshold} transaksi</p>
                  </div>
                  <Badge className="bg-blue-500/15 text-blue-300 hover:bg-blue-500/20">
                    {level.commissionPercent}% komisi
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/70">
            <CardHeader>
              <CardTitle className="text-2xl">Metode Withdrawal & Keuntungan</CardTitle>
              <CardDescription className="text-slate-400">
                Nikmati kemudahan tarik saldo dengan pilihan pembayaran yang fleksibel.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.title} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                    <div className="mb-1 flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-emerald-300" />
                      <p className="font-medium text-white">{method.title}</p>
                    </div>
                    <p className="text-sm text-slate-400">{method.description}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
                  <BadgeCheck className="h-4 w-4" />
                  Keuntungan utama
                </p>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>• Komisi otomatis masuk ke saldo setelah transaksi berhasil.</li>
                  <li>• Tingkatkan level untuk rasio komisi yang lebih tinggi.</li>
                  <li>• Penarikan fleksibel dengan berbagai metode pembayaran.</li>
                  <li>• Dashboard lengkap untuk mengelola performa referral Anda.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-16 space-y-6">
          <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Zap className="h-5 w-5 text-yellow-400" />
                📊 Top Affiliate Berdasarkan Transaksi
              </CardTitle>
              <CardDescription className="text-slate-400">10 affiliate terbaik dengan transaksi terbanyak</CardDescription>
            </CardHeader>
            <CardContent>
              {affiliateStats.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  Belum ada data transaksi affiliate
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-slate-900/50">
                        <TableHead className="text-white">Ranking</TableHead>
                        <TableHead className="text-white">Nama Toko</TableHead>
                        <TableHead className="text-center text-white">📈 Transaksi</TableHead>
                        <TableHead className="text-right text-white">💰 Total Komisi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {affiliateStats.map((a, idx) => (
                        <TableRow key={`${a.storeName}-${idx}`} className="border-white/10 hover:bg-slate-900/50">
                          <TableCell>
                            <span className="inline-block rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 font-bold text-white">
                              #{idx + 1}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-white">{a.storeName}</TableCell>
                          <TableCell className="text-center">
                            <span className="inline-block rounded-lg bg-blue-500/20 px-3 py-1 font-semibold text-blue-300">
                              {a.transactionCount}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-400">{formatRupiah(a.totalCommission ?? 0)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 to-slate-950/90 p-8 text-center">
          <h2 className="text-3xl font-semibold text-white">Siap menjadi affiliate andalan?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-400">
            Daftar sekarang dan mulai dapatkan komisi dari setiap pelanggan yang Anda referensikan.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="bg-emerald-500 hover:bg-emerald-600">
              <Link href="/affiliate/register">Registrasi Affiliate</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-slate-700 bg-slate-950/70 text-white hover:bg-slate-800">
              <Link href="/affiliate/login">Masuk ke Akun</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  )
}

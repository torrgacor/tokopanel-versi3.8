import { getCollections, getAffiliateLevelProgress } from "@/lib/affiliate"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatRupiah } from "@/lib/utils"
import WithdrawForm from "@/components/affiliate/withdraw-form"
import AffiliateStatsCard from "@/components/affiliate/stats-card"
import Link from "next/link"
import { ArrowRight, BadgeCheck, CircleDollarSign, Sparkles, Wallet2, Wallet } from "lucide-react"
import { Progress } from "@/components/ui/progress"

export const dynamic = "force-dynamic"

export default async function AffiliateDashboardPage() {
  const cookieStore = await cookies()
  const affiliateUser = cookieStore.get("affiliate_user")?.value
  if (!affiliateUser) {
    redirect("/affiliate/login")
  }

  const { affiliateProfiles, affiliateTransactions, withdrawalRequests } = await getCollections()

  const affiliate = await affiliateProfiles.findOne({ userId: affiliateUser })
  if (!affiliate) redirect("/affiliate/register")
  const affiliateId = affiliate?.userId || "demo-affiliate"

  const commissions = await affiliateTransactions
    .find({ affiliateId, type: { $in: ["referral", "purchase", "admin_adjust"] } })
    .sort({ createdAt: -1 })
    .toArray()

  const withdrawals = await withdrawalRequests.find({ affiliateId }).sort({ createdAt: -1 }).toArray()

  const levelProgress = await getAffiliateLevelProgress(affiliateId).catch(() => null)

  const transactions = [...commissions.map((tx) => ({
    ...tx,
    kind: "commission",
  })),
  ...withdrawals.map((withdraw) => ({
    ...withdraw,
    kind: "withdraw",
  }))]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_35%),linear-gradient(135deg,_#07111f_0%,_#111827_100%)] px-4 py-6 text-slate-50 md:px-8 md:py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Card className="overflow-hidden border border-white/10 bg-slate-950/80 shadow-2xl backdrop-blur-xl">
          <CardContent className="grid gap-8 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-3 py-1 text-sm text-sky-200">
                <Sparkles className="h-4 w-4" />
                Dashboard Affiliate Premium
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold sm:text-4xl">Selamat datang, {affiliate?.storeName || "Affiliate"}!</h1>
                <p className="max-w-2xl text-sm text-slate-300 sm:text-base">
                  Pantau komisi, saldo, dan performa referral dari satu tempat yang lebih rapi dan informatif.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild className="bg-sky-600 hover:bg-sky-500">
                  <Link href="/affiliate/transactions">
                    Riwayat Transaksi
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-white/10 bg-white/10 text-white hover:bg-white/20">
                  <Link href="/affiliate">Ke Beranda</Link>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/10 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Komisi</p>
                  <p className="text-2xl font-semibold">{formatRupiah(affiliate?.referralStats?.totalCommission || 0)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-900/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Transaksi</p>
                  <p className="mt-1 text-lg font-semibold">{affiliate?.referralStats?.conversions ?? 0}</p>
                </div>
                <div className="rounded-xl bg-slate-900/70 p-3">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Pengunjung</p>
                  <p className="mt-1 text-lg font-semibold">{affiliate?.referralStats?.clicks ?? 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet2 className="h-5 w-5 text-sky-400" />
                Saldo Aktif
              </CardTitle>
              <CardDescription className="text-slate-400">Saldo yang tersedia untuk withdraw</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{formatRupiah(affiliate?.wallet?.balance ?? 0)}</div>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-amber-400" />
                Saldo Tertahan
              </CardTitle>
              <CardDescription className="text-slate-400">Jumlah yang masih menunggu proses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{formatRupiah(affiliate?.wallet?.pending ?? 0)}</div>
              <p className="mt-2 text-sm text-slate-400">Dalam proses withdraw</p>
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
            <CardHeader>
              <CardTitle>Status Akun</CardTitle>
              <CardDescription className="text-slate-400">Informasi status akun Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div
                  className={`h-3 w-3 rounded-full ${
                    affiliate?.status === "active" ? "bg-emerald-500" : affiliate?.status === "suspended" ? "bg-rose-500" : "bg-amber-500"
                  }`}
                />
                <span className="text-lg font-medium capitalize">{affiliate?.status ?? "pending"}</span>
              </div>
              {affiliate?.status === "pending" && <p className="mt-2 text-sm text-amber-400">⏳ Menunggu approval admin</p>}
            </CardContent>
          </Card>
        </div>

        <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
          <CardHeader>
            <CardTitle>Level Affiliate</CardTitle>
            <CardDescription className="text-slate-400">Progress transaksi referral Anda menuju level berikutnya</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-lg font-semibold">{levelProgress?.currentLevel?.name ?? "Bronze"}</p>
                  <p className="text-sm text-slate-400">{levelProgress?.message ?? "Belum ada transaksi referral"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-sky-600/10 px-3 py-1 text-sm font-semibold text-sky-300">
                  Komisi {levelProgress?.activeCommissionPercent ?? 0}%
                </span>
              </div>
              <div className="text-sm font-medium text-slate-400">
                {levelProgress?.currentCount ?? 0} / {levelProgress?.targetThreshold ?? "—"} transaksi
              </div>
            </div>
            {levelProgress?.nextLevel ? (
              <div className="space-y-2">
                <Progress value={Math.max(0, Math.min(100, levelProgress.progressPercent || 0))} className="h-3" />
                <div className="flex items-center justify-between text-sm text-slate-400">
                  <span>
                    Naik ke {levelProgress.nextLevel.name} ({levelProgress.nextLevel.commissionPercent}% komisi)
                  </span>
                  <span>{levelProgress.remainingTransactions} transaksi lagi</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-emerald-400">Level maksimal tercapai.</p>
            )}

            {levelProgress?.levels?.length ? (
              <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
                {levelProgress.levels.map((lvl) => {
                  const isCurrent = lvl.name === levelProgress?.currentLevel?.name
                  return (
                    <span
                      key={lvl.name}
                      className={`rounded-lg border px-3 py-1.5 text-xs ${
                        isCurrent
                          ? "border-sky-400 bg-sky-400/10 font-semibold text-sky-300"
                          : "border-white/10 text-slate-400"
                      }`}
                    >
                      {lvl.name} • {lvl.threshold} trx • {lvl.commissionPercent}%
                    </span>
                  )
                })}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-5">
          <AffiliateStatsCard
            referralCode={affiliate?.referralCode || ""}
            stats={affiliate?.referralStats || { clicks: 0, conversions: 0, successfulTransactions: 0, totalCommission: 0 }}
            level={{
              name: levelProgress?.currentLevel?.name ?? "Bronze",
              commissionPercent: levelProgress?.activeCommissionPercent ?? 0,
            }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-1">
          <WithdrawForm affiliateId={affiliateId} />
        </div>

        <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Riwayat Transaksi</span>
              <Button asChild variant="outline" size="sm" className="border-white/10 bg-white/10 text-white hover:bg-white/20">
                <Link href="/affiliate/transactions">
                  Lihat Semua <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardTitle>
            <CardDescription className="text-slate-400">Transaksi komisi dan penarikan terbaru</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {transactions.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">Belum ada transaksi</p>
                <p className="mt-1 text-xs text-slate-500">Mulai bagikan link referral Anda untuk mendapatkan komisi</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const isWithdraw = tx.kind === "withdraw"
                  const isCommission = tx.kind === "commission"
                  const amount = isCommission ? tx.commission || 0 : tx.amount || 0
                  const label = isWithdraw
                    ? tx.status === "pending"
                      ? "Withdraw Pending"
                      : tx.status === "approved"
                      ? "Withdraw Disetujui"
                      : "Withdraw Ditolak"
                    : tx.type === "referral"
                    ? "Komisi Referral"
                    : tx.type === "purchase"
                    ? "Komisi Penjualan"
                    : "Penyesuaian Saldo"
                  const amountPrefix = isWithdraw ? "-" : "+"
                  const amountClass = isWithdraw ? "text-rose-400" : "text-emerald-400"

                  return (
                    <div key={tx._id ?? tx.transactionId} className="rounded-xl border border-white/10 bg-slate-900/70 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{label}</p>
                            {tx.type === "referral" && <span className="rounded bg-sky-600/20 px-2 py-1 text-xs text-sky-300">Referral</span>}
                            {isWithdraw && tx.status === "approved" && <span className="rounded bg-emerald-600/20 px-2 py-1 text-xs text-emerald-300">Approved</span>}
                            {isWithdraw && tx.status === "rejected" && <span className="rounded bg-amber-600/20 px-2 py-1 text-xs text-amber-300">Rejected</span>}
                          </div>
                          <p className="text-sm text-slate-400">{new Date(tx.createdAt).toLocaleString("id-ID")}</p>
                          {tx.planId ? <p className="text-sm text-slate-400">Paket: {tx.planId}</p> : null}
                          {tx.txId ? <p className="text-sm text-slate-400">TxID: {tx.txId}</p> : null}
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${amountClass}`}>{amountPrefix}{formatRupiah(amount)}</p>
                          <p className="text-sm text-slate-400">{isWithdraw ? "Penarikan saldo" : "Pendapatan komisi"}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-sky-500/20 bg-sky-500/10 shadow-lg backdrop-blur-xl">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-sky-100">💡 Tips Tingkatkan Komisi</h3>
              <ul className="space-y-1 text-sm text-sky-100/80">
                <li>✓ Bagikan link referral ke grup WhatsApp, Telegram, atau media sosial Anda</li>
                <li>✓ Buat content yang menarik tentang produk kami</li>
                <li>✓ Sesuaikan harga markup Anda untuk kompetitif namun tetap menguntungkan</li>
                <li>✓ Monitor statistik referral untuk mengetahui channel yang paling efektif</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
                    }

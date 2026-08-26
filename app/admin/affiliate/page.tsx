import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { getCollections } from "@/lib/affiliate"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AdminWithdrawQueue from "@/components/admin/withdraw-queue"
import AffiliatesManage from "@/components/admin/affiliates-manage"
import AffiliateCommissionSettings from "@/components/admin/affiliate-commission-settings"
import AffiliateLevelsManager from "@/components/admin/affiliate-levels-manager"
import { formatRupiah } from "@/lib/utils"
import { verifyAdminAuthToken, ADMIN_AUTH_COOKIE } from "@/lib/admin-auth"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function AdminAffiliatesPage() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get(ADMIN_AUTH_COOKIE)?.value
  if (!verifyAdminAuthToken(adminToken)) {
    redirect("/admin")
  }

  // fetch aggregate statistics for admin overview
  let affiliateStats: Array<any> = []
  try {
    const { affiliateProfiles, affiliateTransactions } = await getCollections()
    const affiliates = await affiliateProfiles.find({}).toArray()
    const transactionStats = await affiliateTransactions
      .aggregate([
        { $group: { _id: "$affiliateId", transactionCount: { $sum: 1 }, totalCommission: { $sum: "$commission" } } },
      ])
      .toArray()

    const statsMap = new Map(transactionStats.map((s) => [s._id, s]))

    affiliateStats = affiliates
      .map((a) => ({
        userId: a.userId,
        storeName: a.storeName,
        email: a.email,
        status: a.status,
        createdAt: a.createdAt,
        transactionCount: statsMap.get(a.userId)?.transactionCount ?? 0,
        totalCommission: statsMap.get(a.userId)?.totalCommission ?? 0,
      }))
      .sort((a, b) => b.transactionCount - a.transactionCount)
  } catch (e) {
    console.error("Failed to load affiliate stats", e)
  }

  return (
    <div className="space-y-8 p-6 md:p-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Admin Panel Affiliate</h1>
          <p className="text-sm text-muted-foreground">Kelola akun affiliate, cek status, dan proses penarikan secara manual.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/vouchermts" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Kelola Voucher
          </Link>
          <Link href="/admin/cron" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Kelola Cron Job
          </Link>
        </div>
      </div>

      <AffiliateCommissionSettings />

      <AffiliateLevelsManager />

      <AdminWithdrawQueue />

      <AffiliatesManage />

      <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">📊 Statistik Transaksi Affiliate</CardTitle>
          <CardDescription className="text-slate-400">Urutan affiliate berdasarkan jumlah transaksi (terbanyak ke tersedikit)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-slate-900/50">
                  <TableHead className="text-white">Ranking</TableHead>
                  <TableHead className="text-white">Nama Toko</TableHead>
                  <TableHead className="text-white">Email</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-center text-white">📈 Transaksi</TableHead>
                  <TableHead className="text-right text-white">💰 Total Komisi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {affiliateStats.map((a, idx) => (
                  <TableRow key={a.userId} className="border-white/10 hover:bg-slate-900/50">
                    <TableCell className="font-bold text-emerald-400">#{idx + 1}</TableCell>
                    <TableCell className="font-medium text-white">{a.storeName}</TableCell>
                    <TableCell className="text-sm text-slate-300">{a.email}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        a.status === "active" ? "bg-emerald-500/20 text-emerald-300" :
                        a.status === "pending" ? "bg-amber-500/20 text-amber-300" :
                        "bg-rose-500/20 text-rose-300"
                      }`}>
                        {a.status}
                      </span>
                    </TableCell>
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
            {affiliateStats.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                Belum ada data affiliate
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

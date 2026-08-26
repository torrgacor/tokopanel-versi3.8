import { getCollections } from "@/lib/affiliate"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatRupiah, formatDate } from "@/lib/utils"
import Link from "next/link"
import { TrendingUp, Wallet, History, Filter } from "lucide-react"

export const dynamic = "force-dynamic"

interface SearchParams {
  type?: string | string[]
  status?: string | string[]
  q?: string | string[]
}

export default async function AffiliateTransactionsPage({ searchParams }: { searchParams?: SearchParams }) {
  const cookieStore = cookies()
  const affiliateUser = cookieStore.get("affiliate_user")?.value
  if (!affiliateUser) {
    redirect("/affiliate/login")
  }

  const { affiliateProfiles, affiliateTransactions, withdrawalRequests } = await getCollections()
  const affiliate = await affiliateProfiles.findOne({ userId: affiliateUser })
  if (!affiliate) redirect("/affiliate/register")

  const typeFilter = Array.isArray(searchParams?.type) ? searchParams?.type[0] : searchParams?.type
  const statusFilter = Array.isArray(searchParams?.status) ? searchParams?.status[0] : searchParams?.status
  const queryFilter = Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q

  const commissionTransactions = await affiliateTransactions
    .find({ affiliateId: affiliateUser, type: { $in: ["referral", "purchase", "admin_adjust"] } })
    .sort({ createdAt: -1 })
    .toArray()

  const withdrawTransactions = await withdrawalRequests
    .find({ affiliateId: affiliateUser })
    .sort({ createdAt: -1 })
    .toArray()

  const rows = [
    ...commissionTransactions.map((tx) => ({
      id: tx._id?.toString() || tx.transactionId,
      date: tx.createdAt,
      category: "Komisi",
      type: tx.type === "referral" ? "Referral" : tx.type === "purchase" ? "Penjualan" : "Penyesuaian Admin",
      status: "Selesai",
      amount: tx.commission ?? 0,
      detail: tx.planId ? `Paket: ${tx.planId}` : "",
      reference: tx.transactionId || "",
      proofUrl: "",
      rawType: tx.type,
    })),
    ...withdrawTransactions.map((withdraw) => ({
      id: withdraw._id.toString(),
      date: withdraw.createdAt,
      category: "Withdraw",
      type:
        withdraw.status === "approved"
          ? "Disetujui"
          : withdraw.status === "rejected"
          ? "Ditolak"
          : "Pending",
      status: withdraw.status,
      amount: withdraw.amount,
      detail: `${withdraw.method} • ${withdraw.accountNumber}`,
      reference: withdraw.txId || "",
      proofUrl: withdraw.proof?.url || "",
      rawType: "withdraw",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const filteredRows = rows.filter((row) => {
    if (typeFilter && typeFilter !== "all") {
      if (typeFilter === "commission" && row.category !== "Komisi") return false
      if (typeFilter === "withdraw" && row.category !== "Withdraw") return false
      if (typeFilter === "referral" && row.rawType !== "referral") return false
      if (typeFilter === "penjualan" && row.rawType !== "purchase") return false
      if (typeFilter === "adjust" && row.rawType !== "admin_adjust") return false
    }

    if (statusFilter && statusFilter !== "all") {
      if (row.status !== statusFilter) return false
    }

    if (queryFilter) {
      const search = queryFilter.toLowerCase()
      const haystack = `${row.category} ${row.type} ${row.detail} ${row.reference}`.toLowerCase()
      if (!haystack.includes(search)) return false
    }

    return true
  })

  const totals = rows.reduce(
    (acc, row) => {
      if (row.category === "Komisi") {
        acc.totalCommission += row.amount
      } else {
        acc.totalWithdraw += row.amount
      }
      acc.totalCount += 1
      return acc
    },
    { totalCommission: 0, totalWithdraw: 0, totalCount: 0 }
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="space-y-8 p-6 md:p-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <History className="h-6 w-6 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">📋 Riwayat Transaksi</h1>
          </div>
          <p className="text-slate-400">Lihat semua komisi, penarikan, dan penyesuaian saldo Anda.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
                Total Komisi
              </CardTitle>
              <CardDescription className="text-slate-400">Semua komisi diterima</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-emerald-400">{formatRupiah(totals.totalCommission)}</div>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Wallet className="h-5 w-5 text-sky-400" />
                Total Withdraw
              </CardTitle>
              <CardDescription className="text-slate-400">Jumlah yang ditarik</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-sky-400">{formatRupiah(totals.totalWithdraw)}</div>
            </CardContent>
          </Card>
          <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Filter className="h-5 w-5 text-amber-400" />
                Jumlah Transaksi
              </CardTitle>
              <CardDescription className="text-slate-400">Jumlah semua entry</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold text-amber-400">{totals.totalCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-slate-400 mb-3">Filter Jenis Transaksi</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={typeFilter === "all" || !typeFilter ? "default" : "outline"} 
                size="sm" 
                asChild
                className={typeFilter === "all" || !typeFilter ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
              >
                <Link href="/affiliate/transactions?type=all">Semua</Link>
              </Button>
              <Button 
                variant={typeFilter === "commission" ? "default" : "outline"} 
                size="sm" 
                asChild
                className={typeFilter === "commission" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
              >
                <Link href="/affiliate/transactions?type=commission">Komisi</Link>
              </Button>
              <Button 
                variant={typeFilter === "withdraw" ? "default" : "outline"} 
                size="sm" 
                asChild
                className={typeFilter === "withdraw" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
              >
                <Link href="/affiliate/transactions?type=withdraw">Withdraw</Link>
              </Button>
              <Button 
                variant={typeFilter === "referral" ? "default" : "outline"} 
                size="sm" 
                asChild
                className={typeFilter === "referral" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
              >
                <Link href="/affiliate/transactions?type=referral">Referral</Link>
              </Button>
            </div>
          </div>
          <div>
            <p className="text-sm text-slate-400 mb-3">Filter Status</p>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={statusFilter === "all" || !statusFilter ? "default" : "outline"} 
                size="sm" 
                asChild
                className={statusFilter === "all" || !statusFilter ? "bg-blue-600 hover:bg-blue-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
              >
                <Link href="/affiliate/transactions?status=all">Semua Status</Link>
              </Button>
              <Button 
                variant={statusFilter === "pending" ? "default" : "outline"} 
                size="sm" 
                asChild
                className={statusFilter === "pending" ? "bg-amber-600 hover:bg-amber-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
              >
                <Link href="/affiliate/transactions?status=pending">Pending</Link>
              </Button>
              <Button 
                variant={statusFilter === "approved" ? "default" : "outline"} 
                size="sm" 
                asChild
                className={statusFilter === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
              >
                <Link href="/affiliate/transactions?status=approved">Disetujui</Link>
              </Button>
              <Button 
                variant={statusFilter === "rejected" ? "default" : "outline"} 
                size="sm" 
                asChild
                className={statusFilter === "rejected" ? "bg-rose-600 hover:bg-rose-700" : "border-slate-700 text-slate-400 hover:bg-slate-800"}
              >
                <Link href="/affiliate/transactions?status=rejected">Ditolak</Link>
              </Button>
            </div>
          </div>
        </div>

        <Card className="border border-white/10 bg-slate-950/70 shadow-lg backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">📊 Detail Transaksi</CardTitle>
            <CardDescription className="text-slate-400">{filteredRows.length} entri cocok dengan filter saat ini.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-slate-900/50">
                  <TableHead className="text-white">Tanggal</TableHead>
                  <TableHead className="text-white">Jenis</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Detail</TableHead>
                  <TableHead className="text-white">Jumlah</TableHead>
                  <TableHead className="text-white">Referensi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id} className="border-white/10 hover:bg-slate-900/50">
                    <TableCell className="text-slate-300">{formatDate(row.date)}</TableCell>
                    <TableCell className="text-slate-300">{row.category === "Komisi" ? `${row.category} - ${row.type}` : row.category}</TableCell>
                    <TableCell>
                      <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        row.status === "approved" ? "bg-emerald-500/20 text-emerald-300" :
                        row.status === "pending" ? "bg-amber-500/20 text-amber-300" :
                        row.status === "rejected" ? "bg-rose-500/20 text-rose-300" :
                        "bg-slate-500/20 text-slate-300"
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-300">{row.detail}</TableCell>
                    <TableCell className={`font-semibold ${row.category === "Withdraw" ? "text-rose-400" : "text-emerald-400"}`}>
                      {row.category === "Withdraw" ? "-" : "+"}{formatRupiah(row.amount)}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {row.reference || "-"}
                      {row.proofUrl ? (
                        <>
                          {" "}
                          <a href={row.proofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
                            Lihat
                          </a>
                        </>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredRows.length === 0 && (
              <div className="py-8 text-center text-slate-400">
                Tidak ada transaksi yang cocok dengan filter
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { formatRupiah, formatDate } from "@/lib/utils"
import {
  approveAffiliate,
  rejectAffiliate,
} from "@/app/actions/affiliate-registration"
import {
  adjustAffiliateBalance,
  toggleAffiliateStatus,
  getAllAffiliates,
  updateAffiliateProfile,
  deleteAffiliate,
} from "@/app/actions/referral-tracking"
import {
  Loader2,
  Check,
  X,
  Pencil,
  Trash2,
  Pause,
  Play,
  Search,
  Users,
  TrendingUp,
  Clock3,
  CircleAlert,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

const FORM_KOSONG = {
  storeName: "",
  email: "",
  ownerName: "",
  phoneNumber: "",
  withdrawMethod: "transfer_bank",
  accountNumber: "",
  accountName: "",
}

export default function AffiliatesManage() {
  const [affiliates, setAffiliates] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [statusSummary, setStatusSummary] = useState({ total: 0, active: 0, pending: 0, suspended: 0, rejected: 0 })

  const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null)
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showEditDrawer, setShowEditDrawer] = useState(false)
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const [rejectionReason, setRejectionReason] = useState("")
  const [editForm, setEditForm] = useState(FORM_KOSONG)
  const [adjustAmount, setAdjustAmount] = useState("")
  const [adjustReason, setAdjustReason] = useState("")
  const [newStatus, setNewStatus] = useState<"active" | "suspended" | "rejected">("suspended")
  const [statusReason, setStatusReason] = useState("")

  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setPage(1)
  }, [filterStatus, searchTerm])

  useEffect(() => {
    loadAffiliates()
  }, [filterStatus, searchTerm, page])

  const loadAffiliates = async () => {
    setIsLoading(true)
    try {
      const result = await getAllAffiliates(page, 10, {
        status: filterStatus === "all" ? undefined : filterStatus,
      })

      if (result.success) {
        setAffiliates(result.data || [])
        setPagination(result.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 })
        setStatusSummary(result.statusSummary || { total: 0, active: 0, pending: 0, suspended: 0, rejected: 0 })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const dataTampil = affiliates.filter((r) => {
    if (!searchTerm.trim()) return true
    const kata = searchTerm.toLowerCase()
    return (
      r.storeName?.toLowerCase().includes(kata) ||
      r.email?.toLowerCase().includes(kata)
    )
  })

  const handleApprove = async () => {
    if (!selectedAffiliate) return
    setIsProcessing(true)

    try {
      const result = await approveAffiliate(selectedAffiliate.userId)
      if (result.success) {
        toast({ title: "Sukses", description: "Affiliate berhasil disetujui" })
        setShowApproveDialog(false)
        loadAffiliates()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menyetujui affiliate",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedAffiliate) return
    setIsProcessing(true)

    try {
      const result = await rejectAffiliate(selectedAffiliate.userId, rejectionReason)
      if (result.success) {
        toast({ title: "Sukses", description: "Affiliate berhasil ditolak" })
        setShowRejectDialog(false)
        setRejectionReason("")
        loadAffiliates()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menolak affiliate",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const bukaEdit = (affiliate: any) => {
    setSelectedAffiliate(affiliate)
    setEditForm({
      storeName: affiliate.storeName || "",
      email: affiliate.email || "",
      ownerName: affiliate.ownerName || "",
      phoneNumber: affiliate.phoneNumber || "",
      withdrawMethod: affiliate.withdrawMethod || "transfer_bank",
      accountNumber: affiliate.accountNumber || "",
      accountName: affiliate.accountName || "",
    })
    setAdjustAmount("")
    setAdjustReason("")
    setShowEditDrawer(true)
  }

  const handleSimpanProfil = async () => {
    if (!selectedAffiliate) return

    if (!editForm.storeName.trim() || !editForm.email.trim() || !editForm.ownerName.trim() || !editForm.phoneNumber.trim()) {
      toast({ title: "Error", description: "Nama toko, email, nama pemilik, dan no telepon wajib diisi", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    try {
      const result = await updateAffiliateProfile(selectedAffiliate.userId, editForm)
      if (result.success) {
        toast({ title: "Sukses", description: "Data affiliate berhasil diperbarui" })
        setSelectedAffiliate(result.data)
        loadAffiliates()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal memperbarui data affiliate",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleAdjustBalance = async () => {
    if (!selectedAffiliate || !adjustAmount || !adjustReason) {
      toast({ title: "Error", description: "Nominal dan alasan penyesuaian saldo wajib diisi", variant: "destructive" })
      return
    }

    setIsProcessing(true)
    try {
      const result = await adjustAffiliateBalance(
        selectedAffiliate.userId,
        parseInt(adjustAmount),
        adjustReason,
        "admin"
      )

      if (result.success) {
        toast({ title: "Sukses", description: result.message })
        setAdjustAmount("")
        setAdjustReason("")
        loadAffiliates()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengupdate saldo",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedAffiliate) return
    setIsProcessing(true)

    try {
      const result = await toggleAffiliateStatus(selectedAffiliate.userId, newStatus, statusReason)

      if (result.success) {
        toast({ title: "Sukses", description: result.message })
        setShowStatusDialog(false)
        setStatusReason("")
        loadAffiliates()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengupdate status",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleHapusAffiliate = async () => {
    if (!selectedAffiliate) return
    setIsProcessing(true)

    try {
      const result = await deleteAffiliate(selectedAffiliate.userId)
      if (result.success) {
        toast({ title: "Sukses", description: "Affiliate berhasil dihapus" })
        setShowDeleteDialog(false)
        setShowEditDrawer(false)
        loadAffiliates()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus affiliate",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      suspended: "bg-red-100 text-red-800",
      rejected: "bg-gray-100 text-gray-800",
    }
    return badges[status as keyof typeof badges] || badges.pending
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Kelola Affiliate</h1>
        <p className="text-muted-foreground">Approve, monitor, dan kelola akun affiliate</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Affiliate</p>
                <p className="text-2xl font-semibold">{statusSummary.total}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2.5 text-primary">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Aktif</p>
                <p className="text-2xl font-semibold">{statusSummary.active}</p>
              </div>
              <div className="rounded-full bg-emerald-500/10 p-2.5 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-semibold">{statusSummary.pending}</p>
              </div>
              <div className="rounded-full bg-amber-500/10 p-2.5 text-amber-600">
                <Clock3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Suspended / Rejected</p>
                <p className="text-2xl font-semibold">{statusSummary.suspended + statusSummary.rejected}</p>
              </div>
              <div className="rounded-full bg-rose-500/10 p-2.5 text-rose-600">
                <CircleAlert className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Cari & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Cari nama toko atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card">
        <CardHeader>
          <CardTitle>Ringkasan Pendaftar Affiliate</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Jumlah User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Active</TableCell>
                  <TableCell>{statusSummary.active}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Pending</TableCell>
                  <TableCell>{statusSummary.pending}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Suspended</TableCell>
                  <TableCell>{statusSummary.suspended}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Rejected</TableCell>
                  <TableCell>{statusSummary.rejected}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border bg-card overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Menampilkan {Math.min((page - 1) * pagination.limit + 1, pagination.total)}-{Math.min(page * pagination.limit, pagination.total)} dari {pagination.total} affiliate
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
                <ChevronLeft className="mr-1 h-4 w-4" /> Sebelumnya
              </Button>
              {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={pageNumber === page ? "default" : "outline"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setPage(pageNumber)}
                  disabled={isLoading}
                >
                  {pageNumber}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages || isLoading}>
                Berikutnya <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : dataTampil.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Tidak ada affiliate</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Toko</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Level</TableHead>
                    <TableHead>Transaksi</TableHead>
                    <TableHead>Saldo Aktif</TableHead>
                    <TableHead>Komisi</TableHead>
                    <TableHead>Terdaftar</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataTampil.map((affiliate) => (
                    <TableRow key={affiliate.userId}>
                      <TableCell className="font-medium">{affiliate.storeName}</TableCell>
                      <TableCell className="text-sm">{affiliate.email}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(affiliate.status)}`}>
                          {affiliate.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{affiliate.levelName || "Bronze"}</span>
                          <span className="text-xs text-muted-foreground">
                            {affiliate.levelCommissionPercent ?? 0}% • {affiliate.referralStats?.conversions ?? 0} konversi
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{affiliate.transactionCount ?? 0} trx</span>
                      </TableCell>
                      <TableCell>{formatRupiah(affiliate.wallet?.balance ?? 0)}</TableCell>
                      <TableCell>{formatRupiah(affiliate.referralStats?.totalCommission ?? 0)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(affiliate.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => bukaEdit(affiliate)}>
                            <Pencil className="w-4 h-4" />
                          </Button>

                          {affiliate.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-green-600 hover:text-green-700"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate)
                                  setShowApproveDialog(true)
                                }}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700"
                                onClick={() => {
                                  setSelectedAffiliate(affiliate)
                                  setShowRejectDialog(true)
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {affiliate.status === "active" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-yellow-600 hover:text-yellow-700"
                              onClick={() => {
                                setSelectedAffiliate(affiliate)
                                setNewStatus("suspended")
                                setShowStatusDialog(true)
                              }}
                            >
                              <Pause className="w-4 h-4" />
                            </Button>
                          )}

                          {affiliate.status === "suspended" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                setSelectedAffiliate(affiliate)
                                setNewStatus("active")
                                setShowStatusDialog(true)
                              }}
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedAffiliate(affiliate)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Setujui Affiliate?</AlertDialogTitle>
            <AlertDialogDescription>
              Setujui {selectedAffiliate?.storeName}? Email konfirmasi akan dikirim ke pemilik.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? "Memproses..." : "Setujui"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tolak Affiliate</DialogTitle>
            <DialogDescription>
              Masukkan alasan penolakan untuk {selectedAffiliate?.storeName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alasan Penolakan</Label>
              <Textarea
                placeholder="Jelaskan mengapa affiliate ditolak..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing}>
              {isProcessing ? "Memproses..." : "Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Status Affiliate</DialogTitle>
            <DialogDescription>
              Ubah status menjadi {newStatus === "suspended" ? "Suspended" : "Active"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Alasan (Opsional)</Label>
              <Textarea
                placeholder="Jelaskan alasan perubahan status..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              Batal
            </Button>
            <Button onClick={handleToggleStatus} disabled={isProcessing}>
              {isProcessing ? "Memproses..." : "Ubah"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Affiliate?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus akun {selectedAffiliate?.storeName} beserta seluruh riwayat harga custom, withdraw, dan transaksinya secara permanen. Tindakan ini tidak bisa dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHapusAffiliate}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Menghapus..." : "Hapus Permanen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer open={showEditDrawer} onOpenChange={setShowEditDrawer}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Edit Data Affiliate</DrawerTitle>
            <DrawerDescription>
              {selectedAffiliate?.storeName} • {selectedAffiliate?.userId}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            <section className="space-y-4">
              <h3 className="font-semibold">Informasi Toko & Pemilik</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nama Toko</Label>
                  <Input
                    value={editForm.storeName}
                    onChange={(e) => setEditForm((f) => ({ ...f, storeName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Pemilik</Label>
                  <Input
                    value={editForm.ownerName}
                    onChange={(e) => setEditForm((f) => ({ ...f, ownerName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>No Telepon</Label>
                  <Input
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-border pt-4">
              <h3 className="font-semibold">Metode Pencairan Dana</h3>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Metode</Label>
                  <Select
                    value={editForm.withdrawMethod}
                    onValueChange={(value) => setEditForm((f) => ({ ...f, withdrawMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="transfer_bank">Transfer Bank</SelectItem>
                      <SelectItem value="e_wallet">E-Wallet (OVO/Dana/Gopay)</SelectItem>
                      <SelectItem value="pulsa">Pulsa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nomor Akun/Rekening</Label>
                  <Input
                    value={editForm.accountNumber}
                    onChange={(e) => setEditForm((f) => ({ ...f, accountNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nama Pemilik Akun</Label>
                  <Input
                    value={editForm.accountName}
                    onChange={(e) => setEditForm((f) => ({ ...f, accountName: e.target.value }))}
                  />
                </div>
              </div>
              <Button onClick={handleSimpanProfil} disabled={isProcessing}>
                {isProcessing ? "Menyimpan..." : "Simpan Perubahan Data"}
              </Button>
            </section>

            <section className="space-y-4 border-t border-border pt-4">
              <h3 className="font-semibold">Penyesuaian Saldo</h3>
              <p className="text-sm text-muted-foreground">
                Saldo aktif saat ini: <span className="font-medium text-foreground">{formatRupiah(selectedAffiliate?.wallet?.balance ?? 0)}</span>
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nominal Perubahan (bisa negatif)</Label>
                  <Input
                    type="number"
                    placeholder="Contoh: 50000 atau -20000"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Alasan Penyesuaian</Label>
                  <Input
                    placeholder="Contoh: Koreksi saldo manual"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                  />
                </div>
              </div>
              <Button variant="outline" onClick={handleAdjustBalance} disabled={isProcessing}>
                {isProcessing ? "Memproses..." : "Terapkan Penyesuaian Saldo"}
              </Button>
            </section>

            <section className="space-y-2 border-t border-border pt-4">
              <h3 className="font-semibold text-red-600">Zona Berbahaya</h3>
              <p className="text-sm text-muted-foreground">
                Menghapus affiliate akan menghilangkan seluruh data terkait secara permanen.
              </p>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus Affiliate Ini
              </Button>
            </section>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Tutup</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
  createVoucher,
  getAllVouchers,
  updateVoucher,
  deactivateVoucher,
  activateVoucher,
  deleteVoucher,
  getVoucherStatistics,
  getVoucherUsageDetails,
  type DiscountType,
  type Voucher,
} from "@/app/actions/voucher-actions"
import { useToast } from "@/hooks/use-toast"
import { formatRupiah, formatDate } from "@/lib/utils"
import {
  Loader2,
  Plus,
  Edit2,
  Trash2,
  Eye,
  BarChart3,
  Power,
  PowerOff,
  Search,
  Users,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

type VoucherWithId = Voucher & { _id: string }

export default function AdminVoucherManagementPage() {
  const [tab, setTab] = useState<"list" | "create">("list")
  const [vouchers, setVouchers] = useState<VoucherWithId[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive" | "expired">("all")
  const [stats, setStats] = useState<any>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    code: "",
    discountValue: "",
    maxUses: "",
    minimumPurchase: "",
    downloadUrl: "",
    expiryDate: "",
    description: "",
  })
  const [discountType, setDiscountType] = useState<DiscountType>("percentage")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modal states
  const [editModal, setEditModal] = useState(false)
  const [editingVoucher, setEditingVoucher] = useState<VoucherWithId | null>(null)
  const [viewModal, setViewModal] = useState(false)
  const [viewingVoucher, setViewingVoucher] = useState<VoucherWithId | null>(null)
  const [usageDetails, setUsageDetails] = useState<any[]>([])
  const [deleteAlert, setDeleteAlert] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { toast } = useToast()

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
    })
    router.push("/admin")
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/admin/check", { cache: "no-store" })
        if (response.ok) {
          setIsAuthenticated(true)
        } else {
          router.replace("/admin")
        }
      } catch {
        router.replace("/admin")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  // Load data
  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    loadVouchers()
    loadStatistics()
  }, [page, searchTerm, filterStatus, isAuthenticated])

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-950 text-white">
        <p className="text-lg">Memeriksa autentikasi...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const loadVouchers = async () => {
    setIsLoading(true)
    try {
      const result = await getAllVouchers(page, 10, {
        search: searchTerm || undefined,
        status: filterStatus === "all" ? undefined : (filterStatus as any),
      })

      if (result.success) {
        setVouchers(result.data as VoucherWithId[])
        setTotalPages(result.pagination?.totalPages || 1)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat voucher",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const result = await getVoucherStatistics()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error("Error loading statistics:", error)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code.trim()) {
      toast({
        title: "Error",
        description: "Kode voucher tidak boleh kosong",
        variant: "destructive",
      })
      return
    }

    if (!formData.discountValue) {
      toast({
        title: "Error",
        description: "Nilai diskon harus diisi",
        variant: "destructive",
      })
      return
    }

    const discountValue = parseFloat(formData.discountValue)

    if (discountType === "percentage" && (discountValue < 0 || discountValue > 100)) {
      toast({
        title: "Error",
        description: "Persentase diskon harus antara 0-100",
        variant: "destructive",
      })
      return
    }

    if (discountValue <= 0) {
      toast({
        title: "Error",
        description: "Nilai diskon harus lebih besar dari 0",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const result = await createVoucher({
        code: formData.code.toUpperCase(),
        discountType,
        discountValue,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
        minimumPurchase: formData.minimumPurchase ? parseInt(formData.minimumPurchase) : undefined,
        downloadUrl: formData.downloadUrl ? formData.downloadUrl.trim() : undefined,
        expiryDate: formData.expiryDate || undefined,
        description: formData.description || undefined,
      })

      if (result.success) {
        toast({
          title: "Sukses!",
          description: result.message,
        })

        setFormData({
          code: "",
          discountValue: "",
          maxUses: "",
          expiryDate: "",
          description: "",
        })
        setDiscountType("percentage")
        setTab("list")
        setPage(1)
        loadVouchers()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal membuat voucher",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (voucher: VoucherWithId) => {
    setEditingVoucher(voucher)
    setFormData({
      code: voucher.code,
      discountValue: voucher.discountValue.toString(),
      maxUses: voucher.maxUses?.toString() || "",
      minimumPurchase: voucher.minimumPurchase?.toString() || "",
      downloadUrl: voucher.downloadUrl || "",
      expiryDate: voucher.expiryDate ? new Date(voucher.expiryDate).toISOString().split("T")[0] : "",
      description: voucher.description || "",
    })
    setDiscountType(voucher.discountType)
    setEditModal(true)
  }

  const handleUpdateVoucher = async () => {
    if (!editingVoucher) return

    setIsSubmitting(true)

    try {
      const result = await updateVoucher(editingVoucher._id, {
        discountValue: parseFloat(formData.discountValue),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        minimumPurchase: formData.minimumPurchase ? parseInt(formData.minimumPurchase) : null,
        downloadUrl: formData.downloadUrl ? formData.downloadUrl.trim() : null,
        expiryDate: formData.expiryDate || null,
        description: formData.description || undefined,
      })

      if (result.success) {
        toast({
          title: "Sukses!",
          description: result.message,
        })
        setEditModal(false)
        loadVouchers()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengupdate voucher",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewDetails = async (voucher: VoucherWithId) => {
    setViewingVoucher(voucher)
    try {
      const result = await getVoucherUsageDetails(voucher._id)
      if (result.success) {
        setUsageDetails(result.data || [])
      }
    } catch (error) {
      console.error("Error loading usage details:", error)
    }
    setViewModal(true)
  }

  const handleToggleStatus = async (voucher: VoucherWithId) => {
    try {
      const result = voucher.active
        ? await deactivateVoucher(voucher._id)
        : await activateVoucher(voucher._id)

      if (result.success) {
        toast({
          title: "Sukses!",
          description: result.message,
        })
        loadVouchers()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal mengubah status voucher",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (voucherId: string) => {
    try {
      const result = await deleteVoucher(voucherId)

      if (result.success) {
        toast({
          title: "Sukses!",
          description: result.message,
        })
        setDeleteAlert(false)
        setDeletingId(null)
        loadVouchers()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Gagal menghapus voucher",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-700 to-dark-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Manajemen Voucher Admin</h1>
            <p className="text-gray-400">Kelola dan monitoring semua voucher diskon</p>
          </div>
          <Button onClick={handleLogout} className="self-start bg-red-600 hover:bg-red-700 text-white">
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          <Button
            variant={tab === "list" ? "default" : "outline"}
            onClick={() => setTab("list")}
            className={tab === "list" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            📋 Daftar Voucher
          </Button>
          <Button
            variant={tab === "create" ? "default" : "outline"}
            onClick={() => setTab("create")}
            className={tab === "create" ? "bg-red-600 hover:bg-red-700" : ""}
          >
            <Plus className="w-4 h-4 mr-2" />
            Buat Baru
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/affiliate")}
            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
          >
            <Users className="w-4 h-4 mr-2" />
            Kelola Affiliate
          </Button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {tab === "list" ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Statistics */}
              {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="bg-dark-400 border-dark-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-300">Total Voucher</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">{stats.vouchers?.total}</div>
                      <p className="text-xs text-green-400 mt-1">
                        {stats.vouchers?.active} aktif
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-dark-400 border-dark-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-300">Total Claim</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">{stats.usage?.totalClaims}</div>
                      <p className="text-xs text-blue-400 mt-1">
                        {stats.usage?.totalUsed} terpakai
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-dark-400 border-dark-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-300">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">{stats.usage?.conversionRate}%</div>
                      <p className="text-xs text-purple-400 mt-1">
                        {stats.usage?.totalUnused} belum dipakai
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-dark-400 border-dark-300">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-gray-300">Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-white">{stats.vouchers?.expired}</div>
                      <p className="text-xs text-red-400 mt-1">
                        {stats.vouchers?.inactive} inactive
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Search & Filter */}
              <Card className="bg-dark-400 border-dark-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Cari & Filter
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Cari kode voucher..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setPage(1)
                      }}
                      className="bg-dark-500 border-dark-200 text-white"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="md:w-32 bg-dark-500 border-dark-200 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-dark-500 border-dark-200 text-white">
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Vouchers Table */}
              <Card className="bg-dark-400 border-dark-300">
                <CardHeader>
                  <CardTitle>Daftar Voucher</CardTitle>
                  <CardDescription className="text-dark-200">
                    {vouchers.length} voucher ditemukan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-dark-300 hover:bg-transparent">
                          <TableHead className="text-gray-300">Kode</TableHead>
                          <TableHead className="text-gray-300">Tipe</TableHead>
                          <TableHead className="text-gray-300">Nilai</TableHead>
                          <TableHead className="text-gray-300">Penggunaan</TableHead>
                          <TableHead className="text-gray-300">Expiry</TableHead>
                          <TableHead className="text-gray-300">Status</TableHead>
                          <TableHead className="text-right text-gray-300">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8">
                              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" />
                            </TableCell>
                          </TableRow>
                        ) : vouchers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                              Tidak ada voucher
                            </TableCell>
                          </TableRow>
                        ) : (
                          vouchers.map((voucher) => (
                            <TableRow key={voucher._id} className="border-dark-300 hover:bg-dark-500/50">
                              <TableCell className="font-mono font-bold text-amber-400">
                                {voucher.code}
                              </TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  voucher.discountType === "percentage"
                                    ? "bg-blue-900/50 text-blue-300"
                                    : "bg-green-900/50 text-green-300"
                                }`}>
                                  {voucher.discountType === "percentage" ? "%" : "Rp"}
                                </span>
                              </TableCell>
                              <TableCell>
                                {voucher.discountType === "percentage"
                                  ? `${voucher.discountValue}%`
                                  : formatRupiah(voucher.discountValue)}
                              </TableCell>
                              <TableCell>
                                {voucher.currentUses}/{voucher.maxUses || "∞"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {voucher.expiryDate
                                  ? new Date(voucher.expiryDate) < new Date()
                                    ? `Expired`
                                    : formatDate(voucher.expiryDate)
                                  : "No limit"}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${
                                    voucher.active && (!voucher.expiryDate || new Date(voucher.expiryDate) > new Date())
                                      ? "bg-green-900/50 text-green-300"
                                      : "bg-red-900/50 text-red-300"
                                  }`}
                                >
                                  {voucher.active && (!voucher.expiryDate || new Date(voucher.expiryDate) > new Date())
                                    ? "Aktif"
                                    : "Inactive"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleViewDetails(voucher)}
                                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(voucher)}
                                    className="text-amber-400 hover:text-amber-300 hover:bg-amber-900/20"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleToggleStatus(voucher)}
                                    className={voucher.active ? "text-red-400 hover:text-red-300 hover:bg-red-900/20" : "text-green-400 hover:text-green-300 hover:bg-green-900/20"}
                                  >
                                    {voucher.active ? (
                                      <PowerOff className="w-4 h-4" />
                                    ) : (
                                      <Power className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setDeletingId(voucher._id)
                                      setDeleteAlert(true)
                                    }}
                                    className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-dark-300">
                      <p className="text-sm text-gray-400">
                        Page {page} of {totalPages}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.max(1, page - 1))}
                          disabled={page === 1}
                          className="bg-dark-500 border-dark-300"
                        >
                          Sebelumnya
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPage(Math.min(totalPages, page + 1))}
                          disabled={page === totalPages}
                          className="bg-dark-500 border-dark-300"
                        >
                          Selanjutnya
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card className="bg-dark-400 border-dark-300 max-w-2xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Plus className="w-5 h-5 text-amber-500" />
                    Buat Voucher Baru
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="code" className="text-white font-medium">
                        Kode Voucher <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="code"
                        name="code"
                        placeholder="Contoh: DISKON50"
                        value={formData.code}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="bg-dark-500 border-dark-200 text-white placeholder:text-dark-100 uppercase"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="discountType" className="text-white font-medium">
                          Tipe Diskon <span className="text-red-500">*</span>
                        </Label>
                        <Select value={discountType} onValueChange={(v: any) => setDiscountType(v)}>
                          <SelectTrigger className="bg-dark-500 border-dark-200 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-dark-500 border-dark-200 text-white">
                            <SelectItem value="percentage">Persentase (%)</SelectItem>
                            <SelectItem value="nominal">Nominal (Rp)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="discountValue" className="text-white font-medium">
                          Nilai Diskon <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="discountValue"
                          name="discountValue"
                          type="number"
                          placeholder={discountType === "percentage" ? "Contoh: 20" : "Contoh: 50000"}
                          value={formData.discountValue}
                          onChange={handleInputChange}
                          disabled={isSubmitting}
                          step={discountType === "percentage" ? "1" : "1000"}
                          min="0"
                          className="bg-dark-500 border-dark-200 text-white placeholder:text-dark-100"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="maxUses" className="text-white font-medium">
                        Penggunaan Maksimal (Opsional)
                      </Label>
                      <Input
                        id="maxUses"
                        name="maxUses"
                        type="number"
                        placeholder="Biarkan kosong untuk unlimited"
                        value={formData.maxUses}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        min="1"
                        className="bg-dark-500 border-dark-200 text-white placeholder:text-dark-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="minimumPurchase" className="text-white font-medium">
                        Pembelian Minimum (Opsional)
                      </Label>
                      <Input
                        id="minimumPurchase"
                        name="minimumPurchase"
                        type="number"
                        placeholder="Contoh: 50000"
                        value={formData.minimumPurchase}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        min="0"
                        className="bg-dark-500 border-dark-200 text-white placeholder:text-dark-100"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="downloadUrl" className="text-white font-medium">
                        Link Unduhan File (Opsional)
                      </Label>
                      <Input
                        id="downloadUrl"
                        name="downloadUrl"
                        type="url"
                        placeholder="Contoh: https://example.com/file.zip"
                        value={formData.downloadUrl}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="bg-dark-500 border-dark-200 text-white placeholder:text-dark-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiryDate" className="text-white font-medium">
                        Tanggal Kadaluarsa (Opsional)
                      </Label>
                      <Input
                        id="expiryDate"
                        name="expiryDate"
                        type="datetime-local"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        className="bg-dark-500 border-dark-200 text-white placeholder:text-dark-100"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-white font-medium">
                        Deskripsi (Opsional)
                      </Label>
                      <Textarea
                        id="description"
                        name="description"
                        placeholder="Contoh: Diskon spesial untuk pelanggan setia"
                        value={formData.description}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                        rows={3}
                        className="bg-dark-500 border-dark-200 text-white placeholder:text-dark-100 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-6 text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Membuat Voucher...
                        </>
                      ) : (
                        <>
                          <Plus className="mr-2 h-5 w-5" />
                          Buat Voucher
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Modal */}
        <Dialog open={editModal} onOpenChange={setEditModal}>
          <DialogContent className="sm:max-w-md bg-dark-400 border-dark-300 text-white">
            <DialogHeader>
              <DialogTitle>Edit Voucher</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update data voucher {editingVoucher?.code}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={(e) => { e.preventDefault(); handleUpdateVoucher() }} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white">Nilai Diskon</Label>
                <Input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      discountValue: e.target.value,
                    }))
                  }
                  className="bg-dark-500 border-dark-200 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Max Uses</Label>
                <Input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxUses: e.target.value,
                    }))
                  }
                  placeholder="Kosongkan untuk unlimited"
                  className="bg-dark-500 border-dark-200 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Pembelian Minimum</Label>
                <Input
                  type="number"
                  value={formData.minimumPurchase}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minimumPurchase: e.target.value,
                    }))
                  }
                  placeholder="Contoh: 50000"
                  className="bg-dark-500 border-dark-200 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Link Unduhan File</Label>
                <Input
                  type="url"
                  value={formData.downloadUrl}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      downloadUrl: e.target.value,
                    }))
                  }
                  placeholder="Contoh: https://example.com/file.zip"
                  className="bg-dark-500 border-dark-200 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      expiryDate: e.target.value,
                    }))
                  }
                  className="bg-dark-500 border-dark-200 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Deskripsi</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="bg-dark-500 border-dark-200 text-white resize-none"
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModal(false)}
                  className="bg-dark-500 border-dark-300"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* View Details Modal */}
        <Dialog open={viewModal} onOpenChange={setViewModal}>
          <DialogContent className="sm:max-w-2xl bg-dark-400 border-dark-300 text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detail Voucher</DialogTitle>
              <DialogDescription className="text-gray-400">
                {viewingVoucher?.code}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-dark-500">
                <div>
                  <p className="text-sm text-gray-400">Tipe</p>
                  <p className="font-medium">{viewingVoucher?.discountType}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Nilai</p>
                  <p className="font-medium">
                    {viewingVoucher?.discountType === "percentage"
                      ? `${viewingVoucher?.discountValue}%`
                      : formatRupiah(viewingVoucher?.discountValue || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pembelian Minimum</p>
                  <p className="font-medium">
                    {viewingVoucher?.minimumPurchase ? formatRupiah(viewingVoucher.minimumPurchase) : "Tidak ada"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <p className="font-medium">{viewingVoucher?.active ? "Aktif" : "Inactive"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Link Unduhan</p>
                  <p className="font-medium break-all">
                    {viewingVoucher?.downloadUrl ? (
                      <a href={viewingVoucher.downloadUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-300 hover:text-emerald-200">
                        Lihat file
                      </a>
                    ) : (
                      "Tidak ada"
                    )}
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setViewModal(false)}
                className="bg-dark-500 border-dark-300"
              >
                Tutup
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={deleteAlert} onOpenChange={setDeleteAlert}>
          <AlertDialogContent className="bg-dark-400 border-dark-300">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Hapus Voucher</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                Apakah Anda yakin ingin menghapus voucher ini? Aksi ini tidak dapat dibatalkan dan semua data penggunaan voucher akan dihapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-dark-500 border-dark-300 text-white hover:bg-dark-600">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingId) {
                    handleDelete(deletingId)
                  }
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}

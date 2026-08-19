"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPayment } from "@/app/actions/create-payment"
import { checkUserExists } from "@/app/actions/check-user-exists"
import { plans } from "@/data/plans"
import { appConfig } from "@/data/config"
import { formatRupiah, formatHitung } from "@/lib/utils"
import { Check, Info, User, Mail, Package, Loader2, Settings, MessageSquare, Send, Clock, MemoryStick, HardDrive, Cpu, Bot, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ConfirmationDialog } from "./confirmation-dialog"
import { StatusModal } from "./status-modal"
import { motion, AnimatePresence } from "framer-motion"
import { AdvancedSettingsBottomSheet } from "./bottom-sheets"
import { Pterodactyl, EggOption } from "@/lib/pterodactyl"
import { VoucherInput } from "./voucher-input"
import type { DiscountType } from "@/app/actions/voucher-actions"
import { getReferralCode } from "@/lib/referral-helper"

export default function PanelForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [selectedDurationDays, setSelectedDurationDays] = useState<number>(30)
  const [serverType, setServerType] = useState<"private" | "public">("private")
  const [accessType, setAccessType] = useState<"regular" | "admin">("regular")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [eggs, setEggs] = useState<EggOption[]>([])
  const [quantity, setQuantity] = useState<number>(1) 
  const [isLoadingEggs, setIsLoadingEggs] = useState(false)
  const [selectedEggId, setSelectedEggId] = useState<number | undefined>(undefined)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"success" | "error" | "info" | "loading">("info")
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  
  // Voucher states
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string
    discountType: DiscountType
    discountValue: number
    description?: string
  } | null>(null)
  
  const { toast } = useToast()
  const router = useRouter()

  // Load saved server type and access type from localStorage on mount
  useEffect(() => {
    try {
      const savedType = localStorage.getItem("serverType")
      if (savedType === "private" || savedType === "public") {
        setServerType(savedType)
      }
      const savedAccess = localStorage.getItem("accessType")
      if (savedAccess === "regular" || savedAccess === "admin") {
        setAccessType(savedAccess)
      }
    } catch (e) {
      // ignore (SSR safety)
    }
  }, [])

  // Persist serverType when it changes
  useEffect(() => {
    try {
      localStorage.setItem("serverType", serverType)
    } catch (e) {
      // ignore
    }
  }, [serverType])

  // Persist accessType when it changes
  useEffect(() => {
    try {
      localStorage.setItem("accessType", accessType)
    } catch (e) {
      // ignore
    }
  }, [accessType])

  useEffect(() => {
    try {
      const savedDuration = localStorage.getItem("selectedDurationDays")
      if (savedDuration) {
        const parsed = Number(savedDuration)
        if ([15, 30, 45].includes(parsed)) {
          setSelectedDurationDays(parsed)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem("selectedDurationDays", selectedDurationDays.toString())
    } catch (e) {
      // ignore
    }
  }, [selectedDurationDays])

  // Load/save selectedPlan to localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("selectedPlan")
      if (saved) {
        const plan = plans.find((p) => p.id === saved)
        if (plan && (plan as any).type === serverType) {
          setSelectedPlan(saved)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [serverType])

  useEffect(() => {
    try {
      if (selectedPlan) localStorage.setItem("selectedPlan", selectedPlan)
      else localStorage.removeItem("selectedPlan")
    } catch (e) {
      // ignore
    }
  }, [selectedPlan])

  // Fetch eggs when needed
  const fetchEggs = async () => {
    setIsLoadingEggs(true)
    try {
      const pterodactyl = new Pterodactyl(serverType, accessType)
      const eggList = await pterodactyl.getEggs()
      setEggs(eggList)
    } catch (error) {
      console.error("Error fetching eggs:", error)
      // Set default eggs
      setEggs([
        { id: 15, nama: 'bot wa', harga: 0, catatan: "untukini" },
        { id: 16, nama: 'python', harga: 1000, catatan: "untkkkini" }
      ])
    } finally {
      setIsLoadingEggs(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (username.length < 3 || /[^a-zA-Z0-9]/.test(username)) {
      toast({
        title: "Error",
        description: "Username harus minimal 3 karakter dan hanya boleh huruf & angka",
        variant: "destructive"
      })
      return
    }
    
    if (!username || !email || !selectedPlan) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: "Error",
        description: "Format email tidak valid",
        variant: "destructive",
      })
      return
    }

    setIsValidating(true)

    try {
      // Show loading modal
      setModalType("loading")
      setModalTitle("Memeriksa Ketersediaan")
      setModalMessage("Sedang memeriksa ketersediaan username dan email di panel...")
      setShowModal(true)

      // Check if username or email already exists
      const result = await checkUserExists(username, email, serverType)

      if (!result.success) {
        throw new Error(result.error || "Gagal memeriksa ketersediaan username dan email")
      }

      if (result.usernameExists) {
        setModalType("error")
        setModalTitle("Username Sudah Terdaftar")
        setModalMessage("Username yang Anda masukkan sudah terdaftar di panel. Silakan gunakan username lain.")
        return
      }

      if (result.emailExists) {
        setModalType("error")
        setModalTitle("Email Sudah Terdaftar")
        setModalMessage("Email yang Anda masukkan sudah terdaftar di panel. Silakan gunakan email lain.")
        return
      }

      // Close the modal and fetch eggs, then show advanced settings
      setShowModal(false)
      await fetchEggs()
      setShowAdvancedSettings(true)
    } catch (error) {
      setModalType("error")
      setModalTitle("Terjadi Kesalahan")
      setModalMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat memeriksa ketersediaan")
    } finally {
      setIsValidating(false)
    }
  }

  const handleAdvancedConfirm = async (eggId?: number, qty: number) => {
    setSelectedEggId(eggId)
    setQuantity(qty)
    setShowAdvancedSettings(false)
    // Store egg selection in localStorage for the payment process
    if (eggId) {
      localStorage.setItem(`selectedEgg_${serverType}_${accessType}`, eggId.toString())
    }
    setShowConfirmation(true)
  }

  const handleAdvancedSkip = (qty: number) => {
    setSelectedEggId(undefined)
    setQuantity(qty)
    setShowAdvancedSettings(false)
    setShowConfirmation(true)
  }

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const referralCode = getReferralCode()
      
      const result = await createPayment({
        planId: selectedPlan,
        username,
        email,
        serverType,
        accessType,
        selectedEggId, // Pass selected egg to payment
        voucherCode: appliedVoucher?.code, // Pass voucher code if applied
        quantity: quantity,
        durationDays: selectedDurationDays,
        referralCode: referralCode || undefined, // Pass referral code if exists
      })

      if (!result.success) {
        throw new Error(result.error)
      }

      router.push(`/invoice/${result.transactionId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Terjadi kesalahan",
        variant: "destructive",
      })
      setShowConfirmation(false)
      setIsLoading(false)
    }
  }

  // Filter plans by server type and access type
  const filteredPlans = plans.filter((p) => p.type === serverType && p.access === accessType)
  
  // Get selected plan price
  const selectedPlanData = plans.find(p => p.id === selectedPlan)
  const selectedPlanPrice = (selectedPlanData?.price || 0) * (selectedDurationDays === 15 ? 0.5 : selectedDurationDays === 45 ? 1.5 : 1)

  return (
    <>
      <div className="rounded-3xl border border-dark-300 bg-dark-500 p-5 mb-6">
        <h1 className="text-1xl font-semibold text-white">SELAMAT DATANG,</h1>
        <p className="mt-2 text-sm text-gray-400">
          Bingung cari tempat beli panel yang murah dan aman dimana?
        </p>
        <p className="mt-2 text-sm text-gray-400">
          Yuk beli panel di sini, Panel sudah terjamin keamanannya dan harganya pas di kantong kamu.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Silakan isi data di bawah dan pilih paket yang sesuai untuk mendapatkan panel server terbaik kamu.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 pb-6">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-400">Ikuti Informasi & Update Terbaru</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a 
              href={appConfig.socialMedia.channelWa}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                type="button"
                className="w-full h-11 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:border-emerald-500/50 font-medium flex items-center justify-center gap-2 rounded-lg transition-all duration-200"
              >
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                INFORMASI SERVER PANEL
              </Button>
            </a>
            <a 
              href={appConfig.socialMedia.channelTele}
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full"
            >
              <Button
                type="button"
                className="w-full h-11 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:border-sky-500/50 font-medium flex items-center justify-center gap-2 rounded-lg transition-all duration-200"
              >
                <Send className="w-4 h-4 text-sky-400" />
                SEMUA RIWAYAT TRANSAKSI
              </Button>
            </a>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="username" className="text-base font-medium flex items-center gap-2">
            <User className="w-4 h-4 text-red-500" />
            Username
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <User className="w-5 h-5 text-gray-500" />
            </div>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              className="h-14 text-base pl-10 bg-dark-500 border-dark-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-base font-medium flex items-center gap-2">
            <Mail className="w-4 h-4 text-red-500" />
            Email
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan email"
              required
              className="h-14 text-base pl-10 bg-dark-500 border-dark-300 focus:border-red-500 focus:ring-red-500"
            />
          </div>
        </div>
            <p className="text-xs text-gray-400 mt-2">Kami Menggunakan Server <span className="font-medium text-white">Private</span> dan <span className="font-medium text-white">Resmi di Indonesia</span> Untuk Menjamin Stabilitas Serta Daya Tahan Yang Lebih Baik. Keamanan Server Juga Terjamin Karena <span className="font-medium text-white">Akses Admin Server Hanya Dipegang Oleh 1 Orang</span> (Pemilik Server).</p>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium flex items-center gap-2">
              <Package className="w-4 h-4 text-red-500" />
              Pilih Paket
            </Label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-pressed={serverType === "private"}
                onClick={() => {
                  const next = "private"
                  setServerType(next)
                  setAccessType("regular")
                  if (!plans.find((p) => p.type === next && p.access === "regular" && p.id === selectedPlan)) setSelectedPlan("")
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  serverType === "private" ? "bg-red-600 text-white" : "bg-dark-500 text-gray-300"
                }`}
              >
                PANEL BOT
              </button>
              <button
                type="button"
                aria-pressed={serverType === "public"}
                onClick={() => {
                  const next = "public"
                  setServerType(next)
                  if (!plans.find((p) => p.type === next && p.access === accessType && p.id === selectedPlan)) setSelectedPlan("")
                }}
                className={`px-3 py-1 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  serverType === "public" ? "bg-red-600 text-white" : "bg-dark-500 text-gray-300"
                }`}
              >
                PANEL WEB
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
            <span className="font-medium text-white inline-flex items-center gap-1">
              <Bot className="w-4 h-4 text-white-500" /> PANEL BOT
            </span> 
            (Untuk Menjalankan Bot WhatsApp/Telegram/Discord)
          </p>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
            <span className="font-medium text-white inline-flex items-center gap-1">
              <Globe className="w-4 h-4 text-white-500" /> PANEL WEB
            </span> 
            (Untuk Menjalankan Tester Progres Aplikasi Website)
          </p>
          
          {/*{serverType === "public" && (
            <>
              <div className="flex items-center justify-between pt-2">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Package className="w-4 h-4 text-red-500" />
                  Pilih Akses Panel
                </Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-pressed={accessType === "regular"}
                    onClick={() => {
                      const next = "regular"
                      setAccessType(next)
                      if (!plans.find((p) => p.type === serverType && p.access === next && p.id === selectedPlan)) setSelectedPlan("")
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      accessType === "regular" ? "bg-red-600 text-white" : "bg-dark-500 text-gray-300"
                    }`}
                  >
                    Panel Bot
                  </button>
                  <button
                    type="button"
                    aria-pressed={accessType === "admin"}
                    onClick={() => {
                      const next = "admin"
                      setAccessType(next)
                      if (!plans.find((p) => p.type === serverType && p.access === next && p.id === selectedPlan)) setSelectedPlan("")
                    }}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-red-500 ${
                      accessType === "admin" ? "bg-red-600 text-white" : "bg-dark-500 text-gray-300"
                    }`}
                  >
                    Akses Admin
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2"><span className="font-medium text-white">Akses Biasa</span> = Panel untuk Bot</p>
              <p className="text-xs text-gray-400 mt-2"><span className="font-medium text-white">Akses Admin</span> = Full Akses Admin + Create User Panel Bot</p>
            </>
          )}*/}
          </div>
          <div className="space-y-2">
            <Label className="text-base font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-red-500" />
              Durasi Masa Aktif
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 45].map((duration) => {
                const isActive = selectedDurationDays === duration
                const label = duration === 30 ? "Default" : duration === 15 ? "Hemat 50%" : "Tambah 50%"
                const priceInfo = duration === 15 ? "- 50%" : duration === 45 ? "+ 50%" : "Tanpa biaya tambahan"

                return (
                  <button
                    key={duration}
                    type="button"
                    onClick={() => setSelectedDurationDays(duration)}
                    className={`rounded-lg border px-3 py-3 text-left transition-all ${
                      isActive
                        ? "border-red-500 bg-red-500/10 text-white"
                        : "border-dark-300 bg-dark-500 text-gray-300 hover:border-red-500/50"
                    }`}
                  >
                    <div className="text-sm font-semibold">{duration} Hari</div>
                    <div className="text-xs text-gray-400">{label}</div>
                    <div className={`text-[11px] mt-1 ${isActive ? "text-red-300" : "text-gray-500"}`}>{priceInfo}</div>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-gray-400">Default durasi 30 hari. Pilihan 15 hari diskon 50%, dan 45 hari tambah 50% dari harga dasar.</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={serverType}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >
              {filteredPlans.length === 0 ? (
                <div className="col-span-1 md:col-span-2 text-center text-gray-400 py-6">
                  Tidak ada paket untuk tipe server ini.
                </div>
              ) : (
                filteredPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedPlan === plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        setSelectedPlan(plan.id)
                      }
                    }}
                    layout
                    className={`relative rounded-lg border-2 cursor-pointer transition-all duration-300 overflow-hidden ${
                      selectedPlan === plan.id
                        ? "bg-red-500/10 border-red-500 shadow-lg shadow-red-500/20 col-span-1 md:col-span-2"
                        : "bg-dark-500 border-dark-300 hover:border-red-500/50 p-4"
                    }`}
                    whileHover={selectedPlan !== plan.id ? { scale: 1.02 } : {}}
                    whileTap={selectedPlan !== plan.id ? { scale: 0.98 } : {}}
                  >
                    <div className={selectedPlan === plan.id ? "p-4" : ""}>
                      {selectedPlan === plan.id && (
                        <div className="absolute top-4 right-4 bg-red-500 rounded-full p-1 z-10">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium text-white text-sm flex-1 pr-2 flex items-center gap-2">
                          <span>{plan.name}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            plan.type === "private" ? "bg-red-600 text-white" : "bg-red-600 text-white"
                          }`}>{plan.type === "private" ? "PANEL BOT" : "PANEL WEB"}</span>
                        </h3>
                      </div>
                      <div className="text-red-400 font-bold mb-2">{formatRupiah(plan.price)}</div>
                      <div className="text-xs text-gray-400 space-y-1 mb-3">
                        <div className="flex items-center gap-1.5">
                          <HardDrive className="w-4 h-4 text-gray-400" />
                          <span>RAM: {formatHitung(plan.memory)} MB</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MemoryStick className="w-4 h-4 text-gray-400" />
                          <span>Disk: {formatHitung(plan.disk)} MB</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-gray-400" />
                          <span>CPU: {plan.cpu}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-300 line-clamp-2">{plan.description}</p>

                      {selectedPlan === plan.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 pt-4 border-t border-red-500/30"
                        >
                          <h4 className="font-medium text-white mb-3 flex items-center">
                            <Info className="w-4 h-4 mr-2 text-red-500" />
                            Detail Paket Lengkap
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                            <div className="text-gray-400">RAM:</div>
                            <div className="font-medium text-white">{formatHitung(plan.memory)} MB</div>
                            <div className="text-gray-400">Disk:</div>
                            <div className="font-medium text-white">{formatHitung(plan.disk)} MB</div>
                            <div className="text-gray-400">CPU:</div>
                            <div className="font-medium text-white">{plan.cpu}%</div>
                            <div className="text-gray-400">Harga:</div>
                            <div className="font-medium text-red-400">{formatRupiah(plan.price)}</div>
                          </div>
                          <p className="text-sm text-gray-400 mb-3">{plan.description}</p>
                          <div>
                            <h5 className="text-sm font-medium text-white mb-2">Fitur Paket:</h5>
                            <ul className="space-y-1">
                              {plan.features.map((feature, index) => (
                                <li key={index} className="flex items-start text-sm">
                                  <Check className="w-4 h-4 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-300">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
      </form>

      {/* Floating Button - Only show when plan is selected */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-dark-600 via-dark-600 to-transparent pt-4 pb-6 px-4 z-40"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              onClick={handleSubmit}
              className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 h-14 text-lg font-medium transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-2xl"
              disabled={isValidating}
            >
              {isValidating ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Memeriksa...
                </>
              ) : (
                <>
                  <Settings className="mr-2 h-5 w-5" />
                  Beli Sekarang
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <StatusModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
      />

      <AdvancedSettingsBottomSheet
        isOpen={showAdvancedSettings}
        onClose={() => setShowAdvancedSettings(false)}
        onConfirm={handleAdvancedConfirm}
        onSkip={handleAdvancedSkip}
        eggs={eggs}
        isLoading={isLoadingEggs}
        selectedPlanPrice={selectedPlanPrice}
      />

      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        planId={selectedPlan}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        serverType={serverType}
        accessType={accessType}
        selectedEggId={selectedEggId}
        eggs={eggs}
        quantity={quantity}
        userIdentifier={username}
        appliedVoucher={appliedVoucher}
        onVoucherApplied={setAppliedVoucher}
        onVoucherRemoved={() => setAppliedVoucher(null)}
        durationDays={selectedDurationDays}
      />
    </>
  )
}

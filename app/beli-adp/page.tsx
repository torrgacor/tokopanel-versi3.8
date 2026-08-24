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
import { formatRupiah } from "@/lib/utils"
import { Check, User, Mail, Package, Loader2, Crown, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ConfirmationDialog } from "@/components/confirmation-dialog"
import { StatusModal } from "@/components/status-modal"
import { motion, AnimatePresence } from "framer-motion"
import { Footer } from "@/components/footer"
import Navbar from "@/components/navbar"

export default function AdminPanelForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [selectedPlan, setSelectedPlan] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState<"success" | "error" | "info" | "loading">("info")
  const [modalTitle, setModalTitle] = useState("")
  const [modalMessage, setModalMessage] = useState("")
  const { toast } = useToast()
  const router = useRouter()

  // Load saved selectedPlan from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("adminSelectedPlan")
      if (saved) {
        const plan = plans.find((p) => p.id === saved && p.type === "public" && p.access === "admin")
        if (plan) {
          setSelectedPlan(saved)
        }
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    try {
      if (selectedPlan) localStorage.setItem("adminSelectedPlan", selectedPlan)
      else localStorage.removeItem("adminSelectedPlan")
    } catch (e) {
      // ignore
    }
  }, [selectedPlan])

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
      const result = await checkUserExists(username, email, "public")

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

      // Close the modal and show confirmation dialog
      setShowModal(false)
      setShowConfirmation(true)
    } catch (error) {
      setModalType("error")
      setModalTitle("Terjadi Kesalahan")
      setModalMessage(error instanceof Error ? error.message : "Terjadi kesalahan saat memeriksa ketersediaan")
    } finally {
      setIsValidating(false)
    }
  }

  const handleConfirm = async () => {
    setIsLoading(true)

    try {
      const result = await createPayment({
        planId: selectedPlan,
        username,
        email,
        serverType: "public",
        accessType: "admin",
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

  // Filter plans by server type public and access admin
  const filteredPlans = plans.filter((p) => p.type === "public" && p.access === "admin")

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-800 to-dark-900 py-12 px-4">
      <div className="container max-w-5xl mx-auto">
        <Navbar />
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-r from-red-600 to-red-800 rounded-2xl mb-6 shadow-lg shadow-red-500/20">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent mb-4">
            Akses Admin Panel
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Dapatkan kendali penuh atas panel Anda dengan akses admin. Kelola multi user dan nikmati fitur premium eksklusif.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <Sparkles className="w-4 h-4 text-red-500" />
            <span className="text-sm text-gray-500">Server Private • Akses Admin</span>
            <Sparkles className="w-4 h-4 text-red-500" />
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-dark-800/50 backdrop-blur-sm rounded-2xl border border-red-500/20 p-6 md:p-8"
          >
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <User className="w-6 h-6 text-red-500" />
              Informasi Akun
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-base font-medium text-gray-300 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-500" />
                  Username
                </Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username"
                  required
                  className="h-12 text-base bg-dark-700 border-red-500/30 focus:border-red-500 focus:ring-red-500 text-white placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-500">Minimal 3 karakter, hanya huruf dan angka</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-base font-medium text-gray-300 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-red-500" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Masukkan email"
                  required
                  className="h-12 text-base bg-dark-700 border-red-500/30 focus:border-red-500 focus:ring-red-500 text-white placeholder:text-gray-500"
                />
              </div>

              <div className="pt-4">
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-red-500" />
                    <span className="text-sm font-medium text-gray-300">Informasi Server</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Paket akses admin menggunakan server <span className="text-red-500 font-medium">Private</span> yang dioptimalkan untuk performa terbaik.
                  </p>
                </div>
              </div>
            </form>
          </motion.div>

          {/* Plans Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-2">
              <Package className="w-6 h-6 text-red-500" />
              Pilih Paket Admin
            </h2>
            
            <AnimatePresence mode="wait">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {filteredPlans.length === 0 ? (
                  <div className="text-center text-gray-400 py-12 bg-dark-800/50 rounded-2xl border border-red-500/20">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Tidak ada paket akses admin tersedia saat ini.</p>
                  </div>
                ) : (
                  filteredPlans.map((plan, index) => (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
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
                      className={`relative rounded-xl border-2 cursor-pointer transition-all duration-300 overflow-hidden ${
                        selectedPlan === plan.id
                          ? "bg-gradient-to-r from-red-600/20 to-red-800/20 border-red-500 shadow-lg shadow-red-500/20"
                          : "bg-dark-800/50 border-red-500/20 hover:border-red-500/50 hover:bg-dark-800/70"
                      }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                              <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-600 to-red-800 text-white shadow-lg">
                                READY
                              </span>
                            </div>
                            <p className="text-gray-400 text-sm">{plan.description}</p>
                          </div>
                          {selectedPlan === plan.id && (
                            <div className="bg-red-500 rounded-full p-1.5">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>

                        <div className="mb-4">
                          <div className="text-3xl font-bold text-red-500">{formatRupiah(plan.price)}</div>
                          <p className="text-xs text-gray-500 mt-1">Perbulan, Belum termasuk fee admin</p>
                        </div>

                        {/* Features List */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-300 mb-2">Fitur Eksklusif:</h4>
                          {plan.features.slice(0, 4).map((feature, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <Check className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-400">{feature}</span>
                            </div>
                          ))}
                          {plan.features.length > 4 && (
                            <p className="text-xs text-gray-500 mt-2">+{plan.features.length - 4} fitur lainnya</p>
                          )}
                        </div>

                        {selectedPlan === plan.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-red-500/30"
                          >
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="bg-red-500/10 rounded-lg p-2 text-center">
                                <div className="text-xs text-gray-500 mb-1">Server Type</div>
                                <div className="font-medium text-white">Private</div>
                              </div>
                              <div className="bg-red-500/10 rounded-lg p-2 text-center">
                                <div className="text-xs text-gray-500 mb-1">Akses</div>
                                <div className="font-medium text-white">Admin Penuh</div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      <Footer />
      {/* Floating Button - Only show when plan is selected */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-dark-900 via-dark-900/95 to-transparent pt-8 pb-6 px-4 z-40"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="container max-w-5xl mx-auto">
              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 h-14 text-lg font-semibold transition-all duration-300 ease-in-out transform hover:scale-[1.02] shadow-2xl shadow-red-500/25 rounded-xl"
                disabled={isValidating}
              >
                {isValidating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memeriksa Ketersediaan...
                  </>
                ) : (
                  <>
                    <Crown className="mr-2 h-5 w-5" />
                    Beli Akses Admin Sekarang
                  </>
                )}
              </Button>
              <p className="text-center text-xs text-gray-500 mt-3">
                Dengan mengklik tombol di atas, Anda menyetujui syarat dan ketentuan yang berlaku
              </p>
            </div>
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

      <ConfirmationDialog
        open={showConfirmation}
        onOpenChange={setShowConfirmation}
        planId={selectedPlan}
        onConfirm={handleConfirm}
        isLoading={isLoading}
        serverType="public"
        accessType="admin"
      />
    </div>
  )
}

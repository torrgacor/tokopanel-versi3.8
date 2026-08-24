"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import { useRouter, useParams } from "next/navigation"
import { getTransactionById, updateTransactionReplace } from "@/app/actions/get-transactions"
import { checkUserExists } from "@/app/actions/check-user-exists"
import { createPanel } from "@/app/actions/create-panel"
import { appConfig } from "@/data/config"
import { plans } from "@/data/plans"
import { Loader2, ShieldCheck, AlertTriangle, Server, Egg, Layers } from "lucide-react"

export default function GaransiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const transactionId = params?.id as string
  const { toast } = useToast()

  const [transaction, setTransaction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [panelData, setPanelData] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [locked, setLocked] = useState(false)
  const [attempts, setAttempts] = useState(0)

  useEffect(() => {
    async function fetchData() {
      const trx = await getTransactionById(transactionId)
      if (!trx) {
        toast({
          title: "Transaksi tidak ditemukan",
          description: "ID transaksi tidak valid.",
          variant: "destructive",
        })
        router.push("/garansi")
        return
      }

      if (trx.status !== "completed") {
        toast({
          title: "Transaksi belum selesai",
          description: "Selesaikan pembayaran terlebih dahulu sebelum klaim garansi.",
          variant: "destructive",
        })
        router.push("/garansi")
        return
      }

      setTransaction(trx)
      setLoading(false)
    }

    fetchData()
  }, [transactionId, router, toast])

  const maskEmail = (email: string) => {
    const [name, domain] = email.split("@")
    return name.slice(0, 2) + "****@" + domain
  }

  const handleVerifyEmail = async () => {
    if (!transaction) return
    if (locked) return setError("Terlalu banyak percobaan, coba lagi nanti.")
    if (!email.trim()) return setError("Masukkan email terlebih dahulu.")

    setVerifying(true)
    setError("")

    try {
      if (email.trim().toLowerCase() !== transaction.email.toLowerCase()) {
        const failCount = attempts + 1
        setAttempts(failCount)

        if (failCount >= 3) {
          setLocked(true)
          return setError("Form dikunci karena 3x gagal. Coba lagi dalam 5 menit.")
        }

        return setError("Email tidak sesuai dengan transaksi ini.")
      }

      const plan = plans.find((p) => p.id === transaction.planId)
      if (!plan) {
        return setError("Plan tidak ditemukan, hubungi admin.")
      }
      
      const check = await checkUserExists(
        transaction.username,
        email,
        transaction.serverType
      )
      if (!check.success) throw new Error("Gagal memeriksa pengguna di panel")

      if (check.usernameExists || check.emailExists) {
        setError("Akun panel masih aktif. Garansi belum bisa digunakan.")
        return
      }

      const panel = await createPanel({
        idtransaksi: transaction.transactionId,
        username: transaction.username,
        email,
        memory: plan.memory,
        disk: plan.disk,
        cpu: plan.cpu,
        planId: transaction.planId,
        createdAt: transaction.createdAt,
        serverType: transaction.serverType,
        accessType: transaction.accessType,
        selectedEggId: transaction.selectedEggId,
        quantity: transaction.quantity || 1,
      })

      if (!panel.success) throw new Error(panel.error || "Gagal membuat panel baru")

      await updateTransactionReplace(transactionId)

      setPanelData({
        username: transaction.username,
        password: panel.password, 
        serverId: panel.serverId,
        servers: panel.servers || [] 
      })

      toast({
        title: "Garansi berhasil diproses",
        description: `${transaction.quantity || 1}x Panel baru berhasil dibuat dan detail dikirim ke email kamu.`,
      })
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Terjadi kesalahan saat memproses garansi.")
    } finally {
      setVerifying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Memuat detail garansi...
      </div>
    )
  }

  const getEggInfo = () => {
    if (!transaction?.selectedEggId) return null
    return {
      id: transaction.selectedEggId,
      name: transaction.selectedEggName || `Egg ID: ${transaction.selectedEggId}`
    }
  }

  const eggInfo = getEggInfo()
  const displayQuantity = transaction?.quantity || 1
  const warrantyDuration = Number(transaction?.durationDays ?? appConfig.garansi.warrantyDays ?? 30)

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-dark-500 border border-dark-300 rounded-2xl shadow-lg">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-2xl font-bold text-center text-white mb-6 flex justify-center items-center gap-2"
      >
        <ShieldCheck className="w-6 h-6 text-red-500" />
        Klaim Garansi Panel
      </motion.h1>

      <Card className="bg-dark-400 border-dark-300 mb-5">
        <CardContent className="p-5 space-y-3 text-sm text-gray-300">
          <p><strong>ID Transaksi:</strong> {transactionId}</p>
          <p><strong>Paket:</strong> {transaction.planName}</p>
          <p className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-red-400" />
            <strong>Jumlah Panel Beli:</strong> <span className="font-semibold text-white bg-red-600/30 px-2 py-0.5 rounded border border-red-500/30">{displayQuantity}x Server</span>
          </p>
          <p><strong>Email:</strong> {maskEmail(transaction.email)}</p>
          <p><strong>Status:</strong> <span className="text-green-400">Completed</span></p>
          {eggInfo && (
            <p className="flex items-center gap-2">
              <Egg className="w-4 h-4 text-red-400" />
              <strong>Egg Bawaan:</strong> {eggInfo.name}
            </p>
          )}
          <p><strong>Sisa Klaim:</strong> <span className="text-yellow-400">{appConfig.garansi.replaceLimit - (transaction.replaceUsed || 0)}</span> dari {appConfig.garansi.replaceLimit} kali</p>
        </CardContent>
      </Card>

      {!panelData ? (
        <div className="space-y-4">
          <Label htmlFor="email" className="text-base text-gray-200">
            Verifikasi Email
          </Label>
          <Input
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Masukkan email terdaftar"
            className="h-14 text-base bg-dark-400 border-dark-300 focus:border-red-500 focus:ring-red-500"
            disabled={verifying || locked}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}

          <Button
            onClick={handleVerifyEmail}
            className="w-full h-14 bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-lg font-medium"
            disabled={verifying || locked}
          >
            {verifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Memverifikasi & Re-create...
              </>
            ) : (
              `Klaim Garansi (${displayQuantity} Server)`
            )}
          </Button>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-dark-400 border border-dark-300 p-5 rounded-xl space-y-4 mt-4"
        >
          <h3 className="font-semibold text-white flex items-center gap-2 border-b border-dark-300 pb-2">
            <Server className="w-4 h-4 text-red-500" /> 
            {displayQuantity > 1 ? `${displayQuantity}x Server Sukses Dibuat Ulang` : "Panel Baru Sukses Dibuat"}
          </h3>
          
          <div className="text-sm text-gray-300 space-y-2">
            <p><strong>Type:</strong> {transaction.serverType === "private" ? "Private Panel" : "Public Panel"}</p>
            <p><strong>Role Access:</strong> {transaction.accessType === "admin" ? "Admin" : "Reguler"}</p>
            <p><strong>Username Akun:</strong> <span className="text-white font-mono bg-dark-500 px-1.5 py-0.5 rounded">{panelData.username}</span></p>
            
            {panelData.servers && panelData.servers.length > 0 ? (
              <div className="mt-3 space-y-2 bg-dark-500 p-3 rounded-lg border border-dark-300">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Rincian Multi-Server:</p>
                {panelData.servers.map((srv: any, index: number) => (
                  <div key={index} className="text-xs border-l-2 border-red-500 pl-2 py-0.5">
                    <p className="text-gray-200 font-medium">Server #{index + 1}</p>
                    <p className="text-gray-400 font-mono">ID: {srv.serverId || srv.id}</p>
                    {srv.password && <p className="text-gray-400">Password: <span className="text-red-400">{srv.password}</span></p>}
                  </div>
                ))}
              </div>
            ) : (
              
              <div className="space-y-1">
                <p><strong>Password Akun:</strong> <span className="text-red-400 font-mono bg-dark-500 px-1.5 py-0.5 rounded">{panelData.password}</span></p>
                <p><strong>Server ID:</strong> <span className="text-gray-400 font-mono">{panelData.serverId}</span></p>
              </div>
            )}

            {eggInfo && (
              <p className="flex items-center gap-2 pt-1 text-xs text-gray-400">
                <Egg className="w-3.5 h-3.5 text-red-400" />
                <strong>Environment Egg:</strong> {eggInfo.name}
              </p>
            )}
          </div>
        </motion.div>
      )}

      <div className="text-center text-gray-400 text-xs mt-6 flex items-center justify-center gap-1">
        <AlertTriangle className="w-4 h-4" />
        Garansi berlaku {warrantyDuration} hari & maksimal {appConfig.garansi.replaceLimit} kali penggantian.
      </div>
    </div>
  )
}

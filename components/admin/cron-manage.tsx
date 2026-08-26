"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useToast } from "@/hooks/use-toast"
import { formatDate } from "@/lib/utils"
import { RefreshCcw, PlayCircle } from "lucide-react"

interface CronLog {
  _id: string
  tanggal: string
  dijalankanPada: string
  sumber: "otomatis" | "manual"
  sukses: boolean
  pesanError?: string | null
  panelExpiredDitemukan: any[]
  serverDihapus: any[]
  akunPanelDihapus: any[]
  pengingatDikirim: any[]
  rawResponse: any
}

export default function CronManage() {
  const [logs, setLogs] = useState<CronLog[]>([])
  const [loading, setLoading] = useState(false)
  const [running, setRunning] = useState(false)
  const [selectedLog, setSelectedLog] = useState<CronLog | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { toast } = useToast()

  async function muatDaftarLog() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/cron/list")
      const data = await res.json()
      if (data.success) {
        setLogs(data.data)
      } else {
        toast({ title: "Gagal memuat riwayat cron", description: data.error || "Coba lagi", variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal memuat riwayat cron", description: "Tidak dapat terhubung ke server", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    muatDaftarLog()
  }, [])

  async function jalankanManual() {
    setRunning(true)
    try {
      const res = await fetch("/api/admin/cron/run", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        toast({
          title: "Cron job selesai dijalankan",
          description: `Ditemukan ${data.ringkasan.totalExpired} panel expired, ${data.ringkasan.totalServerDihapus} server dihapus.`,
        })
        muatDaftarLog()
      } else {
        toast({ title: "Gagal menjalankan cron job", description: data.error || "Coba lagi", variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal menjalankan cron job", description: "Tidak dapat terhubung ke server", variant: "destructive" })
    } finally {
      setRunning(false)
    }
  }

  function bukaDetail(log: CronLog) {
    setSelectedLog(log)
    setDrawerOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Riwayat Cron Job Auto Expired Panel</CardTitle>
          <CardDescription>
            Pantau eksekusi cron job harian dan jalankan secara manual untuk keperluan testing.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={muatDaftarLog} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={jalankanManual} disabled={running}>
            <PlayCircle className="mr-2 h-4 w-4" />
            {running ? "Menjalankan..." : "Jalankan Sekarang"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Memuat riwayat...</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground">Belum ada riwayat cron job.</div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <button
                key={log._id}
                onClick={() => bukaDetail(log)}
                className="w-full rounded-xl border border-border bg-background p-4 text-left shadow-sm transition hover:border-primary"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{formatDate(log.dijalankanPada)}</p>
                    <p className="text-sm text-muted-foreground">
                      Sumber: {log.sumber === "manual" ? "Manual (Admin)" : "Otomatis (Vercel Cron)"}
                    </p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-2 py-1 text-xs font-medium ${
                      log.sukses ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}
                  >
                    {log.sukses ? "Sukses" : "Gagal"}
                  </span>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground">Panel Expired</p>
                    <p className="font-medium">{log.panelExpiredDitemukan.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Server Dihapus</p>
                    <p className="font-medium">{log.serverDihapus.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Akun Dihapus</p>
                    <p className="font-medium">{log.akunPanelDihapus.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Pengingat</p>
                    <p className="font-medium">{log.pengingatDikirim.length}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Detail Cron Job {selectedLog ? formatDate(selectedLog.dijalankanPada) : ""}</DrawerTitle>
            <DrawerDescription>
              {selectedLog?.sumber === "manual" ? "Dijalankan manual oleh admin" : "Dijalankan otomatis oleh scheduler"}
            </DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 space-y-6 overflow-y-auto px-4 pb-4">
            {selectedLog?.pesanError ? (
              <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
                Error: {selectedLog.pesanError}
              </div>
            ) : null}

            <section>
              <h3 className="mb-2 font-semibold">Panel Expired Ditemukan ({selectedLog?.panelExpiredDitemukan.length ?? 0})</h3>
              {selectedLog && selectedLog.panelExpiredDitemukan.length > 0 ? (
                <div className="space-y-2">
                  {selectedLog.panelExpiredDitemukan.map((item, index) => (
                    <div key={index} className="rounded-lg border border-border p-3 text-sm">
                      <p><span className="text-muted-foreground">Transaksi:</span> {item.transactionId}</p>
                      <p><span className="text-muted-foreground">Username:</span> {item.username}</p>
                      <p><span className="text-muted-foreground">Email:</span> {item.email}</p>
                      <p><span className="text-muted-foreground">Paket:</span> {item.planId}</p>
                      <p><span className="text-muted-foreground">Expired Pada:</span> {formatDate(item.expiresAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada panel yang expired pada eksekusi ini.</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Server Dihapus ({selectedLog?.serverDihapus.length ?? 0})</h3>
              {selectedLog && selectedLog.serverDihapus.length > 0 ? (
                <div className="space-y-2">
                  {selectedLog.serverDihapus.map((item, index) => (
                    <div key={index} className="rounded-lg border border-border p-3 text-sm">
                      <p><span className="text-muted-foreground">Transaksi:</span> {item.transactionId}</p>
                      <p><span className="text-muted-foreground">Server ID:</span> {item.serverId}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada server yang dihapus.</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Akun Panel Dihapus ({selectedLog?.akunPanelDihapus.length ?? 0})</h3>
              {selectedLog && selectedLog.akunPanelDihapus.length > 0 ? (
                <div className="space-y-2">
                  {selectedLog.akunPanelDihapus.map((item, index) => (
                    <div key={index} className="rounded-lg border border-border p-3 text-sm">
                      <p><span className="text-muted-foreground">Transaksi:</span> {item.transactionId}</p>
                      <p><span className="text-muted-foreground">Panel User ID:</span> {item.panelUserId}</p>
                      <p><span className="text-muted-foreground">Username:</span> {item.username}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada akun panel yang dihapus (karena masih ada panel aktif lain).</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Pengingat Terkirim ({selectedLog?.pengingatDikirim.length ?? 0})</h3>
              {selectedLog && selectedLog.pengingatDikirim.length > 0 ? (
                <div className="space-y-2">
                  {selectedLog.pengingatDikirim.map((item, index) => (
                    <div key={index} className="rounded-lg border border-border p-3 text-sm">
                      <p><span className="text-muted-foreground">Transaksi:</span> {item.transactionId}</p>
                      <p><span className="text-muted-foreground">Email:</span> {item.email}</p>
                      <p><span className="text-muted-foreground">Expired Pada:</span> {formatDate(item.expiresAt)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada pengingat yang dikirim pada eksekusi ini.</p>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Mentahan JSON Respon Cron</h3>
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs">
                {JSON.stringify(selectedLog?.rawResponse ?? {}, null, 2)}
              </pre>
            </section>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Tutup</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </Card>
  )
}

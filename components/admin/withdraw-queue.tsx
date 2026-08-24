"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { uploadBuktiTransfer } from "@/lib/cdn-upload"
import { Input } from "@/components/ui/input"
import { Upload, X } from "lucide-react"
import { Drawer } from "vaul"

export default function AdminWithdrawQueue() {
  const [pendings, setPendings] = useState<any[]>([])
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [activeRequest, setActiveRequest] = useState<{ id: string; approve: boolean } | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/withdraw/list`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) setPendings(data.data)
        else toast({ title: "Gagal memuat data", description: data?.error || "Periksa konfigurasi admin key", variant: "destructive" })
      })
      .catch(() => {
        toast({ title: "Gagal memuat daftar", description: "Tidak dapat terhubung ke server", variant: "destructive" })
      })
      .finally(() => setLoading(false))
  }, [toast])

  function openActionSheet(id: string, approve: boolean) {
    setActiveRequest({ id, approve })
    setIsOpen(true)
  }

  async function handleSubmitProcess() {
    if (!activeRequest) return
    const { id, approve } = activeRequest
    if (processingIds[id]) return

    const adminNote = notes[id]?.trim() || undefined

    if (!approve && !adminNote) {
      toast({ title: "Gagal", description: "Alasan penolakan wajib diisi!", variant: "destructive" })
      return
    }

    try {
      setProcessingIds((s) => ({ ...s, [id]: true }))
      setIsOpen(false)

      let proofUrl: string | undefined
      const file = files[id]
      if (file) {
        const hasilUpload = await uploadBuktiTransfer(file)
        if (!hasilUpload.success) {
          toast({ title: "Gagal unggah bukti", description: hasilUpload.error || "Coba lagi", variant: "destructive" })
          setProcessingIds((s) => {
            const next = { ...s }
            delete next[id]
            return next
          })
          return
        }
        proofUrl = hasilUpload.url
      }

      const res = await fetch(`/api/admin/withdraw/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: id,
          approve,
          adminNote,
          txId: approve ? adminNote : undefined,
          proofUrl,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Berhasil", description: approve ? "Withdraw disetujui" : "Withdraw ditolak", variant: "default" })
        setPendings((prev) => prev.filter((p) => p._id !== id))
        setFiles((prev) => { const n = { ...prev }; delete n[id]; return n })
        setNotes((prev) => { const n = { ...prev }; delete n[id]; return n })
      } else if (data.alreadyProcessed) {
        toast({ title: "Info", description: "Request sudah diproses sebelumnya", variant: "default" })
        setPendings((prev) => prev.filter((p) => p._id !== id))
      } else {
        toast({ title: "Gagal memproses", description: data.error || "Coba lagi", variant: "destructive" })
      }
    } catch {
      toast({ title: "Gagal memproses", description: "Tidak dapat terhubung ke server", variant: "destructive" })
    } finally {
      setProcessingIds((s) => {
        const next = { ...s }
        delete next[id]
        return next
      })
      setActiveRequest(null)
    }
  }

  return (
    <>
      <Card className="space-y-4">
        <CardHeader>
          <CardTitle>Antrean Withdraw</CardTitle>
          <CardDescription>Kelola pengajuan penarikan affiliate yang berstatus Pending.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Memuat data...</div>
          ) : pendings.length === 0 ? (
            <div className="text-sm text-muted-foreground">Tidak ada antrean withdraw saat ini.</div>
          ) : (
            <div className="space-y-3">
              {pendings.map((p) => {
                const requestId = String(p._id)
                return (
                  <div key={requestId} className="rounded-xl border border-border bg-background p-4 shadow-sm space-y-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-base">{p.affiliateId}</p>
                        <p className="text-sm text-muted-foreground">{p.method} • {p.accountNumber} • {p.accountName}</p>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-md self-start md:self-center">
                        {new Date(p.createdAt).toLocaleString("id-ID")}
                      </div>
                    </div>

                    <div className="text-sm border-t border-b border-border py-2 flex flex-wrap gap-x-6 gap-y-1 items-center justify-between">
                      <p>Jumlah: <span className="font-bold text-emerald-500">Rp {p.amount.toLocaleString("id-ID")}</span></p>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => openActionSheet(requestId, true)} disabled={!!processingIds[requestId]} className="h-9 px-4">
                          {processingIds[requestId] ? "Memproses..." : "Setujui"}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => openActionSheet(requestId, false)} disabled={!!processingIds[requestId]} className="h-9 px-4">
                          Tolak
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Drawer.Content className="bg-background border-t border-border flex flex-col rounded-t-[10px] fixed bottom-0 left-0 right-0 max-w-lg mx-auto z-50 p-6 outline-none shadow-xl">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
            
            {activeRequest && (
              <div className="space-y-5">
                <div>
                  <Drawer.Title className="font-semibold text-lg">
                    {activeRequest.approve ? "Setujui Permintaan Withdraw" : "Tolak Permintaan Withdraw"}
                  </Drawer.Title>
                  <Drawer.Description className="text-sm text-muted-foreground">
                    {activeRequest.approve 
                      ? "Masukkan nomor TxID transaksi dan upload file bukti transfer jika ada." 
                      : "Berikan alasan kenapa permintaan penarikan dana ini ditolak."}
                  </Drawer.Description>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">
                      {activeRequest.approve ? "TxID / Catatan Pembayaran (Opsional)" : "Alasan Penolakan"}
                    </label>
                    <Input
                      type="text"
                      placeholder={activeRequest.approve ? "Masukkan kode unik transaksi..." : "Contoh: Akun bank tidak valid / Typo"}
                      value={notes[activeRequest.id] || ""}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [activeRequest.id]: e.target.value }))}
                      className="h-10 text-sm"
                    />
                  </div>

                  {activeRequest.approve && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-muted-foreground">Bukti Transfer Gambar</label>
                      <div className="relative">
                        <input
                          type="file"
                          id={`sheet-file-${activeRequest.id}`}
                          accept="image/*"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null
                            setFiles((prev) => ({ ...prev, [activeRequest.id]: f }))
                          }}
                          className="hidden"
                        />
                        {files[activeRequest.id] ? (
                          <div className="flex items-center gap-2 bg-muted border border-border rounded-xl px-4 h-11 text-sm">
                            <span className="truncate flex-1 text-muted-foreground">{files[activeRequest.id]?.name}</span>
                            <button 
                              type="button"
                              onClick={() => setFiles((prev) => ({ ...prev, [activeRequest.id]: null }))}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label 
                            htmlFor={`sheet-file-${activeRequest.id}`} 
                            className="flex items-center justify-center gap-2 border border-dashed border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-xl px-4 h-24 text-sm font-medium cursor-pointer transition-colors"
                          >
                            <Upload className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Pilih file bukti transfer</span>
                          </label>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 h-10">
                    Batal
                  </Button>
                  <Button onClick={handleSubmitProcess} className="flex-1 h-10">
                    Lanjutkan
                  </Button>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  )
}

"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Trash2, Pencil } from "lucide-react"

interface AffiliateLevelItem {
  _id: string
  name: string
  threshold: number
  commissionPercent: number
}

export default function AffiliateLevelsManager() {
  const { toast } = useToast()
  const [levels, setLevels] = useState<AffiliateLevelItem[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState("")
  const [threshold, setThreshold] = useState("")
  const [commissionPercent, setCommissionPercent] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  const loadLevels = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/affiliate/levels", { cache: "no-store" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal memuat level")
      setLevels(data.data || [])
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Gagal memuat level", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLevels()
  }, [])

  const resetForm = () => {
    setName("")
    setThreshold("")
    setCommissionPercent("")
    setEditingId(null)
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        name,
        threshold: Number(threshold),
        commissionPercent: Number(commissionPercent),
        levelId: editingId,
      }

      const res = await fetch("/api/admin/affiliate/levels", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan level")

      toast({ title: "Sukses", description: editingId ? "Level berhasil diperbarui" : "Level berhasil dibuat" })
      resetForm()
      loadLevels()
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Gagal menyimpan level", variant: "destructive" })
    }
  }

  const handleDelete = async (levelId: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate/levels?levelId=${encodeURIComponent(levelId)}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Gagal menghapus level")
      toast({ title: "Sukses", description: "Level berhasil dihapus" })
      loadLevels()
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "Gagal menghapus level", variant: "destructive" })
    }
  }

  const startEdit = (level: AffiliateLevelItem) => {
    setEditingId(level._id)
    setName(level.name)
    setThreshold(String(level.threshold))
    setCommissionPercent(String(level.commissionPercent))
  }

  return (
    <Card className="border border-border bg-card">
      <CardHeader>
        <CardTitle>Manajemen Level Affiliate</CardTitle>
        <CardDescription>
          Tambah, ubah, atau hapus level reseller beserta target transaksi dan persentase komisinya. Perubahan di sini
          langsung berlaku ke perhitungan komisi dan progress bar setiap reseller.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Nama Level</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Gold" />
          </div>
          <div className="space-y-2">
            <Label>Target Transaksi</Label>
            <Input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)} placeholder="20" />
          </div>
          <div className="space-y-2">
            <Label>Persentase Komisi (%)</Label>
            <Input type="number" value={commissionPercent} onChange={(e) => setCommissionPercent(e.target.value)} placeholder="15" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />{editingId ? "Simpan Perubahan" : "Tambah Level"}
          </Button>
          {editingId ? <Button variant="outline" onClick={resetForm}>Batal</Button> : null}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />Memuat level...
          </div>
        ) : (
          <div className="space-y-2">
            {levels.map((level) => (
              <div key={level._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-semibold">{level.name}</p>
                  <p className="text-sm text-muted-foreground">Target: {level.threshold} transaksi • Komisi: {level.commissionPercent}%</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(level)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(level._id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

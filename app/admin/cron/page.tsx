import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import Link from "next/link"
import { verifyAdminAuthToken, ADMIN_AUTH_COOKIE } from "@/lib/admin-auth"
import CronManage from "@/components/admin/cron-manage"
import { ArrowLeft, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminCronPage() {
  const cookieStore = await cookies()
  const adminToken = cookieStore.get(ADMIN_AUTH_COOKIE)?.value
  if (!verifyAdminAuthToken(adminToken)) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="space-y-8 p-6 md:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Clock className="h-6 w-6 text-blue-400" />
              </div>
              <h1 className="text-3xl font-semibold text-white">⏰ Kelola Cron Job</h1>
            </div>
            <p className="text-slate-400">
              Auto expired panel berjalan otomatis sekali sehari. Gunakan tombol jalankan manual untuk testing.
            </p>
          </div>
          <Link 
            href="/admin/affiliate" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 bg-slate-950/70 text-slate-300 hover:bg-slate-900 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Panel</span>
          </Link>
        </div>

        <CronManage />
      </div>
    </div>
  )
}

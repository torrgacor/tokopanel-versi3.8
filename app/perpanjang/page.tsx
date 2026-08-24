import Navbar from "@/components/navbar"
import { Footer } from "@/components/footer"
import { RenewalForm } from "@/components/renewal-form"

export default function RenewalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-500 via-dark-700 to-dark-900 pt-24">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <RenewalForm />
      </main>
      <Footer />
    </div>
  )
}
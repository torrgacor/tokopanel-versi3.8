export type PlanAccess = "regular" | "admin"

export interface Plan {
  id: string
  type: "private" | "public"
  access: PlanAccess
  name: string
  memory: number
  disk: number
  cpu: number
  price: number
  description: string
  features: string[]
  durationDays: number
}
/* Ini dokumentasi untuk durationDays (masa aktif nya)
Angka biasa = hari
Angka + h = jam
Angka + m = menit

Contoh:
durationDays: 30, > 30 hari
durationDays: "1h", > 1 jam
durationDays: "1m", > 1 menit 

Variasi durasi nya biar kamu makin mudah testing nya, bisa buat satu plan baru yg durasi nya "1m" misalnya jadi pas transaksi sukses kamu bisa ke admin dashboard > kelola cron dan klik jalankan buat test apakah cron nya bekerja sesuai ekspektasi atau ada error, kalau udh sesuai berarti dah beres, nanti vercel eksekusi cron nya otomatis satu kali sehari (ini limit paket gratis vercel)
*/

export const plans: Plan[] = [
  // PAKET PANEL BOT
  {
    id: "bot3gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 3GB",
    memory: 3025,
    disk: 3025,
    cpu: 60,
    price: 30000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗥𝗶𝗻𝗴𝗮𝗻",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot4gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 4GB",
    memory: 4025,
    disk: 4025,
    cpu: 80,
    price: 40000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗥𝗶𝗻𝗴𝗮𝗻",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot5gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 5GB",
    memory: 5125,
    disk: 5125,
    cpu: 100,
    price: 5000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗥𝗶𝗻𝗴𝗮𝗻",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot6gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 6GB",
    memory: 6125,
    disk: 6125,
    cpu: 120,
    price: 6000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot7gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 7GB",
    memory: 7125,
    disk: 7125,
    cpu: 140,
    price: 7000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot8gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 8GB",
    memory: 8125,
    disk: 8125,
    cpu: 160,
    price: 8000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot9gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 9GB",
    memory: 9125,
    disk: 9125,
    cpu: 180,
    price: 9000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot10gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 10GB",
    memory: 10125,
    disk: 10125,
    cpu: 200,
    price: 10000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗠𝗲𝗻𝗲𝗻𝗴𝗮𝗵",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot11gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 11GB",
    memory: 11125,
    disk: 11125,
    cpu: 220,
    price: 11000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot12gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 12GB",
    memory: 12125,
    disk: 12125,
    cpu: 240,
    price: 12000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot13gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 13GB",
    memory: 13125,
    disk: 13125,
    cpu: 260,
    price: 13000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot14gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 14GB",
    memory: 14125,
    disk: 14125,
    cpu: 280,
    price: 14000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "bot15gb",
    type: "private",
    access: "regular",
    name: "PANEL BOT 15GB",
    memory: 15125,
    disk: 15125,
    cpu: 300,
    price: 15000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "botunlimited",
    type: "private",
    access: "regular",
    name: "PANEL BOT UNLIMITED",
    memory: 0,
    disk: 0,
    cpu: 0,
    price: 17000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗕𝗶𝘀𝗻𝗶𝘀 𝗨𝗻𝘁𝘂𝗸 𝗦𝗲𝗺𝘂𝗮 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁",
    features: ["Full Akses Panel Bot Pterodactyl", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },

  // PAKET PANEL WEBSITE
    {
    id: "web1gb",
    type: "public",
    access: "regular",
    name: "PANEL WEB 1GB",
    memory: 1025,
    disk: 1025,
    cpu: 100,
    price: 10000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗛𝗲𝗺𝗮𝘁 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗥𝗶𝗻𝗴𝗮𝗻",
    features: ["Tester Project Website", "Support Egg Node.js 18 - 25", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "web2gb",
    type: "public",
    access: "regular",
    name: "PANEL WEB 2GB",
    memory: 2025,
    disk: 2025,
    cpu: 200,
    price: 15000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗛𝗲𝗺𝗮𝘁 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗦𝘁𝗮𝗻𝗱𝗮𝗿",
    features: ["Tester Project Website", "Support Egg Node.js 18 - 25", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "web3gb",
    type: "public",
    access: "regular",
    name: "PANEL WEB 3GB",
    memory: 3025,
    disk: 3025,
    cpu: 300,
    price: 20000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗛𝗲𝗺𝗮𝘁 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗕𝗲𝗿𝗮𝘁",
    features: ["Tester Project Website", "Support Egg Node.js 18 - 25", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "web4gb",
    type: "public",
    access: "regular",
    name: "PANEL WEB 4GB",
    memory: 4025,
    disk: 4025,
    cpu: 400,
    price: 25000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗛𝗲𝗺𝗮𝘁 𝗨𝗻𝘁𝘂𝗸 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁 𝗕𝗲𝗿𝗮𝘁",
    features: ["Tester Project Website", "Support Egg Node.js 18 - 25", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },
  {
    id: "webunlimited",
    type: "public",
    access: "regular",
    name: "PANEL WEB UNLIMITED",
    memory: 0,
    disk: 0,
    cpu: 0,
    price: 30000,
    durationDays: 20,
    description: "𝗣𝗮𝗸𝗲𝘁 𝗕𝗶𝘀𝗻𝗶𝘀 𝗨𝗻𝘁𝘂𝗸 𝗦𝗲𝗺𝘂𝗮 𝗦𝗰𝗿𝗶𝗽𝘁 𝗕𝗼𝘁",
    features: ["Tester Project Website", "Support Egg Node.js 18 - 25", "Bebas Ganti Script", "Server Private dan Terjaga", "Keamanan Data dan Privasi Terjamin", "Aman Dari Pencurian Files", "Server Aktif 24 Jam NonStop"],
  },

  // Public Plans - Admin Access

  // access "admin" = admin panel
  // access "regular" = panel biasa
  //{
    //id: "adminpanel",
    //type: "public",
    //access: "admin",
    //name: "GA DI JUAL",
    //memory: 0,
    //disk: 0,
    //cpu: 0,
    //price: 1000000,
    //durationDays: 20,
    //description: "𝗞𝗼𝗻𝘁𝗿𝗼𝗹 𝗗𝗮𝗻 𝗠𝗲𝗺𝗯𝘂𝗮𝘁 𝗣𝗮𝗻𝗲𝗹 𝗔𝗻𝗱𝗮 𝗦𝗲𝗻𝗱𝗶𝗿𝗶",
    //features: ["Akses Admin Panel", "Membuat Panel Sepuasnya", "Bisa Jualan Panel", "Support Egg Node.js 15 - 24", "Support Egg Python 2.7 - 3.13", "Masa Aktif ±1 Bulan", "Garansi Aktif 30 Hari", "Garansi 5× Replace"],
  //},
]
    

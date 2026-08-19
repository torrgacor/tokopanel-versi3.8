import clientPromise from "./mongodb"
import { appConfig } from "@/data/config"

export interface CronLogEntry {
  _id?: any
  tanggal: string
  dijalankanPada: Date
  sumber: "otomatis" | "manual"
  sukses: boolean
  pesanError?: string | null
  panelExpiredDitemukan: Array<{
    transactionId: string
    username: string
    email: string
    planId: string
    serverType: string
    expiresAt: string
  }>
  serverDihapus: Array<{
    transactionId: string
    serverId: number
    respon: any
  }>
  akunPanelDihapus: Array<{
    transactionId: string
    panelUserId: number
    username: string
    respon: any
  }>
  pengingatDikirim: Array<{
    transactionId: string
    username: string
    email: string
    expiresAt: string
  }>
  rawResponse: any
}

export async function getCronLogsCollection() {
  const client = await clientPromise
  const db = client.db(appConfig.mongodb.dbName)
  return db.collection<CronLogEntry>("cron_logs")
}

export async function simpanCronLog(entry: CronLogEntry) {
  const collection = await getCronLogsCollection()
  const hasil = await collection.insertOne(entry)
  return hasil.insertedId
}

export async function ambilCronLogs(limit = 60) {
  const collection = await getCronLogsCollection()
  return collection.find({}).sort({ dijalankanPada: -1 }).limit(limit).toArray()
}

"use server"

import { Pterodactyl } from "@/lib/pterodactyl"
import { generatePassword } from "@/lib/utils"
import { sendPanelDetailsEmail } from "@/lib/email-service"
import { sendTelegramNotification, sendTelegramTestimonial } from "@/lib/telegram-service"
import { plans } from "@/data/plans"

type ServerType = "public" | "private"
type AccessType = "reguler" | "admin"

type PanelData = {
  idtransaksi: string
  username: string
  email: string
  memory: number
  disk: number
  cpu: number
  planId: string
  serverType: ServerType
  accessType: AccessType
  createdAt: string
  selectedEggId?: number 
  quantity: number
}

export async function createPanel(data: PanelData) {
  try {
    const {
      idtransaksi,
      username,
      email,
      memory,
      disk,
      cpu,
      planId,
      serverType,
      accessType,
      createdAt,
      selectedEggId, 
      quantity,
    } = data

    const password = generatePassword(10)
    const pterodactyl = new Pterodactyl(serverType, accessType)

    console.log(`[${serverType.toUpperCase()}] Creating user ${username}`)

    const userResponse = await pterodactyl.createUser(
      username,
      email,
      password,
      accessType
    )

    if (!userResponse.attributes) {
      throw new Error("Gagal membuat user: " + JSON.stringify(userResponse))
    }

    const userId = userResponse.attributes.id
    const serverIds: number[] = [] 
    for (let i = 1; i <= quantity; i++) {
      const serverName = quantity > 1 ? `${username}'s Server #${i}` : `${username}'s Server`
      
      console.log(`[${serverType.toUpperCase()}] Creating server ${i}/${quantity} for user ${userId}`)

      try {
        const serverResponse = await pterodactyl.addServer(
          userId,
          serverName,
          memory,
          disk,
          cpu,
          selectedEggId 
        )

        if (!serverResponse.attributes) {
          throw new Error(`Gagal membuat server urutan ke-${i}`)
        }

        serverIds.push(serverResponse.attributes.id)
      } catch (serverError) {
        console.error(`Error pas looping server ke-${i}:`, serverError)
        if (serverIds.length === 0) {
          await pterodactyl.deleteUser(userId)
        }
        throw serverError
      }
    }

    const plan = plans.find((p) => p.id === planId)
    if (!plan) {
      throw new Error("Plan tidak ditemukan")
    }
     
    sendPanelDetailsEmail(
      email,
      idtransaksi,
      username,
      password,
      serverIds[0],
      `${plan.name} (${quantity}x Server)`,
      serverType,
    ).catch(console.error)
    
    sendTelegramNotification(
  userId,
  idtransaksi,
  createdAt,
  plan.price * quantity,
  plan.name,
  email,
  quantity
).catch(console.error)
      
      sendTelegramTestimonial(
  idtransaksi,
  plan.name,
  plan.price * quantity,
  email,
  quantity
).catch(console.error)

    return {
      success: true,
      userId,
      serverIds,
      password,
    }
  } catch (error) {
    console.error("Error creating panel:", error)
    throw new Error(
      error instanceof Error
        ? error.message
        : "Terjadi kesalahan saat membuat panel"
    )
  }
}

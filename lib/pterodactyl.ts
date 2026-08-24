// lib/pterodactyl.ts
import { pterodactylConfig, EggConfig } from "@/data/config"

interface UserAttributes {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
}

interface ServerAttributes {
  id: number
  name: string
  user: number
}

interface EggAttributes {
  id: number
  name: string
  startup: string
  docker_images: Record<string, string>
}

interface UserResponse {
  attributes?: UserAttributes
}

interface ServerResponse {
  attributes?: ServerAttributes
}

interface EggResponse {
  attributes?: EggAttributes
}

interface EggListResponse {
  data?: Array<{ attributes: EggAttributes }>
}

interface ServerListResponse {
  data?: Array<{ attributes: ServerAttributes }>
}

interface UserListResponse {
  data?: Array<{ attributes: UserAttributes }>
  meta?: {
    pagination: {
      total_pages: number
    }
  }
}

type ServerType = "public" | "private"
type AccessType = "reguler" | "admin"

export interface EggOption {
  id: number
  nama: string
  harga: number
  catatan: string
}

export class Pterodactyl {
  private domain: string
  private apiKey: string
  private nests: string
  private eggs: EggConfig[]
  private defaultEggId: number
  private location: string
  private accessType: AccessType

  constructor(serverType: ServerType, accessType: AccessType) {
    const config = pterodactylConfig[serverType]
    this.domain = config.domain
    this.apiKey = config.apiKey
    this.nests = config.nests
    this.eggs = config.eggs // Use eggs array from config
    this.defaultEggId = config.defaultEggId
    this.location = config.location
    this.accessType = accessType
  }

  async request<T>(endpoint: string, method = "GET", body: any = null): Promise<T> {
    const res = await fetch(`${this.domain}/api/application${endpoint}`, {
      method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.errors?.[0]?.detail || "Pterodactyl API Error")
    }

    return res.json()
  }

  async getEggs(): Promise<EggOption[]> {
    // Return eggs from config instead of fetching from API
    // This is faster and more reliable
    return this.eggs.map(egg => ({
      id: egg.id,
      nama: egg.nama,
      harga: egg.harga,
      catatan: egg.catatan
    }))
  }

  async createUser(username: string, email: string, password: string): Promise<UserResponse> {
    return this.request("/users", "POST", {
      username,
      email,
      first_name: username,
      last_name: this.accessType === "admin" ? "Admin" : "User",
      password,
      root_admin: this.accessType === "admin",
    })
  }

  async addServer(
    userId: number,
    serverName: string,
    memory: number,
    disk: number,
    cpu: number,
    selectedEggId?: number
  ): Promise<ServerResponse> {
    // Use selected egg or default egg
    const eggId = selectedEggId || this.defaultEggId
     
    const eggData = await this.request<any>(
  `/nests/${this.nests}/eggs/${eggId}?include=variables`
)

    // Get docker image - try to find appropriate image
    let dockerImage = Object.values(eggData.attributes?.docker_images || {})[0]
    
    if (!dockerImage) {
      dockerImage = "ghcr.io/parkervcp/yolks:nodejs_20"
    }

    if (!eggData.attributes?.startup || !dockerImage) {
      throw new Error("Egg configuration invalid")
    }

    // Prepare environment variables based on egg type
    const environment: Record<string, any> = {}
    const variables = eggData.attributes?.relationships?.variables?.data || []

for (const v of variables) {
  const attr = v.attributes
  const key = attr.env_variable
  const defaultValue = attr.default_value

  const rules = Array.isArray(attr.rules)
    ? attr.rules.join("|")
    : attr.rules || ""

  if (rules.includes("boolean")) {
    environment[key] = defaultValue === "true"
  } else if (rules.includes("numeric")) {
    environment[key] = Number(defaultValue) || 0
  } else {
    environment[key] = defaultValue ?? ""
  }
}

    return this.request("/servers", "POST", {
      name: serverName,
      user: userId,
      egg: eggId,
      docker_image: dockerImage,
      startup: eggData.attributes.startup,
      limits: {
        memory,
        swap: 0,
        disk,
        io: 500,
        cpu,
      },
      feature_limits: {
        databases: 5,
        backups: 5,
        allocations: 1,
      },
      deploy: {
        locations: [Number(this.location)],
        dedicated_ip: false,
        port_range: [],
      },
      environment,
    })
  }

  async listServers() {
    const res = await this.request<ServerListResponse>("/servers")
    return res.data?.map(s => s.attributes) || []
  }

  async listUsers() {
    let page = 1
    let allUsers: any[] = []
    let hasNextPage = true

    while (hasNextPage) {
      const res = await this.request<UserListResponse>(`/users?page=${page}`)

      const users = res.data?.map(u => u.attributes) || []
      allUsers.push(...users)

      const pagination = res.meta?.pagination
      if (!pagination || page >= pagination.total_pages) {
        hasNextPage = false
      } else {
        page++
      }
    }
    return allUsers
  }
  
  async deleteServer(serverId: number) {
    return this.request(`/servers/${serverId}`, "DELETE")
  }

  async deleteUser(userId: number) {
    return this.request(`/users/${userId}`, "DELETE")
  }
}

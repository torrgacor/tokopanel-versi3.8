import { MongoClient } from "mongodb"
import { appConfig } from "@/data/config"

const uri = appConfig.mongodb.uri
const options = {}

let client: MongoClient | null = null
let clientPromise: Promise<MongoClient> | null = null

// Lazy initialization - only create connection when actually needed
const getClientPromise = async (): Promise<MongoClient> => {
  if (clientPromise) {
    return clientPromise
  }

  if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local")
  }

  if (process.env.NODE_ENV === "development") {
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>
    }

    if (!globalWithMongo._mongoClientPromise) {
      client = new MongoClient(uri, options)
      globalWithMongo._mongoClientPromise = client.connect()
    }
    clientPromise = globalWithMongo._mongoClientPromise
  } else {
    client = new MongoClient(uri, options)
    clientPromise = client.connect()
  }

  return clientPromise
}

// Export a promise-like object that initializes on first await
class LazyClientPromise {
  private promise: Promise<MongoClient> | null = null

  async then<TResult1 = MongoClient, TResult2 = never>(
    onfulfilled?: ((value: MongoClient) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    if (!this.promise) {
      this.promise = getClientPromise()
    }
    return this.promise.then(onfulfilled, onrejected)
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<MongoClient | TResult> {
    if (!this.promise) {
      this.promise = getClientPromise()
    }
    return this.promise.catch(onrejected)
  }

  finally(onfinally?: (() => void) | null): Promise<MongoClient> {
    if (!this.promise) {
      this.promise = getClientPromise()
    }
    return this.promise.finally(onfinally)
  }
}

export default new LazyClientPromise()

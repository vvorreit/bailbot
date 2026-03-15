import type { Metier } from '@prisma/client'
import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      isPro: boolean
      clientCount: number
      teamId?: string
      teamRole?: string
      metier?: Metier | null
    }
    error?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
    isPro: boolean
    clientCount: number
    teamId?: string
    teamRole?: string
    metier?: Metier | null
    error?: string
    accessToken?: string
    refreshToken?: string
    accessTokenExpires?: number
  }
}

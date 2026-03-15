'use client'

import { useSession } from 'next-auth/react'
import { hasAccess, type Feature } from '@/lib/features'

export function useFeature(feature: Feature): boolean {
  const { data: session } = useSession()
  return hasAccess(session?.user?.metier, feature)
}

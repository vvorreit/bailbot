'use client'

import { hasAccess, type Feature } from '@/lib/features'

export function useFeature(feature: Feature): boolean {
  return hasAccess(null, feature)
}

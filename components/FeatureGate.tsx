'use client'

import { useFeature } from '@/hooks/useFeature'
import type { Feature } from '@/lib/features'

interface Props {
  feature: Feature
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function FeatureGate({ feature, fallback = null, children }: Props) {
  const allowed = useFeature(feature)
  if (!allowed) return <>{fallback}</>
  return <>{children}</>
}

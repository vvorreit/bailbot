import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { hasAccess, type Feature } from '@/lib/features'

/**
 * Vérifie que la session active a accès à une feature.
 * Lance une NextResponse 403 si l'accès est refusé.
 *
 * Usage dans une route API :
 *   const guard = await requireFeature('DASHBOARD_IMPAYES')
 *   if (guard) return guard
 */
export async function requireFeature(feature: Feature): Promise<NextResponse | null> {
  const session = await getServerSession(authOptions)
  const metier = (session?.user as any)?.metier ?? null
  if (!metier || !hasAccess(metier, feature)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return null
}

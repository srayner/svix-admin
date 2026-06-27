'use client'

import { createContext, useContext } from 'react'
import type { EventTypeConfig } from './types'

interface SvixAdminContext {
  appId: string
  appName: string
  apiBaseUrl: string
  eventTypes: EventTypeConfig[]
}

const Context = createContext<SvixAdminContext | null>(null)

export const SvixAdminProvider = Context.Provider

export function useSvixAdmin(): SvixAdminContext {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('useSvixAdmin must be used inside SvixAdmin')
  return ctx
}

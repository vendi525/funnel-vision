'use client'

import { useEffect, useState } from 'react'
import FunnelPage, { defaultFunnelData } from '@/app/f/[slug]/page'
import MerchFunnelPage from '@/app/f/merch/page'
import EventFunnelPage from '@/app/f/event/page'
import NewsletterFunnelPage from '@/app/f/newsletter/page'

export default function BuilderPreviewPage() {
  const [funnelType, setFunnelType] = useState<string>('product')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [data, setData] = useState<any>(defaultFunnelData)

  useEffect(() => {
    const stored = localStorage.getItem('fv_builder_draft')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.funnelType) setFunnelType(parsed.funnelType)
        if (parsed.data) setData(parsed.data)
      } catch { /* ignore */ }
    }

    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'fv_preview_update') {
        if (e.data.funnelType) setFunnelType(e.data.funnelType)
        if (e.data.data) setData(e.data.data)
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  // 'product' and legacy 'merch' both map to MerchFunnelPage
  if (funnelType === 'product' || funnelType === 'merch') return <MerchFunnelPage funnelData={data} previewMode />
  if (funnelType === 'event')      return <EventFunnelPage      funnelData={data} previewMode />
  if (funnelType === 'newsletter') return <NewsletterFunnelPage funnelData={data} previewMode />
  return <FunnelPage funnelData={data} previewMode />
}

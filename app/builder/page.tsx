'use client'

import React, { useEffect, useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen     = 'login' | 'dashboard' | 'type-picker' | 'editor' | 'published'
type FunnelType = 'product' | 'event' | 'newsletter'
type EditorStep = 1 | 2 | 3 | 4   // theme · content · link · publish

interface BuilderDraft {
  bgColor: string; textColor: string; accentColor: string
  fontHeading: string; fontBody: string
  heroHeadline: string; heroSubheadline: string; heroCopy: string; heroBgImage: string
  videoUrl: string
  mediaUrl: string; mediaType: 'video' | 'image'
  eventDate: string; eventTime: string; eventLocation: string
  newsletterBenefits: [string, string, string, string]
  offerTitle: string; offerPrice: string
  offerBenefits: [string, string, string]
  ctaText: string; ctaLink: string; trustLine: string
  stockCount: number; spotsTotal: number; spotsTaken: number
}

interface Project {
  id: string
  type: FunnelType
  name: string
  createdAt: string
  accent: string
  bg: string
  draft: BuilderDraft
}

// ─── Constants ────────────────────────────────────────────────────────────────

const THEMES = [
  { id: 'hip-green',     label: 'HIP\nGreen',     bg: '#f2efec', text: '#000000', accent: '#556032', fontHeading: 'Archivo Narrow', fontBody: 'Archivo Narrow' },
  { id: 'hip-orange',    label: 'HIP\nOrange',    bg: '#fffdfc', text: '#121212', accent: '#d05c31', fontHeading: 'Archivo Narrow', fontBody: 'Archivo Narrow' },
  { id: 'grace',         label: 'GRACE',          bg: '#fffdfc', text: '#282828', accent: '#571a1a', fontHeading: 'Playfair Display', fontBody: 'DM Sans' },
  { id: 'grace-reverse', label: 'GRACE\nReverse', bg: '#571a1a', text: '#fffdfc', accent: '#556032', fontHeading: 'Playfair Display', fontBody: 'DM Sans' },
  { id: 'gain',          label: 'GAIN',           bg: '#000000', text: '#ffffff', accent: '#7c3aed', fontHeading: 'Anton', fontBody: 'Archivo Narrow' },
  { id: 'focus',         label: 'FOCUS',          bg: '#f9f9f9', text: '#000000', accent: '#831515', fontHeading: 'Helvetica Neue', fontBody: 'Open Sans' },
]

const FUNNEL_TYPES: { id: FunnelType; label: string; description: string }[] = [
  {
    id: 'product',
    label: 'Product Funnel',
    description: 'Product page with full-viewport media, offer card with scarcity indicator and Buy Now CTA.',
  },
  {
    id: 'event',
    label: 'Event Funnel',
    description: 'Event info page with time and location, additional info and offer page with Register Now CTA and capacity indicator.',
  },
  {
    id: 'newsletter',
    label: 'Newsletter Funnel',
    description: 'Editorial card with benefits list. Pure email capture — no spam, unsubscribe anytime.',
  },
]

// Theme-first: step 1 = Theme, step 2 = Content, step 3 = Link, step 4 = Publish
const STEP_LABELS = ['Theme', 'Content', 'Link', 'Publish']

// Full placeholder defaults per type — populate the preview from the start
const TYPE_DEFAULTS: Record<FunnelType, BuilderDraft> = {
  product: {
    bgColor: '#000000', textColor: '#ffffff', accentColor: '#7c3aed',
    fontHeading: 'Anton', fontBody: 'Archivo Narrow',
    heroHeadline: 'Drop Season',
    heroSubheadline: "Limited edition. Once it's gone, it's gone.",
    heroCopy: 'Every piece is made to order. No restock. No bulk. Just clean design and quality you can feel.',
    heroBgImage: '',
    videoUrl: '', mediaUrl: '', mediaType: 'video',
    eventDate: '', eventTime: '', eventLocation: '',
    newsletterBenefits: ['', '', '', ''],
    offerTitle: 'Get yours', offerPrice: '$49',
    offerBenefits: ['Premium heavyweight cotton, 400gsm', 'Screen-printed, not heat-transferred', 'Ships in 3–5 business days'],
    ctaText: 'Shop the drop', ctaLink: '', trustLine: 'Free shipping · Easy returns',
    stockCount: 12, spotsTotal: 100, spotsTaken: 0,
  },
  event: {
    bgColor: '#571a1a', textColor: '#fffdfc', accentColor: '#556032',
    fontHeading: 'Playfair Display', fontBody: 'DM Sans',
    heroHeadline: 'One Night Only',
    heroSubheadline: 'The event everyone will be talking about.',
    heroCopy: 'An intimate evening of music, art, and unexpected moments. Limited capacity.',
    heroBgImage: '',
    videoUrl: '', mediaUrl: '', mediaType: 'video',
    eventDate: 'Jun 12', eventTime: '8:00 PM', eventLocation: 'Rooftop 23',
    newsletterBenefits: ['', '', '', ''],
    offerTitle: 'Reserve your spot', offerPrice: '$35',
    offerBenefits: ['Live performance + open bar', 'Rooftop terrace with city views', 'Strictly 120 guests'],
    ctaText: 'Register now', ctaLink: '', trustLine: 'Free cancellation up to 48 hours before',
    stockCount: 0, spotsTotal: 120, spotsTaken: 97,
  },
  newsletter: {
    bgColor: '#fffdfc', textColor: '#282828', accentColor: '#571a1a',
    fontHeading: 'Playfair Display', fontBody: 'DM Sans',
    heroHeadline: 'The Brief',
    heroSubheadline: 'Sharp ideas. No noise. Every Tuesday.',
    heroCopy: 'Trusted by 40,000 founders and creatives who want to stay sharp.',
    heroBgImage: '',
    videoUrl: '', mediaUrl: '', mediaType: 'video',
    eventDate: '', eventTime: '', eventLocation: '',
    newsletterBenefits: [
      'One big idea distilled into a 5-minute read',
      'Tools and resources actually worth your time',
      'Interviews with people building things that matter',
      'Zero sponsored content, ever',
    ],
    offerTitle: 'Join the list', offerPrice: '',
    offerBenefits: ['', '', ''],
    ctaText: 'Subscribe free', ctaLink: '', trustLine: '',
    stockCount: 0, spotsTotal: 100, spotsTaken: 0,
  },
}

const DEFAULT_THEME_FOR: Record<FunnelType, string> = {
  product: 'gain',
  event: 'grace-reverse',
  newsletter: 'grace',
}

const PREV_W = 175
const PREV_H = Math.round(PREV_W * 932 / 430)   // ≈ 379

// ─────────────────────────────────────────────────────────────────────────────
// Module-level components — MUST be outside BuilderPage to avoid remounting
// (defining components inside a parent component causes React to see a new
// type every render, unmounting/remounting children and destroying focus)
// ─────────────────────────────────────────────────────────────────────────────

const minInput: React.CSSProperties = {
  width: '100%', background: 'transparent', border: 'none',
  borderBottom: '1px solid rgba(255,255,255,0.09)',
  color: '#fff', fontSize: '0.95rem', padding: '0.5rem 0',
  fontFamily: 'inherit', outline: 'none',
  boxSizing: 'border-box', WebkitAppearance: 'none',
}

function SectionLabel({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <p style={{
      fontSize: '0.58rem', fontWeight: 800, letterSpacing: '0.12em',
      textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)',
      margin: first ? '0.5rem 0 0.75rem' : '1.75rem 0 0.75rem',
      paddingTop: first ? 0 : '1.5rem',
      borderTop: first ? 'none' : '1px solid rgba(255,255,255,0.05)',
    }}>
      {children}
    </p>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)', marginBottom: '0.3rem' }}>
        {label}
      </div>
      {children}
    </div>
  )
}

function StepIndicator({ step, accentColor }: { step: number; accentColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '0.55rem 2rem 0.7rem' }}>
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const isActive = step === n
        const isDone   = step > n
        return (
          <React.Fragment key={n}>
            {i > 0 && <div style={{ flex: 1, height: 1.5, background: isDone ? accentColor : 'rgba(255,255,255,0.07)', transition: 'background 0.3s' }} />}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: isActive ? '#ffffff' : isDone ? accentColor : 'transparent',
                border: (isActive || isDone) ? 'none' : '1.5px solid rgba(255,255,255,0.14)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.65rem', fontWeight: 800,
                color: isActive ? '#000' : isDone ? '#000' : 'rgba(255,255,255,0.22)',
                transition: 'all 0.3s',
              }}>
                {isDone ? '✓' : n}
              </div>
              <span style={{ fontSize: '0.5rem', fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: isActive ? '#fff' : 'rgba(255,255,255,0.22)', transition: 'color 0.3s' }}>
                {label}
              </span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

function PreviewFrame({
  w = PREV_W,
  iframeRef,
  src,
  onLoad,
}: {
  w?: number
  iframeRef: React.RefObject<HTMLIFrameElement | null>
  src: string
  onLoad: () => void
}) {
  const scale = w / 430
  const h     = Math.round(w * 932 / 430)
  return (
    <div style={{
      width: w, height: h,
      borderRadius: '2rem', border: '1.5px solid rgba(255,255,255,0.09)',
      overflow: 'hidden', position: 'relative', flexShrink: 0,
      boxShadow: '0 12px 48px rgba(0,0,0,0.6)',
    }}>
      <div style={{ position: 'absolute', top: 7, left: '50%', transform: 'translateX(-50%)', width: 52, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(255,255,255,0.06)', zIndex: 99, pointerEvents: 'none' }} />
      <iframe
        ref={iframeRef}
        src={src}
        title="Funnel preview"
        onLoad={onLoad}
        style={{ width: 430, height: 932, border: 'none', transform: `scale(${scale})`, transformOrigin: 'top left' }}
      />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function BuilderPage() {
  const [screen, setScreen]             = useState<Screen>('login')
  const [projects, setProjects]         = useState<Project[]>([])
  const [selectedType, setSelectedType] = useState<FunnelType | null>(null)
  const [funnelType, setFunnelType]     = useState<FunnelType>('product')
  const [step, setStep]                 = useState<EditorStep>(1)
  const [draft, setDraft]               = useState<BuilderDraft>({ ...TYPE_DEFAULTS.product })
  const [themeId, setThemeId]           = useState('gain')
  const [errors, setErrors]             = useState<string[]>([])
  const [publishing, setPublishing]     = useState(false)
  const [slug, setSlug]                 = useState('')
  const [copied, setCopied]             = useState(false)
  const [mediaThumb, setMediaThumb]     = useState('')

  const iframeRef = useRef<HTMLIFrameElement>(null)
  const fileRef   = useRef<HTMLInputElement>(null)

  // ── Draft helpers ─────────────────────────────────────────────────────────

  const set = <K extends keyof BuilderDraft>(k: K, v: BuilderDraft[K]) =>
    setDraft(d => ({ ...d, [k]: v }))

  const setBenefit = (i: 0 | 1 | 2, v: string) =>
    setDraft(d => {
      const b = [...d.offerBenefits] as [string, string, string]
      b[i] = v
      return { ...d, offerBenefits: b }
    })

  const setNlBenefit = (i: 0 | 1 | 2 | 3, v: string) =>
    setDraft(d => {
      const b = [...d.newsletterBenefits] as [string, string, string, string]
      b[i] = v
      return { ...d, newsletterBenefits: b }
    })

  // ── Theme / font pickers ──────────────────────────────────────────────────

  const pickTheme = (id: string) => {
    const t = THEMES.find(x => x.id === id)
    if (!t) return
    setThemeId(id)
    setDraft(d => ({ ...d, bgColor: t.bg, textColor: t.text, accentColor: t.accent, fontHeading: t.fontHeading, fontBody: t.fontBody }))
  }

  // ── Media upload ──────────────────────────────────────────────────────────

  const onMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url     = URL.createObjectURL(file)
    const isVideo = file.type.startsWith('video/')
    setMediaThumb(url)
    setDraft(d => ({ ...d, mediaUrl: url, videoUrl: isVideo ? url : d.videoUrl, mediaType: isVideo ? 'video' : 'image' }))
  }

  // ── Navigation + validation ───────────────────────────────────────────────

  const validate = () => {
    const errs: string[] = []
    if (!draft.heroHeadline.trim())    errs.push('Headline is required')
    if (!draft.heroSubheadline.trim()) errs.push('Sales pitch is required')
    if (funnelType === 'event') {
      if (!draft.eventDate.trim())     errs.push('Event date is required')
      if (!draft.eventTime.trim())     errs.push('Event time is required')
      if (!draft.eventLocation.trim()) errs.push('Location is required')
    }
    setErrors(errs)
    return errs.length === 0
  }

  const goNext = () => {
    if (step === 2 && !validate()) return  // content is step 2
    setErrors([])
    if (step < 4) setStep(s => (s + 1) as EditorStep)
  }

  const goBack = () => {
    setErrors([])
    if (step > 1) setStep(s => (s - 1) as EditorStep)
    else          setScreen('dashboard')
  }

  // ── Start editing a funnel type ───────────────────────────────────────────

  const pickType = (t: FunnelType) => {
    setFunnelType(t)
    setDraft({ ...TYPE_DEFAULTS[t] })
    setMediaThumb('')
    setStep(1)
    setErrors([])
    setThemeId(DEFAULT_THEME_FOR[t])
    setScreen('editor')
  }

  // ── Open existing project ─────────────────────────────────────────────────

  const openProject = (p: Project) => {
    // Normalise old type IDs
    const rawType = p.type as string
    const t: FunnelType = (rawType === 'merch' || rawType === 'default')
      ? 'product'
      : (p.type as FunnelType)
    setFunnelType(t)
    setDraft(p.draft)
    setMediaThumb('')
    setStep(1)
    setErrors([])
    const mt = THEMES.find(x => x.accent === p.draft.accentColor)
    if (mt) setThemeId(mt.id)
    setScreen('editor')
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  const publish = async () => {
    setPublishing(true)

    // TODO: upload media to Supabase Storage and replace draft.mediaUrl / draft.videoUrl
    // const { data: upload } = await supabase.storage.from('funnel-media').upload(...)

    // TODO: insert funnel record into Supabase
    // const { error } = await supabase.from('funnels').insert({
    //   slug: newSlug, funnel_type: funnelType, funnel_data: draft, created_at: new Date().toISOString(),
    // })

    const base = (draft.offerTitle || draft.heroHeadline || funnelType)
      .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const newSlug = `${base}-${Date.now().toString(36)}`

    await new Promise(r => setTimeout(r, 1300))

    const project: Project = {
      id: newSlug, type: funnelType,
      name: draft.offerTitle || draft.heroHeadline || 'Untitled',
      createdAt: new Date().toISOString(),
      accent: draft.accentColor, bg: draft.bgColor,
      draft,
    }
    const updated = [project, ...projects]
    setProjects(updated)
    localStorage.setItem('fv_projects', JSON.stringify(updated))

    setSlug(newSlug)
    setPublishing(false)
    setScreen('published')
  }

  // ── Side effects ──────────────────────────────────────────────────────────

  useEffect(() => {
    const payload = { funnelType, data: draft }
    localStorage.setItem('fv_builder_draft', JSON.stringify(payload))
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'fv_preview_update', funnelType, data: draft }, '*'
    )
  }, [draft, funnelType])

  const onIframeLoad = () => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'fv_preview_update', funnelType, data: draft }, '*'
    )
  }

  useEffect(() => {
    const stored = localStorage.getItem('fv_projects')
    if (stored) { try { setProjects(JSON.parse(stored)) } catch { /* ignore */ } }
  }, [])

  useEffect(() => {
    const id = 'fv-builder-gfonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,700;0,9..40,900&display=swap'
    document.head.appendChild(link)
  }, [])

  // ── Derived ───────────────────────────────────────────────────────────────

  const origin     = typeof window !== 'undefined' ? window.location.origin : ''
  const previewUrl = `${origin}/builder/preview`
  const publishedUrl = slug ? `${origin}/f/${slug}` : ''

  // ─────────────────────────────────────────────────────────────────────────
  // Step renderers (called as functions, not JSX components — safe)
  // ─────────────────────────────────────────────────────────────────────────

  function renderThemeFields() {
    return (
      <>
        <SectionLabel first>Choose a theme</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.55rem' }}>
          {THEMES.map(t => {
            const sel = themeId === t.id
            const isLight = t.bg !== '#000000' && t.bg !== '#571a1a'
            const fontLabel = t.fontHeading === t.fontBody
              ? t.fontHeading
              : `${t.fontHeading.split(' ')[0]} · ${t.fontBody.split(' ')[0]}`
            return (
              <button key={t.id} onClick={() => pickTheme(t.id)} style={{
                background: t.bg,
                border: `2px solid ${sel ? t.accent : isLight ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: '0.9rem', padding: '0.85rem 0.8rem', cursor: 'pointer', textAlign: 'left',
                position: 'relative', transition: 'border-color 0.2s', outline: 'none',
              }}>
                <p style={{
                  margin: '0 0 0.55rem',
                  fontSize: '1.35rem', fontWeight: 900,
                  fontFamily: `'${t.fontHeading}', serif`,
                  color: t.accent, lineHeight: 1,
                  letterSpacing: t.fontHeading === 'Anton' ? '0.01em' : '-0.02em',
                }}>Aa</p>
                <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
                  {[t.bg, t.text, t.accent].map((c, ci) => (
                    <div key={ci} style={{ width: 11, height: 11, borderRadius: '50%', background: c, border: `1px solid ${isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'}` }} />
                  ))}
                </div>
                <p style={{ margin: 0, fontSize: '0.65rem', fontWeight: 800, color: t.text, whiteSpace: 'pre-line', lineHeight: 1.2, letterSpacing: '0.02em' }}>{t.label}</p>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.54rem', color: t.text, opacity: 0.4, lineHeight: 1.2 }}>{fontLabel}</p>
                {sel && (
                  <span style={{
                    position: 'absolute', top: 6, right: 6,
                    width: 15, height: 15, borderRadius: '50%',
                    background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.5rem', fontWeight: 900, color: '#fff',
                  }}>✓</span>
                )}
              </button>
            )
          })}
        </div>
      </>
    )
  }

  function renderContentFields() {
    const isEvent      = funnelType === 'event'
    const isNewsletter = funnelType === 'newsletter'
    const hasMedia     = !isNewsletter
    const acceptMedia  = funnelType === 'product' || funnelType === 'event' ? 'video/*,image/*' : 'video/*'

    return (
      <>
        <SectionLabel first>Hero</SectionLabel>

        <FieldRow label="Headline *">
          <input style={minInput} value={draft.heroHeadline}
            onChange={e => set('heroHeadline', e.target.value)}
            placeholder="Your big bold headline" maxLength={60} />
        </FieldRow>
        <FieldRow label="Sales pitch *">
          <input style={minInput} value={draft.heroSubheadline}
            onChange={e => set('heroSubheadline', e.target.value)}
            placeholder="One sentence about what you offer" maxLength={120} />
        </FieldRow>
        <FieldRow label="Body copy">
          <textarea style={{ ...minInput, resize: 'none', lineHeight: 1.55 } as React.CSSProperties}
            value={draft.heroCopy}
            onChange={e => set('heroCopy', e.target.value)}
            placeholder="Supporting paragraph — why they need this right now"
            maxLength={220} rows={3} />
        </FieldRow>

        {isEvent && (
          <>
            <SectionLabel>Event Details</SectionLabel>
            <FieldRow label="Date *">
              <input style={minInput} value={draft.eventDate}
                onChange={e => set('eventDate', e.target.value)}
                placeholder="e.g. Jun 12" maxLength={30} />
            </FieldRow>
            <FieldRow label="Time *">
              <input style={minInput} value={draft.eventTime}
                onChange={e => set('eventTime', e.target.value)}
                placeholder="e.g. 8:00 PM" maxLength={20} />
            </FieldRow>
            <FieldRow label="Location *">
              <input style={minInput} value={draft.eventLocation}
                onChange={e => set('eventLocation', e.target.value)}
                placeholder="e.g. Rooftop 23 or Online" maxLength={60} />
            </FieldRow>
          </>
        )}

        {hasMedia && (
          <>
            <SectionLabel>Media</SectionLabel>
            <div
              role="button" tabIndex={0}
              onClick={() => fileRef.current?.click()}
              onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              style={{ border: '1.5px dashed rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}
            >
              {mediaThumb ? (
                <div style={{ width: 50, height: 90, borderRadius: '0.4rem', overflow: 'hidden', flexShrink: 0 }}>
                  {draft.mediaType === 'image' ? (
                    <img src={mediaThumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                  ) : (
                    <video src={mediaThumb} style={{ width: '100%', height: '100%', objectFit: 'cover' }} muted playsInline />
                  )}
                </div>
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M12 4v12M8 8l4-4 4 4" stroke="rgba(255,255,255,0.35)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.55)' }}>
                  {mediaThumb ? 'Tap to replace' : funnelType === 'product' || funnelType === 'event' ? 'Upload video or image' : 'Upload video'}
                </p>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.68rem', color: 'rgba(255,255,255,0.2)' }}>
                  {funnelType === 'product' || funnelType === 'event' ? 'MP4, MOV, JPG, PNG · up to 100 MB' : 'MP4, MOV · up to 100 MB'}
                </p>
              </div>
            </div>
            <input ref={fileRef} type="file" accept={acceptMedia} style={{ display: 'none' }} onChange={onMediaUpload} />
          </>
        )}

        {isNewsletter && (
          <>
            <SectionLabel>What You&apos;ll Get</SectionLabel>
            {([0, 1, 2, 3] as const).map(i => (
              <FieldRow key={i} label={`Benefit ${i + 1}`}>
                <input style={minInput} value={draft.newsletterBenefits[i]}
                  onChange={e => setNlBenefit(i, e.target.value)}
                  placeholder={`Benefit line ${i + 1}`} maxLength={100} />
              </FieldRow>
            ))}
          </>
        )}

        <SectionLabel>{isEvent ? 'Registration' : isNewsletter ? 'Subscribe' : 'Offer'}</SectionLabel>

        <FieldRow label={isNewsletter ? 'Newsletter Name' : 'Title'}>
          <input style={minInput} value={draft.offerTitle}
            onChange={e => set('offerTitle', e.target.value)}
            placeholder={isEvent ? 'e.g. Reserve your spot' : isNewsletter ? 'e.g. The Brief' : 'Your offer title'}
            maxLength={50} />
        </FieldRow>

        {!isNewsletter && (
          <FieldRow label="Price (optional)">
            <input style={minInput} value={draft.offerPrice}
              onChange={e => set('offerPrice', e.target.value)}
              placeholder="e.g. $49 or Free" maxLength={20} />
          </FieldRow>
        )}

        {!isNewsletter && ([0, 1, 2] as const).map(i => (
          <FieldRow key={i} label={`Benefit ${i + 1}`}>
            <input style={minInput} value={draft.offerBenefits[i]}
              onChange={e => setBenefit(i, e.target.value)}
              placeholder={`Key benefit #${i + 1}`} maxLength={90} />
          </FieldRow>
        ))}

        {funnelType === 'product' && (
          <FieldRow label="Stock count (0 = hide indicator)">
            <input style={minInput} type="number" min={0}
              value={draft.stockCount}
              onChange={e => set('stockCount', Math.max(0, parseInt(e.target.value) || 0))} />
          </FieldRow>
        )}

        {isEvent && (
          <>
            <FieldRow label="Total spots">
              <input style={minInput} type="number" min={1}
                value={draft.spotsTotal}
                onChange={e => set('spotsTotal', Math.max(1, parseInt(e.target.value) || 1))} />
            </FieldRow>
            <FieldRow label="Spots taken">
              <input style={minInput} type="number" min={0}
                value={draft.spotsTaken}
                onChange={e => set('spotsTaken', Math.max(0, parseInt(e.target.value) || 0))} />
            </FieldRow>
          </>
        )}

        <FieldRow label="CTA Button text">
          <input style={minInput} value={draft.ctaText}
            onChange={e => set('ctaText', e.target.value)}
            placeholder={isEvent ? 'Register now' : isNewsletter ? 'Subscribe free' : 'Buy now'}
            maxLength={30} />
        </FieldRow>

        {!isNewsletter && !isEvent && (
          <FieldRow label="Trust line">
            <input style={minInput} value={draft.trustLine}
              onChange={e => set('trustLine', e.target.value)}
              placeholder="Free shipping · 30-day returns" maxLength={60} />
          </FieldRow>
        )}

        {errors.length > 0 && (
          <div style={{ marginTop: '0.75rem', padding: '0.85rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '0.65rem' }}>
            {errors.map((e, i) => <p key={i} style={{ margin: 0, fontSize: '0.82rem', color: '#fca5a5', lineHeight: 1.5 }}>{e}</p>)}
          </div>
        )}
      </>
    )
  }

  function renderLinkStep() {
    const isInline = funnelType === 'event' || funnelType === 'newsletter'
    return (
      <div style={{ paddingTop: '0.5rem' }}>
        {isInline ? (
          <div style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.85rem' }}>
            <p style={{ margin: '0 0 0.4rem', fontSize: '0.8rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
              {funnelType === 'event' ? 'Leads captured inline' : 'Subscribers captured inline'}
            </p>
            <p style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.3)' }}>
              {funnelType === 'event'
                ? 'This funnel captures name and email directly on the page. No external link needed.'
                : 'This funnel captures email addresses directly on the page. No external link needed.'}
            </p>
          </div>
        ) : (
          <>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.78rem', lineHeight: 1.55, color: 'rgba(255,255,255,0.35)' }}>
              Where should the CTA button send visitors? Paste your checkout or sales page URL.
            </p>
            <FieldRow label="Sales page URL">
              <input
                style={{ ...minInput, fontFamily: 'monospace', fontSize: '0.82rem' }}
                value={draft.ctaLink}
                onChange={e => set('ctaLink', e.target.value)}
                placeholder="https://buy.stripe.com/..."
                type="url" inputMode="url" autoCapitalize="none" autoCorrect="off"
              />
            </FieldRow>
          </>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── SCREEN: Login ─────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 'login') {
    const handleGoogleLogin = () => {
      // TODO: Supabase Auth
      // await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/builder' } })
      setScreen('dashboard')
    }
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: '"Inter", -apple-system, sans-serif' }}>
        <div style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '1rem', background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>Funnel Vision</h1>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.35)', margin: 0 }}>Build scroll funnels in minutes</p>
        </div>
        <button onClick={handleGoogleLogin} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.5rem', background: '#fff', color: '#111', borderRadius: '0.75rem', border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, fontFamily: 'inherit', width: '100%', maxWidth: 300, justifyContent: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
        <p style={{ marginTop: '2.5rem', fontSize: '0.72rem', color: 'rgba(255,255,255,0.15)', textAlign: 'center', lineHeight: 1.6, maxWidth: 260 }}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── SCREEN: Published / Congratulations ───────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 'published') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', fontFamily: '"Inter", -apple-system, sans-serif', color: '#fff', maxWidth: 430, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '1.5px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', marginBottom: '1.5rem' }}>✓</div>
        <h2 style={{ fontSize: '1.65rem', fontWeight: 900, margin: '0 0 0.5rem', letterSpacing: '-0.025em' }}>Your funnel is live</h2>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', margin: '0 0 2.5rem', lineHeight: 1.55 }}>
          Drop this link in your Instagram bio, TikTok profile, or ad.
        </p>
        <div style={{ width: '100%', background: '#141414', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.5rem' }}>
          <span style={{ flex: 1, fontSize: '0.82rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.65)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{publishedUrl}</span>
          <button onClick={async () => { await navigator.clipboard.writeText(publishedUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }} style={{ flexShrink: 0, padding: '0.4rem 0.8rem', background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '0.4rem', color: copied ? '#4ade80' : 'rgba(255,255,255,0.5)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'inherit', transition: 'all 0.2s' }}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <div style={{ background: '#141414', borderRadius: '1rem', padding: '0.85rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '2.5rem' }}>
          <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(publishedUrl)}&bgcolor=141414&color=f5f5f5&margin=0&qzone=1`} alt="QR code" width={150} height={150} style={{ display: 'block', borderRadius: '0.5rem' }} />
        </div>
        <button onClick={() => setScreen('dashboard')} style={{ width: '100%', padding: '0.95rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          Back to dashboard
        </button>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── SCREEN: Funnel type picker ────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 'type-picker') {
    const thumbnails: Record<FunnelType, React.ReactNode> = {
      product: (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#1a0808 0%,#0a0a0a 100%)', padding: '0.65rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.38rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>LIMITED DROP</div>
            <div style={{ width: '80%', height: 5, background: 'rgba(245,158,11,0.7)', borderRadius: 2, marginBottom: 3 }} />
            <div style={{ width: '55%', height: 5, background: 'rgba(245,158,11,0.3)', borderRadius: 2 }} />
          </div>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginBottom: 5, padding: '2px 5px', background: 'rgba(245,158,11,0.12)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.3)' }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' }} />
              <span style={{ fontSize: '0.35rem', fontWeight: 700, color: '#f59e0b' }}>Only 12 left</span>
            </div>
            <div style={{ height: 15, background: '#f59e0b', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.35rem', fontWeight: 800, color: '#000', letterSpacing: '0.08em' }}>SHOP NOW</span>
            </div>
          </div>
        </div>
      ),
      event: (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#051530 0%,#080b12 100%)', padding: '0.65rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.38rem', fontWeight: 700, color: '#60a5fa', letterSpacing: '0.06em', marginBottom: 4 }}>Jun 12 · 8:00 PM · Rooftop</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'rgba(255,255,255,0.85)', letterSpacing: '-0.02em', lineHeight: 0.95, textTransform: 'uppercase' }}>ONE<br/>NIGHT</div>
          </div>
          <div>
            <div style={{ height: 2, background: 'rgba(255,255,255,0.1)', borderRadius: 1, marginBottom: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '81%', background: '#60a5fa', borderRadius: 1 }} />
            </div>
            <div style={{ fontSize: '0.35rem', color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>97/120 spots remaining</div>
            <div style={{ height: 15, background: '#60a5fa', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.35rem', fontWeight: 800, color: '#000', letterSpacing: '0.07em' }}>REGISTER NOW</span>
            </div>
          </div>
        </div>
      ),
      newsletter: (
        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(160deg,#141414 0%,#0a0a0a 100%)', padding: '0.65rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.38rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>WHAT YOU&apos;LL GET</div>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ display: 'flex', gap: 3, marginBottom: 4, paddingTop: 4, borderTop: '1px solid rgba(255,255,255,0.06)', alignItems: 'center' }}>
                <span style={{ fontSize: '0.35rem', color: '#f59e0b', opacity: 0.5, flexShrink: 0, fontWeight: 700 }}>0{n}</span>
                <div style={{ height: 3, flex: 1, background: 'rgba(255,255,255,0.14)', borderRadius: 1 }} />
              </div>
            ))}
          </div>
          <div style={{ height: 15, background: '#f59e0b', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.35rem', fontWeight: 800, color: '#000', letterSpacing: '0.07em' }}>SUBSCRIBE FREE</span>
          </div>
        </div>
      ),
    }

    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0d0d0d', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', fontFamily: '"Inter", -apple-system, sans-serif', color: '#fff' }}>
        {/* Header */}
        <div style={{ padding: 'max(1.25rem, env(safe-area-inset-top)) 1.5rem 0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Choose funnel type</h2>
          <p style={{ margin: '0.3rem 0 0', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>Select one to continue</p>
        </div>

        {/* Type cards */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem 1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {FUNNEL_TYPES.map(ft => {
              const sel = selectedType === ft.id
              return (
                <button
                  key={ft.id}
                  onClick={() => setSelectedType(ft.id)}
                  style={{
                    background: sel ? '#1c1c1c' : '#141414',
                    border: `2px solid ${sel ? '#ffffff' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '1rem', padding: 0, cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'stretch', overflow: 'hidden', transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  <div style={{ width: 88, height: 110, flexShrink: 0, overflow: 'hidden' }}>
                    {thumbnails[ft.id]}
                  </div>
                  <div style={{ padding: '1rem 1.1rem 1rem 0.9rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                    <p style={{ margin: '0 0 0.35rem', fontSize: '0.88rem', fontWeight: 700, color: '#fff', lineHeight: 1.2 }}>{ft.label}</p>
                    <p style={{ margin: 0, fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{ft.description}</p>
                  </div>
                  {sel && (
                    <div style={{ position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: '50%', background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#000' }}>✓</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Bottom nav */}
        <div style={{ flexShrink: 0, background: 'linear-gradient(to top, #0d0d0d 60%, transparent)', padding: `1.25rem 1.25rem max(1.25rem, env(safe-area-inset-bottom))`, display: 'flex', gap: '0.6rem' }}>
          <button onClick={() => setScreen('dashboard')} style={{ flexShrink: 0, padding: '0.85rem 1.1rem', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back
          </button>
          <button
            onClick={() => selectedType && pickType(selectedType)}
            disabled={!selectedType}
            style={{ flex: 1, padding: '0.95rem', background: selectedType ? '#ffffff' : 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '0.75rem', color: selectedType ? '#000' : 'rgba(255,255,255,0.2)', fontSize: '0.95rem', fontWeight: 800, cursor: selectedType ? 'pointer' : 'default', fontFamily: 'inherit', letterSpacing: '0.02em', transition: 'all 0.2s' }}
          >
            Next →
          </button>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── SCREEN: Dashboard ─────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  if (screen === 'dashboard') {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0d0d0d', display: 'flex', flexDirection: 'column', maxWidth: 430, margin: '0 auto', fontFamily: '"Inter", -apple-system, sans-serif', color: '#fff' }}>
        <div style={{ padding: 'max(1.5rem, env(safe-area-inset-top)) 1.5rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <p style={{ margin: 0, fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>Funnel Vision</p>
            <h1 style={{ margin: '0.15rem 0 0', fontSize: '1.35rem', fontWeight: 900, letterSpacing: '-0.025em' }}>My Funnels</h1>
          </div>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#000', flexShrink: 0 }}>U</div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1rem 6rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {/* New funnel card */}
            <button
              onClick={() => { setSelectedType(null); setScreen('type-picker') }}
              style={{ background: '#141414', border: '1.5px dashed rgba(255,255,255,0.1)', borderRadius: '1rem', aspectRatio: '3/4', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'border-color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
            >
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.35rem', color: 'rgba(255,255,255,0.3)', fontWeight: 300 }}>+</div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>New funnel</span>
            </button>

            {projects.map(p => (
              <button key={p.id} onClick={() => openProject(p)} style={{ background: '#141414', border: '1.5px solid rgba(255,255,255,0.06)', borderRadius: '1rem', overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', textAlign: 'left', transition: 'border-color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.16)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)')}
              >
                <div style={{ aspectRatio: '1/1', background: `linear-gradient(135deg, ${p.bg} 0%, #000 100%)`, position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: '60%', height: '60%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ width: '100%', height: 5, background: 'rgba(255,255,255,0.15)', borderRadius: 2 }} />
                      <div style={{ width: '75%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }} />
                      <div style={{ width: '100%', height: 16, background: p.accent, borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: '0.65rem 0.75rem' }}>
                  <p style={{ margin: '0 0 0.2rem', fontSize: '0.78rem', fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                  <p style={{ margin: 0, fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', textTransform: 'capitalize' }}>{p.type} funnel</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom tab bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(13,13,13,0.97)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', padding: '0.6rem 0 max(0.6rem, env(safe-area-inset-bottom))' }}>
          {[
            { label: 'Home',      icon: 'M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z',   active: true },
            { label: 'Analytics', icon: 'M18 20V10M12 20V4M6 20v-6',                       active: false },
            { label: 'Settings',  icon: 'M12 15a3 3 0 100-6 3 3 0 000 6z',               active: false },
          ].map(tab => (
            <div key={tab.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem', opacity: tab.active ? 1 : 0.35 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={tab.active ? '#fff' : 'rgba(255,255,255,0.4)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={tab.icon} />
              </svg>
              <span style={{ fontSize: '0.55rem', fontWeight: tab.active ? 700 : 500, color: tab.active ? '#fff' : 'rgba(255,255,255,0.4)', letterSpacing: '0.05em' }}>{tab.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ── SCREEN: Editor ────────────────────────────────────────────────────────
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', maxWidth: 430, margin: '0 auto', fontFamily: '"Inter", -apple-system, sans-serif', color: '#fff' }}>

      {/* Fullscreen funnel preview fills the background */}
      <iframe
        ref={iframeRef}
        src={previewUrl}
        title="Funnel preview"
        onLoad={onIframeLoad}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
      />

      {/* Top bar floats over funnel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 200,
        padding: `max(1rem, env(safe-area-inset-top)) 1.25rem 2rem`,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <button onClick={goBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.75)', cursor: 'pointer', fontSize: '0.88rem', padding: '0.25rem', fontFamily: 'inherit', fontWeight: 600 }}>
          ← {step === 1 ? 'Exit' : 'Back'}
        </button>
        <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          {STEP_LABELS[step - 1]}
        </span>
        <div style={{ width: 52 }} />
      </div>

      {/* Bottom editor sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 200,
        height: '62vh',
        background: 'rgba(8,8,8,0.96)',
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        borderRadius: '1.5rem 1.5rem 0 0',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Drag handle */}
        <div style={{ padding: '0.7rem 0 0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* Step indicator */}
        <StepIndicator step={step} accentColor="#ffffff" />

        {/* Scrollable fields */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 1.25rem 0.5rem' }}>
          {step === 1 && renderThemeFields()}
          {step === 2 && renderContentFields()}
          {step === 3 && renderLinkStep()}
          {step === 4 && (
            <div style={{ paddingTop: '1rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 0.35rem' }}>Looking good!</p>
              <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)', margin: 0, lineHeight: 1.55 }}>Hit Publish to get your shareable link.</p>
            </div>
          )}
        </div>

        {/* Nav buttons */}
        <div style={{
          flexShrink: 0,
          padding: `0.75rem 1.25rem max(1rem, env(safe-area-inset-bottom))`,
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', gap: '0.6rem',
        }}>
          <button onClick={goBack} style={{ flexShrink: 0, padding: '0.85rem 1.1rem', background: 'transparent', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: '0.75rem', color: 'rgba(255,255,255,0.45)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            ← Back
          </button>
          {step < 4 ? (
            <button onClick={goNext} style={{ flex: 1, padding: '0.95rem', background: '#ffffff', border: 'none', borderRadius: '0.75rem', color: '#000', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.02em' }}>
              Next →
            </button>
          ) : (
            <button onClick={publish} disabled={publishing} style={{ flex: 1, padding: '1rem', background: publishing ? 'rgba(255,255,255,0.15)' : '#ffffff', border: 'none', borderRadius: '0.75rem', color: publishing ? 'rgba(255,255,255,0.4)' : '#000', fontSize: '1rem', fontWeight: 800, cursor: publishing ? 'default' : 'pointer', fontFamily: 'inherit', letterSpacing: '0.025em', transition: 'all 0.2s' }}>
              {publishing ? 'Publishing…' : 'Publish →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

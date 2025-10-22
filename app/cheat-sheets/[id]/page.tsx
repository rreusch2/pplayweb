'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Download, Share2, Copy, Check } from 'lucide-react'
import { toast } from 'react-hot-toast'
import DailyCheatSheet from '@/components/cheatsheets/DailyCheatSheet'
import { exportToPNG, copyToClipboard, shareViaWebShare } from '@/lib/htmlExport'
import type { DailyDigestContent } from '@/lib/cheatSheetData'

interface CheatSheetData {
  id: string
  title: string
  theme: 'dark_glass' | 'blue_blaze' | 'team_colors'
  sheet_type: string
  content_json: DailyDigestContent
  user_id: string
  created_at: string
}

export default function CheatSheetPage() {
  const params = useParams()
  const shareId = params.id as string
  const [cheatSheet, setCheatSheet] = useState<CheatSheetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!shareId) return

    async function fetchCheatSheet() {
      try {
        const response = await fetch(`/api/cheat-sheets/${shareId}`)
        if (!response.ok) {
          throw new Error('Cheat sheet not found')
        }
        const data = await response.json()
        setCheatSheet(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load cheat sheet')
      } finally {
        setLoading(false)
      }
    }

    fetchCheatSheet()
  }, [shareId])

  const handleDownload = async () => {
    if (!sheetRef.current || !cheatSheet) return

    setDownloading(true)
    try {
      await exportToPNG(sheetRef.current, {
        filename: `predictive-play-${shareId}`,
        backgroundColor: '#000000',
      })
      toast.success('Cheat sheet downloaded!')
    } catch (err) {
      toast.error('Failed to download cheat sheet')
      console.error(err)
    } finally {
      setDownloading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await copyToClipboard(window.location.href)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error('Failed to copy link')
    }
  }

  const handleShare = async () => {
    const shared = await shareViaWebShare(
      cheatSheet?.title || 'Predictive Play Cheat Sheet',
      'Check out my betting cheat sheet from Predictive Play!',
      window.location.href
    )

    if (!shared) {
      // Fallback to copy link if Web Share API not available
      handleCopyLink()
    } else {
      toast.success('Shared successfully!')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white mx-auto"></div>
          <p className="text-lg text-slate-300">Loading cheat sheet...</p>
        </div>
      </div>
    )
  }

  if (error || !cheatSheet) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="text-center max-w-md">
          <div className="mb-4 text-6xl">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Cheat Sheet Not Found</h1>
          <p className="text-gray-400 mb-6">{error || 'This cheat sheet does not exist or has been deleted.'}</p>
          <a
            href="/"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="mx-auto max-w-4xl">
        {/* Action Bar */}
        <div className="mb-6 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div>
            <h1 className="text-xl font-bold text-white">{cheatSheet.title}</h1>
            <p className="text-sm text-gray-400">
              Generated {new Date(cheatSheet.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              {downloading ? 'Downloading...' : 'Download PNG'}
            </button>
          </div>
        </div>

        {/* Cheat Sheet */}
        <div ref={sheetRef}>
          {cheatSheet.sheet_type === 'daily_digest' && (
            <DailyCheatSheet
              content={cheatSheet.content_json}
              theme={cheatSheet.theme}
              watermark={false} // No watermark on share page
            />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-4">
            Want to create your own AI-powered cheat sheets?
          </p>
          <a
            href="/"
            className="inline-block rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
          >
            Get Started with Predictive Play
          </a>
        </div>
      </div>
    </div>
  )
}

'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/SimpleAuthContext'
import TrendsSearch from '@/components/trends/TrendsSearch'

export default function TrendsPage() {
  const { user, initializing } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!initializing && !user) router.push('/')
  }, [user, initializing, router])

  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect via useEffect
  }

  return <TrendsSearch />
}

import React from 'react'
import dynamic from 'next/dynamic'

export const metadata = {
  title: 'Professor Lock — Advanced AI Betting Assistant',
  description: 'Ask Professor Lock for real picks, smart parlays, live odds checks, and injury intel — powered by your real predictions and insights.',
}

// Use dynamic import to ensure Client Component only renders on client
const ChatClient = dynamic(() => import('@/components/professor-lock/ChatClient'), {
  ssr: false,
})

export default function ProfessorLockPage() {
  return (
    <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white">Professor Lock</h1>
        <p className="text-gray-300 mt-1">Advanced AI Sports Betting Assistant — data-backed, tool-enabled, and razor sharp.</p>
      </div>
      <ChatClient />
    </main>
  )
}

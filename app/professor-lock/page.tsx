'use client'

import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues with ChatKit
const ProfessorLockShellEnhanced = dynamic(
  () => import('@/components/professor-lock/ProfessorLockShellEnhanced'),
  { ssr: false }
)

export default function ProfessorLockPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <ProfessorLockShellEnhanced />
    </div>
  )
}

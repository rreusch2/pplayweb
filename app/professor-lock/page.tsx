import { Metadata } from 'next'
import dynamic from 'next/dynamic'

// Dynamically import to avoid SSR issues with ChatKit
const ProfessorLockShellEnhanced = dynamic(
  () => import('@/components/professor-lock/ProfessorLockShellEnhanced'),
  { ssr: false }
)

export const metadata: Metadata = {
  title: 'Professor Lock AI | Predictive Play',
  description: 'Chat with Professor Lock, powered by OpenAI GPT-4 and Agent Builder - the most advanced AI sports betting assistant.',
}

export default function ProfessorLockPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <ProfessorLockShellEnhanced />
    </div>
  )
}

import { Metadata } from 'next'
import ProfessorLockShell from '@/components/professor-lock/ProfessorLockShell'

export const metadata: Metadata = {
  title: 'Professor Lock | Predictive Play',
  description: 'Chat with Professor Lock, the advanced AI sports betting assistant built for serious bettors.',
}

export default function ProfessorLockPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <ProfessorLockShell />
    </div>
  )
}

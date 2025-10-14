import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Professor Lock | Predictive Play',
  description: 'Chat with Professor Lock, the advanced AI sports betting assistant powered by OpenAI.',
}

export default function ProfessorLockLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

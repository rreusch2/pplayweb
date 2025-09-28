"use client"

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Brain,
  MessageCircle,
  Zap,
  Globe,
  BarChart,
  Activity,
  ShieldCheck,
  Sparkles
} from 'lucide-react'

const heroStats = [
  {
    icon: Sparkles,
    label: 'Autonomous Research',
    description: 'Daytona sandbox with browser, StatMuse, Supabase + advanced tools'
  },
  {
    icon: ShieldCheck,
    label: 'Tier-Aware Strategy',
    description: 'Adapts picks, parlays, and guidance to Pro or Elite preferences'
  },
  {
    icon: BarChart,
    label: 'Live Tool Telemetry',
    description: 'Every tool invocation visualized as rich, animated timelines'
  }
]

export default function ProfessorLockShell() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const introCards = useMemo(
    () => [
      {
        title: 'Mission Control',
        icon: Brain,
        body: 'Upgraded Professor Lock designed for the web. Streaming Grok-3 insights, parlay intelligence, and bankroll coaching in a cinematic interface.'
      },
      {
        title: 'Tool Timeline',
        icon: Activity,
        body: 'Watch the agent reason in real-time. Web searches, StatMuse dives, Supabase queries, and Daytona shell sessions all surface as interactive cards.'
      },
      {
        title: 'Visual Forensics',
        icon: Globe,
        body: 'Browser-control tooling captures screenshots while it scouts news or odds. Galleries auto-purge when sessions close to keep privacy tight.'
      }
    ],
    []
  )

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950" />
      <div className="absolute inset-x-0 -top-40 h-96 bg-blue-500/20 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <section className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
          >
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-400/40 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
                <MessageCircle className="h-4 w-4" />
                Professor Lock • Web Alpha
              </span>
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Your elite betting co-pilot just moved to the big screen
              </h1>
              <p className="text-lg text-slate-300">
                This page will host the upgraded Professor Lock experience: real-time streaming chat, live tool telemetry, Daytona-driven research sandboxes, and visual intelligence for every move the agent makes.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="flex h-full w-full max-w-md flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="flex items-center justify-between text-slate-100">
                <span className="text-sm uppercase tracking-wide text-slate-300/80">Live Telemetry</span>
                <Zap className="h-5 w-5 text-blue-300" />
              </div>
              <div className="space-y-3 text-sm text-slate-200/90">
                <p>• Tool timeline cards for web search, StatMuse, Supabase, browser control</p>
                <p>• Session status, agent heartbeat, sandbox lifecycle</p>
                <p>• Parlay builder & pick distribution tied to Supabase predictions</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-black/40 p-3 text-xs text-slate-400">
                Chat scaffolding and streaming hooks will mount here once the API stubs are wired in.
              </div>
            </motion.div>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3">
            {heroStats.map((item, index) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={isMounted ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15 * index, duration: 0.5 }}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md"
              >
                <item.icon className="h-5 w-5 text-blue-300" />
                <h3 className="mt-3 text-lg font-semibold text-white">{item.label}</h3>
                <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {introCards.map(card => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isMounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md"
            >
              <card.icon className="h-6 w-6 text-blue-200" />
              <h3 className="mt-4 text-xl font-semibold text-white">{card.title}</h3>
              <p className="mt-3 text-sm text-slate-300">{card.body}</p>
            </motion.div>
          ))}
        </section>
      </div>
    </div>
  )
}

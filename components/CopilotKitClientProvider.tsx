'use client'

import React from 'react'
import { CopilotKit } from '@copilotkit/react-core'

interface CopilotKitClientProviderProps {
  children: React.ReactNode
}

export default function CopilotKitClientProvider({ children }: CopilotKitClientProviderProps) {
  // Route all CopilotKit requests to our Next.js API endpoint
  const runtimeUrl = '/api/copilot'

  return (
    <CopilotKit
      runtimeUrl={runtimeUrl}
      /* Keep defaults for guardrails and prompt injection protection */
    >
      {children}
    </CopilotKit>
  )
}



'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/SimpleAuthContext'

export function useOnboarding() {
  const [needsOnboarding, setNeedsOnboarding] = useState(false)
  const [onboardingStep, setOnboardingStep] = useState<'preferences' | 'subscription' | 'welcome-wheel' | 'completed'>('preferences')
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false)
  const { user, profile } = useAuth()

  useEffect(() => {
    // Check if user is new (created within last 5 minutes) and hasn't been onboarded
    if (user && profile && !hasCheckedOnboarding) {
      const createdAt = new Date(profile.created_at || '')
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      const isNewUser = createdAt > fiveMinutesAgo
      
      // Check if onboarding is needed based on profile completeness
      const needsOnboardingCheck = isNewUser || 
        !profile.preferred_sports || 
        profile.subscription_tier === 'free' && !profile.welcome_bonus_claimed
      
      if (needsOnboardingCheck) {
        setNeedsOnboarding(true)
        setOnboardingStep('preferences')
        setIsOnboardingOpen(true)
      }
      
      setHasCheckedOnboarding(true)
    }
  }, [user, profile, hasCheckedOnboarding])

  const startOnboarding = () => {
    setNeedsOnboarding(true)
    setOnboardingStep('preferences')
    setIsOnboardingOpen(true)
  }

  const forceOnboarding = () => {
    setNeedsOnboarding(true)
    setOnboardingStep('preferences')
    setIsOnboardingOpen(true)
  }

  const closeOnboarding = () => {
    setIsOnboardingOpen(false)
  }

  const completeOnboarding = () => {
    setNeedsOnboarding(false)
    setIsOnboardingOpen(false)
    setOnboardingStep('completed')
  }

  return {
    needsOnboarding,
    onboardingStep,
    isOnboardingOpen,
    startOnboarding,
    forceOnboarding,
    closeOnboarding,
    completeOnboarding
  }
}

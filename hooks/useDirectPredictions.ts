'use client'
import { useState, useEffect, useCallback } from 'react'
import { predictionService, AIPrediction } from '@/services/directPredictionService'
import { useAuth } from '@/contexts/SimpleAuthContext'

export function useDirectPredictions() {
  const { user, profile } = useAuth()
  const [predictions, setPredictions] = useState<AIPrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Get subscription tier from profile
  const subscriptionTier = profile?.subscription_tier || 'free'
  
  // Check welcome bonus status
  const isWelcomeBonus = profile?.welcome_bonus_claimed === false && 
    profile?.welcome_bonus_expires_at && 
    new Date(profile.welcome_bonus_expires_at) > new Date()
  
  // Determine pick limits based on tier
  const getPickLimit = () => {
    if (subscriptionTier === 'elite') return 30
    if (subscriptionTier === 'pro') return 20
    if (isWelcomeBonus) return 5
    return 2 // free tier
  }
  
  const fetchPredictions = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const predictions = await predictionService.getPredictions(
        user.id,
        subscriptionTier
      )
      setPredictions(predictions)
    } catch (err) {
      console.error('Error fetching predictions:', err)
      setError('Failed to load predictions')
    } finally {
      setLoading(false)
    }
  }, [user, subscriptionTier])
  
  const fetchPredictionsBySport = useCallback(async (sport: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const predictions = await predictionService.getPredictionsBySport(
        sport,
        getPickLimit()
      )
      setPredictions(predictions)
    } catch (err) {
      console.error('Error fetching predictions by sport:', err)
      setError('Failed to load predictions')
    } finally {
      setLoading(false)
    }
  }, [subscriptionTier, isWelcomeBonus])
  
  const fetchHighConfidencePicks = useCallback(async () => {
    if (subscriptionTier === 'free' && !isWelcomeBonus) {
      setError('High confidence picks are for Pro and Elite users')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const predictions = await predictionService.getHighConfidencePicks()
      setPredictions(predictions)
    } catch (err) {
      console.error('Error fetching high confidence picks:', err)
      setError('Failed to load predictions')
    } finally {
      setLoading(false)
    }
  }, [subscriptionTier, isWelcomeBonus])
  
  const fetchLockOfTheDay = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const lock = await predictionService.getLockOfTheDay()
      if (lock) {
        setPredictions([lock])
      }
    } catch (err) {
      console.error('Error fetching Lock of the Day:', err)
      setError('Failed to load Lock of the Day')
    } finally {
      setLoading(false)
    }
  }, [])
  
  // Fetch predictions on mount
  useEffect(() => {
    if (user) {
      fetchPredictions()
    }
  }, [user, fetchPredictions])
  
  return {
    predictions,
    loading,
    error,
    subscriptionTier,
    isWelcomeBonus,
    pickLimit: getPickLimit(),
    
    // Actions
    fetchPredictions,
    fetchPredictionsBySport,
    fetchHighConfidencePicks,
    fetchLockOfTheDay,
    
    // Computed values
    teamPicks: predictions.filter(p => 
      p.bet_type && ['moneyline', 'spread', 'total'].includes(p.bet_type)
    ),
    propsPicks: predictions.filter(p => 
      p.bet_type === 'player_prop'
    ),
    highConfidencePicks: predictions.filter(p => p.confidence >= 80),
    averageConfidence: predictions.length > 0 
      ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
      : 0
  }
}

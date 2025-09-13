// Shared Predictions hook (combines mobile app logic)
'use client'
import { useState, useEffect, useCallback } from 'react'
import { aiService, AIPrediction } from '../services/aiService'
import { getTierCapabilities, isInWelcomeBonusPeriod } from '@/lib/subscriptionUtils'
import type { SubscriptionTier } from '@/lib/subscriptionUtils'

export interface PredictionsState {
  predictions: AIPrediction[]
  teamPicks: AIPrediction[]
  playerPropsPicks: AIPrediction[]
  isLoading: boolean
  isLoadingTeam: boolean
  isLoadingProps: boolean
  refreshing: boolean
  error: string | null
}

interface UsePredictionsProps {
  subscriptionTier: SubscriptionTier
  welcomeBonusClaimed?: boolean
  welcomeBonusExpiresAt?: string | null
  userId?: string
}

export function usePredictions({
  subscriptionTier = 'free',
  welcomeBonusClaimed = false,
  welcomeBonusExpiresAt = null,
  userId
}: UsePredictionsProps = {} as UsePredictionsProps) {
  const [state, setState] = useState<PredictionsState>({
    predictions: [],
    teamPicks: [],
    playerPropsPicks: [],
    isLoading: false,
    isLoadingTeam: false,
    isLoadingProps: false,
    refreshing: false,
    error: null
  })

  // Filter predictions based on tier and welcome bonus
  const filterPredictionsByTier = useCallback((predictions: AIPrediction[]) => {
    const isWelcomeBonus = isInWelcomeBonusPeriod(welcomeBonusClaimed, welcomeBonusExpiresAt)
    const capabilities = getTierCapabilities(subscriptionTier)
    
    console.log('🎯 Filtering predictions by tier:', {
      subscriptionTier,
      isWelcomeBonus,
      totalPredictions: predictions.length,
      maxPicks: isWelcomeBonus ? 5 : capabilities.dailyPicks
    })
    
    if (isWelcomeBonus) {
      // During welcome bonus, show 5 picks regardless of tier
      return predictions.slice(0, 5)
    }
    
    // Regular tier-based filtering
    return predictions.slice(0, capabilities.dailyPicks)
  }, [subscriptionTier, welcomeBonusClaimed, welcomeBonusExpiresAt])

  // Fetch today's predictions (for home tab preview - 2 picks)
  const fetchTodaysPredictions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const isWelcomeBonus = isInWelcomeBonusPeriod(welcomeBonusClaimed, welcomeBonusExpiresAt)
      const effectiveTier = isWelcomeBonus ? 'welcome_bonus' : subscriptionTier
      const allPredictions = await aiService.getTodaysPredictions(userId, effectiveTier)
      const filteredPredictions = filterPredictionsByTier(allPredictions)
      
      setState(prev => ({ 
        ...prev, 
        predictions: filteredPredictions,
        isLoading: false 
      }))
      return filteredPredictions
    } catch (error) {
      console.error('Error fetching todays predictions:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load predictions', 
        isLoading: false 
      }))
      return []
    }
  }, [filterPredictionsByTier])

  // NEW: Fetch full predictions from ai_predictions table (for Predictions tab)
  const fetchFullPredictions = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      // Use the same logic as getTodaysPredictions but with full tier limits
      const isWelcomeBonus = isInWelcomeBonusPeriod(welcomeBonusClaimed, welcomeBonusExpiresAt)
      const effectiveTier = isWelcomeBonus ? 'welcome_bonus' : subscriptionTier
      
      // Get all predictions using the working daily-picks-combined endpoint
      const allPredictions = await aiService.getTodaysPredictions(userId, effectiveTier)
      
      setState(prev => ({ 
        ...prev, 
        predictions: allPredictions,
        isLoading: false 
      }))
      return allPredictions
    } catch (error) {
      console.error('Error fetching full predictions:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load full predictions', 
        isLoading: false 
      }))
      return []
    }
  }, [userId, subscriptionTier, welcomeBonusClaimed, welcomeBonusExpiresAt])

  // Fetch team picks (ML, spreads, totals)
  const fetchTeamPicks = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingTeam: true, error: null }))
    try {
      const isWelcomeBonus = isInWelcomeBonusPeriod(welcomeBonusClaimed, welcomeBonusExpiresAt)
      const effectiveTier = isWelcomeBonus ? 'welcome_bonus' : subscriptionTier
      const allPredictions = await aiService.getTodaysPredictions(userId, effectiveTier)
      
      // Since daily-picks-combined already returns tier-filtered picks, 
      // just filter by bet type locally
      const teamPicks = allPredictions.filter(p => 
        p.bet_type && !p.bet_type.toLowerCase().includes('prop') &&
        (p.bet_type.includes('ML') || 
         p.bet_type.includes('spread') || 
         p.bet_type.includes('total') ||
         p.bet_type.includes('moneyline') ||
         p.bet_type.includes('over') ||
         p.bet_type.includes('under'))
      )
      
      setState(prev => ({ 
        ...prev, 
        teamPicks,
        isLoadingTeam: false 
      }))
      return teamPicks
    } catch (error) {
      console.error('Error fetching team picks:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load team picks', 
        isLoadingTeam: false 
      }))
      return []
    }
  }, [subscriptionTier, welcomeBonusClaimed, welcomeBonusExpiresAt, userId])

  // Fetch player props picks
  const fetchPlayerPropsPicks = useCallback(async () => {
    setState(prev => ({ ...prev, isLoadingProps: true, error: null }))
    try {
      const isWelcomeBonus = isInWelcomeBonusPeriod(welcomeBonusClaimed, welcomeBonusExpiresAt)
      const effectiveTier = isWelcomeBonus ? 'welcome_bonus' : subscriptionTier
      const allPredictions = await aiService.getTodaysPredictions(userId, effectiveTier)
      
      // Since daily-picks-combined already returns tier-filtered picks, 
      // just filter by bet type locally
      const propsPicks = allPredictions.filter(p => 
        p.bet_type && (
          p.bet_type.toLowerCase().includes('prop') ||
          p.bet_type.toLowerCase().includes('hit') ||
          p.bet_type.toLowerCase().includes('homer') ||
          p.bet_type.toLowerCase().includes('rbi') ||
          p.bet_type.toLowerCase().includes('strikeout') ||
          p.bet_type.toLowerCase().includes('assist') ||
          p.bet_type.toLowerCase().includes('rebound')
        )
      )
      
      setState(prev => ({ 
        ...prev, 
        playerPropsPicks: propsPicks,
        isLoadingProps: false 
      }))
      return propsPicks
    } catch (error) {
      console.error('Error fetching player props picks:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to load player props', 
        isLoadingProps: false 
      }))
      return []
    }
  }, [subscriptionTier, welcomeBonusClaimed, welcomeBonusExpiresAt, userId])

  // Fetch predictions by sport
  const fetchPredictionsBySport = useCallback(async (sport: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const predictions = await aiService.getPredictionsBySport(sport)
      setState(prev => ({ 
        ...prev, 
        predictions,
        isLoading: false 
      }))
      return predictions
    } catch (error) {
      console.error('Error fetching predictions by sport:', error)
      setState(prev => ({ 
        ...prev, 
        error: `Failed to load ${sport} predictions`, 
        isLoading: false 
      }))
      return []
    }
  }, [])

  // NEW: Fetch Lock of the Day (highest confidence pick)
  const fetchLockOfTheDay = useCallback(async () => {
    try {
      const lockPick = await aiService.getLockOfTheDay(userId || 'default')
      return lockPick
    } catch (error) {
      console.error('Error fetching Lock of the Day:', error)
      return null
    }
  }, [userId])

  // Generate new predictions
  const generatePredictions = useCallback(async (sport: string = 'MLB') => {
    setState(prev => ({ ...prev, isLoading: true, error: null }))
    try {
      const newPredictions = await aiService.generatePredictions(sport)
      // Refresh the current predictions after generation
      await fetchTodaysPredictions()
      return newPredictions
    } catch (error) {
      console.error('Error generating predictions:', error)
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to generate new predictions', 
        isLoading: false 
      }))
      throw error
    }
  }, [fetchTodaysPredictions])

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setState(prev => ({ ...prev, refreshing: true }))
    try {
      await Promise.all([
        fetchTodaysPredictions(),
        fetchTeamPicks(),
        fetchPlayerPropsPicks()
      ])
    } finally {
      setState(prev => ({ ...prev, refreshing: false }))
    }
  }, [fetchTodaysPredictions, fetchTeamPicks, fetchPlayerPropsPicks])

  // Load initial data
  useEffect(() => {
    fetchTodaysPredictions()
    fetchTeamPicks()
    fetchPlayerPropsPicks()
  }, [fetchTodaysPredictions, fetchTeamPicks, fetchPlayerPropsPicks])

  return {
    // State
    ...state,

    // Actions
    fetchTodaysPredictions,
    fetchFullPredictions,
    fetchTeamPicks,
    fetchPlayerPropsPicks,
    fetchPredictionsBySport,
    fetchLockOfTheDay,
    generatePredictions,
    refreshAll,

    // Computed values
    totalPredictions: state.predictions.length,
    highConfidencePicks: state.predictions.filter(p => p.confidence >= 80),
    averageConfidence: state.predictions.length > 0 
      ? state.predictions.reduce((sum, p) => sum + p.confidence, 0) / state.predictions.length 
      : 0
  }
}
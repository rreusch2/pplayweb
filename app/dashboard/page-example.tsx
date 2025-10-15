'use client'
import { useAuth } from '@/contexts/SimpleAuthContext'
import { useDirectPredictions } from '@/hooks/useDirectPredictions'
import { useEffect } from 'react'

// Example of how to use the new simplified architecture
export default function DashboardExample() {
  const { user, profile } = useAuth()
  const { 
    predictions, 
    loading, 
    subscriptionTier,
    isWelcomeBonus,
    pickLimit,
    teamPicks,
    propsPicks,
    fetchHighConfidencePicks 
  } = useDirectPredictions()
  
  // Example: Show tier-specific content
  const renderTierContent = () => {
    if (subscriptionTier === 'elite') {
      return (
        <div className="elite-features">
          <h2>Elite Dashboard</h2>
          <p>You have access to {pickLimit} daily picks!</p>
          <div className="pick-distribution">
            <div>{teamPicks.length} Team Picks</div>
            <div>{propsPicks.length} Prop Picks</div>
          </div>
        </div>
      )
    }
    
    if (subscriptionTier === 'pro') {
      return (
        <div className="pro-features">
          <h2>Pro Dashboard</h2>
          <p>You have access to {pickLimit} daily picks!</p>
          <button onClick={fetchHighConfidencePicks}>
            View High Confidence Picks
          </button>
        </div>
      )
    }
    
    // Free tier
    return (
      <div className="free-features">
        <h2>Free Dashboard</h2>
        <p>You have access to {pickLimit} daily picks</p>
        {isWelcomeBonus && (
          <div className="welcome-bonus-banner">
            🎉 Welcome Bonus Active! Enjoy 5 picks today!
          </div>
        )}
      </div>
    )
  }
  
  if (loading) {
    return <div>Loading predictions...</div>
  }
  
  return (
    <div className="dashboard">
      <h1>Welcome {profile?.username}!</h1>
      
      {/* Tier-specific content */}
      {renderTierContent()}
      
      {/* Show predictions */}
      <div className="predictions-grid">
        {predictions.map(prediction => (
          <div key={prediction.id} className="prediction-card">
            <h3>{prediction.match}</h3>
            <p>{prediction.pick}</p>
            <p>Confidence: {prediction.confidence}%</p>
            <p>Odds: {prediction.odds}</p>
          </div>
        ))}
      </div>
      
      {/* Show user's subscription info */}
      <div className="subscription-info">
        <p>Your tier: {subscriptionTier}</p>
        <p>Daily pick limit: {pickLimit}</p>
        {profile?.subscription_expires_at && (
          <p>Expires: {new Date(profile.subscription_expires_at).toLocaleDateString()}</p>
        )}
      </div>
    </div>
  )
}

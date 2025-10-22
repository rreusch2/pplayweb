'use client';

import React, { useState } from 'react';
import { ChatKitWithWidgets } from '@/components/ChatKitWithWidgets';
import { WidgetService } from '@/services/chatkit/widgetService';

export default function WidgetsTestPage() {
  const [activeDemo, setActiveDemo] = useState<string>('chat');
  const [widgetPreview, setWidgetPreview] = useState<any>(null);

  // Sample data for widget demos
  const samplePicks = [
    { id: '1', team: 'Lakers', bet: 'Spread -4.5', odds: '+110', selected: true },
    { id: '2', team: 'Warriors', bet: 'Moneyline', odds: '+150', selected: false },
    { id: '3', team: 'Celtics', bet: 'Over 215.5', odds: '-110', selected: true },
    { id: '4', team: 'Heat', bet: 'Under 208', odds: '-105', selected: false }
  ];

  const sampleOdds = [
    { book: 'DraftKings', team1Odds: '-110', team2Odds: '-110', overUnder: '215.5', spread: '-4.5' },
    { book: 'FanDuel', team1Odds: '-115', team2Odds: '-105', overUnder: '216', spread: '-4' },
    { book: 'BetMGM', team1Odds: '-108', team2Odds: '-112', overUnder: '215', spread: '-4.5' },
    { book: 'Caesars', team1Odds: '-110', team2Odds: '-110', overUnder: '216.5', spread: '-5' }
  ];

  const samplePlayer = {
    name: 'LeBron James',
    team: 'Lakers',
    position: 'SF',
    image: '/images/lebron.jpg',
    stats: [
      { label: 'PPG', value: '25.7' },
      { label: 'APG', value: '8.3' },
      { label: 'RPG', value: '7.3' },
      { label: 'FG%', value: '50.6' }
    ],
    props: [
      { market: 'Points', line: '25.5', over: '-110', under: '-110', recommendation: 'over' as const },
      { market: 'Assists', line: '7.5', over: '+105', under: '-125', recommendation: 'over' as const },
      { market: 'Rebounds', line: '8.5', over: '-115', under: '-105' },
      { market: '3-Pointers', line: '2.5', over: '+120', under: '-140' }
    ]
  };

  const sampleInsights = [
    {
      icon: '🔥',
      title: 'Lakers Hot Streak',
      description: 'Lakers have won 8 of their last 10 games and covered in 7',
      confidence: 85,
      action: { type: 'view_details', payload: { teamId: 'lakers' } }
    },
    {
      icon: '💰',
      title: 'Value Play Alert',
      description: 'Warriors +150 showing incredible value as road underdogs',
      confidence: 72
    },
    {
      icon: '⚡',
      title: 'Prop Value',
      description: 'LeBron assists Over hitting 75% in last 12 games',
      confidence: 78
    },
    {
      icon: '🎯',
      title: 'System Pick',
      description: 'Home favorites off B2B rest are 18-4 ATS this season',
      confidence: 91
    }
  ];

  const sampleLivePicks = [
    {
      id: '1',
      game: 'Lakers vs Warriors',
      pick: 'Lakers -4.5',
      odds: '-110',
      confidence: 85,
      status: 'winning' as const,
      stake: 50,
      potentialWin: 45.45
    },
    {
      id: '2',
      game: 'Celtics vs Heat',
      pick: 'Over 215.5',
      odds: '+105',
      confidence: 72,
      status: 'pending' as const,
      stake: 30,
      potentialWin: 31.50
    },
    {
      id: '3',
      game: 'Bucks vs Nets',
      pick: 'Bucks ML',
      odds: '-180',
      confidence: 92,
      status: 'won' as const,
      stake: 100,
      potentialWin: 55.56
    }
  ];

  const showWidgetDemo = (type: string) => {
    let widget;
    
    switch (type) {
      case 'search':
        widget = WidgetService.createSearchProgressWidget({
          status: 'analyzing',
          currentSearch: 'Finding best NBA picks for tonight...',
          sources: ['Supabase', 'ESPN', 'StatMuse', 'Vegas Insider'],
          progress: 65
        });
        break;
      
      case 'parlay':
        widget = WidgetService.createParlayBuilderWidget({
          picks: samplePicks,
          totalOdds: '+385',
          potentialPayout: '$48.50',
          stake: 10
        });
        break;
      
      case 'odds':
        widget = WidgetService.createOddsTableWidget({
          title: '🏀 Lakers vs Warriors - Odds Comparison',
          odds: sampleOdds,
          team1: 'Lakers',
          team2: 'Warriors'
        });
        break;
      
      case 'player':
        widget = WidgetService.createPlayerCardWidget(samplePlayer);
        break;
      
      case 'insights':
        widget = WidgetService.createInsightsWidget({
          title: '💡 Professor Lock\'s Top Insights',
          insights: sampleInsights
        });
        break;
      
      case 'live':
        widget = WidgetService.createLivePicksTrackerWidget({
          picks: sampleLivePicks,
          totalStake: 180,
          totalPotentialWin: 132.51
        });
        break;
    }
    
    setWidgetPreview(widget);
    setActiveDemo('preview');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-white">🎯 ChatKit Widgets Test - Professor Lock</h1>
          <p className="text-gray-400 mt-1">Test and preview all sports betting widgets</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Demo Selector */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setActiveDemo('chat')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'chat'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              💬 Live Chat
            </button>
            <button
              onClick={() => setActiveDemo('widgets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === 'widgets'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              🎨 Widget Gallery
            </button>
            {activeDemo === 'preview' && (
              <button
                onClick={() => setActiveDemo('widgets')}
                className="px-4 py-2 rounded-lg font-medium bg-blue-600 text-white"
              >
                ← Back to Gallery
              </button>
            )}
          </div>
        </div>

        {/* Chat Demo */}
        {activeDemo === 'chat' && (
          <div className="bg-slate-900 rounded-xl shadow-xl overflow-hidden">
            <div className="h-[600px]">
              <ChatKitWithWidgets theme="dark" />
            </div>
          </div>
        )}

        {/* Widget Gallery */}
        {activeDemo === 'widgets' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Search Progress Widget */}
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">🔍 Search Progress</h3>
              <p className="text-sm text-gray-400 mb-4">
                Shows real-time search status and data sources
              </p>
              <button
                onClick={() => showWidgetDemo('search')}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Preview Widget
              </button>
            </div>

            {/* Parlay Builder Widget */}
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">🎯 Parlay Builder</h3>
              <p className="text-sm text-gray-400 mb-4">
                Interactive parlay creation with odds calculation
              </p>
              <button
                onClick={() => showWidgetDemo('parlay')}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Preview Widget
              </button>
            </div>

            {/* Odds Comparison Widget */}
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">📊 Odds Table</h3>
              <p className="text-sm text-gray-400 mb-4">
                Compare odds across multiple sportsbooks
              </p>
              <button
                onClick={() => showWidgetDemo('odds')}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Preview Widget
              </button>
            </div>

            {/* Player Card Widget */}
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">🏀 Player Card</h3>
              <p className="text-sm text-gray-400 mb-4">
                Detailed player stats and prop bets
              </p>
              <button
                onClick={() => showWidgetDemo('player')}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Preview Widget
              </button>
            </div>

            {/* Insights Widget */}
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">💡 Betting Insights</h3>
              <p className="text-sm text-gray-400 mb-4">
                Key insights with confidence ratings
              </p>
              <button
                onClick={() => showWidgetDemo('insights')}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Preview Widget
              </button>
            </div>

            {/* Live Picks Tracker */}
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-3">📈 Live Tracker</h3>
              <p className="text-sm text-gray-400 mb-4">
                Track active picks with live status updates
              </p>
              <button
                onClick={() => showWidgetDemo('live')}
                className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Preview Widget
              </button>
            </div>
          </div>
        )}

        {/* Widget Preview */}
        {activeDemo === 'preview' && widgetPreview && (
          <div className="bg-slate-900 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Widget Preview</h3>
            
            {/* JSON Preview */}
            <div className="bg-slate-800 rounded-lg p-4 mb-6">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Widget JSON Structure:</h4>
              <pre className="text-xs text-green-400 overflow-x-auto">
                {JSON.stringify(widgetPreview, null, 2)}
              </pre>
            </div>

            {/* Visual Note */}
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Note:</strong> This shows the widget data structure. In the actual chat, 
                ChatKit will render these as beautiful, interactive components based on the JSON configuration.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-slate-900 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">🚀 How to Use Widgets</h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div>
              <strong className="text-white">In Chat:</strong> Type commands like <code className="bg-slate-800 px-2 py-1 rounded">/parlay</code>, 
              <code className="bg-slate-800 px-2 py-1 rounded ml-2">/odds Lakers vs Warriors</code>, or 
              <code className="bg-slate-800 px-2 py-1 rounded ml-2">/player LeBron James</code>
            </div>
            <div>
              <strong className="text-white">From Agent:</strong> Your OpenAI agent can trigger widgets by outputting the proper JSON format
            </div>
            <div>
              <strong className="text-white">Interactive:</strong> Click buttons in widgets to add/remove picks, view details, or place bets
            </div>
            <div>
              <strong className="text-white">Real-time:</strong> Widgets update automatically as the agent searches and analyzes data
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

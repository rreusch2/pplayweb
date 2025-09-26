import { motion } from 'framer-motion'
import { BarChart3, TrendingUp, Users, Trophy, Clock, Target } from 'lucide-react'
import { useState } from 'react'

interface StatMuseToolViewProps {
  tool: {
    name: string
    status: 'running' | 'completed' | 'error'
    progress?: number
    data?: any
    screenshots?: string[]
    startTime: Date
    endTime?: Date
  }
  expanded: boolean
}

export default function StatMuseToolView({ tool, expanded }: StatMuseToolViewProps) {
  const [selectedStat, setSelectedStat] = useState<string | null>(null)
  
  const query = tool.data?.query || tool.data?.search_query
  const results = tool.data?.results || tool.data?.statistics
  const player = tool.data?.player
  const team = tool.data?.team
  const sport = tool.data?.sport
  const insights = tool.data?.insights || tool.data?.analysis

  const formatStatValue = (value: any) => {
    if (typeof value === 'number') {
      return value.toLocaleString()
    }
    return value?.toString() || 'N/A'
  }

  const getStatIcon = (statType: string) => {
    if (statType.toLowerCase().includes('trend')) return <TrendingUp className="w-4 h-4" />
    if (statType.toLowerCase().includes('team')) return <Users className="w-4 h-4" />
    if (statType.toLowerCase().includes('season')) return <Trophy className="w-4 h-4" />
    return <BarChart3 className="w-4 h-4" />
  }

  if (!expanded) {
    return (
      <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-white">StatMuse Query</span>
          </div>
          <div className={`px-2 py-1 rounded text-xs ${
            tool.status === 'running' ? 'bg-blue-500/20 text-blue-300' :
            tool.status === 'completed' ? 'bg-green-500/20 text-green-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {tool.status}
          </div>
        </div>
        
        {query && (
          <div className="text-sm text-gray-300 mb-2 truncate">
            "{query}"
          </div>
        )}
        
        {results && (
          <div className="text-xs text-green-400">
            ✅ {Array.isArray(results) ? results.length : Object.keys(results).length} stats retrieved
          </div>
        )}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="p-4 bg-slate-800/30 rounded-lg border border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-green-400" />
          <span className="font-medium text-white">StatMuse Data Query</span>
        </div>
        <div className={`px-2 py-1 rounded text-xs ${
          tool.status === 'running' ? 'bg-blue-500/20 text-blue-300' :
          tool.status === 'completed' ? 'bg-green-500/20 text-green-300' :
          'bg-red-500/20 text-red-300'
        }`}>
          {tool.status}
        </div>
      </div>

      {/* Query Info */}
      {query && (
        <div className="mb-4 p-3 bg-slate-700/30 rounded border border-slate-600">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-400">Search Query</span>
          </div>
          <div className="text-white">"{query}"</div>
          {sport && (
            <div className="text-sm text-gray-400 mt-1">Sport: {sport.toUpperCase()}</div>
          )}
        </div>
      )}

      {/* Player/Team Context */}
      {(player || team) && (
        <div className="mb-4 p-3 bg-slate-700/30 rounded border border-slate-600">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Context</span>
          </div>
          {player && (
            <div className="text-white font-medium">{player}</div>
          )}
          {team && (
            <div className="text-gray-300">{team}</div>
          )}
        </div>
      )}

      {/* Statistics Results */}
      {results && (
        <div className="mb-4">
          <div className="text-sm font-medium text-white mb-3">Statistical Data</div>
          
          {Array.isArray(results) ? (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((stat, index) => (
                <div 
                  key={index}
                  className="p-3 bg-slate-700/50 rounded border border-slate-600 hover:border-green-400/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedStat(selectedStat === `${index}` ? null : `${index}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatIcon(stat.category || stat.type || 'stat')}
                      <span className="text-white font-medium">
                        {stat.label || stat.name || `Statistic ${index + 1}`}
                      </span>
                    </div>
                    <div className="text-green-400 font-bold">
                      {formatStatValue(stat.value)}
                    </div>
                  </div>
                  {selectedStat === `${index}` && stat.details && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-2 pt-2 border-t border-slate-600 text-sm text-gray-300"
                    >
                      {stat.details}
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          ) : typeof results === 'object' ? (
            <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
              {Object.entries(results).map(([key, value]) => (
                <div 
                  key={key}
                  className="p-3 bg-slate-700/50 rounded border border-slate-600"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-green-400 font-bold">
                      {formatStatValue(value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-slate-700/50 rounded border border-slate-600">
              <pre className="text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* AI Insights */}
      {insights && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded border border-purple-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">AI Analysis</span>
          </div>
          <div className="text-white text-sm leading-relaxed">
            {insights}
          </div>
        </div>
      )}

      {/* Key Metrics Summary */}
      {tool.data?.summary && (
        <div className="mb-4 p-3 bg-green-500/10 rounded border border-green-500/30">
          <div className="text-sm font-medium text-green-400 mb-2">Key Findings</div>
          <ul className="text-sm text-gray-300 space-y-1">
            {Array.isArray(tool.data.summary) ? (
              tool.data.summary.map((point: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>{point}</span>
                </li>
              ))
            ) : (
              <li>{tool.data.summary}</li>
            )}
          </ul>
        </div>
      )}

      {/* Betting Relevance */}
      {tool.data?.betting_context && (
        <div className="mb-4 p-3 bg-yellow-500/10 rounded border border-yellow-500/30">
          <div className="text-sm font-medium text-yellow-400 mb-2">Betting Context</div>
          <div className="text-sm text-gray-300">
            {tool.data.betting_context}
          </div>
        </div>
      )}

      {/* Timing Info */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-slate-600">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Queried: {tool.startTime.toLocaleTimeString()}</span>
        </div>
        {tool.endTime && (
          <span>Response: {((tool.endTime.getTime() - tool.startTime.getTime()) / 1000).toFixed(1)}s</span>
        )}
      </div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import { Globe, Search, ExternalLink, Clock, TrendingUp, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface WebSearchToolViewProps {
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

export default function WebSearchToolView({ tool, expanded }: WebSearchToolViewProps) {
  const [selectedResult, setSelectedResult] = useState<string | null>(null)
  
  const query = tool.data?.query || tool.data?.search_query
  const results = tool.data?.results || tool.data?.search_results || []
  const totalResults = tool.data?.total_results || results.length
  const source = tool.data?.search_engine || 'Google'
  const searchType = tool.data?.search_type || 'web'

  const getSearchTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'news': return <AlertCircle className="w-4 h-4 text-red-400" />
      case 'images': return <Globe className="w-4 h-4 text-blue-400" />
      case 'sports': return <TrendingUp className="w-4 h-4 text-green-400" />
      default: return <Search className="w-4 h-4 text-purple-400" />
    }
  }

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (!expanded) {
    return (
      <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Web Search</span>
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
        
        {totalResults > 0 && (
          <div className="text-xs text-purple-400">
            ✅ {totalResults} results found
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
          <Globe className="w-5 h-5 text-purple-400" />
          <span className="font-medium text-white">Web Search Results</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-400">{source}</span>
          <div className={`px-2 py-1 rounded text-xs ${
            tool.status === 'running' ? 'bg-blue-500/20 text-blue-300' :
            tool.status === 'completed' ? 'bg-green-500/20 text-green-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {tool.status}
          </div>
        </div>
      </div>

      {/* Query Info */}
      {query && (
        <div className="mb-4 p-3 bg-slate-700/30 rounded border border-slate-600">
          <div className="flex items-center space-x-2 mb-2">
            {getSearchTypeIcon(searchType)}
            <span className="text-sm font-medium text-purple-400">Search Query</span>
          </div>
          <div className="text-white">"{query}"</div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
            <span>Type: {searchType.charAt(0).toUpperCase() + searchType.slice(1)}</span>
            <span>{totalResults} results</span>
          </div>
        </div>
      )}

      {/* Search Results */}
      {results && results.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-white mb-3">Search Results</div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.slice(0, 5).map((result: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-3 bg-slate-700/50 rounded border border-slate-600 hover:border-purple-400/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium text-sm leading-tight flex-1">
                    {result.title || result.name || `Result ${index + 1}`}
                  </h3>
                  {result.url && (
                    <a 
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 p-1 rounded hover:bg-slate-600 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                
                {result.snippet && (
                  <p className="text-sm text-gray-300 mb-2 leading-relaxed">
                    {selectedResult === `${index}` 
                      ? result.snippet 
                      : truncateText(result.snippet)
                    }
                    {result.snippet.length > 150 && (
                      <button
                        onClick={() => setSelectedResult(
                          selectedResult === `${index}` ? null : `${index}`
                        )}
                        className="ml-2 text-purple-400 hover:text-purple-300 text-xs"
                      >
                        {selectedResult === `${index}` ? 'Show less' : 'Show more'}
                      </button>
                    )}
                  </p>
                )}

                {result.url && (
                  <div className="text-xs text-blue-300 truncate">
                    {result.url}
                  </div>
                )}

                {/* Additional metadata */}
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  {result.date && (
                    <span>{new Date(result.date).toLocaleDateString()}</span>
                  )}
                  {result.source && (
                    <span className="bg-slate-600 px-2 py-1 rounded">
                      {result.source}
                    </span>
                  )}
                </div>

                {/* Relevance score or rating */}
                {result.relevance && (
                  <div className="mt-2 flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Relevance:</span>
                    <div className="flex-1 bg-slate-600 rounded-full h-1">
                      <div 
                        className="bg-purple-400 h-1 rounded-full"
                        style={{ width: `${(result.relevance || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-purple-400">
                      {Math.round((result.relevance || 0) * 100)}%
                    </span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {results.length > 5 && (
            <div className="text-center mt-3">
              <span className="text-xs text-gray-400">
                Showing top 5 of {results.length} results
              </span>
            </div>
          )}
        </div>
      )}

      {/* Search Insights */}
      {tool.data?.insights && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded border border-purple-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Search Insights</span>
          </div>
          <div className="text-white text-sm leading-relaxed">
            {tool.data.insights}
          </div>
        </div>
      )}

      {/* Key Findings */}
      {tool.data?.key_findings && (
        <div className="mb-4 p-3 bg-green-500/10 rounded border border-green-500/30">
          <div className="text-sm font-medium text-green-400 mb-2">Key Findings</div>
          <ul className="text-sm text-gray-300 space-y-1">
            {Array.isArray(tool.data.key_findings) ? (
              tool.data.key_findings.map((finding: string, index: number) => (
                <li key={index} className="flex items-start space-x-2">
                  <span className="text-green-400 mt-0.5">•</span>
                  <span>{finding}</span>
                </li>
              ))
            ) : (
              <li>{tool.data.key_findings}</li>
            )}
          </ul>
        </div>
      )}

      {/* Search Statistics */}
      {tool.data?.search_stats && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          {Object.entries(tool.data.search_stats).map(([key, value]) => (
            <div key={key} className="p-2 bg-slate-700/30 rounded border border-slate-600">
              <div className="text-xs text-gray-400 capitalize">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-white font-medium">
                {typeof value === 'number' ? value.toLocaleString() : value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timing Info */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-slate-600">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Searched: {tool.startTime.toLocaleTimeString()}</span>
        </div>
        {tool.endTime && (
          <span>Duration: {((tool.endTime.getTime() - tool.startTime.getTime()) / 1000).toFixed(1)}s</span>
        )}
      </div>
    </motion.div>
  )
}

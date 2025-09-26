import { motion } from 'framer-motion'
import { Cpu, Code, TrendingUp, Clock, FileText, BarChart3, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface AnalysisToolViewProps {
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

export default function AnalysisToolView({ tool, expanded }: AnalysisToolViewProps) {
  const [showFullCode, setShowFullCode] = useState(false)
  
  const code = tool.data?.code || tool.data?.script
  const output = tool.data?.output || tool.data?.result
  const error = tool.data?.error
  const variables = tool.data?.variables
  const plots = tool.data?.plots || tool.data?.charts
  const analysis = tool.data?.analysis || tool.data?.insights
  const executionTime = tool.data?.execution_time

  const getToolIcon = () => {
    if (tool.name.toLowerCase().includes('python')) return <Code className="w-4 h-4" />
    if (tool.name.toLowerCase().includes('analysis')) return <TrendingUp className="w-4 h-4" />
    return <Cpu className="w-4 h-4" />
  }

  const formatOutput = (output: any) => {
    if (typeof output === 'string') return output
    if (typeof output === 'object') return JSON.stringify(output, null, 2)
    return String(output)
  }

  if (!expanded) {
    return (
      <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            {getToolIcon()}
            <span className="text-sm font-medium text-white capitalize">
              {tool.name.replace('_', ' ')}
            </span>
          </div>
          <div className={`px-2 py-1 rounded text-xs ${
            tool.status === 'running' ? 'bg-blue-500/20 text-blue-300' :
            tool.status === 'completed' ? 'bg-green-500/20 text-green-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {tool.status}
          </div>
        </div>
        
        {code && (
          <div className="text-sm text-gray-300 mb-2 font-mono bg-slate-700/50 p-2 rounded">
            {code.split('\n')[0]}...
          </div>
        )}
        
        {tool.status === 'completed' && output && (
          <div className="text-xs text-green-400">
            ✅ Execution completed
          </div>
        )}

        {error && (
          <div className="text-xs text-red-400">
            ❌ Error occurred
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
          {getToolIcon()}
          <span className="font-medium text-white capitalize">
            {tool.name.replace('_', ' ')} Execution
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {executionTime && (
            <span className="text-xs text-gray-400">{executionTime}ms</span>
          )}
          <div className={`px-2 py-1 rounded text-xs ${
            tool.status === 'running' ? 'bg-blue-500/20 text-blue-300' :
            tool.status === 'completed' ? 'bg-green-500/20 text-green-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {tool.status}
          </div>
        </div>
      </div>

      {/* Code Section */}
      {code && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Code className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-400">Code</span>
            </div>
            {code.split('\n').length > 5 && (
              <button
                onClick={() => setShowFullCode(!showFullCode)}
                className="text-xs text-blue-400 hover:text-blue-300"
              >
                {showFullCode ? 'Show less' : 'Show all'}
              </button>
            )}
          </div>
          <div className="bg-slate-900 rounded border border-slate-600 p-3 overflow-x-auto">
            <pre className="text-sm text-gray-300 font-mono">
              <code>
                {showFullCode ? code : code.split('\n').slice(0, 5).join('\n')}
                {!showFullCode && code.split('\n').length > 5 && '\n...'}
              </code>
            </pre>
          </div>
        </div>
      )}

      {/* Error Section */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 rounded border border-red-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm font-medium text-red-400">Error</span>
          </div>
          <div className="text-sm text-red-300 font-mono">
            {error}
          </div>
        </div>
      )}

      {/* Output Section */}
      {output && !error && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <FileText className="w-4 h-4 text-green-400" />
            <span className="text-sm font-medium text-green-400">Output</span>
          </div>
          <div className="bg-slate-900 rounded border border-slate-600 p-3 max-h-64 overflow-y-auto">
            <pre className="text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {formatOutput(output)}
            </pre>
          </div>
        </div>
      )}

      {/* Variables Section */}
      {variables && Object.keys(variables).length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Variables</span>
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
            {Object.entries(variables).map(([key, value]) => (
              <div 
                key={key}
                className="p-2 bg-slate-700/50 rounded border border-slate-600"
              >
                <div className="flex items-center justify-between">
                  <span className="text-white font-mono text-sm">{key}</span>
                  <span className="text-gray-400 text-sm">
                    {typeof value}
                  </span>
                </div>
                <div className="text-xs text-gray-300 mt-1 font-mono">
                  {String(value).length > 50 
                    ? String(value).substring(0, 50) + '...'
                    : String(value)
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts/Plots Section */}
      {plots && plots.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center space-x-2 mb-2">
            <BarChart3 className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-medium text-yellow-400">Generated Charts</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {plots.map((plot: any, index: number) => (
              <div key={index} className="bg-slate-700/30 rounded border border-slate-600 p-3">
                {plot.title && (
                  <div className="text-white font-medium mb-2">{plot.title}</div>
                )}
                {plot.image && (
                  <img 
                    src={`data:image/png;base64,${plot.image}`}
                    alt={plot.title || `Chart ${index + 1}`}
                    className="w-full rounded border border-slate-600"
                  />
                )}
                {plot.description && (
                  <div className="text-sm text-gray-400 mt-2">{plot.description}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <div className="mb-4 p-3 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded border border-purple-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Analysis Results</span>
          </div>
          <div className="text-white text-sm leading-relaxed">
            {analysis}
          </div>
        </div>
      )}

      {/* Execution Stats */}
      {tool.data?.stats && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          {Object.entries(tool.data.stats).map(([key, value]) => (
            <div key={key} className="p-2 bg-slate-700/30 rounded border border-slate-600">
              <div className="text-xs text-gray-400 capitalize">
                {key.replace(/_/g, ' ')}
              </div>
              <div className="text-white font-medium">
                {typeof value === 'number' ? value.toLocaleString() : String(value)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Timing Info */}
      <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-slate-600">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>Started: {tool.startTime.toLocaleTimeString()}</span>
        </div>
        {tool.endTime && (
          <span>Duration: {((tool.endTime.getTime() - tool.startTime.getTime()) / 1000).toFixed(1)}s</span>
        )}
      </div>
    </motion.div>
  )
}

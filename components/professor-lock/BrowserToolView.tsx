import { motion } from 'framer-motion'
import { Globe, Eye, Maximize2, ExternalLink, Clock, MousePointer } from 'lucide-react'
import { useState } from 'react'

interface BrowserToolViewProps {
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

export default function BrowserToolView({ tool, expanded }: BrowserToolViewProps) {
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null)
  
  const latestScreenshot = tool.screenshots?.[tool.screenshots.length - 1]
  const browsedUrl = tool.data?.url || tool.data?.current_url
  const pageTitle = tool.data?.title || tool.data?.page_title
  const action = tool.data?.action || 'browsing'
  
  const formatAction = (action: string) => {
    switch (action.toLowerCase()) {
      case 'navigate': return '🔗 Navigating to page'
      case 'click': return '👆 Clicking element'
      case 'type': return '⌨️ Typing text'
      case 'scroll': return '📜 Scrolling page'
      case 'screenshot': return '📸 Taking screenshot'
      case 'extract': return '📋 Extracting content'
      default: return '🌐 Browser action'
    }
  }

  if (!expanded) {
    return (
      <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-white">Browser Control</span>
          </div>
          <div className={`px-2 py-1 rounded text-xs ${
            tool.status === 'running' ? 'bg-blue-500/20 text-blue-300' :
            tool.status === 'completed' ? 'bg-green-500/20 text-green-300' :
            'bg-red-500/20 text-red-300'
          }`}>
            {tool.status}
          </div>
        </div>
        
        {latestScreenshot && (
          <div className="relative rounded overflow-hidden">
            <img 
              src={`data:image/jpeg;base64,${latestScreenshot}`}
              alt="Browser screenshot"
              className="w-full h-24 object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 left-2 right-2">
              <p className="text-xs text-white truncate">{pageTitle || browsedUrl}</p>
            </div>
          </div>
        )}
        
        <div className="mt-2 text-xs text-gray-400">
          {formatAction(action)}
        </div>
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
          <Globe className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-white">Browser Control Session</span>
        </div>
        <div className="flex items-center space-x-2">
          {browsedUrl && (
            <a 
              href={browsedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1 rounded hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
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

      {/* Current Page Info */}
      {(browsedUrl || pageTitle) && (
        <div className="mb-4 p-3 bg-slate-700/30 rounded border border-slate-600">
          <div className="flex items-center space-x-2 mb-2">
            <Eye className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Current Page</span>
          </div>
          {pageTitle && (
            <div className="text-white font-medium mb-1">{pageTitle}</div>
          )}
          {browsedUrl && (
            <div className="text-sm text-blue-300 truncate">{browsedUrl}</div>
          )}
        </div>
      )}

      {/* Action Status */}
      {action && (
        <div className="mb-4 p-3 bg-slate-700/30 rounded border border-slate-600">
          <div className="flex items-center space-x-2 mb-2">
            <MousePointer className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-medium text-orange-400">Current Action</span>
          </div>
          <div className="text-white">{formatAction(action)}</div>
          {tool.data?.element && (
            <div className="text-sm text-gray-400 mt-1">
              Target: {tool.data.element}
            </div>
          )}
        </div>
      )}

      {/* Live Screenshot */}
      {latestScreenshot && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Live Screenshot</span>
            <button
              onClick={() => setSelectedScreenshot(latestScreenshot)}
              className="p-1 rounded hover:bg-slate-700 text-gray-400 hover:text-white transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          <div className="relative rounded overflow-hidden border border-slate-600">
            <img 
              src={`data:image/jpeg;base64,${latestScreenshot}`}
              alt="Browser screenshot"
              className="w-full max-h-64 object-cover object-top cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedScreenshot(latestScreenshot)}
            />
            {tool.status === 'running' && (
              <div className="absolute top-2 right-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screenshot History */}
      {tool.screenshots && tool.screenshots.length > 1 && (
        <div className="mb-4">
          <div className="text-sm font-medium text-white mb-2">Screenshot History</div>
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {tool.screenshots.slice(-5).map((screenshot, index) => (
              <div
                key={index}
                className="flex-shrink-0 relative cursor-pointer"
                onClick={() => setSelectedScreenshot(screenshot)}
              >
                <img 
                  src={`data:image/jpeg;base64,${screenshot}`}
                  alt={`Screenshot ${index + 1}`}
                  className="w-16 h-12 object-cover rounded border border-slate-600 hover:border-blue-400 transition-colors"
                />
              </div>
            ))}
          </div>
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

      {/* Screenshot Modal */}
      {selectedScreenshot && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedScreenshot(null)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-w-4xl max-h-full"
          >
            <img 
              src={`data:image/jpeg;base64,${selectedScreenshot}`}
              alt="Full screenshot"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

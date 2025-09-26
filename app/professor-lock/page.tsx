'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/contexts/SubscriptionContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Brain, 
  Send, 
  Mic, 
  MicOff,
  Globe,
  Database,
  Activity,
  Eye,
  Zap,
  TrendingUp,
  BarChart3,
  Clock,
  Cpu,
  Loader2,
  ChevronDown,
  Maximize2,
  Minimize2
} from 'lucide-react'

// Tool visualization components (temporarily disabled - components don't exist yet)
// import BrowserToolView from '@/components/professor-lock/BrowserToolView'
// import StatMuseToolView from '@/components/professor-lock/StatMuseToolView'
// import WebSearchToolView from '@/components/professor-lock/WebSearchToolView'
// import AnalysisToolView from '@/components/professor-lock/AnalysisToolView'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolsUsed?: Tool[]
  isStreaming?: boolean
}

interface Tool {
  name: string
  status: 'running' | 'completed' | 'error'
  progress?: number
  data?: any
  screenshots?: string[]
  startTime: Date
  endTime?: Date
}

interface AgentStatus {
  isActive: boolean
  currentTask?: string
  toolsInUse: string[]
  progress: number
}

export default function ProfessorLockPage() {
  const { user } = useAuth()
  const { subscriptionTier } = useSubscription()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [agentStatus, setAgentStatus] = useState<AgentStatus>({
    isActive: false,
    toolsInUse: [],
    progress: 0
  })
  const [activeTools, setActiveTools] = useState<Tool[]>([])
  const [expandedTool, setExpandedTool] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const wsRef = useRef<WebSocket | null>(null)

  // WebSocket connection for real-time communication
  useEffect(() => {
    if (!user) return

    // Avoid duplicate sockets during Fast Refresh / re-renders
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8081'
    const ws = new WebSocket(`${wsUrl}/professor-lock/${user.id}`)
    wsRef.current = ws
    
    ws.onopen = () => {
      console.log('🔗 Connected to Professor Lock Agent')
      setIsConnected(true)
      addSystemMessage('🧠 Professor Lock Advanced Agent initialized. Ready for complex analysis tasks.')
    }

    ws.onerror = (err) => {
      console.error('⚠️ WebSocket error:', err)
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      handleWebSocketMessage(data)
    }

    ws.onclose = () => {
      console.log('🔌 Disconnected from Professor Lock Agent')
      setIsConnected(false)
      // Clear ref only if this instance is the active one
      if (wsRef.current === ws) {
        wsRef.current = null
      }
    }

    return () => {
      try { ws.close() } catch {}
    }
  }, [user])

  const handleWebSocketMessage = useCallback((data: any) => {
    switch (data.type) {
      case 'message_chunk':
        updateStreamingMessage(data.messageId, data.chunk)
        break
      case 'message_complete':
        completeStreamingMessage(data.messageId, data.toolsUsed)
        break
      case 'tool_start':
        startTool(data.tool)
        break
      case 'tool_update':
        updateTool(data.toolName, data.update)
        break
      case 'tool_screenshot':
        addToolScreenshot(data.toolName, data.screenshot)
        break
      case 'tool_complete':
        completeTool(data.toolName, data.result)
        break
      case 'agent_status':
        setAgentStatus(data.status)
        break
    }
  }, [])

  const addSystemMessage = (content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      role: 'system',
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  const updateStreamingMessage = (messageId: string, chunk: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: msg.content + chunk }
        : msg
    ))
  }

  const completeStreamingMessage = (messageId: string, toolsUsed: Tool[]) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isStreaming: false, toolsUsed }
        : msg
    ))
  }

  const startTool = (tool: Tool) => {
    setActiveTools(prev => [...prev, tool])
    setAgentStatus(prev => ({
      ...prev,
      isActive: true,
      currentTask: `Using ${tool.name}`,
      toolsInUse: [...prev.toolsInUse, tool.name]
    }))
  }

  const updateTool = (toolName: string, update: any) => {
    setActiveTools(prev => prev.map(tool =>
      tool.name === toolName ? { ...tool, ...update } : tool
    ))
  }

  const addToolScreenshot = (toolName: string, screenshot: string) => {
    setActiveTools(prev => prev.map(tool =>
      tool.name === toolName 
        ? { ...tool, screenshots: [...(tool.screenshots || []), screenshot] }
        : tool
    ))
  }

  const completeTool = (toolName: string, result: any) => {
    setActiveTools(prev => prev.map(tool =>
      tool.name === toolName 
        ? { ...tool, status: 'completed', endTime: new Date(), data: result }
        : tool
    ))
    
    setAgentStatus(prev => ({
      ...prev,
      toolsInUse: prev.toolsInUse.filter(name => name !== toolName),
      isActive: prev.toolsInUse.length > 1
    }))
  }

  const sendMessage = async () => {
    if (!inputValue.trim()) return
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addSystemMessage('Connection not ready. Reconnecting... please try again in a moment.')
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date()
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    }

    setMessages(prev => [...prev, userMessage, assistantMessage])
    setInputValue('')
    
    // Send message to WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content: userMessage.content,
      messageId: assistantMessage.id,
      userTier: subscriptionTier
    }))

    // Clear active tools for new conversation
    setActiveTools([])
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const getToolIcon = (toolName: string) => {
    switch (toolName.toLowerCase()) {
      case 'browser_use': return <Globe className="w-4 h-4" />
      case 'statmuse_query': return <BarChart3 className="w-4 h-4" />
      case 'web_search': return <Globe className="w-4 h-4" />
      case 'python_execute': return <Cpu className="w-4 h-4" />
      case 'data_analysis': return <TrendingUp className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const renderToolView = (tool: Tool) => {
    const isExpanded = expandedTool === tool.name

    // Temporarily use default view for all tools until tool components are created
    switch (tool.name.toLowerCase()) {
      case 'browser_use':
      case 'statmuse_query':
      case 'web_search':
      case 'python_execute':
      case 'data_analysis':
        // return <BrowserToolView tool={tool} expanded={isExpanded} />
        // return <StatMuseToolView tool={tool} expanded={isExpanded} />
        // return <WebSearchToolView tool={tool} expanded={isExpanded} />
        // return <AnalysisToolView tool={tool} expanded={isExpanded} />
      default:
        return (
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getToolIcon(tool.name)}
                <span className="font-medium text-white capitalize">
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
            {tool.data && (
              <pre className="text-sm text-gray-300 overflow-x-auto">
                {JSON.stringify(tool.data, null, 2)}
              </pre>
            )}
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800">
      {/* Header */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Brain className="w-8 h-8 text-purple-400" />
                <motion.div
                  className="absolute inset-0"
                  animate={{
                    scale: agentStatus.isActive ? [1, 1.2, 1] : 1,
                  }}
                  transition={{
                    duration: 2,
                    repeat: agentStatus.isActive ? Infinity : 0,
                  }}
                >
                  <Brain className="w-8 h-8 text-purple-400/50" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Professor Lock Advanced</h1>
                <p className="text-sm text-gray-400">
                  AI Sports Betting Agent with Live Tool Visualization
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {agentStatus.isActive && (
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500/20 text-blue-300">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">{agentStatus.currentTask}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          
          {/* Chat Section */}
          <div className="lg:col-span-2 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
              <AnimatePresence>
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${
                      message.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white ml-4'
                        : message.role === 'system'
                        ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                        : 'bg-slate-800 text-gray-100 mr-4 border border-slate-700'
                    }`}>
                      {message.role === 'assistant' && (
                        <div className="flex items-center space-x-2 mb-2">
                          <Brain className="w-4 h-4 text-purple-400" />
                          <span className="text-sm font-medium text-purple-400">
                            Professor Lock Advanced
                          </span>
                          {message.isStreaming && (
                            <Loader2 className="w-3 h-3 animate-spin text-purple-400" />
                          )}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">
                        {message.content}
                        {message.isStreaming && (
                          <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="ml-1"
                          >
                            ▊
                          </motion.span>
                        )}
                      </div>
                      {message.toolsUsed && message.toolsUsed.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-600">
                          <div className="text-xs text-gray-400 mb-2">Tools Used:</div>
                          <div className="flex flex-wrap gap-2">
                            {message.toolsUsed.map((tool, toolIndex) => (
                              <div
                                key={toolIndex}
                                className="flex items-center space-x-1 px-2 py-1 bg-slate-700 rounded text-xs"
                              >
                                {getToolIcon(tool.name)}
                                <span>{tool.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-slate-800/50 backdrop-blur-md rounded-2xl border border-slate-700 p-4 relative z-50 pointer-events-auto">
              <div className="flex items-end space-x-4">
                <div 
                  className="flex-1 cursor-text relative z-20"
                  onClick={() => inputRef.current?.focus()}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask Professor Lock Advanced to analyze betting opportunities, research players, or build complex strategies..."
                    className="w-full bg-transparent text-white placeholder-gray-400 outline-none border-none focus:ring-0 p-2 min-h-[40px]"
                    autoComplete="off"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsListening(!isListening)}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-500 text-white'
                        : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tool Visualization Panel */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="bg-slate-800/30 backdrop-blur-md rounded-2xl border border-slate-700 p-6 flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Eye className="w-5 h-5 text-blue-400" />
                  <span>Live Agent Tools</span>
                </h2>
                {activeTools.length > 0 && (
                  <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                    {activeTools.filter(t => t.status === 'running').length} active
                  </div>
                )}
              </div>

              <div className="space-y-4 overflow-y-auto flex-1">
                <AnimatePresence>
                  {activeTools.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                      <p className="text-gray-400 text-sm">
                        Agent tools will appear here when Professor Lock starts working
                      </p>
                    </motion.div>
                  ) : (
                    activeTools.map((tool) => (
                      <motion.div
                        key={tool.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative"
                      >
                        {/* Tool Header */}
                        <div 
                          className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:bg-slate-800/70 transition-colors"
                          onClick={() => setExpandedTool(
                            expandedTool === tool.name ? null : tool.name
                          )}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              {getToolIcon(tool.name)}
                              {tool.status === 'running' && (
                                <motion.div
                                  className="absolute inset-0"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                  <Zap className="w-4 h-4 text-yellow-400/50" />
                                </motion.div>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm capitalize">
                                {tool.name.replace('_', ' ')}
                              </div>
                              <div className="text-xs text-gray-400">
                                {tool.status === 'running' ? 'Working...' : 
                                 tool.status === 'completed' ? 'Completed' : 'Error'}
                              </div>
                            </div>
                          </div>
                          <ChevronDown 
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedTool === tool.name ? 'rotate-180' : ''
                            }`} 
                          />
                        </div>

                        {/* Tool Content */}
                        <AnimatePresence>
                          {expandedTool === tool.name && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-2"
                            >
                              {renderToolView(tool)}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

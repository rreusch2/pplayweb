'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { GripHorizontal, GripVertical } from 'lucide-react'

interface ResizableChatKitProps {
  children: React.ReactNode
  className?: string
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  initialWidth?: number
  initialHeight?: number
}

export default function ResizableChatKit({
  children,
  className = '',
  minWidth = 400,
  maxWidth = 1200,
  minHeight = 400,
  maxHeight = 800,
  initialWidth = 800,
  initialHeight = 600
}: ResizableChatKitProps) {
  const [dimensions, setDimensions] = useState({
    width: initialWidth,
    height: initialHeight
  })
  const [isResizing, setIsResizing] = useState({ width: false, height: false })
  const containerRef = useRef<HTMLDivElement>(null)
  const startPos = useRef({ x: 0, y: 0 })
  const startSize = useRef({ width: 0, height: 0 })

  // Handle width resizing
  const handleWidthMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(prev => ({ ...prev, width: true }))
    startPos.current.x = e.clientX
    startSize.current.width = dimensions.width
  }, [dimensions.width])

  // Handle height resizing
  const handleHeightMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(prev => ({ ...prev, height: true }))
    startPos.current.y = e.clientY
    startSize.current.height = dimensions.height
  }, [dimensions.height])

  // Mouse move handler
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing.width) {
      const deltaX = e.clientX - startPos.current.x
      const newWidth = Math.min(maxWidth, Math.max(minWidth, startSize.current.width + deltaX))
      setDimensions(prev => ({ ...prev, width: newWidth }))
    }
    
    if (isResizing.height) {
      const deltaY = e.clientY - startPos.current.y
      const newHeight = Math.min(maxHeight, Math.max(minHeight, startSize.current.height + deltaY))
      setDimensions(prev => ({ ...prev, height: newHeight }))
    }
  }, [isResizing, minWidth, maxWidth, minHeight, maxHeight])

  // Mouse up handler
  const handleMouseUp = useCallback(() => {
    setIsResizing({ width: false, height: false })
  }, [])

  // Add/remove event listeners
  useEffect(() => {
    if (isResizing.width || isResizing.height) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = isResizing.width ? 'ew-resize' : 'ns-resize'
      document.body.style.userSelect = 'none'
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      style={{
        width: dimensions.width,
        height: dimensions.height
      }}
    >
      {/* Main content */}
      <div className="w-full h-full overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-white/[0.04] backdrop-blur-sm">
        {children}
      </div>

      {/* Height resize handle (bottom) */}
      <div
        className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-20 h-4 cursor-ns-resize group flex items-center justify-center"
        onMouseDown={handleHeightMouseDown}
        title="Drag to resize height"
      >
        <div className="w-12 h-2 bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full group-hover:from-blue-400/50 group-hover:to-purple-400/50 transition-all duration-200 flex items-center justify-center border border-white/10 group-hover:border-white/20 shadow-lg backdrop-blur-sm">
          <GripHorizontal className="w-4 h-4 text-white/70 group-hover:text-white/90 transition-colors" />
        </div>
      </div>

      {/* Width resize handle (right) */}
      <div
        className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-4 h-20 cursor-ew-resize group flex items-center justify-center"
        onMouseDown={handleWidthMouseDown}
        title="Drag to resize width"
      >
        <div className="w-2 h-12 bg-gradient-to-b from-blue-500/30 to-purple-500/30 rounded-full group-hover:from-blue-400/50 group-hover:to-purple-400/50 transition-all duration-200 flex items-center justify-center border border-white/10 group-hover:border-white/20 shadow-lg backdrop-blur-sm">
          <GripVertical className="w-4 h-4 text-white/70 group-hover:text-white/90 transition-colors" />
        </div>
      </div>

      {/* Corner resize handle (bottom-right) */}
      <div
        className="absolute -bottom-2 -right-2 w-6 h-6 cursor-nw-resize group"
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing({ width: true, height: true })
          startPos.current.x = e.clientX
          startPos.current.y = e.clientY
          startSize.current.width = dimensions.width
          startSize.current.height = dimensions.height
        }}
        title="Drag to resize both dimensions"
      >
        <div className="w-full h-full bg-gradient-to-br from-blue-500/40 to-purple-500/40 rounded-tl-xl group-hover:from-blue-400/60 group-hover:to-purple-400/60 transition-all duration-200 border border-white/20 group-hover:border-white/30 shadow-lg backdrop-blur-sm" />
      </div>
    </div>
  )
}

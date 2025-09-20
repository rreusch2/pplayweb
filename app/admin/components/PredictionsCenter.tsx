'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Settings, Play, Wand2, Shield, Terminal, RefreshCw } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'react-hot-toast'

type ScriptType = 'props' | 'teams'
type SportKey = 'NFL' | 'MLB' | 'WNBA' | 'CFB' | 'MMA'

interface RunResult {
  success: boolean
  output?: string
  error?: string
}

export default function PredictionsCenter() {
  const { session } = useAuth()
  const [scriptType, setScriptType] = useState<ScriptType>('props')
  const [date, setDate] = useState<string>('')
  const [picks, setPicks] = useState<number>(10)
  const [sport, setSport] = useState<SportKey>('NFL')
  const [nflOnly, setNflOnly] = useState(false)
  const [nflWeek, setNflWeek] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [resp, setResp] = useState<RunResult | null>(null)

  const scriptPath = useMemo(() => {
    return scriptType === 'props' ? 'python props_enhanced.py' : 'python teams_enhanced.py'
  }, [scriptType])

  const buildCommand = () => {
    const parts: string[] = [scriptPath]
    if (date) parts.push(`--date ${date}`)
    if (picks) parts.push(`--picks ${picks}`)
    if (sport) parts.push(`--sport ${sport}`)
    if (scriptType === 'props') {
      if (nflWeek) parts.push('--nfl-week')
      if (nflOnly || sport === 'NFL') parts.push('--nfl-only')
    } else {
      if (nflWeek) parts.push('--nfl-week')
      if (nflOnly || sport === 'NFL') parts.push('--nfl-only')
    }
    return parts.join(' ')
  }

  const run = async () => {
    try {
      if (!session?.access_token) {
        toast.error('Not authenticated')
        return
      }
      const command = buildCommand()
      setIsRunning(true)
      setResp(null)
      const res = await fetch('/api/admin/predictions/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ command })
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        setResp({ success: false, error: data?.error || 'Failed' })
        toast.error(data?.error || 'Execution failed')
      } else {
        const output = data?.data?.output || data?.output
        setResp({ success: true, output })
        toast.success('Execution started')
      }
    } catch (e: any) {
      setResp({ success: false, error: e?.message || 'Unexpected error' })
      toast.error('Unexpected error running command')
    } finally {
      setIsRunning(false)
    }
  }

  const runWithLiveLogs = async () => {
    try {
      if (!session?.access_token) {
        toast.error('Not authenticated')
        return
      }
      const command = buildCommand()
      setResp(null)
      const url = `/api/admin/predictions/stream?command=${encodeURIComponent(command)}&token=${encodeURIComponent(session.access_token)}`
      const es = new EventSource(url)

      es.onopen = () => toast.success('Streaming started')
      es.addEventListener('stdout', (e: MessageEvent) => {
        setResp(prev => ({ success: true, output: `${(prev?.output || '')}${e.data}\n` }))
      })
      es.addEventListener('stderr', (e: MessageEvent) => {
        setResp(prev => ({ success: true, output: `${(prev?.output || '')}${e.data}\n` }))
      })
      es.addEventListener('done', (e: MessageEvent) => {
        toast.success('Execution finished')
        es.close()
      })
      es.onerror = () => {
        toast.error('Stream error')
        es.close()
      }
    } catch (e) {
      toast.error('Unable to start stream')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-md rounded-xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Shield className="w-5 h-5 mr-2 text-blue-400" />
          Predictions Center
        </h3>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Run Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setScriptType('props')}
              className={`px-3 py-2 rounded border ${scriptType==='props'?'bg-blue-600 text-white border-blue-500':'bg-white/10 text-white border-white/20'}`}
            >Player Props</button>
            <button
              onClick={() => setScriptType('teams')}
              className={`px-3 py-2 rounded border ${scriptType==='teams'?'bg-purple-600 text-white border-purple-500':'bg-white/10 text-white border-white/20'}`}
            >Teams</button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Sport</label>
          <select
            value={sport}
            onChange={e=>setSport(e.target.value as SportKey)}
            className="w-full px-3 py-2 bg-white border border-white/20 rounded-lg text-black"
          >
            <option value="NFL">NFL</option>
            <option value="CFB">CFB</option>
            <option value="MLB">MLB</option>
            <option value="WNBA">WNBA</option>
            <option value="MMA">MMA</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Date</label>
          <div className="relative">
            <input
              type="date"
              value={date}
              onChange={e=>setDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
            />
            <Calendar className="w-4 h-4 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-2">Number of Picks</label>
          <input
            type="number"
            min={1}
            max={30}
            value={picks}
            onChange={e=>setPicks(parseInt(e.target.value || '0', 10))}
            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">NFL Week Mode</label>
          <button onClick={()=>setNflWeek(v=>!v)} className={`px-3 py-2 rounded border ${nflWeek?'bg-emerald-600 text-white border-emerald-500':'bg-white/10 text-white border-white/20'}`}>Toggle</button>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-300">NFL Only</label>
          <button onClick={()=>setNflOnly(v=>!v)} className={`px-3 py-2 rounded border ${nflOnly?'bg-emerald-600 text-white border-emerald-500':'bg-white/10 text-white border-white/20'}`}>Toggle</button>
        </div>

      </div>

      {/* Preview */}
      <div className="mt-5 p-3 bg-black/30 border border-white/10 rounded-lg text-xs text-gray-300 font-mono">
        <div className="flex items-center gap-2 mb-2 text-white">
          <Terminal className="w-4 h-4" /> Command Preview
        </div>
        {buildCommand()}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={run}
          disabled={isRunning}
          className={`px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 border border-blue-500/30 flex items-center gap-2 ${isRunning?'opacity-75 cursor-not-allowed':''}`}
        >
          {isRunning ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
          Run Now
        </button>
        <button
          onClick={runWithLiveLogs}
          className="px-4 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 border border-emerald-500/30 flex items-center gap-2"
        >
          <Play className="w-4 h-4"/>
          Run with Live Logs
        </button>
        <div className="text-gray-400 text-sm flex items-center gap-2"><Wand2 className="w-4 h-4"/>Runs on Railway script service</div>
      </div>

      {/* Result */}
      {resp && (
        <div className={`mt-4 p-3 rounded-lg border ${resp.success? 'border-emerald-500/30 bg-emerald-500/10':'border-red-500/30 bg-red-500/10'}`}>
          <div className="text-sm text-white font-semibold mb-2">{resp.success ? 'Started Successfully' : 'Failed'}</div>
          {resp.output && (
            <pre className="whitespace-pre-wrap text-xs text-gray-200 max-h-64 overflow-auto">{resp.output}</pre>
          )}
          {resp.error && (
            <div className="text-xs text-red-200">{resp.error}</div>
          )}
        </div>
      )}
    </motion.div>
  )
}



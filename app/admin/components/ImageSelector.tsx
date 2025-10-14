'use client'

import { useState } from 'react'
import { X, Search, Upload, Link as LinkIcon, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import Portal from './Portal'

interface Props {
  type: 'league' | 'sportsbook'
  onSelect: (url: string, type: 'league' | 'sportsbook') => void
  onClose: () => void
}

// Pre-defined logos from Supabase storage
const SUPABASE_URL = 'https://iriaegoipkjtktitpary.supabase.co'

const LEAGUE_LOGOS = {
  MLB: `${SUPABASE_URL}/storage/v1/object/public/logos/leagues/mlb.png`,
  NBA: `${SUPABASE_URL}/storage/v1/object/public/logos/leagues/nba.png`,
  NFL: `${SUPABASE_URL}/storage/v1/object/public/logos/leagues/nfl.png`,
  NHL: `${SUPABASE_URL}/storage/v1/object/public/logos/leagues/nhl.png`,
  WNBA: `${SUPABASE_URL}/storage/v1/object/public/logos/leagues/wnba.png`,
  CFB: `${SUPABASE_URL}/storage/v1/object/public/logos/leagues/cfb.png`,
  UFC: 'https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg', // Fallback for UFC
}

const TEAM_LOGOS = {
  // MLB Teams - using ESPN team logos for consistency
  'New York Yankees': 'https://www.mlbstatic.com/team-logos/147.svg',
  'Boston Red Sox': 'https://www.mlbstatic.com/team-logos/111.svg',
  'Los Angeles Dodgers': 'https://www.mlbstatic.com/team-logos/119.svg',
  'San Francisco Giants': 'https://www.mlbstatic.com/team-logos/137.svg',
  'Chicago Cubs': 'https://www.mlbstatic.com/team-logos/112.svg',
  'Atlanta Braves': 'https://www.mlbstatic.com/team-logos/144.svg',
  'Philadelphia Phillies': 'https://www.mlbstatic.com/team-logos/143.svg',
  'Houston Astros': 'https://www.mlbstatic.com/team-logos/117.svg',
  'Toronto Blue Jays': 'https://www.mlbstatic.com/team-logos/141.svg',
  'Tampa Bay Rays': 'https://www.mlbstatic.com/team-logos/139.svg',
  // Add more as needed
}

const SPORTSBOOK_LOGOS = {
  DraftKings: `${SUPABASE_URL}/storage/v1/object/public/logos/bookmakers/draftkings.png`,
  FanDuel: `${SUPABASE_URL}/storage/v1/object/public/logos/bookmakers/fanduel.png`,
  BetMGM: `${SUPABASE_URL}/storage/v1/object/public/logos/bookmakers/betmgm.png`,
  Caesars: `${SUPABASE_URL}/storage/v1/object/public/logos/bookmakers/caesars.png`,
  Fanatics: `${SUPABASE_URL}/storage/v1/object/public/logos/bookmakers/fanatics.png`,
}

export default function ImageSelector({ type, onSelect, onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'league' | 'team' | 'custom'>('league')

  const handleSelect = (url: string) => {
    onSelect(url, type)
  }

  const handleCustomSubmit = () => {
    if (customUrl) {
      handleSelect(customUrl)
    }
  }

  const getLogos = () => {
    if (type === 'sportsbook') {
      return SPORTSBOOK_LOGOS
    }

    if (selectedCategory === 'league') {
      return LEAGUE_LOGOS
    } else if (selectedCategory === 'team') {
      // Combine all team logos
      return TEAM_LOGOS
    }
    return {}
  }

  const filteredLogos = Object.entries(getLogos()).filter(([name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  ) as [string, string][]

  return (
    <>
      <Portal>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            role="dialog"
            aria-modal="true"
            className="w-full max-w-[min(640px,calc(100vw-2rem))] max-h-[80vh] bg-gray-900 rounded-lg border border-gray-800 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="bg-gray-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold">
            Select {type === 'league' ? 'League/Team Logo' : 'Sportsbook Logo'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Tabs (only for league type) */}
        {type === 'league' && (
          <div className="border-b border-gray-800 px-6 flex-shrink-0">
            <div className="flex gap-4">
              {(['league', 'team', 'custom'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`py-3 px-4 capitalize border-b-2 transition-colors ${
                    selectedCategory === cat 
                      ? 'border-green-500 text-green-500' 
                      : 'border-transparent hover:text-gray-300'
                  }`}
                >
                  {cat === 'league' ? 'Leagues' : cat === 'team' ? 'Teams' : 'Custom URL'}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 min-h-0">
          {selectedCategory !== 'custom' ? (
            <>
              {/* Search */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search logos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>

              {/* Logo Grid */}
              <div className="grid grid-cols-4 md:grid-cols-6 gap-4 max-h-[50vh] overflow-y-auto">
                {filteredLogos.map(([name, url]) => (
                  <button
                    key={name}
                    onClick={() => handleSelect(url)}
                    className="group relative bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all hover:scale-105"
                  >
                    <div className="aspect-square flex items-center justify-center mb-2">
                      <img 
                        src={url} 
                        alt={name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          const img = e.target as HTMLImageElement
                          img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMjAgMTJDMTguMDIyMiAxMiAxNi4wODg4IDEyLjU4NjUgMTQuNDQ0MyAxMy42ODUzQzEyLjc5OTggMTQuNzg0MSAxMS41MTgxIDE2LjM0NTkgMTAuNzYxMiAxOC4xNzNDMTAuMDA0MyAyMC4wMDAyIDkuODA2MyAyMi4wMTExIDEwLjE5MjIgMjMuOTUwOUMxMC41NzgyIDI1Ljg5MDcgMTEuNTMwNCAyNy42NzI1IDEyLjkyODkgMjkuMDcxMUMxNC4zMjc1IDMwLjQ2OTYgMTYuMTA5MyAzMS40MjE4IDE4LjA0OTEgMzEuODA3OEMxOS45ODg5IDMyLjE5MzcgMjEuOTk5OCAzMS45OTU3IDIzLjgyNyAzMS4yMzg4QzI1LjY1NDEgMzAuNDgxOSAyNy4yMTU5IDI5LjIwMDIgMjguMzE0NyAyNy41NTU3QzI5LjQxMzUgMjUuOTExMiAzMCAyMy45Nzc4IDMwIDIwQzMwIDE1LjAyMTggMjUuNTIyOCAxMiAyMCAxMlpNMjAgMjhDMTcuMjE1MiAyOCAxNSAyNS43ODQ4IDE1IDIzQzE1IDIwLjIxNTIgMTcuMjE1MiAxOCAyMCAxOEMyMi43ODQ4IDE4IDI1IDIwLjIxNTIgMjUgMjNDMjUgMjUuNzg0OCAyMi43ODQ4IDI4IDIwIDI4WiIgZmlsbD0iIzlDQTNCNCIvPgo8L3N2Zz4='
                        }}
                      />
                    </div>
                    <div className="text-xs text-center truncate">{name}</div>
                    <div className="absolute inset-0 rounded-lg border-2 border-green-500 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
                  </button>
                ))}
              </div>
            </>
          ) : (
            /* Custom URL Input */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Enter Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="https://..."
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                  />
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customUrl}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Check size={16} />
                    Use URL
                  </button>
                </div>
              </div>

              {/* Preview */}
              {customUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2">Preview</label>
                  <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-center h-32">
                    <img 
                      src={customUrl} 
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiByeD0iOCIgZmlsbD0iIzM3NDE1MSIvPgo8cGF0aCBkPSJNMjAgMTJDMTguMDIyMiAxMiAxNi4wODg4IDEyLjU4NjUgMTQuNDQ0MyAxMy42ODUzQzEyLjc5OTggMTQuNzg0MSAxMS41MTgxIDE2LjM0NTkgMTAuNzYxMiAxOC4xNzNDMTAuMDA0MyAyMC4wMDAyIDkuODA2MyAyMi4wMTExIDEwLjE5MjIgMjMuOTUwOUMxMC41NzgyIDI1Ljg5MDcgMTEuNTMwNCAyNy42NzI1IDEyLjkyODkgMjkuMDcxMUMxNC4zMjc1IDMwLjQ2OTYgMTYuMTA5MyAzMS40MjE4IDE4LjA0OTEgMzEuODA3OEMxOS45ODg5IDMyLjE5MzcgMjEuOTk5OCAzMS45OTU3IDIzLjgyNyAzMS4yMzg4QzI1LjY1NDEgMzAuNDgxOSAyNy4yMTU5IDI5LjIwMDIgMjguMzE0NyAyNy41NTU3QzI5LjQxMzUgMjUuOTExMiAzMCAyMy45Nzc4IDMwIDIwQzMwIDE1LjAyMTggMjUuNTIyOCAxMiAyMCAxMlpNMjAgMjhDMTcuMjE1MiAyOCAxNSAyNS43ODQ4IDE1IDIzQzE1IDIwLjIxNTIgMTcuMjE1MiAxOCAyMCAxOEMyMi43ODQ4IDE4IDI1IDIwLjIxNTIgMjUgMjNDMjUgMjUuNzg0OCAyMi43ODQ4IDI4IDIwIDI4WiIgZmlsbD0iIzlDQTNCNCIvPgo8L3N2Zz4='
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-400">
                <p className="mb-2">💡 Tips for finding logo URLs:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Search "[team name] logo PNG" in Google Images</li>
                  <li>Right-click the image → "Copy image address"</li>
                  <li>Use ESPN, SportsLogos.net, or official team websites</li>
                  <li>Make sure the URL ends with .png, .jpg, .svg, or .webp</li>
                </ul>
              </div>
            </div>
          )}
        </div>
          </motion.div>
        </div>
      </Portal>
    </>
  )
}

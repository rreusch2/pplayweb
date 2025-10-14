'use client'

import { useState } from 'react'
import { X, Search, Upload, Link as LinkIcon, Check } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  type: 'league' | 'sportsbook'
  onSelect: (url: string, type: 'league' | 'sportsbook') => void
  onClose: () => void
}

// Pre-defined logos for easy selection
const LEAGUE_LOGOS = {
  MLB: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Major_League_Baseball_logo.svg',
  NFL: 'https://upload.wikimedia.org/wikipedia/en/a/a2/National_Football_League_logo.svg',
  NBA: 'https://cdn.nba.com/logos/leagues/logo-nba.svg',
  NHL: 'https://cms.nhl.bamgrid.com/images/assets/binary/301172288/binary-file/file.svg',
  WNBA: 'https://upload.wikimedia.org/wikipedia/en/3/3f/WNBA_logo.svg',
  UFC: 'https://upload.wikimedia.org/wikipedia/commons/9/92/UFC_Logo.svg',
  CFB: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/NCAA_logo.svg',
  CBB: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/NCAA_logo.svg',
}

const SPORTSBOOK_LOGOS = {
  DraftKings: 'https://sportsbook.draftkings.com/static/favicon/favicon.png',
  FanDuel: 'https://www.fanduel.com/favicon.ico',
  BetMGM: 'https://sports.mi.betmgm.com/favicon.ico',
  Caesars: 'https://www.williamhill.com/us/favicon.ico',
  PointsBet: 'https://pointsbet.com/favicon.ico',
  Barstool: 'https://www.barstoolsportsbook.com/favicon.ico',
}

// MLB Teams
const MLB_TEAM_LOGOS = {
  'Arizona Diamondbacks': 'https://content.sportslogos.net/logos/54/50/full/arizona_diamondbacks_logo_primary_2020_sportslogosnet-9728.png',
  'Atlanta Braves': 'https://content.sportslogos.net/logos/54/51/full/atlanta_braves_logo_primary_2018_sportslogosnet-1068.png',
  'Baltimore Orioles': 'https://content.sportslogos.net/logos/53/52/full/baltimore_orioles_logo_primary_2019_sportslogosnet-3269.png',
  'Boston Red Sox': 'https://content.sportslogos.net/logos/53/53/full/boston_red_sox_logo_primary_20249009.png',
  'Chicago Cubs': 'https://content.sportslogos.net/logos/54/54/full/chicago_cubs_logo_primary_19794077.png',
  'Chicago White Sox': 'https://content.sportslogos.net/logos/53/55/full/chicago_white_sox_logo_primary_19914833.png',
  'Cincinnati Reds': 'https://content.sportslogos.net/logos/54/56/full/cincinnati_reds_logo_primary_20138794.png',
  'Cleveland Guardians': 'https://content.sportslogos.net/logos/53/6564/full/cleveland_guardians_logo_primary_20227831.png',
  'Colorado Rockies': 'https://content.sportslogos.net/logos/54/58/full/colorado_rockies_logo_primary_20178222.png',
  'Detroit Tigers': 'https://content.sportslogos.net/logos/53/59/full/detroit_tigers_logo_primary_20166691.png',
  'Houston Astros': 'https://content.sportslogos.net/logos/53/4929/full/houston_astros_logo_primary_20138052.png',
  'Kansas City Royals': 'https://content.sportslogos.net/logos/53/62/full/kansas_city_royals_logo_primary_20197339.png',
  'Los Angeles Angels': 'https://content.sportslogos.net/logos/53/6521/full/los_angeles_angels_logo_primary_20234809.png',
  'Los Angeles Dodgers': 'https://content.sportslogos.net/logos/54/63/full/los_angeles_dodgers_logo_primary_20128119.png',
  'Miami Marlins': 'https://content.sportslogos.net/logos/54/3637/full/miami_marlins_logo_primary_20197937.png',
  'Milwaukee Brewers': 'https://content.sportslogos.net/logos/54/64/full/milwaukee_brewers_logo_primary_20208027.png',
  'Minnesota Twins': 'https://content.sportslogos.net/logos/53/65/full/minnesota_twins_logo_primary_20233082.png',
  'New York Mets': 'https://content.sportslogos.net/logos/54/67/full/new_york_mets_logo_primary_20243184.png',
  'New York Yankees': 'https://content.sportslogos.net/logos/53/68/full/new_york_yankees_logo_primary_20239734.png',
  'Oakland Athletics': 'https://content.sportslogos.net/logos/53/69/full/oakland_athletics_logo_primary_20199310.png',
  'Philadelphia Phillies': 'https://content.sportslogos.net/logos/54/70/full/philadelphia_phillies_logo_primary_20196146.png',
  'Pittsburgh Pirates': 'https://content.sportslogos.net/logos/54/71/full/pittsburgh_pirates_logo_primary_20141126.png',
  'San Diego Padres': 'https://content.sportslogos.net/logos/54/73/full/san_diego_padres_logo_primary_20208958.png',
  'San Francisco Giants': 'https://content.sportslogos.net/logos/54/74/full/san_francisco_giants_logo_primary_20011686.png',
  'Seattle Mariners': 'https://content.sportslogos.net/logos/53/75/full/seattle_mariners_logo_primary_19933809.png',
  'St. Louis Cardinals': 'https://content.sportslogos.net/logos/54/72/full/st_louis_cardinals_logo_primary_19989789.png',
  'Tampa Bay Rays': 'https://content.sportslogos.net/logos/53/2535/full/tampa_bay_rays_logo_primary_20196969.png',
  'Texas Rangers': 'https://content.sportslogos.net/logos/53/77/full/texas_rangers_logo_primary_20207889.png',
  'Toronto Blue Jays': 'https://content.sportslogos.net/logos/53/78/full/toronto_blue_jays_logo_primary_20208387.png',
  'Washington Nationals': 'https://content.sportslogos.net/logos/54/578/full/washington_nationals_logo_primary_20118742.png',
}

// NFL Teams (sample - add all 32)
const NFL_TEAM_LOGOS = {
  'Buffalo Bills': 'https://content.sportslogos.net/logos/7/149/full/buffalo_bills_logo_primary_19706226.png',
  'Miami Dolphins': 'https://content.sportslogos.net/logos/7/150/full/miami_dolphins_logo_primary_20184765.png',
  'New England Patriots': 'https://content.sportslogos.net/logos/7/151/full/new_england_patriots_logo_primary_20006403.png',
  'New York Jets': 'https://content.sportslogos.net/logos/7/152/full/new_york_jets_logo_primary_20243639.png',
  // Add more teams...
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
      return { ...MLB_TEAM_LOGOS, ...NFL_TEAM_LOGOS }
    }
    return {}
  }

  const filteredLogos = Object.entries(getLogos()).filter(([name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  ) as [string, string][]

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-3xl md:w-full md:max-h-[80vh] bg-gray-900 rounded-lg border border-gray-800 overflow-hidden z-[60]"
      >
        {/* Header */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
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
          <div className="border-b border-gray-800 px-6">
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
        <div className="p-6">
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
    </>
  )
}

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield } from 'lucide-react';
import { cn } from '../lib/utils';
import type { Team } from '../types';

// ============================================================================
// BACKGROUND CONFIGURATION
// To use a custom background image, paste the URL below (e.g. "/bg.jpg").
// If empty, the animated wavy CSS background will be used.
// ============================================================================
const BACKGROUND_IMAGE_URL = "/assets/bg.webp"; 

export default function Rankings() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [phase, setPhase] = useState('FINALS');
  const [matchNumber, setMatchNumber] = useState('MATCH 5');

  useEffect(() => {
    let isMounted = true;
    const fetchTeamsAndConfig = async () => {
      try {
        const [boardRes, configRes] = await Promise.all([
          fetch('/api/leaderboard'),
          fetch('/api/config')
        ]);
        
        if (isMounted && boardRes.ok && configRes.ok) {
          const boardData = await boardRes.json();
          const configData = await configRes.json();
          
          const fetchedTeams: Team[] = Array.isArray(boardData) ? boardData : boardData.teams || [];
          setTeams(fetchedTeams);
          
          if (configData.rankingsPhase) setPhase(configData.rankingsPhase);
          if (configData.rankingsMatch) setMatchNumber(configData.rankingsMatch);
        }
      } catch (err) {
        console.error('Failed to fetch', err);
      }
    };

    fetchTeamsAndConfig();
    const interval = setInterval(fetchTeamsAndConfig, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Sort by Total Points (points + elims), then by Elims, then by Placement
  const sortedTeams = [...teams].sort((a, b) => {
    const totalA = a.points + a.elims;
    const totalB = b.points + b.elims;
    if (totalA !== totalB) return totalB - totalA;
    if (b.elims !== a.elims) return b.elims - a.elims;
    return b.points - a.points;
  });

  // Ensure we have exactly 16 teams for the 2 columns (or pad with empty)
  const displayTeams = [...sortedTeams];
  while (displayTeams.length < 16) {
    displayTeams.push({
      id: `empty-${displayTeams.length}`,
      name: 'TBD',
      points: 0,
      elims: 0,
      players: [false, false, false, false]
    });
  }

  const leftColumn = displayTeams.slice(0, 8);
  const rightColumn = displayTeams.slice(8, 16);

  const renderHeader = () => (
    <div className="flex items-center text-xs lg:text-sm xl:text-base font-black text-white uppercase mb-1 px-1 xl:px-2 border-b-4 border-neutral-900 pb-1 xl:pb-2 bg-black/60 backdrop-blur-sm pt-2 xl:pt-4 shadow-xl">
      <div className="w-8 xl:w-12 text-center">#</div>
      <div className="w-8 xl:w-12 ml-1 xl:ml-2 mr-2 xl:mr-4"></div>
      <div className="flex-1 text-left pl-1 xl:pl-2">Team</div>
      <div className="flex items-center w-[220px] lg:w-[260px] xl:w-[320px] justify-between text-center pr-2 xl:pr-4">
        <div className="w-16 lg:w-20 xl:w-24 leading-[1.1] tracking-wider">Placement<br/>Points</div>
        <div className="w-16 lg:w-20 xl:w-24 leading-[1.1] tracking-wider">Elim.<br/>Points</div>
        <div className="w-16 lg:w-20 xl:w-24 tracking-wider">Total</div>
      </div>
    </div>
  );

  const renderRow = (team: Team, index: number) => {
    // If it's a TBD team, render dim
    const isTBD = team.name === 'TBD';
    const total = team.points + team.elims;

    return (
      <motion.div
        key={team.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className={cn(
          "relative flex items-center h-[40px] lg:h-[46px] xl:h-[54px] bg-[#141414] border-l-[4px] xl:border-l-[6px] pr-2 xl:pr-4 w-full overflow-hidden text-white mb-1 shadow-lg",
          index === 0 ? "border-amber-400" : 
          index < 8 ? "border-white" : "border-neutral-600",
          isTBD && "opacity-50"
        )}
      >
        <div className="w-8 xl:w-12 text-center font-black text-lg lg:text-xl xl:text-2xl">
          {index + 1}
        </div>
        
        <div className={cn(
          "w-8 xl:w-12 h-full flex items-center justify-center text-black -skew-x-[15deg] ml-1 xl:ml-2 mr-2 xl:mr-4 shadow-sm z-10",
          isTBD ? "bg-neutral-600" : "bg-white"
        )}>
          <div className="skew-x-[15deg] flex items-center justify-center">
            <Shield className="w-4 h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
          </div>
        </div>
        
        <div className="flex-1 font-black text-lg lg:text-xl xl:text-2xl uppercase tracking-wider truncate">
          {team.name}
        </div>
        
        <div className="flex items-center text-lg lg:text-xl xl:text-2xl font-black w-[220px] lg:w-[260px] xl:w-[320px] justify-between z-10 pr-2 xl:pr-4">
          <div className="w-16 lg:w-20 xl:w-24 text-center">{isTBD ? '-' : team.points}</div>
          <div className="text-neutral-500 font-light text-base lg:text-lg xl:text-xl">/</div>
          <div className="w-16 lg:w-20 xl:w-24 text-center">{isTBD ? '-' : team.elims}</div>
          <div className="text-neutral-500 font-light text-base lg:text-lg xl:text-xl">/</div>
          <div className="w-16 lg:w-20 xl:w-24 text-center text-amber-400">{isTBD ? '-' : total}</div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center p-4 lg:p-8 xl:p-12 font-sans bg-black">
      
      {/* Background Configuration */}
      {BACKGROUND_IMAGE_URL ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
          style={{ backgroundImage: `url('${BACKGROUND_IMAGE_URL}')` }}
        />
      ) : (
        <div className="absolute inset-0 overflow-hidden bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 z-0">
          <motion.div 
            animate={{ 
              x: [0, 80, -40, 0],
              y: [0, -80, 40, 0],
              scale: [1, 1.3, 1] 
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[200px] -left-[200px] w-[800px] h-[800px] bg-purple-700 rounded-full mix-blend-multiply filter blur-[120px] opacity-80" 
          />
          <motion.div 
            animate={{ 
              x: [0, -60, 60, 0],
              y: [0, 60, -60, 0],
              scale: [1, 1.4, 1] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[200px] -right-[200px] w-[900px] h-[900px] bg-fuchsia-700 rounded-full mix-blend-multiply filter blur-[150px] opacity-70" 
          />
          <motion.div 
            animate={{ 
              x: [0, 40, -80, 0],
              y: [0, 80, -40, 0],
              scale: [1, 1.2, 1] 
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] right-[10%] w-[600px] h-[600px] bg-rose-600 rounded-full mix-blend-multiply filter blur-[130px] opacity-50" 
          />
          
          {/* Subtle grid overlay */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-[1600px] flex flex-col items-center justify-center">
        
        {/* Header Title */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex flex-col items-center justify-center mb-4 lg:mb-6 xl:mb-10"
        >
          <h1 className="font-anton text-6xl lg:text-7xl xl:text-8xl 2xl:text-[120px] leading-none text-white tracking-wide uppercase" style={{ transform: 'scaleY(1.15)' }}>
            MATCH RANKING
          </h1>
          
          {/* Pills */}
          <div className="flex mt-2 lg:mt-4 xl:mt-6 drop-shadow-2xl">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 lg:px-12 xl:px-16 py-2 xl:py-3 font-black text-white text-base lg:text-lg xl:text-xl tracking-widest uppercase -skew-x-12 z-10">
              <span className="skew-x-12 block">{phase}</span>
            </div>
            <div className="bg-[#1a1a1a] px-8 lg:px-12 xl:px-16 py-2 xl:py-3 font-black text-white text-base lg:text-lg xl:text-xl tracking-widest uppercase -skew-x-12 -ml-4 xl:-ml-6 border-l-4 border-neutral-800">
              <span className="skew-x-12 block pl-2 xl:pl-4">{matchNumber}</span>
            </div>
          </div>
        </motion.div>

        {/* 2-Column Table */}
        <div className="w-full flex flex-row gap-4 xl:gap-6 mt-2 xl:mt-4">
          
          {/* Left Column (1-8) */}
          <div className="flex-1 flex flex-col min-w-0">
            {renderHeader()}
            <div className="flex flex-col mt-1">
              {leftColumn.map((team, index) => renderRow(team, index))}
            </div>
          </div>

          {/* Right Column (9-16) */}
          <div className="flex-1 flex flex-col min-w-0">
            {renderHeader()}
            <div className="flex flex-col mt-1">
              {rightColumn.map((team, index) => renderRow(team, index + 8))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

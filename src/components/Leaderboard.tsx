import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@/src/lib/utils';
import type { Team } from '@/src/types';
import { Shield } from 'lucide-react';

function TeamRow({ team, index, shiftX }: { team: Team; index: number; shiftX: number; key?: string | number }) {
  const isEliminated = team.players.length > 0 && team.players.every(p => !p);
  const [showSweep, setShowSweep] = useState(false);
  const [isDimmed, setIsDimmed] = useState(isEliminated);
  const prevElimRef = useRef(isEliminated);

  useEffect(() => {
    const prev = prevElimRef.current;
    if (isEliminated && !prev) {
      // Team just got eliminated
      setShowSweep(true);
      setIsDimmed(false); // Keep bright while sweeping
      
      const timer = setTimeout(() => {
        setShowSweep(false);
        setIsDimmed(true); // Dim the row after sweep leaves
      }, 1500); // 1.5 seconds total (0.5s slide in + 1s hold)
      
      return () => clearTimeout(timer);
    } else if (!isEliminated) {
      // Team got revived
      setShowSweep(false);
      setIsDimmed(false);
    }
    prevElimRef.current = isEliminated;
  }, [isEliminated]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isDimmed ? 0.35 : 1, 
        y: 0,
        x: shiftX
      }}
      transition={{ 
        x: { delay: (shiftX > 0 ? 0 : 1.5) + index * 0.05 + 0.05, type: "spring", stiffness: 200, damping: 25 },
        layout: { type: "spring", stiffness: 300, damping: 25 },
        opacity: { duration: 0.5 },
        y: { type: "spring", stiffness: 300, damping: 25 }
      }}
      className={cn(
        "relative flex items-center h-12 bg-[#141414] border-l-4 pr-2 w-full max-w-[440px] overflow-hidden",
        index < 3 ? "border-white" : "border-neutral-700"
      )}
      style={{
        boxShadow: index < 3 ? 'inset 0 0 20px rgba(255,255,255,0.02)' : 'none'
      }}
    >
      {/* Rank */}
      <div className="w-8 text-center font-extrabold text-lg">
        {index + 1}
      </div>
      
      {/* Logo Box (Slanted) */}
      <div className="w-10 h-full flex items-center justify-center bg-white text-black -skew-x-12 ml-2 mr-3">
        <div className="skew-x-12 flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
      </div>
      
      {/* Team Name */}
      <div className="flex-1 font-extrabold text-xl uppercase tracking-wider truncate pr-2">
        {team.name}
      </div>
      
      {/* Alive Status */}
      <div className="w-16 flex items-center justify-center gap-1 z-0">
        {team.players.map((isAlive, i) => (
          <div 
            key={i} 
            className={cn(
              "w-2 h-5 -skew-x-[20deg] transition-colors duration-300",
              isAlive ? "bg-[#00ffd5]" : "bg-neutral-700"
            )} 
          />
        ))}
      </div>

      {/* PTS (Total) */}
      <div className="w-12 text-center font-extrabold text-xl z-0">
        {team.points + team.elims}
      </div>
      
      {/* ELIMS */}
      <div className="w-12 text-center font-extrabold text-white z-0">
        {team.elims}
      </div>

      {/* ELIMINATED Overlay (Covers the whole row) */}
      <AnimatePresence>
        {showSweep && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }} // Slides out to the right
            transition={{ type: "spring", stiffness: 200, damping: 25 }}
            className="absolute inset-0 bg-white backdrop-blur-md flex items-center justify-center z-10"
          >
            <span className="font-extrabold text-black tracking-[0.5em] uppercase text-sm">
              Eliminated
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Leaderboard() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [shiftRight, setShiftRight] = useState(false);
  const [showEndgame, setShowEndgame] = useState(false);

  useEffect(() => {
    // Initial fetch
    fetch('/api/leaderboard')
      .then(async res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => setTeams(data))
      .catch(console.error);

    fetch('/api/config')
      .then(async res => {
        if (!res.ok) throw new Error('API Error');
        return res.json();
      })
      .then(data => {
        setShiftRight(data.shiftRight);
        setShowEndgame(data.showEndgame);
      })
      .catch(console.error);

    // SSE for updates
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      try {
        const updatedTeams = JSON.parse(event.data);
        setTeams(updatedTeams);
      } catch (e) {
        console.error('Failed to parse event data', e);
      }
    };

    eventSource.addEventListener('config', (event) => {
      try {
        const config = JSON.parse(event.data);
        setShiftRight(config.shiftRight);
        setShowEndgame(config.showEndgame);
      } catch (e) {
        console.error('Failed to parse config event data', e);
      }
    });

    return () => {
      eventSource.close();
    };
  }, []);

  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1920);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sort teams by points (descending), then elims (descending)
  const sortedTeams = [...teams].sort((a, b) => {
    const totalA = a.points + a.elims;
    const totalB = b.points + b.elims;
    if (totalA !== totalB) return totalB - totalA;
    if (b.elims !== a.elims) return b.elims - a.elims;
    return b.points - a.points;
  });

  // Endgame specific logic
  const aliveTeamsList = sortedTeams.filter(t => t.players.some(p => p));
  const isTop4Active = aliveTeamsList.length <= 4 && aliveTeamsList.length > 1; // Hidden if 1 or 0 teams
  const isTableShiftedRight = aliveTeamsList.length <= 4 && aliveTeamsList.length > 0;
  
  const shiftX = (shiftRight || isTableShiftedRight) ? windowWidth - 440 - 32 : 0; // 32px for padding (2rem)

  const top4Teams = aliveTeamsList.slice(0, 4);
  const totalWWCDScore = top4Teams.reduce((sum, t) => sum + (t.players.filter(p => p).length * 50 + t.points), 0);

  return (
    <div className="flex items-start justify-start min-h-screen bg-transparent overflow-hidden font-sans w-full p-4 text-white">
      <div className="relative w-full h-full flex flex-col">
        {/* Header */}
        <motion.div 
          animate={{ x: shiftX }}
          transition={{ x: { delay: shiftX > 0 ? 0 : 1.5, type: "spring", stiffness: 200, damping: 25 } }}
          className="flex items-center text-xs font-extrabold text-neutral-400 tracking-widest uppercase mb-1 py-2 pr-2 w-full max-w-[440px] bg-[#141414] rounded-sm shadow-md border-l-[3px] border-transparent"
        >
          <div className="w-8 text-center">#</div>
          <div className="w-10 ml-2 mr-3"></div>
          <div className="flex-1">Team</div>
          <div className="w-16 text-center">Alive</div>
          <div className="w-12 text-center">Total</div>
          <div className="w-12 text-center">Elims</div>
        </motion.div>

        {/* Main List */}
        <div className="flex-1 flex flex-col gap-1 relative w-full">
          <AnimatePresence>
            {sortedTeams.map((team, index) => (
              <TeamRow 
                key={team.id} 
                team={team} 
                index={index} 
                shiftX={shiftX} 
              />
            ))}
          </AnimatePresence>
        </div>

        {/* Endgame Top 4 Overlay */}
        <AnimatePresence>
          {isTop4Active && (
            <motion.div
              initial={{ opacity: 0, x: windowWidth }}
              animate={{ 
                opacity: 1, 
                x: 0,
                transition: { delay: 1.5, type: "spring", stiffness: 200, damping: 25 }
              }}
              exit={{ 
                opacity: 0, 
                x: windowWidth,
                transition: { delay: 1.0, type: "spring", stiffness: 200, damping: 25 }
              }}
              className="fixed left-8 top-1/2 -translate-y-1/2 flex flex-col gap-6 w-[340px] z-50"
            >
              {top4Teams.map((team) => {
                const rank = sortedTeams.findIndex(t => t.id === team.id) + 1;
                const score = team.players.filter(p => p).length * 50 + team.points;
                const chance = totalWWCDScore > 0 ? ((score / totalWWCDScore) * 100).toFixed(1) : "0.0";
                
                return (
                  <motion.div layout key={team.id} className="flex flex-col shadow-2xl">
                    <div className="flex h-12 bg-[#1a1a1a] relative overflow-hidden">
                      {/* Rank */}
                      <div className="w-12 flex items-center justify-center text-white text-xl shrink-0 z-10">
                        {rank}
                      </div>
                      
                      {/* Middle white section with slanted borders */}
                      <div className="flex-1 relative shrink-0">
                        <div className="absolute inset-0 bg-white -skew-x-[20deg] -ml-2 -mr-2 shadow-[0_0_0_2px_#1a1a1a] z-0" />
                        <div className="relative h-full flex items-center px-4 gap-3 z-10">
                          <Shield className="w-6 h-6 text-black" />
                          <span className="text-xl text-black uppercase tracking-wider truncate">{team.name}</span>
                        </div>
                      </div>
                      
                      {/* Alive Status */}
                      <div className="w-24 flex items-center justify-center gap-1 z-10 shrink-0">
                        {team.players.map((isAlive, i) => (
                          <div 
                            key={i} 
                            className={cn(
                              "w-2.5 h-6 -skew-x-[20deg] transition-colors duration-300", 
                              isAlive ? "bg-[#00ffd5]" : "bg-neutral-600"
                            )} 
                          />
                        ))}
                      </div>
                    </div>
                    {/* WWCD CHANCE */}
                    <div className="h-7 bg-gradient-to-r from-[#ff6b00] via-[#ff6b00] to-[#3b82f6] flex items-center justify-center relative shadow-[inset_0_2px_4px_rgba(255,255,255,0.2)]">
                      <span className="italic text-white tracking-widest text-sm drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] relative z-10 uppercase">
                        WWCD CHANCE: {chance}%
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

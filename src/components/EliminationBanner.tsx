import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Team } from '../types';
import { Shield } from 'lucide-react';

export default function EliminationBanner() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [eliminationQueue, setEliminationQueue] = useState<Team[]>([]);
  const [currentEliminated, setCurrentEliminated] = useState<Team | null>(null);
  
  const prevTeamsRef = useRef<Team[]>([]);

  useEffect(() => {
    let isMounted = true;
    
    // Initial fetch to seed prevTeamsRef
    const fetchInitial = async () => {
      try {
        const res = await fetch('/api/leaderboard');
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted) {
          const initialTeams: Team[] = Array.isArray(data) ? data : data.teams || [];
          prevTeamsRef.current = initialTeams;
          setTeams(initialTeams);
        }
      } catch (err) {
        console.error('Failed to fetch initial teams', err);
      }
    };
    
    fetchInitial();

    // Listen to real-time events
    const eventSource = new EventSource('/api/events');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const newTeams: Team[] = Array.isArray(data) ? data : data.teams;
        
        if (newTeams) {
          if (prevTeamsRef.current.length > 0) {
            const newlyEliminated = newTeams.filter(newTeam => {
              const oldTeam = prevTeamsRef.current.find(t => t.id === newTeam.id);
              if (!oldTeam) return false;
              
              const wasAlive = oldTeam.players.some(p => p);
              const isDead = !newTeam.players.some(p => p);
              
              return wasAlive && isDead;
            });
            
            if (newlyEliminated.length > 0) {
              setEliminationQueue(prev => [...prev, ...newlyEliminated]);
            }
          }
          
          prevTeamsRef.current = newTeams;
          setTeams(newTeams);
        }
      } catch (e) {
        console.error("Failed to parse event", e);
      }
    };

    eventSource.addEventListener('testElimination', () => {
      setEliminationQueue(prev => [...prev, {
        id: `test-team-${Date.now()}`,
        name: 'TEST ESPORTS',
        points: 0,
        elims: 12,
        players: [false, false, false, false]
      }]);
    });
    
    return () => {
      isMounted = false;
      eventSource.close();
    };
  }, []);

  // Process the queue to show the next eliminated team
  useEffect(() => {
    if (currentEliminated === null && eliminationQueue.length > 0) {
      const nextTeam = eliminationQueue[0];
      setCurrentEliminated(nextTeam);
      setEliminationQueue(prev => prev.slice(1));
    }
  }, [currentEliminated, eliminationQueue]);

  // Handle the display timer for the currently showing team
  useEffect(() => {
    if (currentEliminated !== null) {
      const timer = setTimeout(() => {
        setCurrentEliminated(null);
      }, 5000); // Show for 5 seconds
      return () => clearTimeout(timer);
    }
  }, [currentEliminated]);

  return (
    <div className="min-h-screen w-full overflow-hidden pointer-events-none flex items-center justify-start p-12 pl-12 sm:pl-20 md:pl-32 lg:pl-40">
      <AnimatePresence mode="wait">
        {currentEliminated && (
          <motion.div
            key={currentEliminated.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="relative flex pointer-events-auto"
          >
            {/* The wrapper that applies the skew to the whole banner group */}
            <div className="relative flex -skew-x-[15deg] w-full max-w-[90vw] lg:max-w-[1200px]">
              
              {/* Main White Block */}
              <div className="relative w-full bg-white py-4 md:py-6 border-l-[6px] border-neutral-900 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center pl-8 pr-16 md:pl-12 md:pr-24">
                
                {/* Decorative slash on the right side */}
                <div className="absolute top-0 right-[-15px] md:right-[-30px] h-full w-12 md:w-24 bg-neutral-200 shadow-xl" style={{ clipPath: 'polygon(20% 0, 100% 0, 80% 100%, 0% 100%)' }}></div>
                
                {/* Unskewed content wrapper */}
                <div className="skew-x-[15deg] flex flex-col items-center w-full gap-2 md:gap-4">
                  
                  {/* Text: TEAM ELIMINATED (Unstacked) */}
                  <div className="flex items-center font-black tracking-wider drop-shadow-sm shrink-0 w-full pl-2 md:pl-4">
                    <span className="text-4xl md:text-5xl xl:text-6xl text-black">TEAM ELIMINATED</span>
                  </div>

                  {/* Team Name Black Box Container */}
                  <div className="relative flex w-[105%] md:w-[110%] -ml-[2.5%] md:-ml-[5%]">
                    {/* The black background */}
                    <div className="absolute inset-0 bg-[#111111] border-b-4 border-neutral-800 -skew-x-[15deg] shadow-lg"></div>
                    
                    {/* Unskewed inner content for the black box */}
                    <div className="relative w-full py-2 md:py-3 px-4 md:px-8 flex flex-row items-center justify-between z-10">
                      <span className="text-white text-xl md:text-3xl font-black uppercase tracking-widest truncate max-w-[50%] xl:max-w-none">
                        {currentEliminated.name}
                      </span>
                      <div className="flex items-center gap-2 md:gap-3 shrink-0">
                        <span className="text-neutral-500 font-light text-lg md:text-2xl hidden sm:inline">/</span>
                        <Shield className="w-6 h-6 md:w-8 md:h-8 text-neutral-400" />
                        <span className="text-white text-lg md:text-2xl font-bold ml-1 md:ml-2 whitespace-nowrap">
                          {currentEliminated.elims} ELIMS
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

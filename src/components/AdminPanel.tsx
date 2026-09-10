import { useEffect, useState } from 'react';
import type { Team } from '@/src/types';

export default function AdminPanel() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [shiftRight, setShiftRight] = useState(false);
  const [matchDay, setMatchDay] = useState(1);
  const [matchNumber, setMatchNumber] = useState(1);
  const [history, setHistory] = useState<any[]>([]);
  const [viewingMatchContent, setViewingMatchContent] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'rankings'>('live');
  const [rankingsPhase, setRankingsPhase] = useState('FINALS');
  const [rankingsMatch, setRankingsMatch] = useState('MATCH 5');

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error('Failed to fetch history', err);
    }
  };

  useEffect(() => {
    fetchHistory();

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
        if (data.rankingsPhase) setRankingsPhase(data.rankingsPhase);
        if (data.rankingsMatch) setRankingsMatch(data.rankingsMatch);
      })
      .catch(console.error);
  }, []);

  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const saveTeams = async (teamsToSave: Team[]) => {
    try {
      await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teamsToSave),
      });
    } catch (err) {
      console.error('Failed to save', err);
    }
  };

  const handleReset = async () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
      setTimeout(() => setIsConfirmingReset(false), 3000);
      return;
    }
    
    const resetTeams = teams.map(team => ({
      ...team,
      points: 0,
      elims: 0,
      players: [true, true, true, true]
    }));
    
    // Optimistic update
    setTeams(resetTeams);
    setIsConfirmingReset(false);
    
    // Also reset shift state
    setShiftRight(false);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftRight: false })
      });
    } catch (err) {
      console.error('Failed to reset config', err);
    }

    // Save to backend immediately
    await saveTeams(resetTeams);
  };

  const toggleShift = async () => {
    const newShift = !shiftRight;
    setShiftRight(newShift);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftRight: newShift })
      });
    } catch (err) {
      console.error('Failed to update config', err);
      setShiftRight(!newShift); // revert
    }
  };

  const updateRankingsConfig = async (phase: string, match: string) => {
    setRankingsPhase(phase);
    setRankingsMatch(match);
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rankingsPhase: phase, rankingsMatch: match })
      });
    } catch (err) {
      console.error('Failed to update rankings config', err);
    }
  };

  const updateTeam = (index: number, updates: Partial<Team>) => {
    const newTeams = [...teams];
    const oldTeam = newTeams[index];
    
    newTeams[index] = { ...oldTeam, ...updates };
    setTeams(newTeams);
    saveTeams(newTeams);
  };

  const togglePlayer = (teamIndex: number, playerIndex: number) => {
    const newTeams = [...teams];
    const newPlayers = [...newTeams[teamIndex].players];
    newPlayers[playerIndex] = !newPlayers[playerIndex];
    newTeams[teamIndex] = { ...newTeams[teamIndex], players: newPlayers };
    setTeams(newTeams);
    saveTeams(newTeams);
  };

  const downloadData = async () => {
    const dataToSave = {
      matchDay,
      matchNumber,
      timestamp: Date.now(),
      teams
    };

    // Save to server history
    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchDay, matchNumber, teams })
      });
      fetchHistory(); // Refresh history list
    } catch (err) {
      console.error('Failed to save history to server', err);
    }

    // Client-side download
    const dataStr = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([dataStr], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match-day-${matchDay}-num-${matchNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const viewMatch = async (filename: string) => {
    try {
      const res = await fetch(`/api/history/${filename}`);
      if (res.ok) {
        const text = await res.text();
        setViewingMatchContent(text);
      }
    } catch (err) {
      console.error('Failed to load match content', err);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 text-white p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <div className="flex items-center gap-3 bg-neutral-800 p-2 rounded border border-neutral-700 w-fit">
              <div className="flex items-center gap-2">
                <label className="text-neutral-400 font-semibold text-sm">DAY</label>
                <input 
                  type="number" 
                  value={matchDay}
                  onChange={e => setMatchDay(parseInt(e.target.value) || 1)}
                  className="w-16 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-center font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="w-px h-6 bg-neutral-700"></div>
              <div className="flex items-center gap-2">
                <label className="text-neutral-400 font-semibold text-sm">MATCH</label>
                <input 
                  type="number" 
                  value={matchNumber}
                  onChange={e => setMatchNumber(parseInt(e.target.value) || 1)}
                  className="w-16 bg-neutral-900 border border-neutral-600 rounded px-2 py-1 text-center font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={downloadData}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded font-bold transition-colors"
            >
              DOWNLOAD DATA
            </button>
            <button
              onClick={toggleShift}
              className={`px-4 py-2 rounded font-bold transition-colors ${
                shiftRight ? 'bg-blue-600 hover:bg-blue-500' : 'bg-neutral-600 hover:bg-neutral-500'
              }`}
            >
              {shiftRight ? 'Shift Leaderboard Left' : 'Shift Leaderboard Right'}
            </button>
            <a href="/" target="_blank" className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded font-bold transition-colors">
              Open Leaderboard
            </a>
            <a href="/rankings" target="_blank" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-white font-bold transition-colors">
              Open Rankings
            </a>
            <a href="/elimination" target="_blank" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-black font-bold transition-colors">
              Open Elimination
            </a>
            <button 
              onClick={async () => {
                try {
                  await fetch('/api/test-elimination', { method: 'POST' });
                } catch (e) {
                  console.error(e);
                }
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded text-white font-bold transition-colors"
            >
              Test Banner
            </button>
            <button 
              onClick={handleReset}
              className={`px-6 py-2 rounded font-bold transition-colors ${
                isConfirmingReset ? 'bg-red-800 animate-pulse text-white' : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {isConfirmingReset ? 'Click again to confirm' : 'Reset All'}
            </button>
          </div>
        </div>

        <div className="flex gap-4 mb-4 border-b border-neutral-700">
          <button 
            className={`px-4 py-2 font-bold transition-colors border-b-2 ${activeTab === 'live' ? 'text-emerald-400 border-emerald-400' : 'text-neutral-500 border-transparent hover:text-white'}`}
            onClick={() => setActiveTab('live')}
          >
            Live Match Editor
          </button>
          <button 
            className={`px-4 py-2 font-bold transition-colors border-b-2 ${activeTab === 'rankings' ? 'text-emerald-400 border-emerald-400' : 'text-neutral-500 border-transparent hover:text-white'}`}
            onClick={() => setActiveTab('rankings')}
          >
            Overall Rankings Editor
          </button>
        </div>

        <div className="bg-neutral-800 rounded-lg overflow-hidden shadow-xl border border-neutral-700">
          {activeTab === 'live' && (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-700">
                  <th className="p-4 font-semibold text-neutral-400">ID</th>
                  <th className="p-4 font-semibold text-neutral-400">Team</th>
                  <th className="p-4 font-semibold text-neutral-400">Placement Pts</th>
                  <th className="p-4 font-semibold text-neutral-400">Elims</th>
                  <th className="p-4 font-semibold text-neutral-400 text-center">Total (Live)</th>
                  <th className="p-4 font-semibold text-neutral-400">Players Alive</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.id} className="border-b border-neutral-700 hover:bg-neutral-800">
                    <td className="p-4 text-neutral-400">{team.id}</td>
                    <td className="p-4">
                      <input 
                        type="text" 
                        value={team.name}
                        onChange={(e) => updateTeam(index, { name: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-1 font-bold focus:outline-none focus:border-emerald-500 uppercase"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={team.points}
                        onChange={(e) => updateTeam(index, { points: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-neutral-900 border border-neutral-600 rounded px-3 py-1 focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        value={team.elims}
                        onChange={(e) => updateTeam(index, { elims: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-neutral-900 border border-neutral-600 rounded px-3 py-1 focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-amber-500">{team.points + team.elims}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {team.players.map((isAlive, i) => (
                          <button
                            key={i}
                            onClick={() => togglePlayer(index, i)}
                            className={`w-10 h-10 flex items-center justify-center rounded font-bold text-sm transition-colors ${
                              isAlive ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-900/50 text-red-500 hover:bg-red-900/70 border border-red-900'
                            }`}
                          >
                            P{i + 1}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {activeTab === 'rankings' && (
            <div className="flex flex-col">
              {/* Rankings Config Header */}
              <div className="p-4 bg-neutral-900 border-b border-neutral-700 flex gap-6 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-neutral-400 font-semibold text-sm">Phase</label>
                  <input 
                    type="text" 
                    value={rankingsPhase}
                    onChange={e => updateRankingsConfig(e.target.value, rankingsMatch)}
                    className="w-32 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 font-bold focus:outline-none focus:border-emerald-500 uppercase"
                    placeholder="FINALS"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-neutral-400 font-semibold text-sm">Match</label>
                  <input 
                    type="text" 
                    value={rankingsMatch}
                    onChange={e => updateRankingsConfig(rankingsPhase, e.target.value)}
                    className="w-32 bg-neutral-800 border border-neutral-600 rounded px-2 py-1 font-bold focus:outline-none focus:border-emerald-500 uppercase"
                    placeholder="MATCH 5"
                  />
                </div>
              </div>

              <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-900 border-b border-neutral-700">
                  <th className="p-4 font-semibold text-neutral-400">ID</th>
                  <th className="p-4 font-semibold text-neutral-400">Team</th>
                  <th className="p-4 font-semibold text-neutral-400 text-center">Placement Points (Pts)</th>
                  <th className="p-4 font-semibold text-neutral-400 text-center">Elimination Points (Elims)</th>
                  <th className="p-4 font-semibold text-neutral-400 text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => (
                  <tr key={team.id} className="border-b border-neutral-700 hover:bg-neutral-800">
                    <td className="p-4 text-neutral-400">{team.id}</td>
                    <td className="p-4">
                      <input 
                        type="text" 
                        value={team.name}
                        onChange={(e) => updateTeam(index, { name: e.target.value })}
                        className="w-full bg-neutral-900 border border-neutral-600 rounded px-3 py-1 font-bold focus:outline-none focus:border-emerald-500 uppercase"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        value={team.points}
                        onChange={(e) => updateTeam(index, { points: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-neutral-900 border border-neutral-600 rounded px-3 py-1 text-center focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <input 
                        type="number" 
                        value={team.elims}
                        onChange={(e) => updateTeam(index, { elims: parseInt(e.target.value) || 0 })}
                        className="w-20 bg-neutral-900 border border-neutral-600 rounded px-3 py-1 text-center focus:outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-black text-amber-500 text-lg">{team.points + team.elims}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* History Section */}
        <div className="mt-12 mb-16">
          <h2 className="text-2xl font-bold mb-6">Recent Matches</h2>
          {history.length === 0 ? (
            <p className="text-neutral-500 italic">No matches downloaded yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((match, i) => (
                <div key={i} className="bg-neutral-800 p-4 rounded border border-neutral-700 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg text-emerald-400">Day {match.matchDay}</span>
                    <span className="bg-neutral-700 text-neutral-300 text-xs px-2 py-1 rounded font-bold uppercase">
                      Match {match.matchNumber}
                    </span>
                  </div>
                  <div className="text-neutral-400 text-sm mt-2">
                    {new Date(match.timestamp).toLocaleString()}
                  </div>
                  <div className="text-neutral-500 text-xs break-all mt-1">
                    {match.filename}
                  </div>
                  <button 
                    onClick={() => viewMatch(match.filename)}
                    className="mt-3 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm transition-colors text-white font-bold text-center"
                  >
                    VIEW DATA
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal for viewing match content */}
      {viewingMatchContent !== null && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={() => setViewingMatchContent(null)}>
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-neutral-800">
              <h3 className="font-bold text-xl">Match Data</h3>
              <button onClick={() => setViewingMatchContent(null)} className="text-neutral-400 hover:text-white font-bold text-xl px-2">✕</button>
            </div>
            <div className="p-4 overflow-auto bg-neutral-950 font-mono text-xs text-emerald-400">
              <pre>{viewingMatchContent}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

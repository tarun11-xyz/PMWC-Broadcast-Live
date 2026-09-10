/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import Leaderboard from './components/Leaderboard';
import AdminPanel from './components/AdminPanel';
import EliminationBanner from './components/EliminationBanner';
import Rankings from './components/Rankings';

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', onLocationChange);
    return () => window.removeEventListener('popstate', onLocationChange);
  }, []);

  if (currentPath === '/admin') {
    return <AdminPanel />;
  }

  if (currentPath === '/elimination' || currentPath === '/elimination/') {
    return <EliminationBanner />;
  }
  
  if (currentPath === '/rankings' || currentPath === '/rankings/') {
    return <Rankings />;
  }

  return <Leaderboard />;
}

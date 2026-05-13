/**
 * Main App component
 */

import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppRoutes } from './routes/AppRoutes';
import { InstallPrompt } from './components/InstallPrompt';
import { db } from './database/indexedDB';
import { syncService } from './services/syncService';

function App() {
  useEffect(() => {
    // Initialize IndexedDB
    db.init().catch((error) => {
      console.error('Failed to initialize IndexedDB:', error);
    });

    // Initialize sync service
    syncService.init();

    // Cleanup on unmount
    return () => {
      syncService.stop();
    };
  }, []);

  return (
    <Router>
      <AuthProvider>
        <>
          <AppRoutes />
          <InstallPrompt />
        </>
      </AuthProvider>
    </Router>
  );
}

export default App;
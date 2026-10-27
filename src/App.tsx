import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NewAnalysis } from './pages/NewAnalysis';
import { AnalysisResult } from './pages/AnalysisResult';
import { AnalysisHistory } from './pages/AnalysisHistory';
import { CompareAnalysis } from './pages/CompareAnalysis';
import { Watchlist } from './pages/Watchlist';
import { Settings } from './pages/Settings';
import { SurgeRadarPage } from './pages/SurgeRadarPage';

export const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-gray-100 flex flex-col font-sans">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 w-full max-w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/surge-radar" element={<SurgeRadarPage />} />
            <Route path="/new" element={<NewAnalysis />} />
            <Route path="/analyses/:id" element={<AnalysisResult />} />
            <Route path="/history" element={<AnalysisHistory />} />
            <Route path="/compare" element={<CompareAnalysis />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;

import './App.css';
import React, { useState, useEffect } from 'react';
import {
  SignedIn,
  SignedOut,
} from '@clerk/clerk-react';
import ChatWrapper from './components/ChatWrapper';
import Header from './components/Header';
import LandingPage from './pages/LandingPage';

function App() {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <div className="App">
      <Header toggleTheme={toggleTheme} theme={theme} />
      <main>
        <SignedIn>
          <ChatWrapper />
        </SignedIn>
        <SignedOut>
          <LandingPage />
        </SignedOut>
      </main>
    </div>
  );
}

export default App;

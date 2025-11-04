import React from 'react';
import { SignedIn, UserButton, useUser } from '@clerk/clerk-react';
import { Sun, Moon, Users } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const Header = ({ toggleTheme, theme }) => {
  const { setIsUserListVisible } = useChat();
  const { isSignedIn } = useUser();

  return (
    <header className="app-header">
      <div className="logo">
        <img src="/palaver-high-resolution-logo-transparent.svg" alt="Palaver Logo" />
        <h1>Palaver</h1>
      </div>
      <div className="header-controls">
        {isSignedIn && (
          <button onClick={() => setIsUserListVisible(v => !v)} className="users-toggle-btn"><Users size={20} /></button>
        )}
        <button onClick={toggleTheme} className="theme-toggle">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <SignedIn>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </header>
  );
};

export default Header;
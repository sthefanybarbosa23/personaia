import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.tsx';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import Sidebar from './components/Sidebar.tsx';
import { Character, User } from './types.ts';
import { INITIAL_CHARACTERS } from './data.ts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [activeCharId, setActiveCharId] = useState<string | null>(null);

  // Restore session from localStorage if available
  useEffect(() => {
    const savedUser = localStorage.getItem('ai_roleplay_user');
    const savedToken = localStorage.getItem('ai_roleplay_token');
    
    if (savedUser && savedToken) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
        setView('dashboard');
      } catch (e) {
        localStorage.removeItem('ai_roleplay_user');
        localStorage.removeItem('ai_roleplay_token');
      }
    }
  }, []);

  // Fetch characters on load (or whenever user gets authenticated/refreshed)
  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/characters', { headers });
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCharacters(data);
          }
        }
      } catch (err) {
        console.error('Failed to fetch characters:', err);
      }
    };

    fetchCharacters();
  }, [user, token]);

  // Handle successful registration/login
  const handleAuthSuccess = (authUser: User, authToken: string) => {
    setUser(authUser);
    setToken(authToken);
    localStorage.setItem('ai_roleplay_user', JSON.stringify(authUser));
    localStorage.setItem('ai_roleplay_token', authToken);
    setView('dashboard');
  };

  // Logout/Return to Landing
  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('ai_roleplay_user');
    localStorage.removeItem('ai_roleplay_token');
    setView('landing');
  };

  // Select character for conversation
  const handleSelectCharacter = (charId: string) => {
    setActiveCharId(charId);
    setView('dashboard');
  };

  // Landing page trial click handler
  const handleSelectCharacterTrial = (char: Character) => {
    setActiveCharId(char.id);
    setView('dashboard');
  };

  // Create custom character
  const handleCreateCharacter = async (newCharData: Omit<Character, 'id' | 'isCustom' | 'chatsCount' | 'rating'>) => {
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newCharData)
      });

      if (res.ok) {
        const createdChar = await res.json();
        setCharacters(prev => [createdChar, ...prev]);
        setActiveCharId(createdChar.id);
      } else {
        throw new Error('API creation failed');
      }
    } catch (err) {
      console.error(err);
      // Fallback local creation state if backend is sleeping
      const fallbackChar: Character = {
        ...newCharData,
        id: 'char-' + Math.random().toString(36).substr(2, 9),
        isCustom: true,
        chatsCount: 0,
        rating: 5.0
      };
      setCharacters(prev => [fallbackChar, ...prev]);
      setActiveCharId(fallbackChar.id);
    }
  };

  // Edit custom character
  const handleEditCharacter = async (charId: string, updatedData: Partial<Character>) => {
    try {
      const res = await fetch(`/api/characters/${charId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updatedData)
      });

      if (res.ok) {
        const updatedChar = await res.json();
        setCharacters(prev => prev.map(c => c.id === charId ? updatedChar : c));
        if (activeCharId === charId) {
          setActiveCharId(updatedChar.id);
        }
      } else {
        throw new Error('API edit failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete custom character
  const handleDeleteCharacter = async (charId: string) => {
    try {
      const res = await fetch(`/api/characters/${charId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        }
      });

      if (res.ok) {
        setCharacters(prev => prev.filter(c => c.id !== charId));
        if (activeCharId === charId) {
          setActiveCharId(null);
        }
      } else {
        throw new Error('API delete failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#030712] font-sans antialiased text-gray-100">
      {view === 'landing' && (
        <LandingPage
          onStart={() => {
            setAuthMode('register');
            setView('auth');
          }}
          onSelectCharacter={handleSelectCharacterTrial}
          onLoginClick={() => {
            setAuthMode('login');
            setView('auth');
          }}
        />
      )}

      {view === 'auth' && (
        <Auth
          initialMode={authMode}
          onSuccess={handleAuthSuccess}
          onBack={() => setView('landing')}
        />
      )}

      {view === 'dashboard' && (
        <Dashboard
          user={user}
          token={token}
          characters={characters}
          activeCharId={activeCharId || (characters[0] ? characters[0].id : null)}
          onSelectCharacter={(id) => setActiveCharId(id)}
          onCreateCharacter={handleCreateCharacter}
          onEditCharacter={handleEditCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onLogout={handleLogout}
          sidebarElement={
            <Sidebar
              user={user}
              characters={characters}
              activeCharId={activeCharId || (characters[0] ? characters[0].id : null)}
              onSelectCharacter={(id) => setActiveCharId(id)}
              onOpenCreateModal={() => {}} // Hooked up inside Dashboard cloneElement
              onLogout={handleLogout}
            />
          }
        />
      )}
    </div>
  );
}

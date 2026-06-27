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
  const isMountedRef = React.useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Restore session and handle visibility token refresh
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let handleVisibilityChange: (() => void) | undefined;

    const setupAuth = async () => {
      try {
        const { onIdTokenChanged } = await import('firebase/auth');
        const { auth } = await import('./lib/firebase.ts');
        
        unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
          if (!isMountedRef.current) return;
          if (firebaseUser) {
            try {
              const newToken = await firebaseUser.getIdToken();
              if (!isMountedRef.current) return;
              const loggedUser: User = {
                id: firebaseUser.uid,
                email: firebaseUser.email || '',
                username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                avatarUrl: firebaseUser.photoURL || undefined,
                joinedDate: new Date().toISOString()
              };
              
              setUser(loggedUser);
              setToken(newToken);
              
              localStorage.setItem('ai_roleplay_user', JSON.stringify(loggedUser));
              localStorage.setItem('ai_roleplay_token', newToken);
              
              setView(prev => prev === 'landing' || prev === 'auth' ? 'dashboard' : prev);
            } catch (e) {
              console.error('Failed to refresh token', e);
            }
          } else {
            const savedUser = localStorage.getItem('ai_roleplay_user');
            if (savedUser) {
              setUser(null);
              setToken(null);
              localStorage.removeItem('ai_roleplay_user');
              localStorage.removeItem('ai_roleplay_token');
              setView('landing');
            }
          }
        });

        handleVisibilityChange = async () => {
          if (document.visibilityState === 'visible' && auth.currentUser) {
            try {
              const freshToken = await auth.currentUser.getIdToken(true);
              if (isMountedRef.current) {
                setToken(freshToken);
                localStorage.setItem('ai_roleplay_token', freshToken);
              }
            } catch (error) {
              console.error("Visibility token refresh failed", error);
            }
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
      } catch (err) {
        // Fallback local storage
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
      }
    };

    setupAuth();

    return () => {
      if (unsubscribe) unsubscribe();
      if (handleVisibilityChange) document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch characters on load (or whenever user gets authenticated/refreshed)
  useEffect(() => {
    let isMounted = true;
    const abortController = new AbortController();

    const fetchCharacters = async () => {
      try {
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        const res = await fetch('/api/characters', { 
          headers,
          signal: abortController.signal
        });
        
        if (res.status === 401) {
          // Token might be expired, Firebase onIdTokenChanged will handle refresh
          // or we could force a refresh here, but let's just ignore for now
          return;
        }

        if (res.ok && isMounted) {
          const data = await res.json();
          if (data && data.length > 0) {
            setCharacters(data);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to fetch characters:', err);
        }
      }
    };

    fetchCharacters();

    return () => {
      isMounted = false;
      abortController.abort();
    };
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
    const abortController = new AbortController();
    try {
      const res = await fetch('/api/characters', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(newCharData),
        signal: abortController.signal
      });

      if (res.status === 401) {
        throw new Error('Unauthorized');
      }

      if (res.ok) {
        const createdChar = await res.json();
        if (isMountedRef.current) {
          setCharacters(prev => [createdChar, ...prev]);
          setActiveCharId(createdChar.id);
        }
      } else {
        throw new Error('API creation failed');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      if (isMountedRef.current) {
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
    }
  };

  // Edit custom character
  const handleEditCharacter = async (charId: string, updatedData: Partial<Character>) => {
    const abortController = new AbortController();
    try {
      const res = await fetch(`/api/characters/${charId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(updatedData),
        signal: abortController.signal
      });

      if (res.status === 401) {
        throw new Error('Unauthorized');
      }

      if (res.ok) {
        const updatedChar = await res.json();
        if (isMountedRef.current) {
          setCharacters(prev => prev.map(c => c.id === charId ? updatedChar : c));
          if (activeCharId === charId) {
            setActiveCharId(updatedChar.id);
          }
        }
      } else {
        throw new Error('API edit failed');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
    }
  };

  // Delete custom character
  const handleDeleteCharacter = async (charId: string) => {
    const abortController = new AbortController();
    try {
      const res = await fetch(`/api/characters/${charId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        signal: abortController.signal
      });

      if (res.status === 401) {
        throw new Error('Unauthorized');
      }

      if (res.ok) {
        if (isMountedRef.current) {
          setCharacters(prev => prev.filter(c => c.id !== charId));
          if (activeCharId === charId) {
            setActiveCharId(null);
          }
        }
      } else {
        throw new Error('API delete failed');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
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

import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage.tsx';
import Auth from './components/Auth.tsx';
import Dashboard from './components/Dashboard.tsx';
import Sidebar from './components/Sidebar.tsx';
import { Character, User, UserPersona } from './types.ts';
import { INITIAL_CHARACTERS } from './data.ts';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [characters, setCharacters] = useState<Character[]>(INITIAL_CHARACTERS);
  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const isMountedRef = React.useRef(true);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('ai_roleplay_theme') as 'dark' | 'light') || 'dark';
  });

  const [favoriteCharIds, setFavoriteCharIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ai_roleplay_favorite_chars');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [recentCharIds, setRecentCharIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ai_roleplay_recent_chars');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // User Personas state
  const [userPersonas, setUserPersonas] = useState<UserPersona[]>(() => {
    try {
      const stored = localStorage.getItem('ai_roleplay_user_personas');
      if (stored) return JSON.parse(stored);
    } catch {}
    const defaults: UserPersona[] = [
      {
        id: 'persona-apprentice',
        name: 'Mage Apprentice',
        avatarUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=150&auto=format&fit=crop&q=80',
        bio: 'An aspiring practitioner of elemental wizardry, eager to discover arcane secrets and historical spells.'
      },
      {
        id: 'persona-hacker',
        name: 'Neon Cyber Rogue',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        bio: 'A futuristic tech specialist from Neo-Tokyo who operates on the boundary of network code and cybernetic spirit lore.'
      }
    ];
    localStorage.setItem('ai_roleplay_user_personas', JSON.stringify(defaults));
    return defaults;
  });

  const [activePersonaId, setActivePersonaId] = useState<string | null>(() => {
    return localStorage.getItem('ai_roleplay_active_persona_id') || null;
  });

  const handleSelectPersona = (id: string | null) => {
    setActivePersonaId(id);
    if (id) {
      localStorage.setItem('ai_roleplay_active_persona_id', id);
    } else {
      localStorage.removeItem('ai_roleplay_active_persona_id');
    }
  };

  const handleCreatePersona = (newPersona: Omit<UserPersona, 'id'>) => {
    const fresh: UserPersona = {
      ...newPersona,
      id: 'persona-' + Math.random().toString(36).substr(2, 9)
    };
    setUserPersonas(prev => {
      const updated = [...prev, fresh];
      localStorage.setItem('ai_roleplay_user_personas', JSON.stringify(updated));
      return updated;
    });
    setActivePersonaId(fresh.id);
    localStorage.setItem('ai_roleplay_active_persona_id', fresh.id);
  };

  // Pinned conversations state
  const [pinnedCharIds, setPinnedCharIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('ai_roleplay_pinned_chars');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Chat sessions state (last message, timestamp, unread indicators)
  const [sessions, setSessions] = useState<Record<string, { lastMessageText: string; lastMessageTime: string; unreadCount: number }>>(() => {
    try {
      const stored = localStorage.getItem('ai_roleplay_sessions_v2');
      if (stored) return JSON.parse(stored);
    } catch {}

    // Set interactive initial unread items to make the sidebar feel alive like WhatsApp!
    const defaults: Record<string, { lastMessageText: string; lastMessageTime: string; unreadCount: number }> = {
      'char-nova9': {
        lastMessageText: 'Diagnostic complete. Core integrity: 94%. Communication bridge established. I am Nova-9...',
        lastMessageTime: '11:42 AM',
        unreadCount: 1
      },
      'char-kaelen': {
        lastMessageText: 'Ah, step closer to the hearth, traveler. The winds outside are harsh, and my scrying pool...',
        lastMessageTime: 'Yesterday',
        unreadCount: 0
      },
      'char-yukiko': {
        lastMessageText: '*A small glowing fox spirit darts around your feet as she adjusts her high-tech talisman holster*',
        lastMessageTime: '09:15 AM',
        unreadCount: 2
      }
    };
    try {
      localStorage.setItem('ai_roleplay_sessions_v2', JSON.stringify(defaults));
    } catch {}
    return defaults;
  });

  const updateSession = (charId: string, lastMessageText: string, lastMessageTime?: string, incrementUnread = false) => {
    setSessions(prev => {
      const current = prev[charId] || { lastMessageText: '', lastMessageTime: '', unreadCount: 0 };
      const time = lastMessageTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nextUnread = incrementUnread ? current.unreadCount + 1 : current.unreadCount;
      const updated = {
        ...prev,
        [charId]: {
          lastMessageText,
          lastMessageTime: time,
          unreadCount: nextUnread
        }
      };
      try {
        localStorage.setItem('ai_roleplay_sessions_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const markSessionRead = (charId: string) => {
    setSessions(prev => {
      if (!prev[charId] || prev[charId].unreadCount === 0) return prev;
      const updated = {
        ...prev,
        [charId]: {
          ...prev[charId],
          unreadCount: 0
        }
      };
      try {
        localStorage.setItem('ai_roleplay_sessions_v2', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const togglePinCharacter = (charId: string) => {
    setPinnedCharIds(prev => {
      const updated = prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId];
      localStorage.setItem('ai_roleplay_pinned_chars', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleFavorite = (charId: string) => {
    setFavoriteCharIds(prev => {
      const updated = prev.includes(charId) ? prev.filter(id => id !== charId) : [...prev, charId];
      localStorage.setItem('ai_roleplay_favorite_chars', JSON.stringify(updated));
      return updated;
    });
  };

  const addToRecent = (charId: string) => {
    setRecentCharIds(prev => {
      const filtered = prev.filter(id => id !== charId);
      const updated = [charId, ...filtered].slice(0, 8);
      localStorage.setItem('ai_roleplay_recent_chars', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('ai_roleplay_theme', nextTheme);
  };

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
    addToRecent(charId);
    setView('dashboard');
  };

  // Landing page trial click handler
  const handleSelectCharacterTrial = (char: Character) => {
    setActiveCharId(char.id);
    addToRecent(char.id);
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
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      theme === 'dark' ? 'dark bg-[#030712] text-gray-100' : 'light bg-slate-50 text-slate-800'
    }`}>
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
          theme={theme}
          toggleTheme={toggleTheme}
          favoriteCharIds={favoriteCharIds}
          toggleFavorite={toggleFavorite}
          recentCharIds={recentCharIds}
        />
      )}

      {view === 'auth' && (
        <Auth
          initialMode={authMode}
          onSuccess={handleAuthSuccess}
          onBack={() => setView('landing')}
          theme={theme}
        />
      )}

      {view === 'dashboard' && (
        <Dashboard
          user={user}
          token={token}
          characters={characters}
          activeCharId={activeCharId || (characters[0] ? characters[0].id : null)}
          onSelectCharacter={handleSelectCharacter}
          onCreateCharacter={handleCreateCharacter}
          onEditCharacter={handleEditCharacter}
          onDeleteCharacter={handleDeleteCharacter}
          onLogout={handleLogout}
          theme={theme}
          toggleTheme={toggleTheme}
          favoriteCharIds={favoriteCharIds}
          toggleFavorite={toggleFavorite}
          recentCharIds={recentCharIds}
          userPersonas={userPersonas}
          activePersonaId={activePersonaId}
          onSelectPersona={handleSelectPersona}
          onCreatePersona={handleCreatePersona}
          pinnedCharIds={pinnedCharIds}
          togglePinCharacter={togglePinCharacter}
          sessions={sessions}
          updateSession={updateSession}
          markSessionRead={markSessionRead}
          sidebarElement={
            <Sidebar
              user={user}
              characters={characters}
              activeCharId={activeCharId || (characters[0] ? characters[0].id : null)}
              onSelectCharacter={handleSelectCharacter}
              onOpenCreateModal={() => {}} // Hooked up inside Dashboard cloneElement
              onLogout={handleLogout}
              theme={theme}
              toggleTheme={toggleTheme}
              favoriteCharIds={favoriteCharIds}
              toggleFavorite={toggleFavorite}
              recentCharIds={recentCharIds}
              userPersonas={userPersonas}
              activePersonaId={activePersonaId}
              onSelectPersona={handleSelectPersona}
              onCreatePersona={handleCreatePersona}
              pinnedCharIds={pinnedCharIds}
              togglePinCharacter={togglePinCharacter}
              sessions={sessions}
              updateSession={updateSession}
              markSessionRead={markSessionRead}
            />
          }
        />
      )}
    </div>
  );
}

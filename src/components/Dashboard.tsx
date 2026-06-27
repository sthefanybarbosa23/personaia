import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Trash2, 
  Settings, 
  Menu, 
  X, 
  Info, 
  Sparkles, 
  Check, 
  Upload, 
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Globe,
  Lock,
  Tag,
  Plus,
  Heart,
  Brain,
  History,
  UserCheck
} from 'lucide-react';
import { Character, Message, User } from '../types.ts';

interface DashboardProps {
  user: User | null;
  token: string | null;
  characters: Character[];
  activeCharId: string | null;
  onSelectCharacter: (id: string) => void;
  onCreateCharacter: (newChar: Omit<Character, 'id' | 'isCustom' | 'chatsCount' | 'rating'>) => void;
  onEditCharacter: (charId: string, updatedData: Partial<Character>) => void;
  onDeleteCharacter: (charId: string) => void;
  onLogout: () => void;
  sidebarElement: React.ReactNode;
}

export default function Dashboard({
  user,
  token,
  characters,
  activeCharId,
  onSelectCharacter,
  onCreateCharacter,
  onEditCharacter,
  onDeleteCharacter,
  onLogout,
  sidebarElement
}: DashboardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  // Custom character state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCharacterId, setEditingCharacterId] = useState<string | null>(null);
  const [charName, setCharName] = useState('');
  const [charTagline, setCharTagline] = useState('');
  const [charDesc, setCharDesc] = useState('');
  const [charPrompt, setCharPrompt] = useState('');
  const [charInitial, setCharInitial] = useState('');
  const [charCategory, setCharCategory] = useState<string>('Sci-Fi');
  const [charAvatar, setCharAvatar] = useState('');
  const [charBanner, setCharBanner] = useState('');
  const [charIsPublic, setCharIsPublic] = useState(true);
  const [charTags, setCharTags] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Character Detail Sheet toggler
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [activeCharMemory, setActiveCharMemory] = useState<any>(null);

  const activeChar = characters.find(c => c.id === activeCharId) || characters[0];
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const fetchCharacterMemory = async () => {
    if (!activeChar || !token) return;
    try {
      const res = await fetch(`/api/memories/${activeChar.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.status === 401) return;
      if (res.ok && isMountedRef.current) {
        const memoryData = await res.json();
        if (isMountedRef.current) {
          setActiveCharMemory(memoryData);
        }
      }
    } catch (err) {
      console.error('Failed to load memory:', err);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages and memory when character changes or token refreshes
  useEffect(() => {
    if (!activeChar || !token) return;

    let isMounted = true;
    const abortController = new AbortController();

    const fetchChatHistory = async () => {
      try {
        const res = await fetch(`/api/chats/${activeChar.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          signal: abortController.signal
        });
        if (res.ok && isMounted) {
          const history = await res.json();
          if (history.length === 0) {
            // Seed initial message if empty
            setMessages([
              {
                id: 'init-' + activeChar.id,
                characterId: activeChar.id,
                sender: 'bot',
                content: activeChar.initialMessage,
                timestamp: '00:00 AM'
              }
            ]);
          } else {
            setMessages(history);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Failed to load chats:', err);
        }
      }
    };

    fetchChatHistory();
    fetchCharacterMemory();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [activeChar?.id, token]);

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingReply]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loadingReply || !token) return;

    const text = inputText;
    setInputText('');

    // Optimistically insert user message
    const tempUserMsg: Message = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      characterId: activeChar.id,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setLoadingReply(true);

    // Create placeholder message for the streaming bot reply
    const botMsgId = 'bot-' + Math.random().toString(36).substr(2, 9);
    const tempBotMsg: Message = {
      id: botMsgId,
      characterId: activeChar.id,
      sender: 'bot',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, tempBotMsg]);

    const abortController = new AbortController();

    try {
      const res = await fetch(`/api/chats/${activeChar.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messageText: text }),
        signal: abortController.signal
      });

      if (res.status === 401) {
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        throw new Error('Could not post message');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('Streaming response body not supported');
      }

      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          if (chunk) {
            accumulatedContent += chunk;
            if (isMountedRef.current) {
              setMessages(prev => {
                const updated = [...prev];
                const botMsgIdx = updated.findIndex(m => m.id === botMsgId);
                if (botMsgIdx !== -1) {
                  updated[botMsgIdx] = {
                    ...updated[botMsgIdx],
                    content: accumulatedContent
                  };
                }
                return updated;
              });
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      if (isMountedRef.current) {
        // Fallback response simulation
        setMessages(prev => {
          const updated = [...prev];
          const botMsgIdx = updated.findIndex(m => m.id === botMsgId);
          if (botMsgIdx !== -1) {
            updated[botMsgIdx] = {
              ...updated[botMsgIdx],
              content: `*flickers slightly* [Communication Module Latency] I received: "${text}". Let us continue mapping our virtual storyline.`
            };
          }
          return updated;
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingReply(false);
        fetchCharacterMemory();
        setTimeout(() => {
          if (isMountedRef.current) fetchCharacterMemory();
        }, 3000);
      }
    }
  };

  const handleClearMemory = async () => {
    if (!confirm(`Are you sure you want to clear your current conversation timeline with ${activeChar?.name}? This cannot be undone.`)) {
      return;
    }

    setMessages([
      {
        id: 'init-' + activeChar.id,
        characterId: activeChar.id,
        sender: 'bot',
        content: activeChar.initialMessage,
        timestamp: '00:00 AM'
      }
    ]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          if (target === 'avatar') {
            setCharAvatar(reader.result);
          } else {
            setCharBanner(reader.result);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCustomCharacterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!charName.trim() || !charTagline.trim() || !charPrompt.trim() || !charInitial.trim()) {
      setCreateError('Please fill in all required fields to form the digital soul.');
      return;
    }

    const payload = {
      name: charName,
      tagline: charTagline,
      description: charDesc || `${charName} is a mysterious persona waiting to unfold.`,
      systemPrompt: charPrompt,
      initialMessage: charInitial,
      category: charCategory,
      avatarUrl: charAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bannerUrl: charBanner || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
      isPublic: charIsPublic,
      tags: charTags,
    };

    if (editingCharacterId) {
      onEditCharacter(editingCharacterId, payload);
    } else {
      onCreateCharacter(payload);
    }

    resetForm();
    setShowCreateModal(false);
  };

  const resetForm = () => {
    setCharName('');
    setCharTagline('');
    setCharDesc('');
    setCharPrompt('');
    setCharInitial('');
    setCharCategory('Sci-Fi');
    setCharAvatar('');
    setCharBanner('');
    setCharIsPublic(true);
    setCharTags('');
    setEditingCharacterId(null);
  };

  return (
    <div id="dashboard-root" className="h-screen w-full flex bg-[#030712] overflow-hidden">
      
      {/* Desktop Sidebar (Left side) */}
      <div className="hidden md:block">
        {React.cloneElement(sidebarElement as React.ReactElement, {
          onOpenCreateModal: () => { resetForm(); setShowCreateModal(true); }
        })}
      </div>

      {/* Mobile Drawer Sidebar Backing */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/75 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar (Drawer) */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {React.cloneElement(sidebarElement as React.ReactElement, {
          onCloseMobileSidebar: () => setMobileSidebarOpen(false),
          onOpenCreateModal: () => { resetForm(); setShowCreateModal(true); }
        })}
      </div>

      {/* Primary Chat Stage */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950/40 relative">
        {/* Subtle decorative grid lines overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

        {/* Dashboard Header Bar */}
        <header className="sticky top-0 z-30 bg-[#030712]/90 backdrop-blur-md border-b border-gray-900 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            {/* Hamburger for mobile */}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 transition-colors shrink-0"
            >
              <Menu className="h-5 w-5" />
            </button>

            {activeChar && (
              <div className="flex items-center space-x-3 min-w-0">
                <img
                  src={activeChar.avatarUrl}
                  alt={activeChar.name}
                  className="h-10 w-10 rounded-xl object-cover border border-gray-800 shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="font-display font-semibold text-sm sm:text-base text-white truncate">
                      {activeChar.name}
                    </h2>
                    <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 font-medium font-mono">
                      {activeChar.category}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate font-light mt-0.5">{activeChar.tagline}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="clear-chat-timeline-btn"
              onClick={handleClearMemory}
              title="Reset Timeline Memory"
              className="p-2.5 text-gray-400 hover:text-red-400 rounded-xl hover:bg-red-950/15 border border-transparent hover:border-red-900/30 transition-all duration-200"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
            <button
              id="character-details-toggle"
              onClick={() => setShowDetailSheet(!showDetailSheet)}
              title="Persona Details"
              className={`p-2.5 rounded-xl border transition-all duration-200 ${
                showDetailSheet
                  ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-900 border-transparent'
              }`}
            >
              <Info className="h-4.5 w-4.5" />
            </button>
          </div>
        </header>

        {/* Outer Split Container: Main Message Area + Right Detail panel */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Active Chat Thread container */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              
              {/* Scenario Guide Notice */}
              <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-4 flex items-start space-x-3 max-w-3xl mx-auto mb-4">
                <Sparkles className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  <span className="font-semibold text-white">System Scenario Active: </span>
                  You are engaging in a zero-latency responsive simulation. AI generative engine is ready. Standard chat rules apply. Keep it creative!
                </div>
              </div>

              {/* Message List */}
              <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <motion.div
                      key={msg.id || index}
                      id={`message-bubble-${index}`}
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-3 max-w-[90%] sm:max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar preview */}
                        {!isUser && (
                          <div className="relative group shrink-0">
                            <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300 pointer-events-none" />
                            <img
                              src={activeChar?.avatarUrl || ''}
                              alt={activeChar?.name || 'Bot'}
                              className="relative h-9 w-9 rounded-xl object-cover border border-gray-800/80 shrink-0 shadow-lg"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                        {isUser && (
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600/30 to-purple-600/30 border border-indigo-500/30 text-indigo-200 font-bold flex items-center justify-center text-xs shrink-0 shadow-lg font-mono">
                            {user ? user.username.substring(0, 2).toUpperCase() : 'ME'}
                          </div>
                        )}

                        <div className="space-y-1">
                          <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-xl border ${
                            isUser
                              ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 border-indigo-400/20 text-white rounded-tr-none'
                              : 'bg-gray-900/85 backdrop-blur-md border-gray-800/80 text-gray-100 rounded-tl-none hover:border-gray-700/60 transition-colors'
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`text-[10px] text-gray-500 px-2 font-mono flex items-center gap-1.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <span>{msg.timestamp}</span>
                            {!isUser && msg.content === '' && (
                              <span className="inline-block h-1.5 w-1.5 bg-indigo-400 rounded-full animate-ping" />
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Simulated typing indicator */}
              {loadingReply && (
                <motion.div 
                  id="ai-typing-indicator" 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-3 max-w-[80%]">
                    <img
                      src={activeChar?.avatarUrl || ''}
                      alt={activeChar?.name || 'Bot'}
                      className="h-9 w-9 rounded-xl object-cover border border-gray-800 shrink-0 shadow-lg animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                    <div className="bg-gray-900/85 backdrop-blur-sm border border-gray-800/80 px-5 py-4 rounded-2xl rounded-tl-none flex items-center space-x-1.5 shadow-xl">
                      <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 bg-indigo-400 rounded-full animate-bounce" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Bottom Form input wrapper */}
            <div className="p-4 bg-[#030712]/60 border-t border-gray-900 backdrop-blur-sm">
              <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center space-x-3">
                <input
                  id="chat-message-input"
                  type="text"
                  placeholder={`Write your response to ${activeChar?.name || 'companion'}...`}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={loadingReply}
                  className="flex-1 py-3 px-4 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-all duration-200"
                />
                <button
                  id="send-message-btn"
                  type="submit"
                  disabled={!inputText.trim() || loadingReply}
                  className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-lg shadow-indigo-600/10 flex items-center justify-center transition-all duration-200 cursor-pointer"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
              <div className="max-w-4xl mx-auto flex items-center justify-between text-[10px] text-gray-500 mt-2 px-1">
                <span>Press Enter to send message</span>
                <span>Roleplay timeline auto-saves locally</span>
              </div>
            </div>
          </div>

          {/* Right sidebar: Character Details & System instructions panel */}
          <AnimatePresence>
            {showDetailSheet && activeChar && (
              <>
                {/* Backdrop overlay on mobile */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDetailSheet(false)}
                  className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
                />
                <motion.div
                  id="character-detail-sheet"
                  initial={{ x: '100%', opacity: 0.9 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0.9 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 220 }}
                  className="fixed md:relative right-0 top-0 bottom-0 h-full w-80 bg-gray-950/95 border-l border-gray-900 flex flex-col shrink-0 overflow-y-auto z-40 md:z-auto shadow-2xl md:shadow-none"
                >
              <div className="p-4 border-b border-gray-900 flex items-center justify-between">
                <h3 className="font-display font-semibold text-sm text-gray-200">System Blueprint</h3>
                <button
                  id="close-detail-sheet-btn"
                  onClick={() => setShowDetailSheet(false)}
                  className="p-1 text-gray-400 hover:text-white rounded hover:bg-gray-900 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Character Banner Area */}
              <div className="relative h-28 w-full bg-gray-900 overflow-hidden shrink-0">
                <img 
                  src={activeChar.bannerUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80'} 
                  alt="Character Banner" 
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                
                {/* Privacy Badge */}
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider font-mono backdrop-blur-md border ${
                    activeChar.isPublic !== false
                      ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400'
                      : 'bg-amber-950/40 border-amber-500/20 text-amber-400'
                  }`}>
                    {activeChar.isPublic !== false ? (
                      <>
                        <Globe className="h-2.5 w-2.5" />
                        <span>Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-2.5 w-2.5" />
                        <span>Private</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5 space-y-6 relative -mt-10">
                {/* Visual Identity Block */}
                <div className="text-center relative z-10">
                  <img
                    src={activeChar.avatarUrl}
                    alt={activeChar.name}
                    className="h-20 w-20 rounded-2xl object-cover border-2 border-gray-950 mx-auto shadow-2xl bg-gray-900"
                    referrerPolicy="no-referrer"
                  />
                  <h4 className="font-display font-bold text-lg text-white mt-3">{activeChar.name}</h4>
                  <p className="text-xs text-indigo-400 font-mono mt-0.5">{activeChar.tagline}</p>
                </div>

                <div className="space-y-4 pt-2">
                  {/* Category Pill */}
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Archetype Genus</span>
                    <div className="mt-1.5 inline-block px-3 py-1 bg-gray-900 border border-gray-800 rounded-lg text-xs font-semibold text-gray-300">
                      {activeChar.category}
                    </div>
                  </div>

                  {/* Tags Badges */}
                  {activeChar.tags && activeChar.tags.trim() && (
                    <div>
                      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Descriptors</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {activeChar.tags.split(',').map((tag, idx) => {
                          const cleanedTag = tag.trim();
                          if (!cleanedTag) return null;
                          return (
                            <span 
                              key={idx}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-[10px] font-medium text-gray-400"
                            >
                              <Tag className="h-2.5 w-2.5 text-gray-500" />
                              <span>{cleanedTag}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Character Bio description */}
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Deep Lore</span>
                    <p className="text-xs text-gray-400 leading-relaxed mt-1.5 bg-gray-900/50 p-3 rounded-xl border border-gray-900">
                      {activeChar.description}
                    </p>
                  </div>

                  {/* Mannerisms System Prompt */}
                  <div>
                    <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider font-mono">Core Directives / Mannerisms</span>
                    <p className="text-xs text-indigo-300/80 leading-relaxed mt-1.5 bg-indigo-950/10 border border-indigo-900/20 p-3 rounded-xl font-mono">
                      {activeChar.systemPrompt}
                    </p>
                  </div>

                  {/* Dynamic Long-Term Memory Section */}
                  <div className="border-t border-gray-900/60 pt-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                        <Brain className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Cognitive Memory Core</span>
                      </span>
                      <button 
                        onClick={fetchCharacterMemory}
                        className="p-1 rounded text-gray-500 hover:text-white hover:bg-gray-900 transition-colors cursor-pointer"
                        title="Sync memory"
                      >
                        <RefreshCw className="h-3 w-3" />
                      </button>
                    </div>

                    {activeCharMemory ? (
                      <div className="space-y-3">
                        {/* Relationship meter */}
                        <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                              <Heart className="h-3 w-3 text-rose-500 fill-rose-500/10" />
                              Relationship
                            </span>
                            <span className="text-xs font-bold text-rose-400">
                              {activeCharMemory.relationshipStatus || 'Stranger'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden mb-1">
                            <div 
                              className="h-full bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${activeCharMemory.relationshipScore || 10}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                            <span>Trust Meter</span>
                            <span>{activeCharMemory.relationshipScore || 10}/100</span>
                          </div>
                        </div>

                        {/* User memory card */}
                        <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3">
                          <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                            <UserCheck className="h-3 w-3 text-indigo-400" />
                            Recalled User Profile
                          </span>
                          <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                            {activeCharMemory.userMemory || "No explicit facts remembered yet."}
                          </p>
                        </div>

                        {/* Character internal memory card */}
                        <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3">
                          <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                            <Brain className="h-3 w-3 text-emerald-400" />
                            Internal Diary / Lore
                          </span>
                          <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                            {activeCharMemory.characterMemory || "No specialized dynamic events recalled."}
                          </p>
                        </div>

                        {/* Storyline Summary card */}
                        <div className="bg-gray-900/40 border border-gray-800/40 rounded-xl p-3">
                          <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1 mb-1 font-mono uppercase tracking-wider">
                            <History className="h-3 w-3 text-amber-400" />
                            Storyline Summary
                          </span>
                          <p className="text-[11px] text-gray-300 leading-relaxed font-sans">
                            {activeCharMemory.conversationSummary || "The dialogue has just begun."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-xs text-gray-600 bg-gray-950/20 rounded-xl border border-dashed border-gray-900">
                        Initializing cognitive syncing...
                      </div>
                    )}
                  </div>

                  {/* Owner Controls */}
                  {activeChar.creatorId !== undefined && activeChar.creatorId !== null && Number(activeChar.creatorId) === Number(user?.id) && (
                    <div className="flex items-center space-x-2 pt-4 border-t border-gray-900/60">
                      <button
                        onClick={() => {
                          setCharName(activeChar.name);
                          setCharTagline(activeChar.tagline);
                          setCharDesc(activeChar.description || '');
                          setCharPrompt(activeChar.systemPrompt || '');
                          setCharInitial(activeChar.initialMessage || '');
                          setCharCategory(activeChar.category || 'Sci-Fi');
                          setCharAvatar(activeChar.avatarUrl || '');
                          setCharBanner(activeChar.bannerUrl || '');
                          setCharIsPublic(activeChar.isPublic !== undefined ? activeChar.isPublic : true);
                          setCharTags(activeChar.tags || '');
                          setEditingCharacterId(activeChar.id);
                          setShowCreateModal(true);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/35 border border-indigo-500/30 text-indigo-300 font-semibold text-xs transition-colors cursor-pointer text-center"
                      >
                        Edit Persona
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you absolutely sure you want to dismantle and delete ${activeChar.name}? All message history will be purged.`)) {
                            onDeleteCharacter(activeChar.id);
                            setShowDetailSheet(false);
                          }
                        }}
                        className="py-2 px-3 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/20 text-red-400 font-semibold text-xs transition-colors cursor-pointer"
                        title="Purge Persona"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            </>
          )}
        </AnimatePresence>
        </div>
      </main>

      {/* CHARACTER CREATION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            id="create-character-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 12, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 12, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl"
            >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-900 flex items-center justify-between bg-gray-950">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-indigo-400" />
                <h3 className="font-display font-bold text-lg text-white">
                  {editingCharacterId ? 'Upgrade Custom Persona' : 'Create Custom Roleplay Persona'}
                </h3>
              </div>
              <button
                id="close-create-modal-btn"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateCustomCharacterSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto bg-gray-950">
              {createError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start space-x-2.5 text-red-400 text-xs">
                  <AlertCircle className="h-4.5 w-4.5 mt-0.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Character Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Persona Name *</label>
                  <input
                    id="char-name-input"
                    type="text"
                    required
                    placeholder="e.g. Captain Vance"
                    value={charName}
                    onChange={(e) => setCharName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {/* Tagline */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tagline *</label>
                  <input
                    id="char-tagline-input"
                    type="text"
                    required
                    placeholder="e.g. Rogue smugglers guild pilot"
                    value={charTagline}
                    onChange={(e) => setCharTagline(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Genre Category</label>
                <div className="flex flex-wrap gap-2">
                  {(['Sci-Fi', 'Fantasy', 'Anime', 'Historical', 'Mystery', 'Helper'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      id={`genre-select-${cat.toLowerCase()}`}
                      onClick={() => setCharCategory(cat)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        charCategory === cat
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Avatar and Banner Visual Configuration */}
              <div className="space-y-4 p-4 bg-gray-900/50 border border-gray-800 rounded-xl">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">Visual Customization</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Avatar Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Avatar Image</label>
                    <div className="flex items-center space-x-3">
                      {charAvatar ? (
                        <img src={charAvatar} alt="Avatar Preview" className="h-12 w-12 rounded-xl object-cover border border-gray-700 bg-gray-950 shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-12 w-12 rounded-xl border border-dashed border-gray-700 flex items-center justify-center text-gray-600 bg-gray-950 shrink-0">
                          <Upload className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Paste image URL"
                          value={charAvatar}
                          onChange={(e) => setCharAvatar(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                        />
                        <label className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 cursor-pointer transition-colors">
                          <Upload className="h-3 w-3 mr-1" />
                          <span>Upload File</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'avatar')} />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Banner Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-400">Banner Image</label>
                    <div className="flex items-center space-x-3">
                      {charBanner ? (
                        <img src={charBanner} alt="Banner Preview" className="h-12 w-16 rounded-xl object-cover border border-gray-700 bg-gray-950 shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="h-12 w-16 rounded-xl border border-dashed border-gray-700 flex items-center justify-center text-gray-600 bg-gray-950 shrink-0">
                          <Upload className="h-4 w-4" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          placeholder="Paste banner URL"
                          value={charBanner}
                          onChange={(e) => setCharBanner(e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-gray-950 border border-gray-800 rounded-lg text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                        />
                        <label className="mt-1.5 inline-flex items-center px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 text-[10px] font-semibold text-gray-300 border border-gray-700 cursor-pointer transition-colors">
                          <Upload className="h-3 w-3 mr-1" />
                          <span>Upload File</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, 'banner')} />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Visibility */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Visibility Setting</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCharIsPublic(true)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                        charIsPublic
                          ? 'bg-emerald-600/10 border-emerald-500/40 text-emerald-300'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Globe className="h-3.5 w-3.5" />
                      <span>Public</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCharIsPublic(false)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center space-x-1.5 transition-all ${
                        !charIsPublic
                          ? 'bg-amber-600/10 border-amber-500/40 text-amber-300'
                          : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
                      }`}
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Private</span>
                    </button>
                  </div>
                </div>

                {/* Tags Descriptor */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Tags / Descriptors</label>
                  <div className="relative">
                    <Tag className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="e.g. funny, heroic, wise"
                      value={charTags}
                      onChange={(e) => setCharTags(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* Deep Lore Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Lore Background (Bio)</label>
                <textarea
                  id="char-desc-input"
                  rows={2}
                  placeholder="Provide background context or storyline lore for this character..."
                  value={charDesc}
                  onChange={(e) => setCharDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* System Prompt / Mannerisms */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mannerisms / Directives (System Prompt) *</label>
                <textarea
                  id="char-prompt-input"
                  rows={3}
                  required
                  placeholder="How should this character behave? e.g. 'Speak like a strict pirate. Keep replies short.'"
                  value={charPrompt}
                  onChange={(e) => setCharPrompt(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs resize-none"
                />
              </div>

              {/* Greeting Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Greeting Dialogue *</label>
                <textarea
                  id="char-initial-input"
                  rows={2.5}
                  required
                  placeholder="Initial conversation starter e.g. '*Adjusts hat* Welcome aboard the Star Wanderer. Speak fast.'"
                  value={charInitial}
                  onChange={(e) => setCharInitial(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-100 placeholder-gray-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-gray-900 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white rounded-xl hover:bg-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  id="submit-create-character-btn"
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/15 flex items-center space-x-2 transition-all duration-200"
                >
                  <Check className="h-4 w-4" />
                  <span>{editingCharacterId ? 'Upgrade Persona' : 'Synthesize Persona'}</span>
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

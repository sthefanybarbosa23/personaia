import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
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
  UserCheck,
  Copy,
  Edit,
  RotateCcw,
  Share2,
  MoreHorizontal,
  Paperclip,
  Bookmark,
  Pin,
  ChevronRight,
  Shield,
  BadgeAlert,
  Phone,
  Video,
  Smile,
  Mic,
  VolumeX,
  VideoOff,
  PhoneOff
} from 'lucide-react';
import { Character, Message, User, UserPersona } from '../types.ts';

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
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  favoriteCharIds: string[];
  toggleFavorite: (charId: string) => void;
  recentCharIds: string[];
  
  // User Personas state
  userPersonas: UserPersona[];
  activePersonaId: string | null;
  onSelectPersona: (id: string | null) => void;
  onCreatePersona: (persona: Omit<UserPersona, 'id'>) => void;
  
  // Pinning feature
  pinnedCharIds: string[];
  togglePinCharacter: (charId: string) => void;

  // WhatsApp-inspired session props
  sessions: Record<string, { lastMessageText: string; lastMessageTime: string; unreadCount: number }>;
  updateSession: (charId: string, lastMessageText: string, lastMessageTime?: string, incrementUnread?: boolean) => void;
  markSessionRead: (charId: string) => void;
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
  sidebarElement,
  theme,
  toggleTheme,
  favoriteCharIds,
  toggleFavorite,
  recentCharIds,
  
  userPersonas,
  activePersonaId,
  onSelectPersona,
  onCreatePersona,
  
  pinnedCharIds,
  togglePinCharacter,

  sessions,
  updateSession,
  markSessionRead
}: DashboardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingReply, setLoadingReply] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // New WhatsApp UI states
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [showCallSimulation, setShowCallSimulation] = useState<'audio' | 'video' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  // Image attach state
  const [attachedImageBase64, setAttachedImageBase64] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Call timer ticker
  useEffect(() => {
    let interval: any;
    if (showCallSimulation) {
      setCallDuration(0);
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showCallSimulation]);

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

  // Message edits & copy helpers
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // Character Detail Sheet toggler
  const [showDetailSheet, setShowDetailSheet] = useState(false);
  const [activeCharMemory, setActiveCharMemory] = useState<any>(null);
  const [syncingMemory, setSyncingMemory] = useState(false);

  const activeChar = characters.find(c => c.id === activeCharId) || characters[0];
  const activePersona = userPersonas.find(p => p.id === activePersonaId) || null;
  const isMountedRef = useRef(true);

  const isDark = theme === 'dark';

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Fetch long-term memory metrics from backend
  const fetchCharacterMemory = async () => {
    if (!activeChar || !token) return;
    setSyncingMemory(true);
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
    } finally {
      setSyncingMemory(false);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch messages and memory when active character changes
  useEffect(() => {
    if (!activeChar || !token) return;

    setIsHistoryLoading(true);
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
            // Seed initial message if timeline is empty
            setMessages([
              {
                id: 'init-' + activeChar.id,
                characterId: activeChar.id,
                sender: 'bot',
                content: activeChar.initialMessage,
                timestamp: '12:00 PM'
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
      } finally {
        if (isMounted) {
          setTimeout(() => {
            if (isMountedRef.current) setIsHistoryLoading(false);
          }, 500);
        }
      }
    };

    fetchChatHistory();
    fetchCharacterMemory();
    markSessionRead(activeChar.id); // Mark read immediately on select!

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [activeChar?.id, token]);

  // Smart smooth scrolling to bottom of thread
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingReply]);

  // Convert attached files to Base64
  const handleAttachImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleAttachedImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setAttachedImageBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachedImage = () => {
    setAttachedImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Send message dispatches to streaming backend
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImageBase64) return;
    if (loadingReply || !token) return;

    const text = inputText;
    const imagePayload = attachedImageBase64;
    
    setInputText('');
    setAttachedImageBase64(null);

    // Create optimistic user message with persona support and thumbnail image representation
    const tempUserMsg: Message = {
      id: 'usr-' + Math.random().toString(36).substr(2, 9),
      characterId: activeChar.id,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      image: imagePayload || undefined,
      userPersonaId: activePersona?.id || undefined
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setLoadingReply(true);
    updateSession(activeChar.id, text, tempUserMsg.timestamp);

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
      // Body payload passes active user persona class metadata so system prompts adapt instantly
      const bodyPayload = {
        messageText: text + (imagePayload ? ' [Attached Roleplay Image Context Provided]' : ''),
        userPersonaName: activePersona ? activePersona.name : undefined,
        userPersonaBio: activePersona ? activePersona.bio : undefined
      };

      const res = await fetch(`/api/chats/${activeChar.id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload),
        signal: abortController.signal
      });

      if (res.status === 401) {
        throw new Error('Unauthorized');
      }

      if (!res.ok) {
        throw new Error('Streaming failed');
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No streaming body reader found');
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
      // Stream completed successfully, update thread row last message
      updateSession(activeChar.id, accumulatedContent, tempBotMsg.timestamp);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      const fallbackContent = `*${activeChar.name} steps closer, responding with a quiet, narrative gesture.* "Let us forge ahead with our adventure."`;
      if (isMountedRef.current) {
        setMessages(prev => {
          const updated = [...prev];
          const botMsgIdx = updated.findIndex(m => m.id === botMsgId);
          if (botMsgIdx !== -1) {
            updated[botMsgIdx] = {
              ...updated[botMsgIdx],
              content: fallbackContent
            };
          }
          return updated;
        });
      }
      updateSession(activeChar.id, fallbackContent, tempBotMsg.timestamp);
    } finally {
      if (isMountedRef.current) {
        setLoadingReply(false);
        fetchCharacterMemory();
      }
    }
  };

  // Regenerate last companion response
  const handleRegenerateResponse = async () => {
    const userMsgs = messages.filter(m => m.sender === 'user');
    if (userMsgs.length === 0 || loadingReply || !token) return;
    
    const lastUserMsg = userMsgs[userMsgs.length - 1];
    const lastUserIdx = messages.findIndex(m => m.id === lastUserMsg.id);
    if (lastUserIdx === -1) return;

    // Slice timeline up to user message
    const truncatedHistory = messages.slice(0, lastUserIdx + 1);
    setMessages(truncatedHistory);
    setLoadingReply(true);

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
        body: JSON.stringify({
          messageText: lastUserMsg.content,
          userPersonaName: activePersona ? activePersona.name : undefined,
          userPersonaBio: activePersona ? activePersona.bio : undefined
        }),
        signal: abortController.signal
      });

      if (!res.ok) throw new Error('Generation error');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader');

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
        setMessages(prev => {
          const updated = [...prev];
          const botMsgIdx = updated.findIndex(m => m.id === botMsgId);
          if (botMsgIdx !== -1) {
            updated[botMsgIdx] = {
              ...updated[botMsgIdx],
              content: `*${activeChar.name} watches you closely, adjusting their posture as the timeline ripples.*`
            };
          }
          return updated;
        });
      }
    } finally {
      if (isMountedRef.current) {
        setLoadingReply(false);
        fetchCharacterMemory();
      }
    }
  };

  // Erase conversation history
  const handleClearMemory = async () => {
    if (!confirm(`Tem certeza de que deseja apagar completamente o histórico de conversas com ${activeChar.name}?`)) return;
    try {
      const res = await fetch(`/api/chats/${activeChar.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        setMessages([
          {
            id: 'init-' + activeChar.id,
            characterId: activeChar.id,
            sender: 'bot',
            content: activeChar.initialMessage,
            timestamp: '12:00 PM'
          }
        ]);
        fetchCharacterMemory();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyMessage = (msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 1500);
  };

  const handleDeleteMessage = (msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
  };

  const handleSubmitEditMessage = (msgId: string) => {
    if (!editMessageText.trim()) return;
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: editMessageText } : m));
    setEditingMessageId(null);
    setEditMessageText('');
  };

  // Image Upload helper converting to Base64 for the custom avatars
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        if (field === 'avatar') setCharAvatar(reader.result);
        if (field === 'banner') setCharBanner(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCustomCharacterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!charName.trim() || !charTagline.trim() || !charPrompt.trim() || !charInitial.trim()) {
      setCreateError('Por favor, preencha todos os campos obrigatórios marcados com *');
      return;
    }

    const payload = {
      name: charName,
      tagline: charTagline,
      description: charDesc,
      systemPrompt: charPrompt,
      initialMessage: charInitial,
      category: charCategory,
      avatarUrl: charAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bannerUrl: charBanner || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80',
      isPublic: charIsPublic,
      tags: charTags
    };

    try {
      if (editingCharacterId) {
        await onEditCharacter(editingCharacterId, payload);
      } else {
        await onCreateCharacter(payload);
      }
      setShowCreateModal(false);
      resetForm();
    } catch (err: any) {
      setCreateError(err.message || 'Error executing submission');
    }
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
    setCreateError(null);
  };

  const isPinned = pinnedCharIds.includes(activeChar?.id);
  const isFavorite = favoriteCharIds.includes(activeChar?.id);

  return (
    <div id="dashboard-root" className={`h-screen w-full flex overflow-hidden ${
      isDark ? 'bg-[#030712] text-gray-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Desktop Sidebar (Render Element) */}
      <div className="hidden md:block">
        {React.cloneElement(sidebarElement as any, {
          onOpenCreateModal: () => { resetForm(); setShowCreateModal(true); }
        })}
      </div>

      {/* Mobile Drawer Sidebar backer */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/85 md:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 md:hidden ${
        mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {React.cloneElement(sidebarElement as any, {
          onCloseMobileSidebar: () => setMobileSidebarOpen(false),
          onOpenCreateModal: () => { resetForm(); setShowCreateModal(true); }
        })}
      </div>

      {/* Primary Chat Stage Container */}
      <main className={`flex-1 flex flex-col h-full overflow-hidden relative ${
        isDark ? 'bg-gray-950/25' : 'bg-white'
      }`}>
        <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        {/* Header Bar */}
        <header className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 py-2.5 flex items-center justify-between transition-colors ${
          isDark ? 'bg-[#030712]/95 border-gray-900/80' : 'bg-white/95 border-slate-200'
        }`}>
          <div className="flex items-center space-x-3.5 min-w-0">
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileSidebarOpen(true)}
              className={`md:hidden p-2 rounded-xl transition-colors shrink-0 border ${
                isDark ? 'text-gray-400 hover:text-white border-gray-800 hover:bg-gray-900' : 'text-slate-500 hover:text-slate-900 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {activeChar && (
              <div className="flex items-center space-x-3 min-w-0 cursor-pointer group" onClick={() => setShowDetailSheet(true)}>
                <div className="relative shrink-0">
                  <img
                    src={activeChar.avatarUrl}
                    alt={activeChar.name}
                    className="h-11 w-11 rounded-full object-cover border border-indigo-500/20 shadow-sm shrink-0 group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <span className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 ${
                    isDark ? 'border-[#030712]' : 'border-white'
                  } bg-emerald-500`} />
                </div>
                
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <h2 className={`font-black text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                      {activeChar.name}
                    </h2>
                    <span className={`hidden sm:inline-block text-[8px] font-bold font-mono px-2 py-0.5 rounded uppercase border ${
                      isDark ? 'bg-indigo-950/40 border-indigo-500/10 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                    }`}>
                      {activeChar.category}
                    </span>
                  </div>
                  
                  {/* Real-time Presence status block */}
                  <div className="flex items-center space-x-1.5 mt-0.5">
                    {loadingReply ? (
                      <span className="text-xs text-emerald-500 dark:text-emerald-400 font-extrabold animate-pulse">
                        digitando...
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" /> online
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1 sm:space-x-1.5 shrink-0">
            {/* Pin / Unpin Conversation Toggle */}
            <button
              onClick={() => togglePinCharacter(activeChar.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isPinned
                  ? isDark ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : isDark ? 'text-gray-400 border-transparent hover:bg-gray-900' : 'text-slate-500 border-transparent hover:bg-slate-100'
              }`}
              title={isPinned ? "Desfixar Conversa" : "Fixar Conversa na Barra Lateral"}
            >
              <Pin className={`h-4 w-4 ${isPinned ? 'fill-indigo-500' : ''}`} />
            </button>

            {/* Favorite Toggle */}
            <button
              onClick={() => toggleFavorite(activeChar.id)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  : isDark ? 'text-gray-400 border-transparent hover:bg-gray-900' : 'text-slate-500 border-transparent hover:bg-slate-100'
              }`}
              title={isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
            </button>

            <button
              onClick={() => setShowShareModal(true)}
              title="Compartilhar Conversa"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'text-gray-400 border-transparent hover:bg-gray-900' : 'text-slate-500 border-transparent hover:bg-slate-100'
              }`}
            >
              <Share2 className="h-4 w-4" />
            </button>

            <button
              id="clear-chat-timeline-btn"
              onClick={handleClearMemory}
              title="Apagar Histórico de Conversas"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isDark ? 'text-gray-400 border-transparent hover:text-red-400 hover:bg-red-950/15' : 'text-slate-500 border-transparent hover:text-red-600 hover:bg-red-50'
              }`}
            >
              <Trash2 className="h-4 w-4" />
            </button>

            <button
              id="character-details-toggle"
              onClick={() => setShowDetailSheet(!showDetailSheet)}
              title="Alternar Painel de Informações"
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                showDetailSheet
                  ? isDark ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : isDark ? 'text-gray-400 border-transparent hover:bg-gray-900' : 'text-slate-500 border-transparent hover:bg-slate-100'
              }`}
            >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Workspace body panels split */}
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Messages block & Input form stage */}
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
              
              {/* Core informational banner */}
              <div className={`border rounded-2xl p-4 flex items-start space-x-3.5 max-w-2xl mx-auto mb-2 ${
                isDark ? 'bg-indigo-950/15 border-indigo-900/20 text-gray-300' : 'bg-indigo-50/50 border-indigo-100 text-indigo-950'
              }`}>
                <Sparkles className="h-5 w-5 text-indigo-400 mt-0.5 shrink-0" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <span className="font-extrabold">Active Sandbox Memory Engine:</span> Chat com {activeChar?.name}. Suas respostas adaptam-se automaticamente de acordo com o contexto da sua persona.
                </div>
              </div>

              {/* SKELETON SHIMMER CHAT LOADER */}
              {isHistoryLoading ? (
                <div className="space-y-6 max-w-4xl mx-auto w-full py-4">
                  {/* Left (companion) bubble skeleton */}
                  <div className="flex justify-start animate-pulse">
                    <div className="flex items-start gap-3.5 max-w-[70%]">
                      <div className="h-10 w-10 bg-slate-300 dark:bg-slate-800 rounded-full shrink-0" />
                      <div className="space-y-2">
                        <div className="h-3.5 bg-slate-300 dark:bg-slate-800 rounded w-24" />
                        <div className="h-16 bg-slate-300 dark:bg-slate-800 rounded-3xl rounded-tl-none w-64" />
                      </div>
                    </div>
                  </div>
                  {/* Right (user) bubble skeleton */}
                  <div className="flex justify-end animate-pulse">
                    <div className="flex items-start gap-3.5 max-w-[70%]">
                      <div className="space-y-2">
                        <div className="h-14 bg-slate-300 dark:bg-slate-800 rounded-3xl rounded-tr-none w-52" />
                      </div>
                      <div className="h-10 w-10 bg-slate-300 dark:bg-slate-800 rounded-full shrink-0" />
                    </div>
                  </div>
                  {/* Left (companion) bubble skeleton */}
                  <div className="flex justify-start animate-pulse">
                    <div className="flex items-start gap-3.5 max-w-[70%]">
                      <div className="h-10 w-10 bg-slate-300 dark:bg-slate-800 rounded-full shrink-0" />
                      <div className="space-y-2">
                        <div className="h-20 bg-slate-300 dark:bg-slate-800 rounded-3xl rounded-tl-none w-80" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Message Streams */
                <AnimatePresence initial={false}>
                {messages.map((msg, index) => {
                  const isUser = msg.sender === 'user';
                  const isEditing = editingMessageId === msg.id;
                  const isCopied = copiedMessageId === msg.id;
                  
                  // Lookup persona associated with message
                  const msgPersona = isUser ? (userPersonas.find(p => p.id === msg.userPersonaId) || activePersona) : null;

                  return (
                    <motion.div
                      key={msg.id || index}
                      id={`message-bubble-${index}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div className={`flex items-start gap-3.5 max-w-[85%] sm:max-w-[75%] ${isUser ? 'flex-row-reverse' : ''}`}>
                        
                        {/* Flanking Avatar */}
                        {!isUser ? (
                          <img
                            src={activeChar?.avatarUrl || ''}
                            alt={activeChar?.name || 'Companion'}
                            className="h-10 w-10 rounded-full object-cover border border-indigo-500/10 shrink-0 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <img
                            src={msgPersona ? msgPersona.avatarUrl : (user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80')}
                            alt={msgPersona ? msgPersona.name : (user?.username || 'You')}
                            className="h-10 w-10 rounded-full object-cover border border-indigo-500/30 shrink-0 shadow-md"
                          />
                        )}

                        <div className="space-y-1.5 flex-1 min-w-0">
                          {/* Sender meta metadata headers */}
                          <div className={`flex items-center gap-2 px-1 text-[10px] text-gray-500 font-mono ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <span className="font-extrabold">
                              {isUser ? (msgPersona ? msgPersona.name : (user?.username || 'You')) : activeChar?.name}
                            </span>
                            {isUser && msgPersona && (
                              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1 py-0.2 rounded border border-indigo-500/10">Persona</span>
                            )}
                          </div>

                          <div className="relative">
                            {/* Rich bubble content formatting */}
                            <div className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-xs relative group-hover:shadow-sm transition-all ${
                              isUser
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : isDark
                                  ? 'bg-gray-900 border border-gray-800 text-gray-100 rounded-tl-none'
                                  : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none'
                            }`}>
                              
                              {/* Attached roleplay thumbnail representation */}
                              {msg.image && (
                                <div className="mb-2.5 rounded-xl overflow-hidden max-w-xs border border-white/10">
                                  <img src={msg.image} alt="Roleplay context" className="w-full object-cover max-h-48" />
                                </div>
                              )}

                              {isEditing ? (
                                <div className="space-y-2">
                                  <textarea
                                    value={editMessageText}
                                    onChange={(e) => setEditMessageText(e.target.value)}
                                    className="w-full p-2.5 bg-black/20 text-white border border-white/10 rounded-xl text-xs focus:outline-none focus:border-white"
                                    rows={3}
                                  />
                                  <div className="flex items-center justify-end space-x-2">
                                    <button 
                                      onClick={() => setEditingMessageId(null)}
                                      className="px-2.5 py-1 rounded-lg bg-white/10 text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      Cancelar
                                    </button>
                                    <button 
                                      onClick={() => handleSubmitEditMessage(msg.id)}
                                      className="px-3 py-1 rounded-lg bg-white text-indigo-900 text-[10px] font-bold cursor-pointer"
                                    >
                                      Salvar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="markdown-body prose prose-invert max-w-none prose-sm">
                                  <Markdown>{msg.content}</Markdown>
                                </div>
                              )}
                            </div>

                            {/* Floating hover control bar */}
                            {!isEditing && (
                              <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-0.5 p-1 bg-opacity-95 backdrop-blur rounded-xl border shadow-md z-10 transition-all ${
                                isUser 
                                  ? 'right-full mr-2' 
                                  : 'left-full ml-2'
                              } ${
                                isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-slate-200'
                              }`}>
                                <button
                                  onClick={() => handleCopyMessage(msg.id, msg.content)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                  }`}
                                  title="Copiar conteúdo"
                                >
                                  {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                                </button>
                                
                                {isUser && (
                                  <button
                                    onClick={() => {
                                      setEditingMessageId(msg.id);
                                      setEditMessageText(msg.content);
                                    }}
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                      isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                                    }`}
                                    title="Editar diálogo"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </button>
                                )}

                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                    isDark ? 'text-gray-400 hover:text-red-400 hover:bg-red-950/20' : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                                  }`}
                                  title="Excluir mensagem"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              )}

              {/* Glowing animated typing indicator */}
              {loadingReply && !isHistoryLoading && (
                <motion.div 
                  id="ai-typing-indicator" 
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-start gap-3.5 max-w-[80%]">
                    <img
                      src={activeChar?.avatarUrl || ''}
                      alt={activeChar?.name || 'Companion'}
                      className="h-10 w-10 rounded-full object-cover border border-indigo-500/10 shrink-0 shadow-sm animate-pulse"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`p-4 rounded-3xl rounded-tl-none flex items-center space-x-1.5 border ${
                      isDark ? 'bg-gray-900 border-gray-800' : 'bg-slate-100 border-slate-200'
                    }`}>
                      <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick multi-turn response regenerator action bar */}
            {messages.length > 1 && !loadingReply && (
              <div className="py-2.5 flex justify-center bg-transparent shrink-0">
                <button
                  onClick={handleRegenerateResponse}
                  className={`px-4 py-2 rounded-full border text-[10px] font-extrabold uppercase tracking-widest flex items-center space-x-2 transition-all shadow-xs cursor-pointer ${
                    isDark 
                      ? 'bg-gray-950 hover:bg-gray-900 border-gray-900 text-gray-400 hover:text-indigo-400' 
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 hover:text-indigo-600'
                  }`}
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Regerar Resposta</span>
                </button>
              </div>
            )}

            {/* Form Input Deck */}
            <div className={`p-3.5 border-t backdrop-blur-md transition-colors shrink-0 relative ${
              isDark ? 'bg-[#0b141a] border-gray-900/80' : 'bg-[#f0f2f5] border-slate-200/60'
            }`}>
              
              {/* Floating Emojis list panel */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className={`absolute bottom-16 left-4 border rounded-2xl p-3 shadow-2xl z-40 w-60 select-none ${
                        isDark ? 'bg-[#202c33] border-[#222e35]' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="grid grid-cols-6 gap-2 text-center text-lg">
                        {['😊', '😂', '😍', '👍', '✨', '🔥', '❤️', '🧙', '🗡️', '🛸', '🧬', '🦊', '💬', '🌟', '👻', '👑', '🎉', '💡'].map(emoji => (
                          <button
                            key={`emoji-${emoji}`}
                            type="button"
                            onClick={() => {
                              setInputText(prev => prev + emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-transform hover:scale-110 cursor-pointer text-base sm:text-lg"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* Image attachment deck bar preview */}
              {attachedImageBase64 && (
                <div className="max-w-3xl mx-auto mb-3 flex items-center space-x-3 bg-indigo-950/20 p-2 rounded-xl border border-indigo-500/20">
                  <div className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-800 shrink-0">
                    <img src={attachedImageBase64} alt="Attachment thumbnail" className="h-full w-full object-cover" />
                    <button 
                      type="button" 
                      onClick={handleRemoveAttachedImage}
                      className="absolute top-0 right-0 p-0.5 bg-red-600 text-white rounded-bl-lg"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-indigo-400">Referência de Imagem Atrelada</p>
                    <p className="text-gray-500 text-[10px]">Será enviada com o seu próximo diálogo</p>
                  </div>
                </div>
              )}

              <div className="max-w-3xl mx-auto flex items-center space-x-2 relative">
                
                {/* Paperclip upload button */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAttachedImageChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                <div className="flex items-center space-x-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer"
                    title="Inserir Emoji"
                  >
                    <Smile className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleAttachImageClick}
                    className={`p-2.5 rounded-full transition-colors cursor-pointer ${
                      attachedImageBase64 
                        ? 'text-[#00af9c]' 
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                    title="Anexar Imagem de Contexto"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                </div>

                {/* Auto-growing Textarea Input */}
                <textarea
                  id="chat-message-input"
                  placeholder={`Mensagem para ${activeChar?.name}...`}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={1}
                  disabled={loadingReply}
                  className={`flex-1 max-h-32 py-2.5 px-4 rounded-2xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-medium resize-none overflow-y-auto scrollbar-none ${
                    isDark 
                      ? 'bg-[#2a3942] border-[#2a3942] text-gray-100 placeholder-gray-400 focus:border-indigo-500' 
                      : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-indigo-500'
                  }`}
                />
                
                {/* Voice recording hover feedback simulator button */}
                <button
                  type="button"
                  className="group relative p-2.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-emerald-500 transition-colors cursor-pointer shrink-0"
                  title="Enviar Áudio (Simulação)"
                >
                  <Mic className="h-5 w-5" />
                  <span className="pointer-events-none absolute bottom-12 right-0 scale-0 group-hover:scale-100 transition-all origin-bottom bg-[#202c33] border border-gray-700 text-[10px] text-white px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-xl z-20 font-mono">
                    Gravador de voz pronto
                  </span>
                </button>

                <button
                  id="send-message-btn"
                  onClick={handleSendMessage}
                  disabled={(!inputText.trim() && !attachedImageBase64) || loadingReply}
                  className="p-3 rounded-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white shadow-md flex items-center justify-center transition-all cursor-pointer shrink-0"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="max-w-3xl mx-auto flex items-center justify-between text-[9px] text-gray-500 mt-2 px-1 font-mono uppercase tracking-wide">
                <span>Interpretando como {activePersona ? activePersona.name : 'Perfil Padrão'}</span>
                <span>Enter para enviar • Shift+Enter para quebrar linha</span>
              </div>
            </div>
          </div>

          {/* RIGHT DRAWER: Cognitive Memory layers & Core Blueprint settings */}
          <AnimatePresence>
            {showDetailSheet && activeChar && (
              <>
                {/* Backdrop drawer overlay on mobile */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDetailSheet(false)}
                  className="fixed inset-0 bg-black/75 backdrop-blur-xs z-30 md:hidden"
                />

                <motion.div
                  id="character-detail-sheet"
                  initial={{ x: '100%', opacity: 0.9 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0.9 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                  className={`fixed md:relative right-0 top-0 bottom-0 h-full w-80 border-l flex flex-col shrink-0 overflow-y-auto z-40 md:z-auto shadow-2xl md:shadow-none transition-colors ${
                    isDark ? 'bg-[#060a13] border-gray-950/80' : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  <div className={`p-4 border-b flex items-center justify-between ${
                    isDark ? 'border-gray-900 bg-[#060a13]' : 'border-slate-100 bg-slate-50'
                  }`}>
                    <span className="font-extrabold text-xs uppercase font-mono tracking-wider text-gray-500">Ficha do Companheiro</span>
                    <button
                      id="close-detail-sheet-btn"
                      onClick={() => setShowDetailSheet(false)}
                      className={`p-1.5 rounded-lg border hover:bg-opacity-10 cursor-pointer ${
                        isDark ? 'text-gray-400 border-gray-800 hover:text-white' : 'text-slate-500 border-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Banner image layout */}
                  <div className="relative h-28 w-full bg-slate-900 overflow-hidden shrink-0">
                    <img 
                      src={activeChar.bannerUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80'} 
                      alt="Companion Banner decoration" 
                      className="w-full h-full object-cover opacity-50"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`absolute inset-0 bg-gradient-to-t via-transparent ${isDark ? 'from-[#060a13]' : 'from-white'}`} />
                    
                    {/* Public / Private Badge lock */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wider font-mono backdrop-blur-md border ${
                        activeChar.isPublic !== false
                          ? 'bg-emerald-950/50 border-emerald-500/20 text-emerald-400'
                          : 'bg-amber-950/50 border-amber-500/20 text-amber-400'
                      }`}>
                        {activeChar.isPublic !== false ? (
                          <>
                            <Globe className="h-2.5 w-2.5" />
                            <span>Público</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-2.5 w-2.5" />
                            <span>Privado</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 pb-6 space-y-5 relative -mt-10">
                    {/* Companion info */}
                    <div className="text-center relative z-10">
                      <img
                        src={activeChar.avatarUrl}
                        alt={activeChar.name}
                        className={`h-20 w-20 rounded-full object-cover mx-auto shadow-xl ${isDark ? 'border-4 border-[#060a13]' : 'border-4 border-white'}`}
                        referrerPolicy="no-referrer"
                      />
                      <h4 className="font-extrabold text-lg mt-3">{activeChar.name}</h4>
                      <p className="text-xs text-indigo-400 font-mono mt-0.5">{activeChar.tagline}</p>
                    </div>

                    <div className="space-y-4 pt-1">
                      {/* Genre archetype tag */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Categoria</span>
                        <div className="mt-1">
                          <span className={`inline-block px-2.5 py-0.5 border rounded-lg text-xs font-bold uppercase ${
                            isDark ? 'bg-gray-900 border-gray-800 text-gray-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            {activeChar.category}
                          </span>
                        </div>
                      </div>

                      {/* Associated Tags */}
                      {activeChar.tags && activeChar.tags.trim() && (
                        <div>
                          <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Tags / Descritores</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {activeChar.tags.split(',').map((tag, idx) => {
                              const cleaned = tag.trim();
                              if (!cleaned) return null;
                              return (
                                <span 
                                  key={idx}
                                  className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[9px] font-semibold ${
                                    isDark ? 'bg-gray-900 border-gray-800 text-gray-400' : 'bg-slate-100 border-slate-200 text-slate-600'
                                  }`}
                                >
                                  <Tag className="h-2.5 w-2.5 text-gray-500" />
                                  <span>{cleaned}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Character description bio */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Biografia / História</span>
                        <p className={`text-xs leading-relaxed mt-1 p-3 rounded-xl border ${
                          isDark ? 'bg-gray-950/50 border-gray-900 text-gray-400' : 'bg-slate-50 border-slate-100 text-slate-600'
                        }`}>
                          {activeChar.description}
                        </p>
                      </div>

                      {/* System behavior rules */}
                      <div>
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Diretrizes do Prompt de Sistema</span>
                        <p className="text-[11px] text-indigo-400 leading-relaxed mt-1 bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl font-mono">
                          {activeChar.systemPrompt}
                        </p>
                      </div>

                      {/* DYNAMIC RELATIONSHIP & MEMORY ENGINE VISUALS */}
                      <div className="border-t border-gray-950 pt-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                            <Brain className="h-4 w-4 text-indigo-500" />
                            <span>FORJA DE MEMÓRIA COGNITIVA</span>
                          </span>
                          <button 
                            onClick={fetchCharacterMemory}
                            disabled={syncingMemory}
                            className={`p-1 rounded-md border hover:bg-opacity-10 cursor-pointer ${
                              isDark ? 'text-gray-500 border-gray-800 hover:text-white' : 'text-slate-500 border-slate-200 hover:text-slate-900'
                            }`}
                            title="Recalcular memórias cognitivas dinâmicas"
                          >
                            <RefreshCw className={`h-3 w-3 ${syncingMemory ? 'animate-spin' : ''}`} />
                          </button>
                        </div>

                        {activeCharMemory ? (
                          <div className="space-y-3.5">
                            {/* Relationship stats */}
                            <div className={`border rounded-2xl p-3 ${isDark ? 'bg-gray-950/30 border-gray-900' : 'bg-slate-50 border-slate-150'}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 font-mono uppercase">
                                  <Heart className="h-3 w-3 text-rose-500 fill-rose-500/15" />
                                  Status do Relacionamento
                                </span>
                                <span className="text-xs font-black text-rose-500">
                                  {activeCharMemory.relationshipStatus || 'Estranho'}
                                </span>
                              </div>
                              <div className={`w-full h-1.5 rounded-full overflow-hidden mb-1 ${isDark ? 'bg-gray-900' : 'bg-slate-200'}`}>
                                <div 
                                  className="h-full bg-gradient-to-r from-rose-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                                  style={{ width: `${activeCharMemory.relationshipScore || 10}%` }}
                                />
                              </div>
                              <div className="flex items-center justify-between text-[9px] text-gray-500 font-mono">
                                <span>Nível de Confiança</span>
                                <span>{activeCharMemory.relationshipScore || 10}/100</span>
                              </div>
                            </div>

                            {/* Recalled user biography context */}
                            <div className={`border rounded-2xl p-3 ${isDark ? 'bg-gray-950/30 border-gray-900' : 'bg-slate-50 border-slate-150'}`}>
                              <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mb-1.5 font-mono uppercase tracking-wider">
                                <UserCheck className="h-3 w-3 text-indigo-400" />
                                Fatos Lembrados sobre o Usuário
                              </span>
                              <p className="text-[11px] leading-relaxed text-gray-400 font-mono italic">
                                {activeCharMemory.userMemory || "Nenhum fato registrado explicitamente ainda. Continue conversando para atualizar as memórias automaticamente."}
                              </p>
                            </div>

                            {/* Companion private notes summary */}
                            <div className={`border rounded-2xl p-3 ${isDark ? 'bg-gray-950/30 border-gray-900' : 'bg-slate-50 border-slate-150'}`}>
                              <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1 mb-1.5 font-mono uppercase tracking-wider">
                                <Bookmark className="h-3 w-3 text-purple-400" />
                                Resumo do Histórico de Conversas
                              </span>
                              <p className="text-[11px] leading-relaxed text-gray-400 font-mono italic">
                                {activeCharMemory.conversationSummary || "Nenhum resumo disponível ainda. Continue conversando para sintetizar a história."}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-xs font-mono">
                            Banco de dados de memória dormente. Continue conversando para registrar pensamentos.
                          </div>
                        )}
                      </div>

                      {/* Custom Companion Editing options */}
                      {activeChar.isCustom && (
                        <div className="border-t border-gray-950 pt-5 space-y-2">
                          <button
                            onClick={() => {
                              // Set forms fields
                              setCharName(activeChar.name);
                              setCharTagline(activeChar.tagline);
                              setCharDesc(activeChar.description);
                              setCharPrompt(activeChar.systemPrompt);
                              setCharInitial(activeChar.initialMessage);
                              setCharCategory(activeChar.category);
                              setCharAvatar(activeChar.avatarUrl);
                              setCharBanner(activeChar.bannerUrl || '');
                              setCharIsPublic(activeChar.isPublic !== false);
                              setCharTags(activeChar.tags || '');
                              setEditingCharacterId(activeChar.id);
                              setShowCreateModal(true);
                            }}
                            className="w-full py-2 rounded-xl text-xs font-bold border border-gray-800 text-gray-400 hover:text-white flex items-center justify-center space-x-1 hover:border-indigo-500/20"
                          >
                            <Edit className="h-3.5 w-3.5" />
                            <span>Modificar Configuração</span>
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm(`Remover ${activeChar.name} inteiramente do seu painel? Esta ação é irreversível.`)) {
                                await onDeleteCharacter(activeChar.id);
                                setShowDetailSheet(false);
                              }
                            }}
                            className="w-full py-2 rounded-xl text-xs font-bold bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white flex items-center justify-center space-x-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Excluir Companheiro</span>
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

      {/* SHARE TIMELINE MODAL */}
      <AnimatePresence>
        {showShareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className={`w-full max-w-sm rounded-2xl p-6 border shadow-2xl ${
                isDark ? 'bg-gray-950 border-gray-800' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-sm">Compartilhar Diálogo Narrativo</span>
                <button onClick={() => setShowShareModal(false)} className="p-1 text-gray-400 hover:text-white cursor-pointer">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  Exporte este link de histórico de diálogo para redes sociais para que outros leitores possam ler e continuar a conversa.
                </p>

                <div className="p-3 bg-indigo-950/15 rounded-xl border border-indigo-900/10 text-xs font-mono text-indigo-300 break-all select-all">
                  https://odyssey.ai/share/dialogue/{activeChar?.id || 'null'}
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`Ei! Participe da minha conversa dinâmica de RPG com ${activeChar?.name} no Odyssey.AI: https://odyssey.ai/share/dialogue/${activeChar?.id}`);
                    alert('Link de compartilhamento copiado para a área de transferência!');
                    setShowShareModal(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 font-bold text-xs cursor-pointer shadow-md shadow-indigo-600/15"
                >
                  Copiar Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE OR MODIFY COMPANION CONFIGURATION MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-lg border rounded-3xl p-6 my-8 shadow-2xl relative ${
                isDark ? 'bg-gray-950 border-gray-800 text-gray-100' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <button
                onClick={() => setShowCreateModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full border border-gray-800 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="mb-5">
                <h3 className="font-extrabold text-lg flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  <span>{editingCharacterId ? 'Modificar Arquétipo de Companheiro' : 'Forjar Novo Companheiro Personalizado'}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">Especifique as diretrizes do comportamento do sistema, maneirismos de personalidade e mensagens iniciais.</p>
              </div>

              {createError && (
                <div className="mb-4 p-3 rounded-xl border border-red-900/35 bg-red-950/15 text-red-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateCustomCharacterSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 scrollbar-thin">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Nome do Companheiro *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex. Eldrin Spellforge"
                      value={charName}
                      onChange={(e) => setCharName(e.target.value)}
                      className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                        isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Slogan / Descrição Curta *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex. Mestre Alquimista dos Feitiços"
                      value={charTagline}
                      onChange={(e) => setCharTagline(e.target.value)}
                      className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                        isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Categoria de Gênero</label>
                    <select
                      value={charCategory}
                      onChange={(e) => setCharCategory(e.target.value)}
                      className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                        isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <option value="Sci-Fi">Sci-Fi</option>
                      <option value="Fantasy">Fantasy</option>
                      <option value="Anime">Anime</option>
                      <option value="Historical">Historical</option>
                      <option value="Mystery">Mystery</option>
                      <option value="Helper">Helper</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Tags do Companheiro (separadas por vírgula)</label>
                    <input
                      type="text"
                      placeholder="ex. sábio, mago, rpg, silencioso"
                      value={charTags}
                      onChange={(e) => setCharTags(e.target.value)}
                      className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                        isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Biografia Longa / História de Fundo</label>
                  <textarea
                    rows={2}
                    placeholder="História elaborada, lore do personagem, relacionamentos ou passado..."
                    value={charDesc}
                    onChange={(e) => setCharDesc(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Diretrizes do Prompt de Sistema *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Diretrizes estritas sobre estilo de fala: ex. Fale de forma arcaica, use asteriscos *acenando* para ações visuais, não se repita."
                    value={charPrompt}
                    onChange={(e) => setCharPrompt(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 font-mono ${
                      isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Mensagem de Saudação Inicial *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex. *Eu olho para o livro de feitiços, limpando a garganta* Saudações, que feitiços te trazem aqui?"
                    value={charInitial}
                    onChange={(e) => setCharInitial(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                {/* Avatar and banner drag or choose assets files */}
                <div className="grid grid-cols-2 gap-4 border-t border-gray-900/60 pt-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Selecionar Imagem de Avatar</label>
                    <input 
                      type="file" 
                      onChange={(e) => handleFileChange(e, 'avatar')} 
                      accept="image/*" 
                      className="text-xs text-gray-500 cursor-pointer" 
                    />
                    {charAvatar && (
                      <img src={charAvatar} alt="preview" className="h-10 w-10 rounded-full mt-2 object-cover border border-gray-800" />
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Selecionar Imagem de Banner</label>
                    <input 
                      type="file" 
                      onChange={(e) => handleFileChange(e, 'banner')} 
                      accept="image/*" 
                      className="text-xs text-gray-500 cursor-pointer" 
                    />
                    {charBanner && (
                      <img src={charBanner} alt="preview" className="h-10 w-20 rounded mt-2 object-cover border border-gray-800" />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-3 rounded-xl text-xs font-bold border border-gray-800 text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500"
                  >
                    {editingCharacterId ? 'Salvar Alterações' : 'Forjar Companheiro'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

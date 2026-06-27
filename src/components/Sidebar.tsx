import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  LogOut, 
  X,
  Heart,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  Pin,
  Users,
  Search,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  Check,
  CheckCheck,
  MoreVertical,
  Volume2
} from 'lucide-react';
import { Character, User, UserPersona } from '../types.ts';

interface SidebarProps {
  user: User | null;
  characters: Character[];
  activeCharId: string | null;
  onSelectCharacter: (charId: string) => void;
  onOpenCreateModal: () => void;
  onLogout: () => void;
  onCloseMobileSidebar?: () => void;
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

export default function Sidebar({
  user,
  characters,
  activeCharId,
  onSelectCharacter,
  onOpenCreateModal,
  onLogout,
  onCloseMobileSidebar,
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
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tudo'); // Category filter chip
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [showNewPersonaModal, setShowNewPersonaModal] = useState(false);

  // Infinite scroll simulation state
  const [loadedCount, setLoadedCount] = useState(12);

  // New Persona Form State
  const [personaName, setPersonaName] = useState('');
  const [personaAvatar, setPersonaAvatar] = useState('');
  const [personaBio, setPersonaBio] = useState('');

  const isDark = theme === 'dark';
  const activePersona = userPersonas.find(p => p.id === activePersonaId) || null;

  // Standard categories
  const categories = ['Tudo', 'Fixadas', 'Favoritos', 'Ficção Científica', 'Fantasia', 'Anime', 'Histórico', 'Mistério'];

  // Filter and sort characters based on search, active category, and pinning order
  const filteredChars = useMemo(() => {
    let result = characters.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Apply WhatsApp-style category filter chips
    if (selectedCategory === 'Fixadas') {
      result = result.filter(c => pinnedCharIds.includes(c.id));
    } else if (selectedCategory === 'Favoritos') {
      result = result.filter(c => favoriteCharIds.includes(c.id));
    } else if (selectedCategory !== 'Tudo') {
      result = result.filter(c => c.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    // Sort to keep pinned chats at the very top, just like WhatsApp!
    return [...result].sort((a, b) => {
      const aPinned = pinnedCharIds.includes(a.id) ? 1 : 0;
      const bPinned = pinnedCharIds.includes(b.id) ? 1 : 0;
      return bPinned - aPinned; // pinned first
    });
  }, [characters, searchQuery, selectedCategory, pinnedCharIds, favoriteCharIds]);

  // Infinite scroll trigger when container reaches near bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 40) {
      if (loadedCount < filteredChars.length) {
        setLoadedCount(prev => prev + 10);
      }
    }
  };

  // Create persona submit
  const handleCreatePersonaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personaName.trim()) return;
    
    onCreatePersona({
      name: personaName,
      avatarUrl: personaAvatar.trim() || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      bio: personaBio
    });

    setPersonaName('');
    setPersonaAvatar('');
    setPersonaBio('');
    setShowNewPersonaModal(false);
  };

  return (
    <aside 
      id="app-sidebar" 
      className={`h-full flex flex-col shrink-0 relative transition-all duration-300 z-30 ${
        isCollapsed ? 'w-20' : 'w-80'
      } ${
        isDark 
          ? 'bg-[#0b141a] border-r border-[#222e35] text-[#e9edef]' 
          : 'bg-white border-r border-[#e9edef] text-[#111b21]'
      }`}
    >
      {/* 1. WHATSAPP-INSPIRED HEADER BLOCK */}
      <div className={`px-4 py-3 flex items-center justify-between shrink-0 ${
        isDark ? 'bg-[#202c33]' : 'bg-[#f0f2f5]'
      }`}>
        <div className="flex items-center space-x-3 min-w-0">
          {/* User's active avatar */}
          <button 
            onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
            className="relative shrink-0 group focus:outline-none"
            title="Mudar Persona Ativa"
          >
            <img 
              src={activePersona ? activePersona.avatarUrl : (user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')} 
              alt={activePersona ? activePersona.name : 'Conta Principal'} 
              className="h-10.5 w-10.5 rounded-full object-cover border-2 border-indigo-500/60 hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#202c33] animate-pulse" />
          </button>

          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wide text-indigo-400 block font-mono leading-none">
                {activePersona ? 'Persona Ativa' : 'Perfil do usuário'}
              </span>
              <h3 className="font-extrabold text-xs truncate mt-0.5 max-w-[120px]">
                {activePersona ? activePersona.name : (user?.username || 'Visitante')}
              </h3>
            </div>
          )}
        </div>

        {/* Header Action Tools */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:block p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-indigo-400 transition-colors cursor-pointer`}
            title={isCollapsed ? "Expandir barra" : "Recolher barra"}
          >
            {isCollapsed ? <ChevronRight className="h-4.5 w-4.5" /> : <ChevronLeft className="h-4.5 w-4.5" />}
          </button>

          {!isCollapsed && (
            <>
              {/* Add Companion Button */}
              <button
                onClick={onOpenCreateModal}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-[#00a884] transition-colors cursor-pointer"
                title="Criar Novo Companheiro"
              >
                <Plus className="h-4.5 w-4.5" />
              </button>

              {/* Theme Selector */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-yellow-500 transition-colors cursor-pointer"
                title="Alternar Modo de Aparência"
              >
                {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                title="Sair"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </>
          )}

          {/* Mobile close sidebar */}
          {onCloseMobileSidebar && !isCollapsed && (
            <button 
              onClick={onCloseMobileSidebar} 
              className="p-1.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-gray-400 md:hidden"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* COLLAPSED QUICK VIEW SIDEBAR */}
      {isCollapsed ? (
        <div className="flex-1 flex flex-col items-center py-4 space-y-4 overflow-y-auto scrollbar-none select-none">
          {/* Quick Create */}
          <button
            onClick={onOpenCreateModal}
            className="p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-transform hover:scale-105"
            title="Novo Companheiro"
          >
            <Plus className="h-4 w-4" />
          </button>

          <div className="w-8 border-t border-gray-700/40 my-1" />

          {/* Quick List */}
          {filteredChars.slice(0, 10).map(char => {
            const isActive = activeCharId === char.id;
            const isPinned = pinnedCharIds.includes(char.id);
            const isFav = favoriteCharIds.includes(char.id);
            const session = sessions[char.id] || { unreadCount: 0 };

            return (
              <button
                key={`collapsed-row-${char.id}`}
                onClick={() => {
                  onSelectCharacter(char.id);
                  markSessionRead(char.id);
                }}
                className={`relative p-0.5 rounded-full border-2 transition-all cursor-pointer ${
                  isActive 
                    ? 'border-indigo-500 scale-110 shadow-lg shadow-indigo-500/10' 
                    : 'border-transparent hover:border-gray-600'
                }`}
                title={char.name}
              >
                <img src={char.avatarUrl} className="h-10 w-10 rounded-full object-cover" referrerPolicy="no-referrer" />
                {session.unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-[9px] text-white font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center border border-[#0b141a] animate-bounce">
                    {session.unreadCount}
                  </span>
                )}
                {isPinned && (
                  <div className="absolute -bottom-1 -right-1 bg-[#202c33] p-0.5 rounded-full border border-[#0b141a]">
                    <Pin className="h-2.5 w-2.5 text-indigo-400 fill-indigo-400" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <>
          {/* 2. SEARCH BOX */}
          <div className={`p-2.5 flex items-center shrink-0 border-b ${
            isDark ? 'bg-[#0b141a] border-[#222e35]' : 'bg-white border-[#f0f2f5]'
          }`}>
            <div className={`relative w-full flex items-center rounded-lg px-3 py-1.5 text-xs transition-colors ${
              isDark ? 'bg-[#202c33] text-white' : 'bg-[#f0f2f5] text-[#111b21]'
            }`}>
              <Search className="h-4 w-4 text-gray-500 shrink-0 mr-3" />
              <input
                type="text"
                placeholder="Pesquisar ou começar uma nova conversa"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none outline-none placeholder-gray-500 text-xs text-inherit focus:ring-0"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="p-0.5 rounded-full hover:bg-black/15 dark:hover:bg-white/15">
                  <X className="h-3 w-3 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* 3. CATEGORY CHIPS TAB RAIL (WhatsApp list styling) */}
          <div className={`px-3 py-2 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none select-none border-b ${
            isDark ? 'bg-[#0b141a] border-[#222e35]' : 'bg-white border-[#f0f2f5]'
          }`}>
            {categories.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={`chip-${cat}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setLoadedCount(12); // Reset scroll view count
                  }}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-all shrink-0 cursor-pointer ${
                    active
                      ? isDark 
                        ? 'bg-[#00a884] text-[#0b141a] font-extrabold shadow-sm' 
                        : 'bg-indigo-600 text-white font-extrabold shadow-sm'
                      : isDark
                        ? 'bg-[#202c33] hover:bg-[#2b3943] text-[#8696a0]'
                        : 'bg-[#f0f2f5] hover:bg-slate-200 text-[#54656f]'
                  }`}
                >
                  {cat === 'Fixadas' ? (
                    <span className="flex items-center gap-1"><Pin className="h-3 w-3 shrink-0" /> Fixadas</span>
                  ) : cat === 'Favoritos' ? (
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3 shrink-0" /> Favoritos</span>
                  ) : (
                    cat
                  )}
                </button>
              );
            })}
          </div>

          {/* 4. CONVERSATION THREAD LIST (Infinite Scroll enabled) */}
          <div 
            className="flex-1 overflow-y-auto divide-y divide-[#222e35]/30 dark:divide-[#222e35]/30 scrollbar-thin"
            onScroll={handleScroll}
          >
            {filteredChars.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500 text-xs">
                <MessageSquare className="h-8 w-8 text-gray-600 mb-2 opacity-50" />
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredChars.slice(0, loadedCount).map(char => {
                  const isActive = activeCharId === char.id;
                  const isPinned = pinnedCharIds.includes(char.id);
                  const isFav = favoriteCharIds.includes(char.id);
                  const session = sessions[char.id] || { 
                    lastMessageText: char.initialMessage, 
                    lastMessageTime: '12:00 PM', 
                    unreadCount: 0 
                  };

                  return (
                    <button
                      key={`thread-${char.id}`}
                      onClick={() => {
                        onSelectCharacter(char.id);
                        markSessionRead(char.id);
                        if (onCloseMobileSidebar) onCloseMobileSidebar();
                      }}
                      className={`w-full flex items-center space-x-3 px-3.5 py-3 text-left transition-all relative select-none border-b cursor-pointer ${
                        isActive 
                          ? isDark
                            ? 'bg-[#2a3942]' 
                            : 'bg-[#ebebeb]'
                          : isDark
                            ? 'hover:bg-[#202c33] border-[#222e35]/30'
                            : 'hover:bg-[#f0f2f5] border-[#f0f2f5]'
                      }`}
                    >
                      {/* Avatar container with status ring */}
                      <div className="relative shrink-0 select-none">
                        <img 
                          src={char.avatarUrl} 
                          alt={char.name} 
                          className="h-12 w-12 rounded-full object-cover border border-[#8696a0]/20"
                          referrerPolicy="no-referrer"
                        />
                        {/* Status Ring / Bouncing typing indicator */}
                        <span className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 ${
                          isActive && isDark ? 'border-[#2a3942]' : isDark ? 'border-[#0b141a]' : 'border-white'
                        } bg-emerald-500`} />
                      </div>

                      {/* Thread Details */}
                      <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm truncate pr-2 ${
                            session.unreadCount > 0 ? 'font-black text-white dark:text-white' : 'font-semibold'
                          }`}>{char.name}</span>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          {/* Snippet message text */}
                          <p className={`text-xs truncate mr-2 pr-1 ${
                            session.unreadCount > 0 
                              ? 'text-[#e9edef] dark:text-[#f0f2f5] font-bold' 
                              : isDark ? 'text-[#8696a0]' : 'text-[#667781]'
                          }`}>
                            {session.lastMessageText}
                          </p>

                          {/* Pin / Heart / Unread Badges */}
                          <div className="flex items-center space-x-1 shrink-0">
                            {isPinned && (
                              <Pin className={`h-3 w-3 rotate-45 ${
                                isDark ? 'text-indigo-400 fill-indigo-400' : 'text-indigo-600 fill-indigo-600'
                              }`} />
                            )}
                            {isFav && (
                              <Heart className="h-3 w-3 text-rose-500 fill-rose-500" />
                            )}
                            {session.unreadCount > 0 && (
                              <span className="bg-emerald-500 text-[10px] text-white dark:text-[#0b141a] font-extrabold h-4.5 w-4.5 rounded-full flex items-center justify-center select-none shadow-sm shadow-emerald-500/10">
                                {session.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
                {loadedCount < filteredChars.length && (
                  <div className="py-2.5 text-center text-[10px] text-gray-500 animate-pulse">
                    Rolando para carregar mais...
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* 5. ACTIVE PERSONA SWITCHER OVERLAY DROPDOWN (FOOTER) */}
      {!isCollapsed && (
        <AnimatePresence>
          {showPersonaDropdown && (
            <>
              {/* Backing dismiss overlay */}
              <div className="fixed inset-0 z-40" onClick={() => setShowPersonaDropdown(false)} />
              
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`absolute bottom-16 left-3 right-3 border rounded-2xl p-3 shadow-2xl z-50 overflow-hidden space-y-2 select-none ${
                  isDark ? 'bg-[#202c33] border-[#222e35]' : 'bg-white border-slate-200'
                }`}
              >
                <div className="p-1 pb-2 border-b border-gray-700/30 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Personas de Roleplay</span>
                  <button
                    onClick={() => {
                      setShowPersonaDropdown(false);
                      setShowNewPersonaModal(true);
                    }}
                    className="text-[10px] font-black text-indigo-500 hover:text-indigo-400 uppercase tracking-wider"
                  >
                    + Nova
                  </button>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {/* Default main account */}
                  <button
                    onClick={() => {
                      onSelectPersona(null);
                      setShowPersonaDropdown(false);
                    }}
                    className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                      activePersonaId === null 
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/25' 
                        : isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-extrabold text-[9px] flex items-center justify-center shrink-0">
                      {user ? user.username.substring(0, 2).toUpperCase() : 'ME'}
                    </div>
                    <span className="font-semibold truncate">Perfil Padrão ({user?.username || 'Você'})</span>
                  </button>

                  {/* Persona list items */}
                  {userPersonas.map(p => (
                    <button
                      key={p.id}
                      onClick={() => {
                        onSelectPersona(p.id);
                        setShowPersonaDropdown(false);
                      }}
                      className={`w-full flex items-center space-x-2.5 p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                        activePersonaId === p.id 
                          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/25' 
                          : isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <img src={p.avatarUrl} alt={p.name} className="h-6 w-6 rounded-full object-cover shrink-0" />
                      <span className="font-semibold truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      )}

      {/* NEW USER PERSONA MODAL */}
      <AnimatePresence>
        {showNewPersonaModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm border rounded-2xl p-5 shadow-2xl select-none ${
                isDark ? 'bg-[#202c33] border-[#222e35]' : 'bg-white border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-extrabold text-sm">Forjar Nova Persona de RPG</span>
                <button onClick={() => setShowNewPersonaModal(false)} className="p-1 text-gray-400 hover:text-gray-300">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreatePersonaSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Nome da Persona *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Mago Aprendiz, Renegada Cyberpunk"
                    value={personaName}
                    onChange={(e) => setPersonaName(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">URL do Avatar</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={personaAvatar}
                    onChange={(e) => setPersonaAvatar(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-500 mb-1">Biografia Curta / Fatos Core</label>
                  <textarea
                    rows={3}
                    placeholder="Fatos e contexto sobre você para o companheiro se lembrar nas conversas..."
                    value={personaBio}
                    onChange={(e) => setPersonaBio(e.target.value)}
                    className={`w-full p-2.5 border rounded-xl text-xs focus:outline-none focus:border-indigo-500 ${
                      isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-slate-50 border-slate-200'
                    }`}
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPersonaModal(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-bold border border-gray-600/40 text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    Forjar Persona
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </aside>
  );
}

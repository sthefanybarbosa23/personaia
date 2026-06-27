import React from 'react';
import { 
  Sparkles, 
  MessageSquare, 
  Plus, 
  LogOut, 
  User as UserIcon, 
  Compass, 
  BookOpen, 
  Settings,
  X
} from 'lucide-react';
import { Character, User } from '../types.ts';

interface SidebarProps {
  user: User | null;
  characters: Character[];
  activeCharId: string | null;
  onSelectCharacter: (charId: string) => void;
  onOpenCreateModal: () => void;
  onLogout: () => void;
  onCloseMobileSidebar?: () => void;
}

export default function Sidebar({
  user,
  characters,
  activeCharId,
  onSelectCharacter,
  onOpenCreateModal,
  onLogout,
  onCloseMobileSidebar
}: SidebarProps) {
  // Categorize standard vs custom
  const premadeCharacters = characters.filter(c => !c.isCustom);
  const customCharacters = characters.filter(c => c.isCustom);

  return (
    <aside id="app-sidebar" className="w-80 h-full bg-gray-950 border-r border-gray-900 flex flex-col text-gray-100 shrink-0">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/10">
            <Sparkles className="h-4.5 w-4.5 text-indigo-100" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            AI Roleplay Hub
          </span>
        </div>
        {onCloseMobileSidebar && (
          <button 
            id="close-mobile-sidebar-btn"
            onClick={onCloseMobileSidebar} 
            className="md:hidden p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-900 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Quick Action: New Custom Character */}
      <div className="p-4">
        <button
          id="sidebar-create-character-btn"
          onClick={() => {
            onOpenCreateModal();
            if (onCloseMobileSidebar) onCloseMobileSidebar();
          }}
          className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 font-semibold text-sm text-white shadow-lg shadow-indigo-600/15 flex items-center justify-center space-x-2 transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          <span>Create Custom Persona</span>
        </button>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-4 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
        {/* Active Chats / Custom Personas */}
        {customCharacters.length > 0 && (
          <div>
            <div className="px-3 mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">My Custom Archetypes</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-full font-mono font-bold">
                {customCharacters.length}
              </span>
            </div>
            <div className="space-y-1">
              {customCharacters.map(char => {
                const isActive = activeCharId === char.id;
                return (
                  <button
                    key={char.id}
                    id={`sidebar-char-${char.id}`}
                    onClick={() => {
                      onSelectCharacter(char.id);
                      if (onCloseMobileSidebar) onCloseMobileSidebar();
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 relative group ${
                      isActive 
                        ? 'bg-gradient-to-r from-indigo-950/40 to-purple-950/15 border border-indigo-500/30 text-indigo-100 shadow-lg shadow-indigo-950/20' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-900/60 border border-transparent'
                    }`}
                  >
                    {/* Active dynamic accent pill */}
                    {isActive && (
                      <span className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-md" />
                    )}

                    <img 
                      src={char.avatarUrl} 
                      alt={char.name} 
                      className={`h-9 w-9 rounded-xl object-cover shrink-0 transition-transform duration-300 ${
                        isActive ? 'scale-105 border border-indigo-500/40 shadow-md shadow-indigo-500/10' : 'border border-gray-800/80 group-hover:scale-105'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-sm truncate block ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{char.name}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/10 font-mono scale-90">Custom</span>
                      </div>
                      <span className="text-xs text-gray-500 truncate block font-light mt-0.5">{char.tagline}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Premade Cast */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 font-mono">Available Companions</span>
            <span className="text-[10px] bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded-full font-mono">
              {premadeCharacters.length}
            </span>
          </div>
          <div className="space-y-1">
            {premadeCharacters.map(char => {
              const isActive = activeCharId === char.id;
              return (
                <button
                  key={char.id}
                  id={`sidebar-char-${char.id}`}
                  onClick={() => {
                    onSelectCharacter(char.id);
                    if (onCloseMobileSidebar) onCloseMobileSidebar();
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 relative group ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-950/40 to-purple-950/15 border border-indigo-500/30 text-indigo-100 shadow-lg shadow-indigo-950/20' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-900/60 border border-transparent'
                  }`}
                >
                  {/* Active dynamic accent pill */}
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-md" />
                  )}

                  <img 
                    src={char.avatarUrl} 
                    alt={char.name} 
                    className={`h-9 w-9 rounded-xl object-cover shrink-0 transition-transform duration-300 ${
                      isActive ? 'scale-105 border border-indigo-500/40 shadow-md shadow-indigo-500/10' : 'border border-gray-800/80 group-hover:scale-105'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm truncate block ${isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>{char.name}</span>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-mono border scale-90 ${
                        isActive 
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/20' 
                          : 'bg-gray-900 text-gray-400 border-gray-800'
                      }`}>{char.category}</span>
                    </div>
                    <span className="text-xs text-gray-500 truncate block font-light mt-0.5">{char.tagline}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* User Status Profile Card Footer */}
      <div className="p-4 border-t border-gray-900 bg-gray-950/60 flex flex-col gap-3">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center border border-indigo-500/20 font-bold text-white uppercase text-sm">
            {user ? user.username.substring(0, 2) : 'TR'}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-sm text-gray-200 truncate">{user ? user.username : 'Trial Player'}</h4>
            <p className="text-xs text-gray-500 truncate">{user ? user.email : 'No saved conversations'}</p>
          </div>
        </div>
        
        <button
          id="sidebar-logout-btn"
          onClick={onLogout}
          className="w-full py-2 px-3 rounded-lg bg-gray-900 hover:bg-red-950/20 border border-gray-800 hover:border-red-900/40 text-gray-400 hover:text-red-400 font-medium text-xs flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>{user ? 'Log Out' : 'Return to Hub'}</span>
        </button>
      </div>
    </aside>
  );
}

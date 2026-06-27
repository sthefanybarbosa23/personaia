import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  Search, 
  Heart, 
  Star, 
  Compass, 
  Clock, 
  Sun, 
  Moon, 
  ArrowRight, 
  X, 
  Share2, 
  Globe, 
  Shield, 
  Zap,
  Flame,
  Award,
  BookOpen,
  ChevronRight,
  TrendingUp,
  Cpu,
  UserCheck
} from 'lucide-react';
import { Character } from '../types.ts';
import { INITIAL_CHARACTERS } from '../data.ts';

interface LandingPageProps {
  onStart: () => void;
  onSelectCharacter: (char: Character) => void;
  onLoginClick: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  favoriteCharIds: string[];
  toggleFavorite: (charId: string) => void;
  recentCharIds: string[];
}

export default function LandingPage({ 
  onStart, 
  onSelectCharacter, 
  onLoginClick,
  theme,
  toggleTheme,
  favoriteCharIds,
  toggleFavorite,
  recentCharIds
}: LandingPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCharacterProfile, setSelectedCharacterProfile] = useState<Character | null>(null);
  
  // Custom Skeleton Loading State for Instant Search
  const [isSearching, setIsSearching] = useState(false);
  
  // Lazy Loading / Infinite Scroll simulation
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Categories inspired by RPG/Gamer hubs
  const categories = ['Todos', 'Ficção Científica', 'Fantasia', 'Anime', 'Histórico', 'Mistério', 'Assistentes'];

  // Simulate instant search skeleton loader on query change
  useEffect(() => {
    if (searchQuery) {
      setIsSearching(true);
      const timer = setTimeout(() => setIsSearching(false), 500);
      return () => clearTimeout(timer);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, selectedCategory]);

  // Filter and prioritize characters
  const filteredCharacters = useMemo(() => {
    return INITIAL_CHARACTERS.filter((c: Character) => {
      const matchesCategory = selectedCategory === 'Todos' || selectedCategory === 'All' || c.category.toLowerCase() === selectedCategory.toLowerCase();
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Recents pool
  const recentCharacters = useMemo(() => {
    return INITIAL_CHARACTERS.filter((c: Character) => recentCharIds.includes(c.id));
  }, [recentCharIds]);

  // Favorites pool
  const favoriteCharacters = useMemo(() => {
    return INITIAL_CHARACTERS.filter((c: Character) => favoriteCharIds.includes(c.id));
  }, [favoriteCharIds]);

  // Trending Section
  const trendingCharacters = useMemo(() => {
    return [...INITIAL_CHARACTERS].sort((a, b) => b.chatsCount - a.chatsCount).slice(0, 4);
  }, []);

  // Recommended Section
  const recommendedCharacters = useMemo(() => {
    return INITIAL_CHARACTERS
      .filter((c: Character) => !recentCharIds.includes(c.id))
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }, [recentCharIds]);

  // Handle load more / infinite scroll simulation
  const handleLoadMore = () => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 3);
      setIsLoadingMore(false);
    }, 600);
  };

  const handleShare = (charName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`Ei! Conecte-se com este incrível companheiro de RPG IA ${charName} no Odyssey.AI!`);
    alert(`Link copiado para ${charName}!`);
  };

  const isDark = theme === 'dark';

  return (
    <div id="landing-container" className={`min-h-screen relative overflow-x-hidden transition-colors duration-500 font-sans ${
      isDark ? 'bg-[#030712] text-gray-100' : 'bg-slate-50 text-slate-800'
    }`}>
      
      {/* Decorative Fluid Orbs with Blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[25%] right-[-10%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[15%] w-[450px] h-[450px] bg-pink-500/5 rounded-full blur-[130px] pointer-events-none" />

      {/* Glassmorphic Navbar */}
      <nav id="landing-navbar" className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${
        isDark ? 'bg-[#030712]/75 border-gray-900/80' : 'bg-white/75 border-slate-200/80'
      } px-4 lg:px-8 py-3.5`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-black text-xl tracking-tight bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Odyssey.AI
            </span>
            <span className={`text-[9px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full font-bold ${
              isDark ? 'bg-indigo-950/50 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
            }`}>
              RPG Sandbox
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick theme toggler */}
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                isDark 
                  ? 'bg-gray-950 border-gray-800 text-yellow-400 hover:bg-gray-900' 
                  : 'bg-white border-slate-200 text-indigo-600 hover:bg-slate-100'
              }`}
              title="Toggle Light/Dark Theme"
            >
              {isDark ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </button>

            <button 
              onClick={onLoginClick}
              className={`px-4 py-2 text-sm font-bold transition-colors cursor-pointer ${
                isDark ? 'text-gray-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Entrar
            </button>
            <button 
              onClick={onStart}
              className="px-5 py-2.5 text-sm font-black rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
            >
              Criar Conta
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Header Space */}
      <section className="relative pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className={`inline-flex items-center space-x-2 border px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${
            isDark 
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' 
              : 'bg-indigo-50 border-indigo-100 text-indigo-600'
          }`}>
            <Zap className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
            <span>Universo IA Interativo de Múltiplos Turnos</span>
          </div>

          <h1 className="text-4xl sm:text-7xl font-extrabold tracking-tight leading-none max-w-5xl mx-auto">
            Escolha seu <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Companheiro IA
            </span>
          </h1>

          <p className={`text-sm sm:text-base max-w-2xl mx-auto leading-relaxed ${
            isDark ? 'text-gray-400' : 'text-slate-500'
          }`}>
            Mergulhe em histórias ricas com memórias de relacionamento persistentes. Troque de persona, anexe referências visuais e veja as interações evoluírem em tempo real.
          </p>

          {/* Sticky/Fixed Search Bar Section */}
          <div className="max-w-2xl mx-auto pt-4 relative z-20">
            <div className="relative group">
              <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-40 transition duration-300 pointer-events-none" />
              <div className={`relative flex items-center border rounded-2xl transition-all duration-300 ${
                isDark 
                  ? 'bg-gray-950/85 border-gray-800/90 focus-within:border-indigo-500' 
                  : 'bg-white border-slate-200 focus-within:border-indigo-500'
              }`}>
                <Search className={`h-5 w-5 ml-4 shrink-0 ${
                  isDark ? 'text-gray-500' : 'text-slate-400'
                }`} />
                <input
                  type="text"
                  placeholder="Encontre companheiros, criadores, papéis de fantasia ou instruções do sistema..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full py-4.5 px-4 bg-transparent text-sm focus:outline-none font-medium ${
                    isDark ? 'text-white placeholder-gray-500' : 'text-slate-800 placeholder-slate-400'
                  }`}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className={`p-1.5 mr-3 rounded-lg hover:bg-opacity-10 transition-colors ${
                      isDark ? 'hover:bg-white text-gray-400' : 'hover:bg-black text-slate-500'
                    }`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* HORIZONTAL TRENDING CAROUSEL */}
      {!searchQuery && (
        <section className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2.5 mb-6">
            <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
            <h2 className="text-xl font-bold tracking-tight">Personagens Populares</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {trendingCharacters.map((char) => (
              <motion.div
                key={`trend-${char.id}`}
                whileHover={{ y: -4, scale: 1.01 }}
                onClick={() => setSelectedCharacterProfile(char)}
                className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between relative overflow-hidden transition-all duration-300 group ${
                  isDark 
                    ? 'bg-gray-950/60 border-gray-900/90 hover:border-indigo-500/30 hover:bg-[#0c1222]' 
                    : 'bg-white border-slate-200/50 hover:border-indigo-300 shadow-sm'
                }`}
              >
                {/* Micro Category Tag */}
                <div className="absolute top-3 right-3">
                  <span className={`text-[8px] font-bold font-mono px-2 py-0.5 rounded-md uppercase border ${
                    isDark ? 'bg-indigo-950/50 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-100 text-indigo-600'
                  }`}>
                    {char.category}
                  </span>
                </div>

                <div className="flex items-center space-x-3.5">
                  <img
                    src={char.avatarUrl}
                    alt={char.name}
                    className="h-12 w-12 rounded-full object-cover border border-gray-800/60 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm truncate group-hover:text-indigo-400 transition-colors">{char.name}</h3>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{char.tagline}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono mt-4 pt-3 border-t border-gray-900/40">
                  <span>★ {char.rating.toFixed(2)}</span>
                  <span>{char.chatsCount.toLocaleString()} diálogos</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* DYNAMIC RECENT CHATS OR SAVED FAVORITES */}
      {recentCharacters.length > 0 && !searchQuery && (
        <section className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="flex items-center space-x-2.5 mb-5">
            <Clock className="h-5 w-5 text-indigo-400" />
            <h2 className="text-lg font-extrabold tracking-tight">Seu Histórico e Recentes</h2>
          </div>
          <div className="flex items-center space-x-3 overflow-x-auto pb-3 scrollbar-thin">
            {recentCharacters.map((char) => (
              <div
                key={`recent-${char.id}`}
                onClick={() => setSelectedCharacterProfile(char)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl border cursor-pointer shrink-0 transition-all duration-200 hover:scale-102 ${
                  isDark ? 'bg-gray-900/40 border-gray-800 text-gray-300 hover:bg-gray-900' : 'bg-white border-slate-100 shadow-xs hover:border-slate-300'
                }`}
              >
                <img src={char.avatarUrl} alt={char.name} className="h-7 w-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                <span className="text-xs font-bold">{char.name}</span>
                <ChevronRight className="h-3 w-3 text-gray-600" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CORE CAST DIRECTORY BLOCK WITH INSTANT SEARCH & SKELETON LOADERS */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div>
            <div className="flex items-center space-x-2.5">
              <Compass className="h-5 w-5 text-indigo-500" />
              <h2 className="text-2xl font-black tracking-tight">Diretório de Companheiros</h2>
            </div>
            <p className="text-xs text-gray-500 mt-1">Perfis detalhados, diretrizes avançadas e prompts pré-definidos.</p>
          </div>

          {/* Scrolling Categories Selector */}
          <div className="flex flex-wrap gap-1.5">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold tracking-wide border transition-all cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-transparent shadow-md'
                    : isDark
                      ? 'bg-gray-950/80 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Skeleton loading block trigger */}
        {isSearching ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className={`rounded-3xl p-6 border animate-pulse ${
                isDark ? 'bg-[#0b0f19]/60 border-gray-900' : 'bg-white border-slate-100'
              }`}>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-gray-800/50" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-800/50 rounded w-1/3" />
                    <div className="h-3 bg-gray-800/30 rounded w-1/2" />
                  </div>
                </div>
                <div className="space-y-2 mb-6">
                  <div className="h-3 bg-gray-800/30 rounded w-full" />
                  <div className="h-3 bg-gray-800/30 rounded w-5/6" />
                </div>
                <div className="h-8 bg-gray-800/40 rounded-xl w-1/3 ml-auto" />
              </div>
            ))}
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-16 border border-dashed rounded-3xl border-gray-800/70">
            <BookOpen className="h-10 w-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-mono">Nenhum companheiro corresponde aos filtros selecionados.</p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('Todos'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold cursor-pointer"
            >
              Redefinir Parâmetros de Busca
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCharacters.slice(0, visibleCount).map((char: Character) => {
              const isFav = favoriteCharIds.includes(char.id);
              return (
                <motion.div
                  key={char.id}
                  layoutId={`card-${char.id}`}
                  onClick={() => setSelectedCharacterProfile(char)}
                  whileHover={{ y: -5 }}
                  className={`rounded-3xl p-6 border cursor-pointer relative overflow-hidden flex flex-col justify-between transition-all duration-300 group ${
                    isDark 
                      ? 'bg-gradient-to-b from-[#0b0f19] to-gray-950/90 border-gray-900/90 hover:border-indigo-500/40 shadow-xl' 
                      : 'bg-white border-slate-200/60 hover:border-indigo-400/50 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Header: Large circular avatar + Name + Category */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="relative shrink-0">
                          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-[2px] opacity-40 group-hover:opacity-100 transition-opacity" />
                          <img
                            src={char.avatarUrl}
                            alt={char.name}
                            className="relative h-15 w-15 rounded-full object-cover border-2 border-gray-950 bg-gray-900 shadow-md"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-extrabold text-base tracking-tight truncate group-hover:text-indigo-400 transition-colors">
                            {char.name}
                          </h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider font-mono block mt-0.5 ${
                            isDark ? 'text-indigo-400' : 'text-indigo-600'
                          }`}>{char.tagline}</span>
                        </div>
                      </div>

                      {/* Favorite/Star toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(char.id);
                        }}
                        className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                          isFav
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            : isDark
                              ? 'bg-gray-900 border-gray-800 text-gray-500 hover:text-white'
                              : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
                        }`}
                        title={isFav ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                      >
                        <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-500' : ''}`} />
                      </button>
                    </div>

                    {/* Bio */}
                    <p className={`text-xs line-clamp-3 leading-relaxed ${
                      isDark ? 'text-gray-400' : 'text-slate-500'
                    }`}>
                      {char.description}
                    </p>
                  </div>

                  {/* Actions / Conversation stat */}
                  <div className="mt-6 pt-4 border-t border-gray-900/60 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">
                      ★ {char.rating.toFixed(2)} • {char.chatsCount.toLocaleString()} conversas
                    </span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => handleShare(char.name, e)}
                        className={`p-2 rounded-lg border transition-colors hover:text-indigo-400 cursor-pointer ${
                          isDark ? 'bg-gray-900 border-gray-800 text-gray-500' : 'bg-slate-50 border-slate-200 text-slate-400'
                        }`}
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCharacter(char);
                        }}
                        className="px-4 py-2 text-xs font-black rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center space-x-1 shadow-md shadow-indigo-600/10 cursor-pointer"
                      >
                        <span>Chat</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Lazy load / Infinite Scroll Trigger Button */}
        {filteredCharacters.length > visibleCount && !isSearching && (
          <div className="mt-12 flex justify-center">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className={`px-6 py-3 rounded-xl border text-xs font-bold font-mono uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
                isDark 
                  ? 'bg-gray-950 border-gray-800 text-gray-400 hover:text-white hover:bg-gray-900' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-xs'
              }`}
            >
              {isLoadingMore ? (
                <>
                  <div className="h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <span>Carregando mais companheiros...</span>
                </>
              ) : (
                <span>Carregar Mais Companheiros</span>
              )}
            </button>
          </div>
        )}
      </section>

      {/* DETAILED CHARACTER PROFILE SHEET VIEW (SISTEMA DE VISUALIZAÇÃO DE PERFIL) */}
      <AnimatePresence>
        {selectedCharacterProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
            onClick={() => setSelectedCharacterProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className={`w-full max-w-xl rounded-3xl overflow-hidden border shadow-2xl relative ${
                isDark ? 'bg-[#0a0e17] border-gray-900' : 'bg-white border-slate-200 text-slate-800'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedCharacterProfile(null)}
                className={`absolute top-4 right-4 z-10 p-2 rounded-full border backdrop-blur-md cursor-pointer ${
                  isDark ? 'bg-black/60 border-white/10 text-white hover:bg-black/80' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <X className="h-5 w-5" />
              </button>

              {/* Character Banner */}
              <div className="relative h-48 w-full bg-slate-900 overflow-hidden">
                <img 
                  src={selectedCharacterProfile.bannerUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&auto=format&fit=crop&q=80'} 
                  alt="Character Banner" 
                  className="w-full h-full object-cover opacity-50"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e17] via-[#0a0e17]/20 to-transparent" />
              </div>

              {/* Profile card details */}
              <div className="px-6 pb-6 relative -mt-16">
                <div className="flex items-end space-x-4 mb-5">
                  <img
                    src={selectedCharacterProfile.avatarUrl}
                    alt={selectedCharacterProfile.name}
                    className="h-24 w-24 rounded-full object-cover border-4 border-[#0a0e17] shadow-2xl bg-gray-950"
                    referrerPolicy="no-referrer"
                  />
                  <div className="pb-1 min-w-0 flex-1">
                    <h3 className="font-extrabold text-2xl tracking-tight text-white truncate">
                      {selectedCharacterProfile.name}
                    </h3>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5 truncate">{selectedCharacterProfile.tagline}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Category archetype list */}
                  <div className="flex items-center space-x-4">
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Arquétipo</span>
                      <div className="mt-1">
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border uppercase ${
                          isDark ? 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
                        }`}>
                          {selectedCharacterProfile.category}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest font-mono">Avaliação</span>
                      <div className="mt-1 flex items-center space-x-1 text-xs font-semibold text-amber-400">
                        <Star className="h-3.5 w-3.5 fill-amber-400" />
                        <span>{selectedCharacterProfile.rating.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono">Biografia e História</span>
                    <p className={`text-xs sm:text-sm leading-relaxed mt-1 p-3.5 rounded-2xl border ${
                      isDark ? 'bg-gray-950/40 border-gray-900 text-gray-300' : 'bg-slate-50 border-slate-100 text-slate-600'
                    }`}>
                      {selectedCharacterProfile.description}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest font-mono font-bold">Diretrizes de Comportamento</span>
                    <p className="text-[11px] leading-relaxed mt-1 bg-indigo-950/15 border border-indigo-900/10 p-3 rounded-xl font-mono text-indigo-300">
                      {selectedCharacterProfile.systemPrompt}
                    </p>
                  </div>

                  {/* Submit conversation buttons */}
                  <div className="flex items-center justify-between pt-5 border-t border-gray-900/50">
                    <div className="text-left">
                      <span className="text-[9px] block text-gray-500 uppercase tracking-wider font-mono">Estatísticas</span>
                      <span className="text-xs font-semibold text-gray-400">{selectedCharacterProfile.chatsCount.toLocaleString()} conversas ativas</span>
                    </div>

                    <button
                      onClick={() => {
                        onSelectCharacter(selectedCharacterProfile);
                        setSelectedCharacterProfile(null);
                      }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/10 flex items-center space-x-2 cursor-pointer"
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                      <span>Iniciar Conversa</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beautiful RPG Info Section */}
      <section className={`py-12 border-t transition-colors duration-300 ${
        isDark ? 'bg-gray-950/40 border-gray-900' : 'bg-white border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="h-9 w-9 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm uppercase font-mono tracking-wider">Forja de Memória Dinâmica</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Cada mensagem enviada atualiza o nível de amizade e registra fatos persistentes, construindo memórias profundas em tempo real.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-9 w-9 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center">
              <UserCheck className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm uppercase font-mono tracking-wider">Sistema de Troca de Personas</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Crie múltiplos perfis de usuário para você. Mude de perfil facilmente e veja como os companheiros reagem a origens diferentes.
            </p>
          </div>

          <div className="space-y-2">
            <div className="h-9 w-9 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center">
              <Cpu className="h-5 w-5" />
            </div>
            <h4 className="font-extrabold text-sm uppercase font-mono tracking-wider">Interface Altamente Polida</h4>
            <p className="text-xs text-gray-500 leading-relaxed">
              Curta uma experiência de RPG estilizada com elementos translúcidos, temas claro e escuro, envio de imagens e rolagem automática de conversas.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t py-12 px-4 text-center transition-colors duration-300 ${
        isDark ? 'bg-gray-950/90 border-gray-900' : 'bg-slate-100/60 border-slate-200'
      }`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-xl">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-bold tracking-tight text-sm">Odyssey.AI Hub</span>
          </div>
          <p className="text-xs text-gray-500 font-mono">
            © 2026 Odyssey.AI Sandbox. Desenvolvido com estilos visuais originais.
          </p>
        </div>
      </footer>
    </div>
  );
}

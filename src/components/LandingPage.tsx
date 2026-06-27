import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, MessageSquare, Shield, Users, Sword, Zap, ArrowRight } from 'lucide-react';
import { Character } from '../types.ts';
import { INITIAL_CHARACTERS } from '../data.ts';

interface LandingPageProps {
  onStart: () => void;
  onSelectCharacter: (char: Character) => void;
  onLoginClick: () => void;
}

export default function LandingPage({ onStart, onSelectCharacter, onLoginClick }: LandingPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const categories = ['All', 'Sci-Fi', 'Fantasy', 'Anime', 'Historical', 'Mystery'];

  const filteredCharacters = selectedCategory === 'All'
    ? INITIAL_CHARACTERS
    : INITIAL_CHARACTERS.filter(c => c.category === selectedCategory);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
  };

  return (
    <div id="landing-page" className="min-h-screen bg-[#030712] text-gray-100 overflow-x-hidden">
      {/* Decorative gradient glowing blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      
      {/* Landing Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#030712]/80 border-b border-gray-800/80 px-4 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-2 rounded-xl flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-indigo-100" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight bg-gradient-to-r from-white via-gray-100 to-indigo-400 bg-clip-text text-transparent">
              AI Roleplay Hub
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <button 
              id="nav-login-btn"
              onClick={onLoginClick}
              className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              Log In
            </button>
            <button 
              id="nav-register-btn"
              onClick={onStart}
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/30 px-3 py-1.5 rounded-full text-xs font-semibold text-indigo-400 tracking-wide uppercase mb-4">
            <Zap className="h-3 w-3" />
            <span>Interactive Multi-Genre Playgrounds</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-display font-extrabold tracking-tight text-white leading-none max-w-4xl mx-auto">
            Interact with Limitless <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
              AI Personas & Archetypes
            </span>
          </h1>

          <p className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Step beyond reality. Create, customize, and converse with high-fidelity characters, ancient wizards, cyberpunk guides, and historical visionaries.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              id="hero-get-started-btn"
              onClick={onStart}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-base shadow-xl shadow-indigo-600/30 transition-all duration-300 flex items-center justify-center space-x-2 transform hover:-translate-y-1"
            >
              <span>Begin Your Journey</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <a 
              href="#character-grid" 
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white font-semibold text-base transition-all duration-300 flex items-center justify-center"
            >
              Browse Companions
            </a>
          </div>
        </motion.div>
      </section>

      {/* Stats Board */}
      <section className="py-12 bg-gray-950/40 border-y border-gray-900">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-white font-display">100k+</p>
            <p className="text-sm text-gray-400 mt-1">Simulated Chats</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-indigo-400 font-display">4.9★</p>
            <p className="text-sm text-gray-400 mt-1">Average Companion Rating</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-purple-400 font-display">50+</p>
            <p className="text-sm text-gray-400 mt-1">Unique Pre-made Personas</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-extrabold text-emerald-400 font-display">100%</p>
            <p className="text-sm text-gray-400 mt-1">Custom Character Freedom</p>
          </div>
        </div>
      </section>

      {/* Featured Characters Section */}
      <section id="character-grid" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-white tracking-tight">
            Meet the Companions
          </h2>
          <p className="text-gray-400 mt-3 max-w-2xl mx-auto">
            Choose a starting persona below to instantly trigger a quick roleplay chat trial.
          </p>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
            {categories.map(cat => (
              <button
                key={cat}
                id={`filter-pill-${cat.toLowerCase()}`}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide border transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20'
                    : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Character Bento Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCharacters.map((char) => (
            <motion.div
              key={char.id}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-6 flex flex-col justify-between hover:border-gray-700/80 transition-all duration-300 group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div>
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={char.avatarUrl}
                    alt={char.name}
                    className="h-14 w-14 rounded-xl object-cover border border-gray-800 group-hover:border-indigo-500/40 transition-colors"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-display font-semibold text-lg text-white group-hover:text-indigo-300 transition-colors">
                        {char.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-900 text-gray-400 font-medium">
                        {char.category}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-400/90 font-mono mt-0.5">{char.tagline}</p>
                  </div>
                </div>

                <p className="text-sm text-gray-400 line-clamp-3 leading-relaxed">
                  {char.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-900/60 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-mono">
                  ★ {char.rating.toFixed(2)} • {char.chatsCount.toLocaleString()} chats
                </span>
                <button
                  onClick={() => onSelectCharacter(char)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-950 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-900/50 hover:border-indigo-500 transition-all duration-300 flex items-center space-x-1"
                >
                  <span>Chat Trial</span>
                  <MessageSquare className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Pillar Highlights */}
      <section className="py-24 bg-gray-950/20 border-t border-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white">
              Why Roleplay on our Platform?
            </h2>
            <p className="text-gray-400 mt-4 text-base">
              Engineered for absolute fidelity, our playground architecture preserves tone, context, and immersion perfectly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-gray-950/60 border border-gray-800/80 space-y-4">
              <div className="bg-indigo-600/10 text-indigo-400 p-3.5 rounded-xl w-fit">
                <Sword className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-white">Dynamic Context Memory</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Our architecture ensures that characters retain deep storyline memory, preventing repetitive loops and ensuring high immersion.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gray-950/60 border border-gray-800/80 space-y-4">
              <div className="bg-purple-600/10 text-purple-400 p-3.5 rounded-xl w-fit">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-white">Character Creator Suite</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Compose custom system guidelines, greeting dialogues, voice/mannerism cues, and upload specific background lore directly.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-gray-950/60 border border-gray-800/80 space-y-4">
              <div className="bg-emerald-600/10 text-emerald-400 p-3.5 rounded-xl w-fit">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-display font-bold text-white">Private & Secure</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your chats, custom character builds, and conversation journals belong entirely to you with strict localized privacy parameters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="border-t border-gray-900 bg-gray-950 py-12 px-4 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="font-display font-bold text-gray-200">AI Roleplay Hub</span>
          </div>
          <p className="text-xs text-gray-500">
            © 2026 AI Roleplay App. Built for deep conversational immersion.
          </p>
        </div>
      </footer>
    </div>
  );
}

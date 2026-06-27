import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, AlertCircle, ArrowLeft } from 'lucide-react';
import { User as UserType } from '../types.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';

interface AuthProps {
  onSuccess: (user: UserType, token: string) => void;
  onBack: () => void;
  initialMode?: 'login' | 'register';
  theme?: 'dark' | 'light';
}

export default function Auth({ onSuccess, onBack, theme }: AuthProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isMountedRef = React.useRef(true);

  React.useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      const token = await user.getIdToken();

      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: user.email,
          username: user.displayName || user.email?.split('@')[0],
          avatarUrl: user.photoURL
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Authentication sync failed');
      }

      if (isMountedRef.current) {
        onSuccess(data.user, token);
      }
    } catch (err: any) {
      console.error(err);
      if (isMountedRef.current) {
        setError(err.message || 'Something went wrong during sign in.');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  return (
    <div id="auth-page" className="min-h-screen bg-[#030712] text-gray-100 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <button 
        id="auth-back-btn"
        onClick={onBack}
        className="absolute top-6 left-6 flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors py-2 px-3 rounded-lg bg-gray-900/60 border border-gray-800 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Voltar para o Hub</span>
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-600/20">
            <Sparkles className="h-6 w-6 text-indigo-100 animate-pulse" />
          </div>
          <h2 className="text-3xl font-display font-bold text-white tracking-tight">
            Autenticar
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Entre para acessar seus companheiros de IA personalizados e reinos de conversa salvos.
          </p>
        </div>

        <div className="bg-gray-950/60 border border-gray-800/80 rounded-2xl p-8 backdrop-blur-md relative shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-5 flex flex-col items-center"
            >
              {error && (
                <div id="auth-error-banner" className="w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start space-x-3 text-red-400 text-sm">
                  <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-900 font-semibold text-sm shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center space-x-3 mt-2 cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 border-2 border-gray-400 border-t-gray-900 rounded-full animate-spin" />
                ) : (
                  <>
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        fill="#EA4335"
                      />
                    </svg>
                    <span>Continuar com o Google</span>
                  </>
                )}
              </button>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion'
import { Github } from 'lucide-react'

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
)

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative z-10 px-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-mochi-400 to-plasma flex items-center justify-center text-2xl"
            style={{ boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}
          >
            🎬
          </motion.div>
          <h1 className="text-4xl font-bold text-gradient font-display">Mochi Studio</h1>
          <p className="text-white/40 mt-2 text-sm">Text-to-video generation • genmo/mochi-1-preview</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8 glow-border">
          <h2 className="text-xl font-semibold text-white mb-1">Welcome back</h2>
          <p className="text-white/40 text-sm mb-8">Sign in to start generating videos</p>

          <div className="space-y-3">
            <a
              href="/api/auth/google/login"
              className="flex items-center gap-3 w-full glass border border-white/10 hover:border-white/25 rounded-xl px-5 py-4 transition-all duration-200 hover:bg-white/5 group"
            >
              <GoogleIcon />
              <span className="text-white/80 group-hover:text-white font-medium transition-colors">
                Continue with Google
              </span>
            </a>

            <a
              href="/api/auth/github/login"
              className="flex items-center gap-3 w-full glass border border-white/10 hover:border-white/25 rounded-xl px-5 py-4 transition-all duration-200 hover:bg-white/5 group"
            >
              <Github size={20} className="text-white/70" />
              <span className="text-white/80 group-hover:text-white font-medium transition-colors">
                Continue with GitHub
              </span>
            </a>
          </div>

          <p className="text-white/20 text-xs text-center mt-6">
            By signing in you agree to our Terms of Service
          </p>
        </div>

        {/* Feature hints */}
        <div className="grid grid-cols-3 gap-3 mt-6">
          {[
            { icon: '⚡', label: 'Fast queue' },
            { icon: '🎞️', label: 'HD videos' },
            { icon: '🔒', label: 'Secure' },
          ].map(({ icon, label }) => (
            <div key={label} className="glass rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{icon}</div>
              <div className="text-white/40 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

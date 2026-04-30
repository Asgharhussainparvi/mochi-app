import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { motion } from 'framer-motion'

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const setToken = useAuthStore(s => s.setToken)

  useEffect(() => {
    const token = params.get('token')
    if (token) {
      setToken(token).then(() => navigate('/dashboard', { replace: true }))
    } else {
      navigate('/login', { replace: true })
    }
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 border-2 border-plasma border-t-transparent rounded-full"
      />
    </div>
  )
}

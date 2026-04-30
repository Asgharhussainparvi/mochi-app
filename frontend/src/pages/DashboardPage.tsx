import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Zap, Film, User } from 'lucide-react'
import { videoApi, VideoJob } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import GenerateForm from '@/components/video/GenerateForm'
import JobCard from '@/components/video/JobCard'

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const qc = useQueryClient()

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: videoApi.list,
    refetchInterval: 5000,
  })

  const deleteMutation = useMutation({
    mutationFn: videoApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs'] }),
  })

  const handleJobCreated = (job: VideoJob) => {
    qc.setQueryData<VideoJob[]>(['jobs'], old => [job, ...(old || [])])
  }

  return (
    <div className="min-h-screen relative z-10">
      {/* Topbar */}
      <header className="border-b border-white/5 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mochi-400 to-plasma flex items-center justify-center text-sm">🎬</div>
            <span className="font-bold text-gradient font-display text-lg">Mochi Studio</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Credits */}
            <div className="flex items-center gap-1.5 glass rounded-lg px-3 py-1.5">
              <Zap size={13} className="text-yellow-400" />
              <span className="text-white/70 text-sm">{user?.credits ?? 0} credits</span>
            </div>

            {/* User */}
            <div className="flex items-center gap-2">
              {user?.avatar_url ? (
                <img src={user.avatar_url} className="w-7 h-7 rounded-full" alt="avatar" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-glow/30 flex items-center justify-center">
                  <User size={13} className="text-plasma" />
                </div>
              )}
              <span className="text-white/60 text-sm hidden sm:block">{user?.name || user?.email}</span>
            </div>

            <button onClick={logout} className="text-white/30 hover:text-white/70 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        {/* Left: Generate form */}
        <div className="space-y-4">
          <GenerateForm onJobCreated={handleJobCreated} />

          {/* Stats */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-white/40 text-xs font-medium uppercase tracking-wider mb-3">Your Activity</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total', value: jobs.length, icon: Film },
                { label: 'Done', value: jobs.filter(j => j.status === 'completed').length, icon: null },
                { label: 'Active', value: jobs.filter(j => ['pending','processing'].includes(j.status)).length, icon: null },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/3 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-white">{value}</div>
                  <div className="text-white/30 text-xs">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Job grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/70 font-semibold">Your Videos</h2>
            <span className="text-white/25 text-sm">{jobs.length} jobs</span>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-plasma border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!isLoading && jobs.length === 0 && (
            <div className="text-center py-20 text-white/20">
              <Film size={40} className="mx-auto mb-3 opacity-20" />
              <p>No videos yet. Generate your first!</p>
            </div>
          )}

          <AnimatePresence>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {jobs.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

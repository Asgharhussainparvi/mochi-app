import { motion } from 'framer-motion'
import { Download, Trash2, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { VideoJob, videoApi } from '@/lib/api'
import { useJobStream } from '@/hooks/useJobStream'
import clsx from 'clsx'

interface Props {
  job: VideoJob
  onDelete: (id: string) => void
}

const statusConfig = {
  pending:    { icon: Clock,        color: 'text-yellow-400',  label: 'Pending' },
  processing: { icon: Loader2,      color: 'text-plasma',      label: 'Processing' },
  completed:  { icon: CheckCircle,  color: 'text-green-400',   label: 'Completed' },
  failed:     { icon: XCircle,      color: 'text-red-400',     label: 'Failed' },
  cancelled:  { icon: XCircle,      color: 'text-white/30',    label: 'Cancelled' },
}

export default function JobCard({ job, onDelete }: Props) {
  const isActive = ['pending', 'processing'].includes(job.status)
  const stream = useJobStream(isActive ? job.id : null)

  const status = (stream?.status as VideoJob['status']) || job.status
  const progress = stream?.progress ?? job.progress
  const videoUrl = stream?.video_url || job.video_url

  const { icon: Icon, color, label } = statusConfig[status] || statusConfig.pending

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-colors"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-white/80 text-sm leading-relaxed line-clamp-2 flex-1">{job.prompt}</p>
        <div className={clsx('flex items-center gap-1.5 text-xs font-medium shrink-0', color)}>
          <Icon size={13} className={status === 'processing' ? 'animate-spin' : ''} />
          {label}
        </div>
      </div>

      {/* Progress bar */}
      {(status === 'processing' || status === 'pending') && (
        <div className="mb-3">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-glow to-plasma rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-white/30 text-xs mt-1">{progress}%</p>
        </div>
      )}

      {/* Video player */}
      {status === 'completed' && videoUrl && (
        <div className="mb-3 rounded-xl overflow-hidden bg-black aspect-video">
          <video
            src={videoUrl}
            controls
            loop
            className="w-full h-full object-contain"
          />
        </div>
      )}

      {/* Error */}
      {status === 'failed' && job.error_message && (
        <p className="text-red-400/70 text-xs mb-3 bg-red-900/10 rounded-lg p-2 border border-red-900/20">
          {job.error_message}
        </p>
      )}

      {/* Meta & actions */}
      <div className="flex items-center justify-between">
        <span className="text-white/25 text-xs font-mono">
          {new Date(job.created_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          {status === 'completed' && videoUrl && (
            <a
              href={videoApi.downloadUrl(job.id)}
              download
              className="flex items-center gap-1 text-plasma hover:text-white text-xs transition-colors"
            >
              <Download size={12} />
              Download
            </a>
          )}
          <button
            onClick={() => onDelete(job.id)}
            className="text-white/20 hover:text-red-400 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

import { useEffect, useState, useRef } from 'react'
import { videoApi } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'

interface JobProgress {
  status: string
  progress: number
  video_url?: string
  error?: string
}

export function useJobStream(jobId: string | null) {
  const [data, setData] = useState<JobProgress | null>(null)
  const token = useAuthStore(s => s.token)
  const esRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!jobId || !token) return

    const url = `${videoApi.streamUrl(jobId)}?token=${token}`
    const es = new EventSource(url)
    esRef.current = es

    es.onmessage = (e) => {
      try {
        const parsed: JobProgress = JSON.parse(e.data)
        setData(parsed)
        if (['completed', 'failed', 'cancelled'].includes(parsed.status)) {
          es.close()
        }
      } catch {}
    }

    es.onerror = () => es.close()

    return () => {
      es.close()
      esRef.current = null
    }
  }, [jobId, token])

  return data
}

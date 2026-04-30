import axios from 'axios'

export const api = axios.create({ baseURL: '/api' })

export interface VideoJob {
  id: string
  user_id: string
  prompt: string
  negative_prompt?: string
  num_frames: number
  fps: number
  guidance_scale: number
  num_inference_steps: number
  seed?: number
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  error_message?: string
  video_url?: string
  duration_seconds?: number
  created_at: string
  updated_at: string
}

export interface CreateJobPayload {
  prompt: string
  negative_prompt?: string
  num_frames?: number
  fps?: number
  guidance_scale?: number
  num_inference_steps?: number
  seed?: number
}

export const videoApi = {
  create: (payload: CreateJobPayload) =>
    api.post<VideoJob>('/videos/', payload).then(r => r.data),

  list: () =>
    api.get<VideoJob[]>('/videos/').then(r => r.data),

  get: (id: string) =>
    api.get<VideoJob>(`/videos/${id}`).then(r => r.data),

  delete: (id: string) =>
    api.delete(`/videos/${id}`),

  streamUrl: (id: string) => `/api/jobs/${id}/stream`,
  downloadUrl: (id: string) => `/api/videos/${id}/file`,
}

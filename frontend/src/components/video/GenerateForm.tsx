import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wand2, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { videoApi, CreateJobPayload, VideoJob } from '@/lib/api'

interface Props {
  onJobCreated: (job: VideoJob) => void
}

export default function GenerateForm({ onJobCreated }: Props) {
  const [prompt, setPrompt] = useState('')
  const [negPrompt, setNegPrompt] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [numFrames, setNumFrames] = useState(84)
  const [fps, setFps] = useState(24)
  const [guidanceScale, setGuidanceScale] = useState(4.5)
  const [steps, setSteps] = useState(64)
  const [seed, setSeed] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    try {
      const payload: CreateJobPayload = {
        prompt: prompt.trim(),
        negative_prompt: negPrompt.trim() || undefined,
        num_frames: numFrames,
        fps,
        guidance_scale: guidanceScale,
        num_inference_steps: steps,
        seed: seed ? parseInt(seed) : undefined,
      }
      const job = await videoApi.create(payload)
      onJobCreated(job)
      setPrompt('')
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to create job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6 glow-border">
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Wand2 size={18} className="text-plasma" />
        Generate Video
      </h2>

      {/* Main prompt */}
      <textarea
        className="input-field mb-3"
        rows={4}
        placeholder="Describe your video... e.g. 'A cinematic shot of waves crashing on a rocky shore at sunset, slow motion'"
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        disabled={loading}
      />

      {/* Advanced toggle */}
      <button
        onClick={() => setShowAdvanced(v => !v)}
        className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-sm transition-colors mb-3"
      >
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        Advanced settings
      </button>

      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 mb-3">
              <textarea
                className="input-field"
                rows={2}
                placeholder="Negative prompt (optional)"
                value={negPrompt}
                onChange={e => setNegPrompt(e.target.value)}
                disabled={loading}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Frames ({numFrames})</label>
                  <input type="range" min={24} max={163} step={1} value={numFrames}
                    onChange={e => setNumFrames(+e.target.value)}
                    className="w-full accent-plasma" disabled={loading} />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">FPS ({fps})</label>
                  <input type="range" min={6} max={30} step={1} value={fps}
                    onChange={e => setFps(+e.target.value)}
                    className="w-full accent-plasma" disabled={loading} />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Guidance ({guidanceScale})</label>
                  <input type="range" min={1} max={10} step={0.5} value={guidanceScale}
                    onChange={e => setGuidanceScale(+e.target.value)}
                    className="w-full accent-plasma" disabled={loading} />
                </div>
                <div>
                  <label className="text-white/40 text-xs mb-1 block">Steps ({steps})</label>
                  <input type="range" min={10} max={100} step={5} value={steps}
                    onChange={e => setSteps(+e.target.value)}
                    className="w-full accent-plasma" disabled={loading} />
                </div>
              </div>

              <div>
                <label className="text-white/40 text-xs mb-1 block">Seed (optional)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="Random seed..."
                  value={seed}
                  onChange={e => setSeed(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-red-400 text-sm mb-3">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !prompt.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Queuing job...
          </>
        ) : (
          <>
            <Wand2 size={16} />
            Generate Video
          </>
        )}
      </button>
    </div>
  )
}

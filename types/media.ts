export type EditDoc =
  | {
      id: string
      session_id: string
      type: 'photo'
      version: number
      created_at: string
      updated_at: string
      photo: {
        layers: Array<{
          id: string
          kind: 'image' | 'adjust' | 'mask' | 'text' | 'shape' | 'lut'
          src?: string
          params?: Record<string, any>
          maskOf?: string
          opacity?: number
          blend?: 'normal' | 'screen' | 'multiply' | 'overlay' | 'soft-light' | 'hard-light'
        }>
      }
      video?: never
    }
  | {
      id: string
      session_id: string
      type: 'video'
      version: number
      created_at: string
      updated_at: string
      video: {
        fps: number
        width: number
        height: number
        sampleRate: number
        tracks: Array<{
          id: string
          type: 'video' | 'audio' | 'effects' | 'titles'
          clips: Array<{
            id: string
            asset_id?: string
            in: number
            out: number
            start: number
            transforms?: { scale?: number; pos?: [number, number]; rot?: number }
            effects?: Array<{ id: string; name: string; params: Record<string, any> }>
            keyframes?: Array<{ t: number; path: string; v: number | number[] }>
          }>
        }>
      }
      photo?: never
    }

export type RenderTarget = 'mp4' | 'webm' | 'mov' | 'png' | 'webp' | 'gif'
export type RenderPreset = 'reel-1080x1920' | 'yt-1920x1080' | 'square-1080' | string
export type RenderStatus = 'queued' | 'running' | 'done' | 'error'

export type RenderJob = {
  id: string
  session_id: string
  edit_id: string
  target: RenderTarget
  preset: RenderPreset
  status: RenderStatus
  progress: number
  output_url?: string | null
  error_message?: string | null
  created_at: string
  updated_at: string
}

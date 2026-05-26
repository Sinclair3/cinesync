import { useEffect, useRef } from 'react'

export default function VideoTile({ participant, muted = false, label }) {
  const videoRef = useRef(null)
  const audioRef = useRef(null)

  const videoTrack = participant?.tracks?.video?.persistentTrack
  const audioTrack = participant?.tracks?.audio?.persistentTrack
  const hasVideo   = participant?.tracks?.video?.state === 'playable'

  useEffect(() => {
    if (videoRef.current && videoTrack) {
      videoRef.current.srcObject = new MediaStream([videoTrack])
    }
  }, [videoTrack])

  useEffect(() => {
    if (audioRef.current && audioTrack && !muted) {
      audioRef.current.srcObject = new MediaStream([audioTrack])
    }
  }, [audioTrack, muted])

  return (
    <div className="relative rounded-xl overflow-hidden bg-card border border-border aspect-video w-full">
      {hasVideo ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white font-bold">
            {label?.[0]?.toUpperCase() ?? '?'}
          </div>
          {!participant && (
            <p className="text-xs text-secondary text-center px-2">{label}</p>
          )}
        </div>
      )}

      {!muted && <audio ref={audioRef} autoPlay playsInline />}

      {label && (
        <span className="absolute bottom-1.5 left-2 text-[10px] bg-black/50 text-white rounded px-1.5 py-0.5">
          {label}
        </span>
      )}
    </div>
  )
}

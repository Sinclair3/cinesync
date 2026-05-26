import { useEffect, useRef, useState, useCallback } from 'react'
import DailyIframe from '@daily-co/daily-js'

export function useSync({ dailyUrl, onSyncMessage, userName }) {
  const callRef    = useRef(null)
  const onSyncRef  = useRef(onSyncMessage)
  const micOnRef   = useRef(true)
  const camOnRef   = useRef(true)

  const [joined,      setJoined]      = useState(false)
  const [participants, setParticipants] = useState({})
  const [isMicOn,     setIsMicOn]     = useState(true)
  const [isCameraOn,  setIsCameraOn]  = useState(true)

  // Keep callback ref fresh without re-triggering the join effect
  useEffect(() => { onSyncRef.current = onSyncMessage }, [onSyncMessage])

  useEffect(() => {
    if (!dailyUrl) return

    const call = DailyIframe.createCallObject()
    callRef.current = call

    const refresh = () => setParticipants({ ...call.participants() })

    call
      .on('joined-meeting',      () => { setJoined(true); refresh() })
      .on('participant-joined',  refresh)
      .on('participant-updated', refresh)
      .on('participant-left',    refresh)
      .on('app-message',         (e) => onSyncRef.current?.(e.data))
      .on('error',               (e) => console.error('[Daily]', e))

    call.join({ url: dailyUrl, userName }).catch(console.error)

    return () => {
      call.leave().catch(() => {}).finally(() => call.destroy().catch(() => {}))
    }
  }, [dailyUrl, userName])

  const sendSync = useCallback((data) => {
    callRef.current?.sendAppMessage(data, '*')
  }, [])

  const toggleMic = useCallback(() => {
    micOnRef.current = !micOnRef.current
    callRef.current?.setLocalAudio(micOnRef.current)
    setIsMicOn(micOnRef.current)
  }, [])

  const toggleCamera = useCallback(() => {
    camOnRef.current = !camOnRef.current
    callRef.current?.setLocalVideo(camOnRef.current)
    setIsCameraOn(camOnRef.current)
  }, [])

  return { joined, participants, sendSync, toggleMic, toggleCamera, isMicOn, isCameraOn }
}

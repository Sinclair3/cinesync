import { useEffect, useRef, useState, useCallback } from 'react'
import { ref, onValue, update, serverTimestamp } from 'firebase/database'
import { rtdb } from '../firebase/config'

const SYNC_TOLERANCE   = 2    // seconds — within this = "synced"
const SEEK_DEBOUNCE_MS = 300  // ms — debounce before applying remote seek

/** Format seconds as HH:MM:SS or MM:SS */
function fmt(seconds) {
  const s   = Math.floor(seconds ?? 0)
  const h   = Math.floor(s / 3600)
  const m   = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const mm  = m.toString().padStart(2, '0')
  const ss  = sec.toString().padStart(2, '0')
  return h > 0 ? `${h.toString().padStart(2, '0')}:${mm}:${ss}` : `${mm}:${ss}`
}

/**
 * useSyncEngine — Firebase RTDB-backed playback sync.
 *
 * Writes sync commands to /rooms/{roomCode}/syncState as:
 *   { value, origin: userId, lastUpdated: serverTimestamp() }
 *
 * Ignores incoming changes where origin === userId (no feedback loops).
 * Debounces remote seek application by 300ms.
 * Resync (host only) bypasses the debounce and applies immediately.
 */
export function useSyncEngine({ roomCode, userId, isHost }) {
  const [isPlaying,  setIsPlaying]  = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [syncStatus, setSyncStatus] = useState('synced')

  const localTimeRef  = useRef(0)   // kept current via updateLocalTime()
  const remoteTimeRef = useRef(0)   // last value received from Firebase
  const seekTimerRef  = useRef(null)

  // ── Recompute sync status ─────────────────────────────────────────────
  const computeStatus = useCallback(() => {
    const diff = Math.abs(localTimeRef.current - remoteTimeRef.current)
    setSyncStatus(diff < SYNC_TOLERANCE ? 'synced' : 'drifting')
  }, [])

  // ── Write helper ──────────────────────────────────────────────────────
  const writeField = useCallback((field, value, extra = {}) => {
    return update(ref(rtdb, `rooms/${roomCode}/syncState`), {
      [field]: { value, origin: userId, lastUpdated: serverTimestamp(), ...extra },
    })
  }, [roomCode, userId])

  // ── Firebase listener ─────────────────────────────────────────────────
  useEffect(() => {
    if (!roomCode) return

    const syncRef = ref(rtdb, `rooms/${roomCode}/syncState`)

    const unsub = onValue(syncRef, (snap) => {
      if (!snap.exists()) return
      const { isPlaying: ip, currentTime: ct } = snap.val()

      // ── isPlaying ──────────────────────────────────────────────────────
      if (ip && ip.origin !== userId) {
        setIsPlaying(ip.value)
        console.log(`SYNC: ${ip.value ? 'play' : 'pause'} at ${fmt(ct?.value)}`)
      }

      // ── currentTime ────────────────────────────────────────────────────
      if (ct && ct.origin !== userId) {
        const remote = ct.value
        remoteTimeRef.current = remote
        computeStatus()

        if (ct.resync) {
          // Resync: host-initiated, apply immediately (no debounce)
          clearTimeout(seekTimerRef.current)
          setCurrentTime(remote)
          console.log(`SYNC: resync → ${fmt(remote)}`)
        } else {
          // Regular remote seek — debounce to avoid thrashing
          clearTimeout(seekTimerRef.current)
          seekTimerRef.current = setTimeout(() => {
            setCurrentTime(remote)
            console.log(`SYNC: seek to ${fmt(remote)}`)
          }, SEEK_DEBOUNCE_MS)
        }
      }
    })

    return () => {
      unsub()
      clearTimeout(seekTimerRef.current)
    }
  }, [roomCode, userId, computeStatus])

  // ── Public: let video's onTimeUpdate keep localTime fresh ─────────────
  const updateLocalTime = useCallback((t) => {
    localTimeRef.current = t
    computeStatus()
  }, [computeStatus])

  // ── Send commands ─────────────────────────────────────────────────────
  const sendPlay = useCallback((time) => {
    localTimeRef.current = time
    console.log(`SYNC: play at ${fmt(time)}`)
    writeField('isPlaying',  true)
    writeField('currentTime', time)
  }, [writeField])

  const sendPause = useCallback((time) => {
    localTimeRef.current = time
    console.log(`SYNC: pause at ${fmt(time)}`)
    writeField('isPlaying',  false)
    writeField('currentTime', time)
  }, [writeField])

  const sendSeek = useCallback((time) => {
    localTimeRef.current = time
    console.log(`SYNC: seek to ${fmt(time)}`)
    writeField('currentTime', time)
  }, [writeField])

  /**
   * sendResync — host only.
   * Pushes current time + play state to guest with resync: true,
   * which bypasses the 300ms debounce on the receiving end.
   */
  const sendResync = useCallback((time) => {
    if (!isHost) return
    console.log(`SYNC: resync at ${fmt(time)}`)
    writeField('currentTime', time, { resync: true })
    writeField('isPlaying',   isPlaying)
  }, [isHost, isPlaying, writeField])

  return {
    isPlaying,
    currentTime,
    syncStatus,
    updateLocalTime,
    sendPlay,
    sendPause,
    sendSeek,
    sendResync,
  }
}

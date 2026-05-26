import { useEffect, useState, useCallback } from 'react'
import { ref, onValue, update } from 'firebase/database'
import { rtdb } from '../firebase/config'

export function useRoom(code) {
  const [room, setRoom] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!code) return
    const roomRef = ref(rtdb, `rooms/${code}`)
    const unsub = onValue(roomRef, (snapshot) => {
      setRoom(snapshot.exists() ? { ...snapshot.val(), code } : null)
      setLoading(false)
    })
    return unsub
  }, [code])

  const updateRoom = useCallback(
    (data) => update(ref(rtdb, `rooms/${code}`), { ...data, lastUpdated: Date.now() }),
    [code]
  )

  return { room, loading, updateRoom }
}

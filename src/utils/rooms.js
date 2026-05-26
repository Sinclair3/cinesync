import { rtdb } from '../firebase/config'
import { ref, get, set, update } from 'firebase/database'
import { createDailyRoom } from './daily'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export function generateRoomCode() {
  return Array.from({ length: 6 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('')
}

export async function createRoom(code, hostId) {
  const daily    = await createDailyRoom(code)
  const roomRef  = ref(rtdb, `rooms/${code}`)

  await set(roomRef, {
    hostId,
    guestId:     null,
    movieUrl:    '',
    currentTime: 0,
    isPlaying:   false,
    dailyUrl:    daily.url,
    lastUpdated: Date.now(),
    createdAt:   Date.now(),
  })
}

export async function joinRoom(code, guestId) {
  const roomRef  = ref(rtdb, `rooms/${code}`)
  const snapshot = await get(roomRef)

  if (!snapshot.exists()) throw new Error('room-not-found')

  const room = snapshot.val()

  if (room.guestId && room.guestId !== guestId) throw new Error('room-full')

  await update(roomRef, { guestId, lastUpdated: Date.now() })
}

const API = 'https://api.daily.co/v1'
const KEY = import.meta.env.VITE_DAILY_API_KEY

export async function createDailyRoom(name) {
  const res = await fetch(`${API}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${KEY}`,
    },
    body: JSON.stringify({
      name,
      properties: {
        max_participants: 2,
        // Room expires after 24h
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
      },
    }),
  })

  // If name is already taken, fetch the existing room instead
  if (res.status === 400) {
    const existing = await fetch(`${API}/rooms/${name}`, {
      headers: { Authorization: `Bearer ${KEY}` },
    })
    if (existing.ok) return existing.json()
    throw new Error('daily-room-error')
  }

  if (!res.ok) throw new Error('daily-room-error')
  return res.json() // { url, name, id, ... }
}

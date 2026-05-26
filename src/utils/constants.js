export const APP_NAME = 'CineSync'

export const ROUTES = {
  HOME:    '/',
  LOGIN:   '/login',
  ROOM:    '/room/:code',
}

// Realtime Database paths
export const DB = {
  room: (code) => `rooms/${code}`,
}

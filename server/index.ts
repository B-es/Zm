// server/index.ts
import { WebSocketServer } from 'ws'
import {
  joinRoom,
  leaveRoom,
  broadcast,
  getPresence
} from './rooms'

const wss = new WebSocketServer({ port: 3000 })

wss.on('connection', (socket, req) => {
  const url = new URL(req.url!, 'http://localhost')
  const roomId = url.pathname.slice(1)
  const userId = url.searchParams.get('userId') ?? 'anon'

  const client = { socket, userId }

  // 1. зашёл в комнату
  joinRoom(roomId, client)

  // 2. отправляем НОВОМУ клиенту текущее состояние
  socket.send(JSON.stringify({
    type: 'PRESENCE_STATE',
    payload: getPresence(roomId)
  }))

  // 3. уведомляем остальных
  broadcast(roomId, {
    type: 'USER_JOINED',
    payload: { userId }
  }, client)

  socket.on('close', () => {
    leaveRoom(roomId, client)
    
    broadcast(roomId, {
      type: 'USER_LEFT',
      payload: { userId }
    })
  })
})

console.log('WS with presence on ws://localhost:3000')

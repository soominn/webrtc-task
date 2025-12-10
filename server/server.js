import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

const rooms = new Map()
const MAX_ROOM_SIZE = 6

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('join-room', ({ roomId, username }) => {
    console.log(`${username} joining room: ${roomId}`)

    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map())
    }

    const room = rooms.get(roomId)

    // 방 인원 제한 확인
    if (room.size >= MAX_ROOM_SIZE) {
      socket.emit('room-full', {
        message: `방이 가득 찼습니다. (최대 ${MAX_ROOM_SIZE}명)`
      })
      console.log(`Room ${roomId} is full. ${username} cannot join.`)
      return
    }

    socket.join(roomId)
    socket.username = username
    socket.roomId = roomId

    room.set(socket.id, { username, socketId: socket.id })

    // 기존 참여자들에게 새 사용자 알림
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      username: username
    })

    // 새로 들어온 사용자에게 현재 참여자 목록 전송
    const participants = Array.from(room.values())
    socket.emit('participants-list', { participants })

    console.log(`Room ${roomId} participants:`, Array.from(room.values()))
  })

  socket.on('offer', ({ target, offer }) => {
    console.log(`Offer from ${socket.id} to ${target}`)
    io.to(target).emit('offer', {
      from: socket.id,
      offer: offer,
      username: socket.username
    })
  })

  socket.on('answer', ({ target, answer }) => {
    console.log(`Answer from ${socket.id} to ${target}`)
    io.to(target).emit('answer', {
      from: socket.id,
      answer: answer
    })
  })

  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', {
      from: socket.id,
      candidate: candidate
    })
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)

    if (socket.roomId) {
      const room = rooms.get(socket.roomId)
      if (room) {
        room.delete(socket.id)

        // 방에 남은 사용자들에게 퇴장 알림
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.id,
          username: socket.username
        })

        // 방이 비었으면 삭제
        if (room.size === 0) {
          rooms.delete(socket.roomId)
          console.log(`Room ${socket.roomId} deleted (empty)`)
        }
      }
    }
  })
})

const PORT = process.env.PORT || 3001

httpServer.listen(PORT, () => {
  console.log(`🚀 Signaling server running on port ${PORT}`)
  console.log(`WebSocket ready for connections`)
})

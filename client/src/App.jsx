import { useState } from 'react'
import PartyRoom from './components/PartyRoom'
import JoinRoom from './components/JoinRoom'
import './App.css'

function App() {
  const [roomId, setRoomId] = useState(null)
  const [username, setUsername] = useState('')

  const handleJoinRoom = (room, name) => {
    setRoomId(room)
    setUsername(name)
  }

  const handleLeaveRoom = () => {
    setRoomId(null)
    setUsername('')
  }

  return (
    <div className="app">
      {!roomId ? (
        <JoinRoom onJoin={handleJoinRoom} />
      ) : (
        <PartyRoom
          roomId={roomId}
          username={username}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  )
}

export default App

import { useState } from 'react'

function JoinRoom({ onJoin }) {
  const [mode, setMode] = useState('create') // 'create' or 'join'
  const [createUsername, setCreateUsername] = useState('')
  const [joinUsername, setJoinUsername] = useState('')
  const [joinRoomId, setJoinRoomId] = useState('')

  const generateRoomId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  const handleCreateRoom = (e) => {
    e.preventDefault()
    if (createUsername.trim()) {
      const roomId = generateRoomId()

      // 클립보드에 방 ID 복사
      navigator.clipboard.writeText(roomId).then(() => {
        alert('클립보드에 저장되었습니다')
        onJoin(roomId, createUsername.trim())
      }).catch((err) => {
        console.error('클립보드 복사 실패:', err)
        alert(`방 ID: ${roomId}\n(클립보드 복사 실패)`)
        onJoin(roomId, createUsername.trim())
      })
    }
  }

  const handleJoinRoom = (e) => {
    e.preventDefault()
    if (joinUsername.trim() && joinRoomId.trim()) {
      onJoin(joinRoomId.trim().toUpperCase(), joinUsername.trim())
    }
  }

  return (
    <div className="join-container">
      <div className="join-box">
        <h1>🎬 Watch Party</h1>
        <p>친구들과 함께 실시간으로 영상을 시청하세요!</p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setMode('create')}
            style={{
              flex: 1,
              padding: '12px',
              background: mode === 'create' ? 'var(--primary-green)' : 'var(--bg-darker)',
              color: 'white',
              border: mode === 'create' ? 'none' : '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            방 생성하기
          </button>
          <button
            type="button"
            onClick={() => setMode('join')}
            style={{
              flex: 1,
              padding: '12px',
              background: mode === 'join' ? 'var(--primary-green)' : 'var(--bg-darker)',
              color: 'white',
              border: mode === 'join' ? 'none' : '2px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '8px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
          >
            방 참여하기
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreateRoom}>
            <div className="input-group">
              <label>닉네임</label>
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={createUsername}
                onChange={(e) => setCreateUsername(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              방 생성하기
            </button>
            <p style={{ marginTop: '12px', fontSize: '0.9rem', color: 'var(--text-gray)', textAlign: 'center' }}>
              방 ID가 자동으로 생성되어 클립보드에 복사됩니다
            </p>
          </form>
        ) : (
          <form onSubmit={handleJoinRoom}>
            <div className="input-group">
              <label>닉네임</label>
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={joinUsername}
                onChange={(e) => setJoinUsername(e.target.value)}
                maxLength={20}
                required
              />
            </div>

            <div className="input-group">
              <label>방 ID</label>
              <input
                type="text"
                placeholder="방 ID를 입력하세요"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                maxLength={10}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              방 참여하기
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default JoinRoom

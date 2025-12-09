import { useState, useRef, useEffect } from 'react'
import VideoPlayer from './VideoPlayer'
import Chat from './Chat'
import useWebRTC from '../hooks/useWebRTC'

function PartyRoom({ roomId, username, onLeave }) {
  const [videoUrl, setVideoUrl] = useState('')
  const [videoId, setVideoId] = useState('')
  const [messages, setMessages] = useState([])
  const [participants, setParticipants] = useState([username])
  const videoPlayerRef = useRef(null)
  const isHostRef = useRef(false)
  const isSyncingRef = useRef(false)

  const {
    sendMessage: sendWebRTCMessage,
    isConnected,
    isVoiceChatEnabled,
    isMuted,
    startVoiceChat,
    stopVoiceChat,
    toggleMute
  } = useWebRTC(roomId, username, handleReceiveMessage)

  function handleReceiveMessage(data) {
    switch (data.type) {
      case 'chat':
        setMessages((prev) => [...prev, {
          type: 'chat',
          username: data.username,
          content: data.content,
          timestamp: data.timestamp
        }])
        break

      case 'reaction':
        setMessages((prev) => [...prev, {
          type: 'reaction',
          username: data.username,
          content: data.content,
          timestamp: data.timestamp
        }])
        break

      case 'video-load':
        setVideoId(data.videoId)
        addSystemMessage(`${data.username}님이 새 동영상을 불러왔습니다`)
        break

      case 'video-play':
        if (!isSyncingRef.current) {
          isSyncingRef.current = true
          videoPlayerRef.current?.seekTo(data.currentTime)
          videoPlayerRef.current?.playVideo()
          setTimeout(() => { isSyncingRef.current = false }, 500)
        }
        break

      case 'video-pause':
        if (!isSyncingRef.current) {
          isSyncingRef.current = true
          videoPlayerRef.current?.seekTo(data.currentTime)
          videoPlayerRef.current?.pauseVideo()
          setTimeout(() => { isSyncingRef.current = false }, 500)
        }
        break

      case 'video-seek':
        if (!isSyncingRef.current) {
          isSyncingRef.current = true
          videoPlayerRef.current?.seekTo(data.currentTime)
          setTimeout(() => { isSyncingRef.current = false }, 500)
        }
        break

      case 'user-joined':
        addSystemMessage(`${data.username}님이 입장하셨습니다`)
        if (!participants.includes(data.username)) {
          setParticipants((prev) => [...prev, data.username])
        }
        break

      case 'user-left':
        addSystemMessage(`${data.username}님이 퇴장하셨습니다`)
        setParticipants((prev) => prev.filter((p) => p !== data.username))
        break

      case 'participants-list':
        setParticipants(data.participants)
        break

      default:
        break
    }
  }

  const addSystemMessage = (content) => {
    setMessages((prev) => [...prev, {
      type: 'system',
      content,
      timestamp: Date.now()
    }])
  }

  const extractVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[7].length === 11) ? match[7] : null
  }

  const handleLoadVideo = () => {
    const id = extractVideoId(videoUrl)
    if (id) {
      setVideoId(id)
      sendWebRTCMessage({
        type: 'video-load',
        videoId: id,
        username
      })
      setVideoUrl('')
    } else {
      alert('올바른 YouTube URL을 입력해주세요')
    }
  }

  const handleVideoStateChange = (event) => {
    if (isSyncingRef.current) return

    const state = event.data
    const currentTime = videoPlayerRef.current?.getCurrentTime() || 0

    // 0: 종료, 1: 재생 중, 2: 일시정지, 3: 버퍼링, 5: 동영상 신호
    if (state === 1) {
      sendWebRTCMessage({
        type: 'video-play',
        currentTime,
        username
      })
    } else if (state === 2) {
      sendWebRTCMessage({
        type: 'video-pause',
        currentTime,
        username
      })
    }
  }

  const handleSendMessage = (content) => {
    const message = {
      type: 'chat',
      username,
      content,
      timestamp: Date.now()
    }
    setMessages((prev) => [...prev, message])
    sendWebRTCMessage(message)
  }

  const handleSendReaction = (emoji) => {
    const reaction = {
      type: 'reaction',
      username,
      content: emoji,
      timestamp: Date.now()
    }
    setMessages((prev) => [...prev, reaction])
    sendWebRTCMessage(reaction)
  }

  useEffect(() => {
    // 방 입장 메시지
    addSystemMessage(`${roomId} 방에 입장했습니다`)

    return () => {
      // 방 퇴장 시
      sendWebRTCMessage({
        type: 'user-left',
        username
      })
    }
  }, [])

  const handleToggleVoiceChat = async () => {
    if (isVoiceChatEnabled) {
      stopVoiceChat()
      addSystemMessage('음성 채팅을 종료했습니다')
    } else {
      const success = await startVoiceChat()
      if (success) {
        addSystemMessage('음성 채팅을 시작했습니다')
      }
    }
  }

  return (
    <div className="party-room">
      <div className="room-header">
        <div className="room-info">
          <h2>🎬 Watch Party</h2>
          <p>방 ID: {roomId} | {username}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {isVoiceChatEnabled && (
            <button
              onClick={toggleMute}
              style={{
                padding: '10px 20px',
                background: isMuted ? 'var(--text-gray)' : 'var(--primary-green)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {isMuted ? '🔇 음소거됨' : '🎤 마이크 켜짐'}
            </button>
          )}
          <button
            onClick={handleToggleVoiceChat}
            style={{
              padding: '10px 20px',
              background: isVoiceChatEnabled ? 'var(--dark-green)' : 'var(--primary-green)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {isVoiceChatEnabled ? '📞 음성 채팅 종료' : '📞 음성 채팅 시작'}
          </button>
          <button className="btn-leave" onClick={onLeave}>
            나가기
          </button>
        </div>
      </div>

      <div className="room-content">
        <div className="video-section">
          <div className="video-controls">
            <input
              type="text"
              placeholder="YouTube URL을 입력하세요 (예: https://www.youtube.com/watch?v=...)"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLoadVideo()}
            />
            <button className="btn-load" onClick={handleLoadVideo}>
              동영상 불러오기
            </button>
          </div>

          <div className="video-wrapper">
            <VideoPlayer
              ref={videoPlayerRef}
              videoId={videoId}
              onStateChange={handleVideoStateChange}
            />
          </div>

          <div className="participants">
            <h3>👥 참여자 ({participants.length})</h3>
            {participants.map((participant, index) => (
              <div key={index} className="participant">
                <span className="participant-indicator"></span>
                <span>{participant}</span>
              </div>
            ))}
          </div>
        </div>

        <Chat
          messages={messages}
          onSendMessage={handleSendMessage}
          onSendReaction={handleSendReaction}
        />
      </div>
    </div>
  )
}

export default PartyRoom

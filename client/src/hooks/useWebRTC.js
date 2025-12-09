import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const SIGNALING_SERVER = 'http://localhost:3001'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
}

function useWebRTC(roomId, username, onMessage) {
  const [isConnected, setIsConnected] = useState(false)
  const [isVoiceChatEnabled, setIsVoiceChatEnabled] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const socketRef = useRef(null)
  const peerConnectionsRef = useRef({})
  const dataChannelsRef = useRef({})
  const localStreamRef = useRef(null)
  const remoteStreamsRef = useRef({})

  useEffect(() => {
    if (!roomId || !username) return

    // Socket.io 연결
    socketRef.current = io(SIGNALING_SERVER)

    socketRef.current.on('connect', () => {
      console.log('Signaling server connected')
      socketRef.current.emit('join-room', { roomId, username })
    })

    // 새로운 사용자가 입장했을 때
    socketRef.current.on('user-joined', async ({ userId, username: newUsername }) => {
      console.log('User joined:', newUsername)

      // Offer를 보내는 쪽 (먼저 있던 사람)
      const peerConnection = createPeerConnection(userId)
      const dataChannel = peerConnection.createDataChannel('watchparty')
      setupDataChannel(dataChannel, userId)

      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      socketRef.current.emit('offer', {
        target: userId,
        offer: offer
      })

      // 새 사용자에게 입장 알림
      onMessage({
        type: 'user-joined',
        username: newUsername
      })
    })

    // Offer를 받았을 때
    socketRef.current.on('offer', async ({ from, offer, username: fromUsername }) => {
      console.log('Received offer from:', fromUsername)

      const peerConnection = createPeerConnection(from)

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      socketRef.current.emit('answer', {
        target: from,
        answer: answer
      })
    })

    // Answer를 받았을 때
    socketRef.current.on('answer', async ({ from, answer }) => {
      console.log('Received answer from:', from)

      const peerConnection = peerConnectionsRef.current[from]
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer))
      }
    })

    // ICE Candidate를 받았을 때
    socketRef.current.on('ice-candidate', async ({ from, candidate }) => {
      const peerConnection = peerConnectionsRef.current[from]
      if (peerConnection && candidate) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
          console.error('Error adding ICE candidate:', error)
        }
      }
    })

    // 사용자가 퇴장했을 때
    socketRef.current.on('user-left', ({ userId, username: leftUsername }) => {
      console.log('User left:', leftUsername)

      if (peerConnectionsRef.current[userId]) {
        peerConnectionsRef.current[userId].close()
        delete peerConnectionsRef.current[userId]
      }

      if (dataChannelsRef.current[userId]) {
        dataChannelsRef.current[userId].close()
        delete dataChannelsRef.current[userId]
      }

      onMessage({
        type: 'user-left',
        username: leftUsername
      })
    })

    // 현재 참여자 목록
    socketRef.current.on('participants-list', ({ participants }) => {
      onMessage({
        type: 'participants-list',
        participants: participants.map(p => p.username)
      })
    })

    return () => {
      // Cleanup
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop())
      }
      Object.values(peerConnectionsRef.current).forEach(pc => pc.close())
      Object.values(dataChannelsRef.current).forEach(dc => dc.close())

      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [roomId, username])

  const createPeerConnection = (userId) => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS)

    // 로컬 오디오 스트림이 있으면 추가
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current)
      })
    }

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('ice-candidate', {
          target: userId,
          candidate: event.candidate
        })
      }
    }

    peerConnection.ondatachannel = (event) => {
      setupDataChannel(event.channel, userId)
    }

    // 상대방의 오디오 스트림 수신
    peerConnection.ontrack = (event) => {
      console.log('Received remote track from:', userId)
      const [remoteStream] = event.streams

      if (remoteStream) {
        remoteStreamsRef.current[userId] = remoteStream

        // 오디오 엘리먼트 생성 및 재생
        const audioElement = document.getElementById(`audio-${userId}`) || document.createElement('audio')
        audioElement.id = `audio-${userId}`
        audioElement.srcObject = remoteStream
        audioElement.autoplay = true

        if (!document.getElementById(`audio-${userId}`)) {
          document.body.appendChild(audioElement)
        }
      }
    }

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState)
      if (peerConnection.connectionState === 'connected') {
        setIsConnected(true)
      } else if (peerConnection.connectionState === 'disconnected' ||
                 peerConnection.connectionState === 'failed') {
        setIsConnected(false)
      }
    }

    peerConnectionsRef.current[userId] = peerConnection
    return peerConnection
  }

  const setupDataChannel = (dataChannel, userId) => {
    dataChannel.onopen = () => {
      console.log('Data channel opened with:', userId)
      setIsConnected(true)
    }

    dataChannel.onclose = () => {
      console.log('Data channel closed with:', userId)
    }

    dataChannel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onMessage(data)
      } catch (error) {
        console.error('Error parsing message:', error)
      }
    }

    dataChannelsRef.current[userId] = dataChannel
  }

  const sendMessage = (message) => {
    const messageStr = JSON.stringify(message)

    // 모든 연결된 피어에게 메시지 전송
    Object.values(dataChannelsRef.current).forEach(dataChannel => {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(messageStr)
      }
    })
  }

  const startVoiceChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      localStreamRef.current = stream
      setIsVoiceChatEnabled(true)

      // 기존 피어 연결들에 오디오 트랙 추가
      Object.entries(peerConnectionsRef.current).forEach(async ([userId, peerConnection]) => {
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream)
        })

        // Renegotiation 필요
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        socketRef.current.emit('offer', {
          target: userId,
          offer: offer
        })
      })

      console.log('Voice chat started')
      return true
    } catch (error) {
      console.error('Failed to start voice chat:', error)
      alert('마이크 권한이 필요합니다.')
      return false
    }
  }

  const stopVoiceChat = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    setIsVoiceChatEnabled(false)
    setIsMuted(false)
    console.log('Voice chat stopped')
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  return {
    sendMessage,
    isConnected,
    isVoiceChatEnabled,
    isMuted,
    startVoiceChat,
    stopVoiceChat,
    toggleMute
  }
}

export default useWebRTC

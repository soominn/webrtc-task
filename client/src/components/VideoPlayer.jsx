import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import YouTube from 'react-youtube'

const VideoPlayer = forwardRef(({ videoId, onReady, onStateChange, onError }, ref) => {
  const playerRef = useRef(null)

  useImperativeHandle(ref, () => ({
    playVideo: () => {
      if (playerRef.current) {
        playerRef.current.playVideo()
      }
    },
    pauseVideo: () => {
      if (playerRef.current) {
        playerRef.current.pauseVideo()
      }
    },
    seekTo: (seconds) => {
      if (playerRef.current) {
        playerRef.current.seekTo(seconds, true)
      }
    },
    getCurrentTime: () => {
      if (playerRef.current) {
        return playerRef.current.getCurrentTime()
      }
      return 0
    },
    getPlayerState: () => {
      if (playerRef.current) {
        return playerRef.current.getPlayerState()
      }
      return -1
    }
  }))

  const opts = {
    width: '100%',
    height: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1,
      modestbranding: 1,
      rel: 0
    }
  }

  const handleReady = (event) => {
    playerRef.current = event.target
    if (onReady) {
      onReady(event.target)
    }
  }

  if (!videoId) {
    return (
      <div className="video-placeholder">
        <h3>🎥 동영상을 불러오세요</h3>
        <p>위에 YouTube URL을 입력하고 불러오기를 클릭하세요</p>
      </div>
    )
  }

  return (
    <YouTube
      videoId={videoId}
      opts={opts}
      onReady={handleReady}
      onStateChange={onStateChange}
      onError={onError}
      style={{ width: '100%', height: '100%' }}
    />
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer

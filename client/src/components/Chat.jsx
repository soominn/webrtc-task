import { useState, useRef, useEffect } from 'react'

function Chat({ messages, onSendMessage, onSendReaction }) {
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef(null)

  const reactions = ['👍', '😂', '❤️', '🔥', '😮', '🎉']

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim())
      setInputValue('')
    }
  }

  const handleReaction = (emoji) => {
    onSendReaction(emoji)
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="chat-section">
      <div className="chat-header">
        <h3>💬 채팅</h3>
        <div className="reactions">
          {reactions.map((emoji) => (
            <button
              key={emoji}
              className="reaction-btn"
              onClick={() => handleReaction(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, index) => {
          if (msg.type === 'system') {
            return (
              <div key={index} className="message system-message">
                {msg.content}
              </div>
            )
          }

          if (msg.type === 'reaction') {
            return (
              <div key={index} className="message">
                <div className="reaction-message">
                  {msg.username}: {msg.content}
                </div>
              </div>
            )
          }

          return (
            <div key={index} className="message">
              <div className="message-header">
                <span className="message-author">{msg.username}</span>
                <span className="message-time">{formatTime(msg.timestamp)}</span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="메시지를 입력하세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          maxLength={200}
        />
        <button type="submit" className="btn-send">
          전송
        </button>
      </form>
    </div>
  )
}

export default Chat

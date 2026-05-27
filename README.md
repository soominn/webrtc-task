# 🎬 Watch Party - WebRTC 기반 실시간 동영상 시청 파티

![Image](https://github.com/user-attachments/assets/1767f992-0195-4d7b-aca3-94c28adfcf3f)

> **React + Node.js + WebRTC를 활용한 실시간 영상 동기화 및 음성 채팅 서비스**

## 📋 목차
- [프로젝트 개요](#-프로젝트-개요)
- [WebRTC 기술 조사](#-webrtc-기술-조사)
- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [시스템 아키텍처](#-시스템-아키텍처)
- [프로젝트 구조](#-프로젝트-구조)
- [설치 및 실행 방법](#-설치-및-실행-방법)
- [WebRTC 구현 상세](#-webrtc-구현-상세)
- [주요 구현 코드](#-주요-구현-코드)
- [참고 자료](#-참고-자료)

---

## 📌 프로젝트 개요

### 프로젝트 선정 이유
기존의 화상 채팅 서비스를 넘어, **동영상 콘텐츠를 함께 시청하며 소통하는 경험**을 제공하고자 했습니다. 
코로나19 이후 비대면 문화가 자리잡으면서, 물리적으로 떨어져 있어도 함께 영화나 영상을 보며 
실시간으로 반응을 공유하고 싶어하는 니즈가 증가했습니다.

### 핵심 목표
- ✅ **WebRTC 기술의 실전 활용**: P2P 연결, DataChannel, MediaStream API 구현
- ✅ **실시간 동기화**: 밀리초 단위의 정밀한 동영상 재생 동기화
- ✅ **음성 통신**: WebRTC를 통한 저지연 실시간 음성 채팅
- ✅ **시그널링 서버**: Socket.io 기반 연결 수립 및 데이터 중계
- ✅ **확장 가능한 구조**: 추후 기능 확장이 용이한 컴포넌트 설계

### 과제 주제 분류
**🎯 주제 5: 자유 주제 (WebRTC가 핵심인 서비스)**
- 실시간 음성 채팅 (주제 3)
- WebRTC 데이터 채팅 (주제 4)
- 위 두 가지를 결합하여 **동영상 동기화 시청 파티**라는 차별화된 서비스 구현

---

## 🔍 WebRTC 기술 조사

### 1. WebRTC란?

**WebRTC(Web Real-Time Communication)** 는 웹 브라우저 간 플러그인 없이 
**음성, 영상, 데이터를 실시간으로 주고받을 수 있게 하는 오픈소스 기술**입니다.

#### 특징
- 🚀 **P2P(Peer-to-Peer) 통신**: 서버를 거치지 않고 직접 연결
- 🔒 **보안**: DTLS/SRTP 기반 암호화 통신
- 📱 **크로스 플랫폼**: 모든 주요 브라우저 지원
- 💰 **무료**: 오픈소스 프로젝트

### 2. WebRTC 구성 요소

#### 2.1 MediaStream (getUserMedia)
- 카메라, 마이크 등 미디어 장치 접근
- 미디어 트랙(Track) 관리
```javascript
const stream = await navigator.mediaDevices.getUserMedia({ 
  audio: true, 
  video: true 
});
```

#### 2.2 RTCPeerConnection
- P2P 연결의 핵심 API
- 음성/영상 데이터 송수신
- ICE, SDP 처리
```javascript
const pc = new RTCPeerConnection(configuration);
```

#### 2.3 RTCDataChannel
- 텍스트, 파일 등 임의의 데이터 전송
- 낮은 지연시간
- 신뢰성/비신뢰성 모드 선택 가능
```javascript
const dataChannel = pc.createDataChannel('chat');
```

### 3. 시그널링 서버의 역할

WebRTC는 P2P 통신이지만, **처음 연결을 맺기 위해서는 시그널링 서버가 필요**합니다.

#### 시그널링 서버가 하는 일
1. **SDP(Session Description Protocol) 교환**
   - Offer/Answer 메시지 전달
   - 지원 코덱, 미디어 정보 교환

2. **ICE Candidate 교환**
   - 네트워크 경로 정보 전달
   - 최적의 연결 경로 탐색

3. **방 관리**
   - 사용자 입장/퇴장 알림
   - 참여자 목록 관리

**본 프로젝트에서는 Socket.io를 시그널링 서버로 활용**

### 4. STUN / TURN 서버

#### STUN (Session Traversal Utilities for NAT)
- **역할**: 공인 IP 주소 확인
- **사용 시기**: NAT 뒤에 있는 클라이언트의 외부 주소 탐색
- **비용**: 무료 (Google 공개 STUN 서버 사용)

```javascript
{
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
}
```

#### TURN (Traversal Using Relays around NAT)
- **역할**: 직접 연결 실패 시 중계 서버 역할
- **사용 시기**: 방화벽이 강력한 경우 (약 10-20%)
- **비용**: 서버 운영 비용 발생

**본 프로젝트에서는 STUN만 사용** (로컬 네트워크 테스트 환경)

### 5. WebRTC 연결 흐름도

```
[사용자 A]                    [시그널링 서버]                    [사용자 B]
    |                                |                                |
    |-------- join-room ----------->|                                |
    |                                |<-------- join-room ------------|
    |                                |                                |
    |                                |------- user-joined ----------->|
    |                                |                                |
    |<------------------------------- Offer --------------------------|
    |                                |                                |
    |-------- Answer -------------->|                                |
    |                                |------- Answer ---------------->|
    |                                |                                |
    |<-------- ICE Candidate --------|-------- ICE Candidate -------->|
    |                                |                                |
    |                                |                                |
    |<=================== P2P Connection Established ================>|
    |                                                                 |
    |<------------------ Audio/Data Stream --------------------------->|
```

### 6. 연결 과정 상세

#### Step 1: 피어 연결 생성
```javascript
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
});
```

#### Step 2: Offer 생성 (호출자)
```javascript
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
socket.emit('offer', { target: userId, offer });
```

#### Step 3: Answer 생성 (수신자)
```javascript
await pc.setRemoteDescription(offer);
const answer = await pc.createAnswer();
await pc.setLocalDescription(answer);
socket.emit('answer', { target: userId, answer });
```

#### Step 4: ICE Candidate 교환
```javascript
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('ice-candidate', {
      target: userId,
      candidate: event.candidate
    });
  }
};
```

#### Step 5: 연결 완료
```javascript
pc.onconnectionstatechange = () => {
  if (pc.connectionState === 'connected') {
    console.log('P2P 연결 성공!');
  }
};
```

---

## ✨ 주요 기능

### 1️⃣ 실시간 동영상 동기화 (DataChannel 활용)
- YouTube 동영상 URL 입력 시 자동 로드
- 재생/일시정지/탐색 이벤트를 **밀리초 단위로 동기화**
- RTCDataChannel을 통한 저지연 제어 명령 전송
- 참여자 전원이 동일한 시점을 시청

**구현 방식:**
```javascript
// 재생 명령 전송
dataChannel.send(JSON.stringify({
  type: 'play',
  currentTime: player.getCurrentTime()
}));

// 명령 수신 및 실행
dataChannel.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'play') {
    player.seekTo(data.currentTime);
    player.playVideo();
  }
};
```

### 2️⃣ 실시간 음성 채팅 (MediaStream 활용)
- WebRTC 오디오 스트림을 통한 음성 대화
- 마이크 On/Off 토글 기능
- 참여자별 음성 활성 상태 표시
- 에코 캔슬레이션 및 노이즈 제거 적용

**구현 방식:**
```javascript
// 마이크 스트림 획득
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true
  }
});

// 모든 피어에게 오디오 트랙 전송
stream.getTracks().forEach(track => {
  peerConnections.forEach(pc => {
    pc.addTrack(track, stream);
  });
});
```

### 3️⃣ 실시간 텍스트 채팅 (DataChannel 활용)
- WebRTC DataChannel을 통한 P2P 채팅
- 서버를 거치지 않아 **지연시간 최소화**
- 채팅 히스토리 관리
- 이모지 반응 기능 (👍 😂 ❤️ 🔥 😮 🎉)

### 4️⃣ 방 생성 및 참여 시스템
- 고유한 방 ID 자동 생성
- 클립보드 복사 기능
- 참여자 실시간 목록 표시
- 입장/퇴장 알림

---

## 🛠 기술 스택

### Frontend
| 기술 | 버전 | 용도 |
|------|------|------|
| React | 18.x | UI 프레임워크 |
| Vite | 5.x | 빌드 도구 및 개발 서버 |
| Socket.io Client | 4.x | 시그널링 통신 |
| React YouTube | 10.x | YouTube Player API 래퍼 |
| WebRTC API | Native | P2P 통신 |

### Backend
| 기술 | 버전 | 용도 |
|------|------|------|
| Node.js | 18.x | 런타임 환경 |
| Express | 4.x | 웹 서버 프레임워크 |
| Socket.io | 4.x | WebSocket 시그널링 서버 |
| CORS | - | Cross-Origin 요청 처리 |

### 개발 도구
- Git & GitHub (버전 관리 및 협업)
- ESLint (코드 품질 관리)
- Chrome DevTools (디버깅)

---

## 🏗 시스템 아키텍처

### 전체 구조도

```
┌─────────────────────────────────────────────────────────────┐
│                         클라이언트 A                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ VideoPlayer  │  │     Chat     │  │  VoiceChat   │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │              │
│         └──────────────────┼──────────────────┘              │
│                            │                                 │
│                    ┌───────▼────────┐                        │
│                    │  RTCPeerConn   │                        │
│                    │  - DataChannel │◄────┐                  │
│                    │  - AudioTrack  │     │                  │
│                    └───────┬────────┘     │                  │
└────────────────────────────┼──────────────┼──────────────────┘
                             │              │
                    Socket.io│              │ WebRTC P2P
                             │              │
                ┌────────────▼──────────────┴─────┐
                │      시그널링 서버 (Node.js)     │
                │  - Socket.io                     │
                │  - 방 관리                       │
                │  - Offer/Answer 중계             │
                │  - ICE Candidate 중계            │
                └────────────┬─────────────────────┘
                             │
                    Socket.io│              WebRTC P2P
                             │              │
┌────────────────────────────▼──────────────┼──────────────────┐
│                    ┌───────┴────────┐     │                  │
│                    │  RTCPeerConn   │◄────┘                  │
│                    │  - DataChannel │                        │
│                    │  - AudioTrack  │                        │
│                    └───────┬────────┘                        │
│                            │                                 │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐      │
│  │ VideoPlayer  │  │     Chat     │  │  VoiceChat   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                         클라이언트 B                          │
└─────────────────────────────────────────────────────────────┘
```

### 네트워크 토폴로지

**Full Mesh 방식 채택**
- 모든 참여자가 서로 직접 연결 (P2P)
- 장점: 낮은 지연시간, 서버 부담 최소화
- 단점: 참여자 증가 시 연결 수 급증 (n × (n-1) / 2)
- 권장 인원: 5-6명 이하

```
     [User A]
       / \
      /   \
    [B]──[C]
     │    │
    [D]──[E]

5명 = 10개 연결
```

---

## 📁 프로젝트 구조

```
webrtc-task/
├── 📂 client/                          # React 프론트엔드
│   ├── 📂 public/
│   │   └── vite.svg
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── JoinRoom.jsx            # 방 생성/참여 컴포넌트
│   │   │   ├── PartyRoom.jsx           # 메인 시청 화면
│   │   │   ├── VideoPlayer.jsx         # YouTube 플레이어
│   │   │   └── Chat.jsx                # 채팅 컴포넌트
│   │   ├── 📂 hooks/
│   │   │   └── useWebRTC.js            # WebRTC 로직 커스텀 훅
│   │   ├── App.jsx                     # 루트 컴포넌트
│   │   ├── App.css                     # 전역 스타일
│   │   ├── index.css                   # 기본 스타일
│   │   └── main.jsx                    # 엔트리 포인트
│   ├── index.html
│   ├── package.json
│   └── vite.config.js                  # Vite 설정
│
├── 📂 server/                          # Node.js 백엔드
│   ├── server.js                       # Express + Socket.io 서버
│   └── package.json
│
└── README.md                           # 프로젝트 문서
```

### 주요 파일 설명

#### Frontend

**`JoinRoom.jsx`**
- 역할: 초기 진입 화면
- 기능: 닉네임 입력, 방 생성/참여
- Socket.io 연결 초기화

**`PartyRoom.jsx`**
- 역할: 메인 시청 화면 컨테이너
- 기능: 레이아웃 관리, WebRTC 연결 제어
- 참여자 목록 및 상태 표시

**`VideoPlayer.jsx`**
- 역할: YouTube 플레이어 제어
- 기능: 동영상 재생/일시정지/탐색 이벤트 처리
- DataChannel을 통한 동기화 명령 송수신

**`Chat.jsx`**
- 역할: 채팅 인터페이스
- 기능: 메시지 입력/전송, 이모지 반응
- 채팅 히스토리 표시

**`useWebRTC.js`**
- 역할: WebRTC 로직 캡슐화
- 기능:
  - RTCPeerConnection 생성 및 관리
  - Offer/Answer/ICE Candidate 처리
  - 오디오 스트림 관리
  - DataChannel 통신

#### Backend

**`server.js`**
- Express 웹 서버 구동
- Socket.io 시그널링 서버
- 이벤트 핸들러:
  - `join-room`: 방 입장 처리
  - `offer`: WebRTC Offer 중계
  - `answer`: WebRTC Answer 중계
  - `ice-candidate`: ICE Candidate 중계
  - `disconnect`: 사용자 퇴장 처리

---

## 🚀 설치 및 실행 방법

### 사전 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- 모던 웹 브라우저 (Chrome, Firefox, Edge)

### 1. 저장소 클론

```bash
git clone https://github.com/soominn/webrtc-task.git
cd webrtc-task
```

### 2. 서버 실행

```bash
# 서버 디렉토리로 이동
cd server

# 의존성 설치
npm install

# 서버 시작
npm start
```

**실행 결과:**
```
서버가 http://localhost:3001 에서 실행 중입니다.
```

**서버 의존성 (server/package.json):**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "socket.io": "^4.6.1",
    "cors": "^2.8.5"
  }
}
```

### 3. 클라이언트 실행

**새 터미널 창을 열어서:**

```bash
# 클라이언트 디렉토리로 이동
cd client

# 의존성 설치
npm install

# 개발 서버 시작
npm run dev
```

**실행 결과:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

**클라이언트 의존성 (client/package.json):**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "socket.io-client": "^4.6.1",
    "react-youtube": "^10.1.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0"
  }
}
```

### 4. 브라우저에서 접속

1. **첫 번째 사용자** (방 생성):
   ```
   http://localhost:3000 접속
   → 닉네임 입력 (예: "Alice")
   → "방 생성하기" 클릭
   → 방 ID 자동 복사됨 (예: "abc123")
   ```

2. **두 번째 사용자** (방 참여):
   ```
   새 브라우저 탭 또는 시크릿 모드로 http://localhost:3000 접속
   → "방 참여하기" 탭 선택
   → 닉네임 입력 (예: "Bob")
   → 방 ID 입력 (예: "abc123")
   → "방 참여하기" 클릭
   ```

3. **동영상 시청**:
   ```
   YouTube URL 입력 (예: https://www.youtube.com/watch?v=dQw4w9WgXcQ)
   → "동영상 불러오기" 클릭
   → 음성 채팅 시작
   → 함께 시청!
   ```

---

## 🔧 WebRTC 구현 상세

### 1. PeerConnection 생성 및 관리

**위치:** `client/src/hooks/useWebRTC.js`

```javascript
const createPeerConnection = (userId) => {
  const configuration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  const pc = new RTCPeerConnection(configuration);

  // ICE Candidate 이벤트 처리
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit('ice-candidate', {
        target: userId,
        candidate: event.candidate
      });
    }
  };

  // 연결 상태 모니터링
  pc.onconnectionstatechange = () => {
    console.log(`Connection state: ${pc.connectionState}`);
  };

  // 원격 오디오 트랙 수신
  pc.ontrack = (event) => {
    const [remoteStream] = event.streams;
    // 오디오 재생 처리
    playRemoteAudio(remoteStream);
  };

  return pc;
};
```

### 2. DataChannel 생성 및 동기화

**동영상 제어 메시지 형식:**
```javascript
{
  type: 'play' | 'pause' | 'seek',
  currentTime: number,
  timestamp: number
}
```

**송신 측 (VideoPlayer.jsx):**
```javascript
const handlePlay = () => {
  const message = {
    type: 'play',
    currentTime: playerRef.current.getCurrentTime(),
    timestamp: Date.now()
  };

  // 모든 DataChannel에 전송
  Object.values(dataChannels).forEach(dc => {
    if (dc.readyState === 'open') {
      dc.send(JSON.stringify(message));
    }
  });
};
```

**수신 측:**
```javascript
dataChannel.onmessage = (event) => {
  const data = JSON.parse(event.data);
  const latency = Date.now() - data.timestamp;

  switch(data.type) {
    case 'play':
      playerRef.current.seekTo(data.currentTime + latency / 1000);
      playerRef.current.playVideo();
      break;
    case 'pause':
      playerRef.current.pauseVideo();
      break;
    case 'seek':
      playerRef.current.seekTo(data.currentTime);
      break;
  }
};
```

### 3. 오디오 스트림 처리

**마이크 스트림 획득:**
```javascript
const startVoiceChat = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,      // 에코 제거
        noiseSuppression: true,       // 배경 소음 제거
        autoGainControl: true,        // 자동 볼륨 조절
        sampleRate: 48000            // 고품질 샘플레이트
      }
    });

    setLocalStream(stream);

    // 모든 피어에게 오디오 트랙 추가
    stream.getTracks().forEach(track => {
      Object.values(peerConnections).forEach(pc => {
        const sender = pc.addTrack(track, stream);
        senders.push(sender);
      });
    });

  } catch (error) {
    console.error('마이크 접근 실패:', error);
    alert('마이크 권한을 허용해주세요.');
  }
};
```

**마이크 음소거 토글:**
```javascript
const toggleMute = () => {
  if (localStream) {
    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsMuted(!isMuted);
  }
};
```

### 4. 시그널링 프로토콜

**서버 측 이벤트 핸들러 (server/server.js):**

```javascript
io.on('connection', (socket) => {
  console.log('새로운 사용자 연결:', socket.id);

  // 방 참여
  socket.on('join-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    
    // 방에 있는 다른 사용자들에게 알림
    socket.to(roomId).emit('user-joined', {
      userId,
      userName
    });

    // 현재 방 참여자 목록 전송
    const clients = io.sockets.adapter.rooms.get(roomId);
    socket.emit('room-users', Array.from(clients || []));
  });

  // Offer 중계
  socket.on('offer', ({ target, offer }) => {
    io.to(target).emit('offer', {
      sender: socket.id,
      offer
    });
  });

  // Answer 중계
  socket.on('answer', ({ target, answer }) => {
    io.to(target).emit('answer', {
      sender: socket.id,
      answer
    });
  });

  // ICE Candidate 중계
  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', {
      sender: socket.id,
      candidate
    });
  });

  // 연결 해제
  socket.on('disconnect', () => {
    io.emit('user-left', socket.id);
  });
});
```

---

## 💻 주요 구현 코드

### useWebRTC Hook (핵심 로직)

**`client/src/hooks/useWebRTC.js`**

```javascript
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

export const useWebRTC = (roomId, userId) => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const peerConnections = useRef({});
  const dataChannels = useRef({});

  useEffect(() => {
    // Socket.io 연결
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.emit('join-room', { roomId, userId });

    // 새 사용자 참여 시
    newSocket.on('user-joined', async ({ userId: newUserId }) => {
      const pc = createPeerConnection(newUserId);
      peerConnections.current[newUserId] = pc;

      // DataChannel 생성
      const dc = pc.createDataChannel('sync');
      dataChannels.current[newUserId] = dc;
      setupDataChannel(dc);

      // Offer 생성 및 전송
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      newSocket.emit('offer', { target: newUserId, offer });
    });

    // Offer 수신
    newSocket.on('offer', async ({ sender, offer }) => {
      const pc = createPeerConnection(sender);
      peerConnections.current[sender] = pc;

      // DataChannel 수신 대기
      pc.ondatachannel = (event) => {
        dataChannels.current[sender] = event.channel;
        setupDataChannel(event.channel);
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      newSocket.emit('answer', { target: sender, answer });
    });

    // Answer 수신
    newSocket.on('answer', async ({ sender, answer }) => {
      const pc = peerConnections.current[sender];
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    });

    // ICE Candidate 수신
    newSocket.on('ice-candidate', async ({ sender, candidate }) => {
      const pc = peerConnections.current[sender];
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    });

    return () => {
      newSocket.disconnect();
      Object.values(peerConnections.current).forEach(pc => pc.close());
    };
  }, [roomId, userId]);

  const createPeerConnection = (userId) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
      ]
    });

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          target: userId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
    };

    return pc;
  };

  const setupDataChannel = (dc) => {
    dc.onopen = () => console.log('DataChannel opened');
    dc.onmessage = (event) => {
      // 동영상 동기화 메시지 처리
      const data = JSON.parse(event.data);
      handleSyncMessage(data);
    };
  };

  const sendSyncMessage = (message) => {
    Object.values(dataChannels.current).forEach(dc => {
      if (dc.readyState === 'open') {
        dc.send(JSON.stringify(message));
      }
    });
  };

  const startVoiceChat = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    setLocalStream(stream);

    stream.getTracks().forEach(track => {
      Object.values(peerConnections.current).forEach(pc => {
        pc.addTrack(track, stream);
      });
    });
  };

  return {
    socket,
    localStream,
    remoteStreams,
    sendSyncMessage,
    startVoiceChat
  };
};
```

### VideoPlayer Component

**`client/src/components/VideoPlayer.jsx`**

```javascript
import React, { useRef, useEffect } from 'react';
import YouTube from 'react-youtube';

export const VideoPlayer = ({ videoId, sendSyncMessage, onSyncMessage }) => {
  const playerRef = useRef(null);
  const isLocalAction = useRef(false);

  useEffect(() => {
    // 동기화 메시지 수신 리스너
    const handleSync = (data) => {
      if (isLocalAction.current) {
        isLocalAction.current = false;
        return;
      }

      const player = playerRef.current;
      if (!player) return;

      switch(data.type) {
        case 'play':
          player.seekTo(data.currentTime);
          player.playVideo();
          break;
        case 'pause':
          player.pauseVideo();
          break;
        case 'seek':
          player.seekTo(data.currentTime);
          break;
      }
    };

    onSyncMessage(handleSync);
  }, [onSyncMessage]);

  const handleStateChange = (event) => {
    isLocalAction.current = true;
    const player = event.target;

    const message = {
      currentTime: player.getCurrentTime(),
      timestamp: Date.now()
    };

    switch(event.data) {
      case 1: // Playing
        sendSyncMessage({ ...message, type: 'play' });
        break;
      case 2: // Paused
        sendSyncMessage({ ...message, type: 'pause' });
        break;
    }
  };

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
    },
  };

  return (
    <div className="video-container">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={(e) => { playerRef.current = e.target; }}
        onStateChange={handleStateChange}
      />
    </div>
  );
};
```

---

## 📚 참고 자료

### 공식 문서
- [WebRTC API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [Socket.io Documentation](https://socket.io/docs/)
- [React YouTube Player](https://www.npmjs.com/package/react-youtube)

### 학습 자료
- [WebRTC for the Curious](https://webrtcforthecurious.com/)
- [WebRTC Samples](https://webrtc.github.io/samples/)
- [Google Developers - WebRTC](https://developers.google.com/web/updates/2015/07/mediastream-deprecations)

---

## 📄 라이선스

MIT License

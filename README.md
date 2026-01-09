# 3DCommu Messenger

Electron 기반 실시간 메신저 애플리케이션

## 기술 스택

### 프론트엔드
- **Electron** - 데스크톱 앱 프레임워크
- **React** - UI 라이브러리
- **WebSocket (STOMP)** - 실시간 통신
- **Axios** - HTTP 클라이언트

### 백엔드
- **Spring Boot 3.2** - 백엔드 프레임워크
- **PostgreSQL** - 데이터베이스
- **WebSocket (STOMP)** - 실시간 통신
- **Spring Security + JWT** - 인증/인가

## 주요 기능

- ✅ 1:1 DM 및 그룹 채팅
- ✅ 실시간 메시지 송수신
- ✅ 읽음 상태 표시
- ✅ 타이핑 인디케이터
- ✅ 데스크톱 알림
- ✅ 다크 모드
- ✅ WebSocket 자동 재연결
- ✅ 메시지 검색

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 백엔드 서버 실행
```bash
cd 3DCommu_backend
./gradlew bootRun
```

### 3. Electron 앱 실행 (개발 모드)
```bash
npm run electron:dev
```

### 4. 프로덕션 빌드
```bash
npm run electron:build
```

## 프로젝트 구조

```
Messenger_v2/
├── electron/                 # Electron 메인 프로세스
│   ├── main.js
│   └── preload.js
├── src/
│   └── renderer/            # React 앱
│       ├── components/      # UI 컴포넌트
│       ├── context/         # Context Providers
│       ├── pages/           # 페이지 컴포넌트
│       ├── services/        # API 클라이언트
│       └── styles/          # CSS 스타일
└── 3DCommu_backend/         # Spring Boot 백엔드
    └── src/main/java/com/community/
        ├── controller/      # REST & WebSocket 컨트롤러
        ├── service/         # 비즈니스 로직
        ├── repository/      # 데이터 액세스
        ├── model/           # 엔티티
        └── dto/             # 데이터 전송 객체
```

## API 엔드포인트

### REST API
- `GET /api/chat/rooms` - 대화방 목록
- `POST /api/chat/rooms` - 대화방 생성
- `GET /api/chat/rooms/{roomId}/messages` - 메시지 조회
- `POST /api/chat/rooms/{roomId}/messages` - 메시지 전송
- `PATCH /api/chat/rooms/{roomId}/read` - 읽음 처리
- `POST /api/chat/rooms/{roomId}/invite` - 사용자 초대
- `DELETE /api/chat/rooms/{roomId}/leave` - 방 나가기

### WebSocket
- `/topic/chat/room/{roomId}` - 방별 메시지 구독
- `/topic/user/{userId}/updates` - 개인 알림 구독
- `/app/chat.typing` - 타이핑 인디케이터 전송

## 환경 변수

백엔드 `.env` 파일 설정:
```
DB_URL=jdbc:postgresql://localhost:5432/3dcommu
DB_USERNAME=your_username
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

## 라이선스

MIT

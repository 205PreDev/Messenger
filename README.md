# 3D Community 메신저

Electron 기반 데스크톱 메신저 애플리케이션

## 기능

- ✅ JWT 인증 (로그인/로그아웃)
- ✅ 친구 목록 및 검색
- ✅ 1:1 실시간 메시징
- ✅ 프로필 표시 (아바타, 닉네임, 레벨, 재화)
- ✅ 한국어 UI
- ✅ 다크 테마
- 🔄 WebSocket 실시간 통신 (구현 예정)
- 🔄 데스크톱 알림 (구현 예정)
- 🔄 시스템 트레이 (구현 예정)

## 기술 스택

- **Electron** 28.0.0 - 데스크톱 애플리케이션 프레임워크
- **React** 19.1.1 - UI 프레임워크
- **Vite** 5.0.0 - 빌드 도구
- **Axios** - HTTP 클라이언트
- **STOMP.js** - WebSocket 클라이언트
- **date-fns** - 날짜 포맷팅 (한국어 로케일)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 백엔드 URL을 설정하세요:

```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
```

### 3. 개발 모드 실행

```bash
npm run dev
```

이 명령어는 Vite 개발 서버와 Electron 앱을 동시에 실행합니다.

### 4. 프로덕션 빌드

```bash
npm run build:electron
```

빌드된 설치 파일은 `release/` 디렉토리에 생성됩니다.

## 프로젝트 구조

```
c:\KDT\Messenger/
├── electron/              # Electron 메인 프로세스
│   ├── main.js           # 메인 프로세스
│   └── preload.js        # 프리로드 스크립트
├── src/                  # React 애플리케이션
│   ├── components/       # UI 컴포넌트
│   │   ├── auth/        # 인증 관련
│   │   ├── chat/        # 채팅 관련
│   │   ├── friends/     # 친구 목록
│   │   └── layout/      # 레이아웃
│   ├── pages/           # 페이지 컴포넌트
│   ├── services/        # API 서비스
│   ├── i18n/            # 다국어 지원
│   ├── styles/          # 스타일
│   └── utils/           # 유틸리티
├── package.json
├── vite.config.js
└── README.md
```

## 주요 명령어

- `npm run dev` - 개발 모드 실행
- `npm run build` - Vite 빌드
- `npm run build:electron` - Electron 앱 빌드
- `npm run preview` - 빌드 미리보기

## API 연동

이 메신저 앱은 3D Community 백엔드 API를 사용합니다:

- `POST /api/auth/login` - 로그인
- `GET /api/profile` - 프로필 조회
- `GET /api/friends` - 친구 목록
- `GET /api/messages/dm/{friendId}` - 메시지 내역
- `POST /api/messages/dm` - 메시지 전송
- `POST /api/messages/mark-read/{friendId}` - 읽음 처리

## 라이선스

MIT

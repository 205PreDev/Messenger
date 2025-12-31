# 📘 API 연동 및 개발 표준 매뉴얼 (v1.0)

이 문서는 3Dcommu 백엔드 시스템과 프론트엔드(Electron/React) 간의 통신 규격 및 개발 표준을 정의합니다.

---

## 1. 인증 및 보안 (Authentication)

### 1.1 로그인 방식
- **프로토콜:** JWT (JSON Web Token) 기반 인증
- **로그인 엔드포인트:** `POST /api/auth/login`
- **필수 필드:** `email` (NOT `username`), `password`

### 1.2 토큰 관리
- **저장소:** Electron `electron-store` (Key: `auth_token`)
- **인증 헤더:** 모든 요청에 `Authorization: Bearer {token}` 포함

### 1.3 세션 만료 처리
- **인터셉터 로직:** API 요청 중 `401 Unauthorized` 에러 발생 시
  1. 로컬 저장소의 `auth_token` 삭제
  2. `/login` 페이지로 강제 리다이렉트

---

## 2. API 엔드포인트 상세

### 2.1 유저 및 프로필 (User/Profile)
| 기능 | 메서드 | 엔드포인트 | 비고 |
| :--- | :--- | :--- | :--- |
| **내 정보 요약** | `GET` | `/api/auth/me` | 식별 정보, 권한 등 조회 |
| **상세 프로필** | `GET` | `/api/profile/{userId}` | 재화, 레벨, 장착 아바타 정보 |
| **프로필 수정** | `PUT` | `/api/profile` | 상태 메시지, 아바타 장착 변경 |

> **주의:** `/api/profile`에 대한 단순 `GET` 요청은 지원하지 않습니다. 내 정보 조회 시에도 자신의 `userId`를 경로에 포함하거나 `/api/auth/me`를 사용하십시오.

### 2.2 메신저 (Friends & Messages)
| 기능 | 메서드 | 엔드포인트 | 비고 |
| :--- | :--- | :--- | :--- |
| **친구 목록** | `GET` | `/api/friends` | `ACCEPTED` 상태인 친구 리스트 |
| **채팅방 목록** | `GET` | `/api/messages/conversations` | 대화방 별 최근 메시지 포함 |
| **DM 내역 조회** | `GET` | `/api/messages/dm/{userId}` | 특정 유저와의 기록 (ID: Long) |
| **메시지 전송** | `POST` | `/api/messages/dm` | Body: `receiverId`, `content` |
| **읽음 처리** | `POST` | `/api/messages/mark-read/{userId}` | 해당 유저의 메시지 일괄 읽음 |

---

## 3. 데이터 모델 (DTO) 표준

### 3.1 기본 타입 규격
- **식별자(ID):** `Long` (Javascript에서는 `Number`로 처리)
- **날짜/시간:** `ISO-8601` 형식 (`YYYY-MM-DDTHH:mm:ss`)
- **재화(Coin):** `Integer`

### 3.2 주요 객체 구조
#### User (Profile 포함)
```json
{
  "id": 205,
  "username": "205PreDev",
  "goldCoins": 100,
  "silverCoins": 500,
  "selectedProfile": { "imagePath": "/resources/Profile/base.png" },
  "selectedOutline": { "imagePath": "/resources/ProfileOutline/gold.png" }
}
```

#### Message
```json
{
  "id": 1001,
  "senderId": 205,
  "receiverId": 206,
  "content": "안녕하세요!",
  "createdAt": "2023-12-29T16:00:00",
  "isRead": false
}
```

---

## 4. 실시간 통신 (WebSocket/STOMP)

- **접속 주소:** `ws://localhost:8080/ws` (SockJS 기반)
- **인증:** 연결 시 `connectHeaders`에 JWT 토큰 포함 필수

### 구독(Subscribe) 경로
- **개인 알림/메시지:** `/user/queue/messages`
- **광장 전체 채팅:** `/topic/public`

---

## 5. 에러 처리 규정

서버 에러 발생 시 공통적으로 다음 구조의 JSON을 반환합니다.

```json
{
  "status": 400,
  "message": "에러 발생 원인 메시지",
  "timestamp": "2023-12-29T16:00:00"
}
```

- **400:** 파라미터 유효성 실패 (이메일 누락 등)
- **401:** 토큰 만료 및 인증 실패
- **403:** 권한 부족 (관리자 전용 기능 접근 등)
- **405:** HTTP 메서드 불일치 (URL 확인 필요)

---
*최종 업데이트: 2025-12-30*

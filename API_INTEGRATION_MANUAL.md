# 📄 API 연동 및 개발 표준 매뉴얼

이 문서는 3D Community 메신저 앱과 백엔드 서버 간의 연동 규격 및 개발 표준을 정의합니다. `메신저_필독.md`의 내용을 바탕으로 상세화되었습니다.

---

## 1. 인증 및 보안 (Authentication)

### 1.1 인증 방식
- **방식:** JWT (JSON Web Token) 기반 인증
- **헤더:** `Authorization: Bearer {JWT_TOKEN}`
- **스토리지:** Electron의 `electron-store`를 사용하여 로컬 공간에 안전하게 저장합니다. (`token` 키 사용)

### 1.2 토큰 관리 규정
- **로그인 엔드포인트:** `POST /api/auth/login`
- **필수 데이터:**
  - `email`: 유저 이메일 (백엔드 LoginRequest 규격)
  - `password`: 유저 비밀번호
- **토큰 만료 처리:** 
  - API 호출 시 `401 Unauthorized` 응답을 받으면 토큰을 삭제하고 로그인 페이지로 리다이렉트합니다.
  - 앱 시작 시 토큰의 `exp` 필드를 확인하여 만료 여부를 체크합니다.

---

## 2. API 엔드포인트 명세 (Endpoint Specification)

### 2.1 유저 및 프로필
| 기능 | 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- | :--- |
| 내 프로필 조회 | GET | `/api/profile` | 닉네임, 레벨, 재화(금화/은화), 장착 아이템 정보 포함 |
| 내 정보 요약 | GET | `/api/auth/me` | 기본적인 유저 식별 정보 조회 |

### 2.2 친구 관리
| 기능 | 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- | :--- |
| 친구 목록 조회 | GET | `/api/friends` | `ACCEPTED` 상태의 친구 리스트 반환 |
| 친구 검색 | GET | `/api/friends/search` | 쿼리스트링 `?username={닉네임}`으로 유저 검색 |
| 친구 요청 | POST | `/api/friends/request` | Body: `{"username": "상대방"}` |
| 친구 수락 | POST | `/api/friends/accept/{f_id}` | `f_id`는 friendshipId (Long) |
| 친구 삭제 | DELETE | `/api/friends/{f_id}` | 친구 관계 해제 |

### 2.3 메시징 (DM)
| 기능 | 메서드 | 엔드포인트 | 설명 |
| :--- | :--- | :--- | :--- |
| 대화 목록 조회 | GET | `/api/messages/conversations` | 마지막 메시지 및 대화 상대 목록 조회 |
| 대화 기록 조회 | GET | `/api/messages/dm/{u_id}` | `u_id`는 상대방 userId (Long). 쿼리 `?limit=50` 권장 |
| 메시지 전송 | POST | `/api/messages/dm` | Body: `{"receiverId": 123, "content": "내용"}` |
| 읽음 처리 | POST | `/api/messages/mark-read/{u_id}` | 특정 유저와의 메시지를 모두 읽음으로 표시 |

---

## 3. 데이터 모델 (DTO)

### 3.1 공통 규칙
- **ID 형식:** 고유 식별자는 `Long` 타입을 사용하며, JSON에서는 숫자로 취급합니다.
- **날짜 형식:** ISO-8601 표준 (예: `2023-12-29T15:00:00Z`)을 사용하며, 클라이언트에서 `date-fns` 등을 이용해 포맷팅합니다.

### 3.2 주요 객체 구조 (예시)
- **User/Profile:**
  ```json
  {
    "id": 1,
    "username": "205PreDev",
    "goldCoins": 1000,
    "silverCoins": 500,
    "selectedProfile": { "imagePath": "/path/to/img", "itemName": "Avatar" }
  }
  ```
- **Message:**
  ```json
  {
    "id": 101,
    "senderId": 1,
    "receiverId": 2,
    "content": "안녕하세요",
    "createdAt": "2023-12-29T16:30:00",
    "isRead": false
  }
  ```

---

## 4. 실시간 통신 규준 (WebSocket/STOMP)

### 4.1 연결 설정
- **엔드포인트:** `ws://localhost:8080/ws` (SockJS 사용 시 `http://localhost:8080/ws`)
- **프로토콜:** STOMP v1.2

### 4.2 구독 권한 및 경로
- **개인 DM 메시지:** `/user/queue/messages` (개별 유저 대상 메시지)
- **광장(퍼블릭) 채팅:** `/topic/public`
- **구독 시점:** 앱 로드 후 인증이 완료된 즉시 연결을 시도하며, 브라우저 콘솔을 통해 로그를 남겨 상태를 모니터링합니다.

---

## 5. 에러 핸들링 가이드

| 상태 코드 | 의미 | 대응 방안 |
| :--- | :--- | :--- |
| **400 Bad Request** | 요청 데이터 오류 | 필드명(예: `email` vs `username`) 및 제약 조건 확인 |
| **401 Unauthorized** | 인증 만료 | 로컬 저장소 토큰 삭제 후 로그인 페이지로 강제 이동 |
| **403 Forbidden** | 권한 부족 | 접근 가능한 리소스인지 확인 |
| **404 Not Found** | 리소스 없음 | 엔드포인트 주소 및 ID값 유효성 확인 |
| **500 Internal Error** | 서버 측 오류 | 서버 로그 확인 필요 |

---
*참고: 백엔드 코드(`SecurityConfig.java`, `Controller.java` 등) 접근이 제한적인 경우 본 매뉴얼은 `메신저_필독.md` 및 실제 API 응답 결과를 최상위 신뢰 출처로 삼습니다.*

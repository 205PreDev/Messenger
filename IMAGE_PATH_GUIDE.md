# 🖼️ 이미지 리소스 접근 및 경로 해결 가이드

메신저 앱에서 프로필 이미지가 엑박(Broken Image)으로 표시되는 문제를 해결하기 위한 점검 리스트입니다.

---

## 1. 문제의 원인 분석 (Root Cause)
현재 시스템 구조상 이미지는 다음 두 가지 원인으로 인해 로드되지 않을 가능성이 높습니다.
1. **도메인 미지정:** DB에는 `/resources/...`와 같은 상대 경로만 저장되어 있으나, 클라이언트는 이를 백엔드 도메인(`http://localhost:8080`) 없이 호출함.
2. **리소스 매핑 누락:** 백엔드 서버가 특정 폴더의 파일을 외부에서 접근 가능한 정적 리소스로 인식하지 못함.
3. **보안 차단:** Spring Security가 이미지 경로에 대한 접근을 인증(Token) 없이는 거부함.

---

## 2. 백엔드 점검 가이드 (Server Side)

### 2.1 정적 리소스 핸들러 설정
서버의 특정 디렉토리를 `/resources/**` URL로 매핑해야 합니다.
- **체크할 파일:** `backend/src/main/java/com/community/config/WebMvcConfig.java` (없다면 생성 필요)
- **설정 내용:**
```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/resources/**")
                .addResourceLocations("classpath:/static/resources/", "file:./public/resources/");
    }
}
```

### 2.2 보안 설정 (Security)
이미지 리소스는 토큰 없이도 브라우저가 직접 불러올 수 있어야 합니다.
- **체크할 파일:** `backend/src/main/java/com/community/config/SecurityConfig.java`
- **수정 사항:** `securityFilterChain` 메서드 내 `requestMatchers`에 아래 경로 추가
```java
.requestMatchers("/resources/**", "/static/**", "/favicon.ico").permitAll()
```

---

## 3. 프론트엔드 처리 가이드 (Client Side)

### 3.1 API 응답 데이터 확인
먼저 브라우저 개발자 도구(F12) -> Network 탭에서 프로필 조회 응답을 확인하세요.
- 만약 `imagePath`가 `/resources/Profile/base-profile1.png`와 같이 온다면, 그대로 사용해서는 안 됩니다.

### 3.2 이미지 URL 조립 (Prefix 추가)
프론트엔드 코드에서 백엔드 주소를 붙여주어야 합니다.
- **참고 파일:** `src/services/authService.js` 또는 `src/pages/MessengerPage.jsx`
- **구현 예시:**
```javascript
const BACKEND_URL = "http://localhost:8080";
const profileImageUrl = item.imagePath.startsWith('http') 
    ? item.imagePath 
    : `${BACKEND_URL}${item.imagePath}`;
```

---

## 4. 즉시 테스트 방법
1. 백엔드 서버를 실행합니다 (`localhost:8080`).
2. 브라우저 주소창에 직접 이미지 주소를 입력해 봅니다.
   - 예: `http://localhost:8080/resources/Profile/base-profile1.png`
3. **결과에 따른 조치:**
   - **이미지가 보임:** 백엔드 설정은 정상입니다. 프론트엔드에서 `http://localhost:8080`을 붙여서 호출하세요.
   - **404 Not Found:** 백엔드 `WebMvcConfig` 설정이 잘못되었거나 파일이 해당 위치에 없습니다.
   - **403 Forbidden:** 백엔드 `SecurityConfig`에서 해당 경로를 `permitAll()` 시켜야 합니다.

---
*참고: 현재 프로젝트 구조상 실제 이미지 파일은 `C:\KDT\3Dcommu\public\resources` 또는 백엔드의 `static` 폴더 내부에 위치해야 합니다.*

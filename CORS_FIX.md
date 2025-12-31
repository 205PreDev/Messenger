# CORS 문제 해결 방법

## 문제
백엔드 서버가 `localhost:5173` (Vite 개발 서버)의 요청을 CORS 정책으로 차단하고 있습니다.

## 해결 방법

### 옵션 1: 백엔드 CORS 설정 수정 (권장)

백엔드 프로젝트의 CORS 설정 파일을 찾아 `localhost:5173`을 허용 목록에 추가하세요.

**Spring Boot의 경우**, `WebConfig.java` 또는 `SecurityConfig.java`에서:

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                    "http://localhost:5173",  // Vite 개발 서버
                    "http://localhost:3000",  // 기존 React 앱
                    "https://your-production-url.com"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true);
    }
}
```

또는 **Spring Security**를 사용하는 경우:

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.cors(cors -> cors.configurationSource(request -> {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(
            "http://localhost:5173",
            "http://localhost:3000"
        ));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowCredentials(true);
        return config;
    }));
    // ... 나머지 설정
}
```

### 옵션 2: Vite 프록시 사용 (임시 해결)

`vite.config.js`에 프록시 설정 추가:

```javascript
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      }
    }
  }
});
```

그리고 `.env` 파일 수정:
```env
VITE_API_URL=
VITE_WS_URL=http://localhost:8080
```

## 수정 완료 사항
- ✅ Preload 스크립트를 CommonJS로 변환 (ES 모듈 오류 해결)

## 다음 단계
1. 백엔드 CORS 설정 수정 (옵션 1 권장)
2. 앱 재시작
3. 로그인 재시도

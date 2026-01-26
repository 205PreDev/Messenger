# 백엔드 JWT 예외 처리 가이드

사용자께서 겪으신 `ExpiredJwtException`으로 인한 500 에러는 Spring Security 필터 체인에서 예외가 적절히 처리되지 않아 발생합니다. 이를 근본적으로 해결하기 위한 백엔드 수정 가이드입니다.

## 1. 문제 원인
- `JwtAuthenticationFilter`가 `OncePerRequestFilter`를 상속받아 모든 요청(로그인 포함)에서 동작하고 있습니다.
- `permitAll()` 설정이 되어 있더라도 필터는 실행될 수 있으며, 이때 만료된 토큰이 헤더에 포함되어 있으면 `extractClaims` 과정에서 예외가 발생합니다.
- 이 예외가 필터 외부로 던져지면 Spring Boot의 기본 에러 처리 로직에 의해 500 에러와 `/error` 페이지 응답이 나갑니다.

## 2. 권장 해결 코드 (Backend)

`JwtAuthenticationFilter.java`의 `doFilterInternal` 메서드 내에서 예외를 직접 처리하도록 수정하는 것이 가장 좋습니다.

```java
@Override
protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
        throws ServletException, IOException {
    try {
        String jwt = parseJwt(request);
        if (jwt != null && tokenProvider.validateToken(jwt)) {
            // ... 기존 인증 로직 ...
        }
        filterChain.doFilter(request, response);
    } catch (ExpiredJwtException e) {
        // JWT 만료 시 401 Unauthorized 응답을 명시적으로 반환
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.getWriter().write("{\"message\": \"JWT expired\", \"status\": 401}");
    } catch (Exception e) {
        // 기타 보안 예외 처리
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
    }
}
```

## 3. 요약
- **프론트엔드 조치 완료**: 로그인 요청 시 토큰 전송을 막고, 서버 에러 발생 시 만료 메시지를 체크하여 자동 로그아웃되도록 수정했습니다.
- **백엔드 조치 권장**: 위 코드처럼 보안 필터 레벨에서 JWT 예외를 캐치하여 401 에러를 반환하게 하면, 프론트엔드가 표준적인 방식으로 에러를 처리할 수 있게 됩니다.

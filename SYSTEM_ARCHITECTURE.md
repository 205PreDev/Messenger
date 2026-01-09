# Messenger System Architecture

## 1. High-Level Overview
The **Messenger** application operates on a **Hybrid Architecture** combining a **React (ViteSingle Page Application (SPA)** frontend with an external **Spring Boot** backend.

- **Frontend**: Handles UI, state management, and real-time event processing.
- **Backend (MetaPlaza)**: Manages authentication, business logic, persistence, and WebSocket broadcasting.

## 2. Communication Protocols
The system utilizes two primary protocols for communication:

1.  **HTTP/REST**: strictly for request-response actions (e.g., Login, Sending Messages, Fetching History).
2.  **WebSocket (STOMP)**: strictly for server-to-client events (e.g., Receiving Messages, Online Status Updates).

## 3. Architecture Diagram

```mermaid
graph TD
    subgraph "Client Side (React/Vite)"
        UI[User Interface Components]
        
        subgraph "Service Layer"
            AuthS[AuthService]
            FriendS[FriendService]
            MsgS[MessageService]
            WSS[WebSocketService]
        end

        UI --> AuthS
        UI --> FriendS
        UI --> MsgS
        UI --> WSS
    end

    subgraph "Communication Channels"
        REST[REST API (HTTP/HTTPS)]
        WS[WebSocket (WS/WSS)]
    end

    subgraph "Server Side (Spring Boot)"
        AuthC[AuthController]
        FriendC[FriendController]
        MsgC[MessageController]
        SocketC[StompBroker]
        DB[(Database)]
    end

    %% REST Interactions
    AuthS -- "POST /login, GET /me" --> REST
    FriendS -- "GET /friends, POST /request" --> REST
    MsgS -- "POST /dm (Send), GET /history" --> REST

    REST --> AuthC
    REST --> FriendC
    REST --> MsgC

    %% WebSocket Interactions
    WSS -- "Connect /ws" --> WS
    WS -- "Subscribe /topic/dm/{uid}" --> SocketC
    WS -- "Subscribe /topic/players" --> SocketC

    %% Backend Logic
    AuthC --> DB
    FriendC --> DB
    MsgC --> DB

    %% Real-time Events Flow
    MsgC -.->|Event: Message Saved| SocketC
    SocketC -.->|Push: New Message| WS
    WS -.->|Callback: onMessageReceived| WSS
    WSS -->|Update State| UI
```

## 4. Data Flow Description

### A. Authentication flow
1.  **Login**: `AuthService` sends credentials via REST POST.
2.  **Token**: Server returns JWT. Client stores it in `localStorage` or memory.
3.  **Validation**: Subsequent requests include `Authorization: Bearer <token>`.

### B. Messaging Flow (Hybrid)
1.  **Sending**: User types message -> `MessageService` sends **REST POST** request -> Server saves to DB.
    *   *Why REST?* Ensures reliable delivery confirmation and persistence before updating UI.
2.  **Receiving**: `WebSocketService` listens to `/topic/dm/{userId}`.
    *   Server broadcasts the saved message to the recipient's topic.
    *   Client receives event -> Appends to Chat Window via state update.

### C. Status Flow
1.  **Initial Load**: `AuthService` calls REST GET `/is-active/{userId}` for snapshot status.
2.  **Live Updates**: `WebSocketService` listens to `/topic/players` for `JOIN/LEAVE` events to update indicators in real-time.

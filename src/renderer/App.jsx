import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Messenger from './pages/Messenger';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';

import TitleBar from './components/TitleBar';

function PrivateRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <div className="app-main-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                    <TitleBar />
                    <Router>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route
                                    path="/"
                                    element={
                                        <PrivateRoute>
                                            <Messenger />
                                        </PrivateRoute>
                                    }
                                />
                            </Routes>
                        </div>
                    </Router>
                </div>
            </WebSocketProvider>
        </AuthProvider>
    );
}

export default App;

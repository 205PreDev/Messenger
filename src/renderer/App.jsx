import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Messenger from './pages/Messenger';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider } from './context/WebSocketContext';

function PrivateRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <AuthProvider>
            <WebSocketProvider>
                <Router>
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
                </Router>
            </WebSocketProvider>
        </AuthProvider>
    );
}

export default App;

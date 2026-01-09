import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 로컬 스토리지에서 토큰 복원
        const savedToken = localStorage.getItem('authToken');
        const savedUser = localStorage.getItem('user');

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = useCallback((userData, authToken) => {
        setUser(userData);
        setToken(authToken);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('user', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
    }, []);

    const value = useMemo(() => ({
        user,
        token,
        login,
        logout,
        loading
    }), [user, token, login, logout, loading]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

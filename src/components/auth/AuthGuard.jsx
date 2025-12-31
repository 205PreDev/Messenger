import React from 'react';
import { Navigate } from 'react-router-dom';

function AuthGuard({ children, isAuthenticated }) {
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default AuthGuard;

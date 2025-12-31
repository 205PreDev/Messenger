import React from 'react';
import LoginForm from '../components/auth/LoginForm';

function LoginPage({ onLogin }) {
    return <LoginForm onLogin={onLogin} />;
}

export default LoginPage;

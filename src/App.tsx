import React, { useState, useEffect } from 'react';
import { getCurrentSession, logout as authLogout, type AuthUser } from './auth/authStore';
import { LoginPage } from './components/auth/LoginPage';
import { SignupPage } from './components/auth/SignupPage';
import { MainApp } from './MainApp';

type Page = 'login' | 'signup' | 'app';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('login');
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // On mount: check for existing session
  useEffect(() => {
    const session = getCurrentSession();
    if (session) {
      setCurrentUser(session);
      setPage('app');
    }
  }, []);

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setPage('app');
  };

  const handleSignupSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setPage('app');
  };

  const handleLogout = () => {
    authLogout();
    setCurrentUser(null);
    setPage('login');
  };

  if (page === 'login') {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoSignup={() => setPage('signup')}
      />
    );
  }

  if (page === 'signup') {
    return (
      <SignupPage
        onSignupSuccess={handleSignupSuccess}
        onGoLogin={() => setPage('login')}
      />
    );
  }

  return <MainApp user={currentUser!} onLogout={handleLogout} />;
};

export default App;

import React, { useState } from 'react';
import styles from './Login.module.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const { login, error: authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    clearError();
    setLocalError('');

    try {
      if (!email.trim() || !password.trim()) {
        throw new Error('Email and password are required');
      }

      await login({ email: email.trim(), password: password.trim() });
      navigate('/dashboard');
    } catch (err) {
      if (err.message === 'Email and password are required') {
        setLocalError(err.message);
      } else {
        console.error('Login error:', err);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className={styles.container}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title}>Login to FinTrack Pro</h2>

        <input
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
          disabled={isSubmitting}
        />

        <input
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
          disabled={isSubmitting}
        />

        <button 
          className={styles.button} 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Login'}
        </button>

        {displayError && (
          <p className={styles.error}>
            {displayError}
            {displayError === 'Invalid credentials' && (
              <span className={styles.suggestion}>
                <br />Check your email and password or <Link to="/register">register</Link> if you don't have an account.
              </span>
            )}
          </p>
        )}

        <p className={styles.registerPrompt}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}

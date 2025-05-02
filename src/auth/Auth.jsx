import React, { useState } from 'react'
import { supabaseClient } from '../utils/supabaseClient'

const Auth = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      setError(error.message)
    } 
    setIsLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
    })
    if (error) {
      setError(error.message)
    } else {
      setError('Check your email for the confirmation link!')
    }
    setIsLoading(false)
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 style={{color: 'white'}}>Welcome</h2>
        <form onSubmit={handleSignIn} className="auth-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
          <button type="submit" disabled={isLoading} className="auth-button">
            {isLoading ? 'Loading...' : 'Sign In'}
          </button>
          <button 
            type="button" 
            onClick={handleSignUp} 
            disabled={isLoading}
            className="auth-button secondary"
          >
            Sign Up
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
      </div>
    </div>
  )
}

export default Auth 
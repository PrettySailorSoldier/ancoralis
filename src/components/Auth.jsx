import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('email') // 'email' or 'code'
  const [error, setError] = useState('')

  const handleSendCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setStage('code')
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email'
    })
    
    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success, onAuthStateChange fires automatically
  }

  const handleResendCode = async () => {
    setLoading(true)
    setError('')
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true
      }
    })
    
    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  const handleBack = () => {
    setStage('email')
    setCode('')
    setError('')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        textAlign: 'center'
      }}>
        <h1 style={{
          color: 'white',
          fontSize: '2rem',
          marginBottom: '0.5rem',
          fontWeight: '300'
        }}>
          Ancoralis
        </h1>
        <p style={{
          color: '#9ca3af',
          marginBottom: '2rem',
          fontSize: '0.875rem'
        }}>
          Biological rhythm anchors
        </p>

        {stage === 'email' ? (
          <form onSubmit={handleSendCode} style={{ width: '100%' }}>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#1a1a24',
                border: '1px solid #2a2a3a',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                marginBottom: '1rem',
                outline: 'none'
              }}
            />
            {error && (
              <p style={{
                color: '#ef4444',
                fontSize: '0.875rem',
                marginBottom: '1rem',
                textAlign: 'left'
              }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#a78bfa',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '1rem',
                fontWeight: '500',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {loading ? 'Sending...' : 'Send code'}
            </button>
          </form>
        ) : (
          <div>
            <button
              onClick={handleBack}
              style={{
                background: 'none',
                border: 'none',
                color: '#9ca3af',
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              ← Back
            </button>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.875rem',
              marginBottom: '1.5rem'
            }}>
              Enter the 6-digit code sent to <strong style={{ color: 'white' }}>{email}</strong>
            </p>
            <form onSubmit={handleVerifyCode} style={{ width: '100%' }}>
              <input
                type="text"
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                inputMode="numeric"
                required
                disabled={loading}
                autoFocus
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#1a1a24',
                  border: '1px solid #2a2a3a',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                  outline: 'none',
                  textAlign: 'center',
                  letterSpacing: '0.5em',
                  fontVariantNumeric: 'tabular-nums'
                }}
              />
              {error && (
                <p style={{
                  color: '#ef4444',
                  fontSize: '0.875rem',
                  marginBottom: '1rem',
                  textAlign: 'left'
                }}>
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading || code.length !== 6}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#a78bfa',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: (loading || code.length !== 6) ? 'not-allowed' : 'pointer',
                  opacity: (loading || code.length !== 6) ? 0.6 : 1,
                  transition: 'opacity 0.2s',
                  marginBottom: '1rem'
                }}
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: '0.875rem',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Resend code
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

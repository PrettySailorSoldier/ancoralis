import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin
      }
    })
    
    if (error) {
      alert(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
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

        {!sent ? (
          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
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
              {loading ? 'Sending...' : 'Send magic link'}
            </button>
          </form>
        ) : (
          <div style={{
            padding: '20px',
            background: '#1a1a24',
            border: '1px solid #2a2a3a',
            borderRadius: '8px'
          }}>
            <p style={{
              color: '#a78bfa',
              fontSize: '1.125rem',
              marginBottom: '0.5rem'
            }}>
              ✓ Check your email
            </p>
            <p style={{
              color: '#9ca3af',
              fontSize: '0.875rem'
            }}>
              We sent a magic link to <strong style={{ color: 'white' }}>{email}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

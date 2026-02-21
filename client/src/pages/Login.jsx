import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Truck, LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react'
import axios from 'axios'

export default function Login() {
    const { login } = useAuth()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const res = await axios.post('/api/auth/login', { username, password })
            login(res.data)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Animated background elements */}
            <div style={{
                position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
            }}>
                <div style={{
                    position: 'absolute', top: '-20%', left: '-10%', width: '500px', height: '500px',
                    background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
                    borderRadius: '50%', animation: 'float 8s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute', bottom: '-20%', right: '-10%', width: '600px', height: '600px',
                    background: 'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
                    borderRadius: '50%', animation: 'float 10s ease-in-out infinite reverse',
                }} />
                <div style={{
                    position: 'absolute', top: '30%', right: '20%', width: '300px', height: '300px',
                    background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)',
                    borderRadius: '50%', animation: 'float 6s ease-in-out infinite 2s',
                }} />
            </div>

            <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-30px) scale(1.05); }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1); opacity: 0.2; }
          100% { transform: scale(0.8); opacity: 0.5; }
        }
      `}</style>

            {/* Login Card */}
            <div style={{
                background: 'rgba(30,41,59,0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(51,65,85,0.6)',
                borderRadius: '24px',
                padding: '48px 40px',
                width: '100%',
                maxWidth: '440px',
                boxShadow: '0 25px 60px rgba(0,0,0,0.4), 0 0 100px rgba(99,102,241,0.05)',
                position: 'relative',
                zIndex: 10,
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '64px', height: '64px',
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))',
                        borderRadius: '16px',
                        marginBottom: '16px',
                        position: 'relative',
                    }}>
                        <div style={{
                            position: 'absolute', inset: '-4px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))',
                            borderRadius: '20px',
                            animation: 'pulse-ring 3s ease-in-out infinite',
                        }} />
                        <Truck size={30} style={{ color: '#818cf8', position: 'relative', zIndex: 1 }} />
                    </div>
                    <h1 style={{
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        background: 'linear-gradient(135deg, #818cf8, #06b6d4)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        letterSpacing: '-0.02em',
                        marginBottom: '6px',
                    }}>
                        FleetFlow
                    </h1>
                    <p style={{
                        color: '#64748b',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                    }}>
                        Sign in to your fleet management dashboard
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        color: '#fca5a5',
                        fontSize: '0.85rem',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block', fontSize: '0.8rem', fontWeight: 600,
                            color: '#94a3b8', marginBottom: '8px',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. ramesh_mgr"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={{
                                width: '100%', padding: '12px 16px',
                                background: 'rgba(15,23,42,0.6)',
                                border: '1px solid #334155',
                                borderRadius: '12px', color: '#f1f5f9',
                                fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
                                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                outline: 'none',
                            }}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#6366f1'
                                e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#334155'
                                e.target.style.boxShadow = 'none'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '28px' }}>
                        <label style={{
                            display: 'block', fontSize: '0.8rem', fontWeight: 600,
                            color: '#94a3b8', marginBottom: '8px',
                            textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={{
                                    width: '100%', padding: '12px 44px 12px 16px',
                                    background: 'rgba(15,23,42,0.6)',
                                    border: '1px solid #334155',
                                    borderRadius: '12px', color: '#f1f5f9',
                                    fontSize: '0.9rem', fontFamily: 'Inter, sans-serif',
                                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                                    outline: 'none',
                                }}
                                onFocus={(e) => {
                                    e.target.style.borderColor = '#6366f1'
                                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.15)'
                                }}
                                onBlur={(e) => {
                                    e.target.style.borderColor = '#334155'
                                    e.target.style.boxShadow = 'none'
                                }}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute', right: '12px', top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none', border: 'none',
                                    color: '#64748b', cursor: 'pointer',
                                    padding: '4px', display: 'flex',
                                }}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', padding: '13px',
                            background: loading
                                ? '#475569'
                                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            color: 'white',
                            border: 'none', borderRadius: '12px',
                            fontSize: '0.9375rem', fontWeight: 700,
                            fontFamily: 'Inter, sans-serif',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: loading ? 'none' : '0 4px 15px rgba(99,102,241,0.3)',
                        }}
                    >
                        <LogIn size={18} />
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                {/* Hint */}
                <div style={{
                    marginTop: '28px',
                    padding: '16px',
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.12)',
                    borderRadius: '12px',
                }}>
                    <div style={{
                        fontSize: '0.75rem', fontWeight: 700, color: '#818cf8',
                        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px',
                    }}>
                        Demo Credentials
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: '1.6' }}>
                        <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>ramesh_mgr</span>
                        <span style={{ color: '#64748b' }}> / </span>
                        <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>password123</span>
                        <span style={{ color: '#64748b' }}> (Manager)</span>
                        <br />
                        <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>suresh_disp</span>
                        <span style={{ color: '#64748b' }}> / </span>
                        <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>password123</span>
                        <span style={{ color: '#64748b' }}> (Dispatcher)</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

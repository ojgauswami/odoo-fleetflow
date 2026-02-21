import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LogIn, Zap, Sun, Moon, User, Lock } from 'lucide-react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useTranslation } from 'react-i18next'

const demoUsers = [
    { user: 'super', pass: 'super123', role: 'Super Admin', color: 'var(--amber)' },
    { user: 'ramesh_mgr', role: 'Manager', color: 'var(--accent)' },
    { user: 'suresh_disp', role: 'Dispatcher', color: 'var(--cyan)' },
    { user: 'vikram_safety', role: 'Safety Officer', color: 'var(--success)' },
    { user: 'anita_finance', role: 'Financial Analyst', color: 'var(--pink)' },
]

export default function Login() {
    const { login } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [fieldErrors, setFieldErrors] = useState({})

    const validate = () => {
        const errs = {}
        if (!username.trim()) errs.username = 'Username is required'
        else if (username.trim().length < 3) errs.username = 'Min 3 characters'
        if (!password) errs.password = 'Password is required'
        else if (password.length < 6) errs.password = 'Min 6 characters'
        setFieldErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true); setError('')
        try {
            const { data } = await axios.post('/api/auth/login', { username: username.trim(), password })
            login(data)
            navigate('/dashboard')
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.')
            setLoading(false)
        }
    }

    const fillDemo = (u) => { setUsername(u.user); setPassword(u.pass || 'password123'); setError(''); setFieldErrors({}) }

    const FieldErr = ({ name }) => fieldErrors[name] ? <div className="field-error" style={{ marginTop: '5px' }}>⚠ {fieldErrors[name]}</div> : null

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative' }}>
            {/* Theme toggle top-right */}
            <button onClick={toggleTheme} style={{
                position: 'fixed', top: '20px', right: '20px',
                padding: '10px', background: 'var(--bg-glass)', backdropFilter: 'var(--blur-md)',
                border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)',
                color: theme === 'dark' ? 'var(--amber)' : 'var(--accent)',
                cursor: 'pointer', display: 'flex', zIndex: 10,
            }}>{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>

            <div style={{ width: '100%', maxWidth: '400px', animation: 'fadeInUp 0.6s ease' }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div style={{
                        width: '62px', height: '62px', borderRadius: 'var(--radius-lg)',
                        background: 'var(--grd-accent)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 14px',
                        boxShadow: '0 4px 28px rgba(124,122,255,0.30)',
                    }}>
                        <Zap size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: 'var(--text-primary)' }}>{t('login.title')}</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500, marginTop: '4px' }}>{t('login.subtitle')}</p>
                </div>

                {/* Login card */}
                <div className="glass-card-strong" style={{ padding: '36px' }}>
                    {error && <div className="error-banner" style={{ marginBottom: '18px', animation: 'shake 0.4s ease' }}>{error}</div>}

                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <label className="form-label">{t('login.username')}</label>
                            <div style={{ position: 'relative' }}>
                                <User size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input className={`form-input ${fieldErrors.username ? 'input-error' : ''}`}
                                    placeholder={t('login.username')}
                                    value={username}
                                    onChange={e => { setUsername(e.target.value); setError('') }}
                                    style={{ paddingLeft: '42px' }}
                                />
                            </div>
                            <FieldErr name="username" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{t('login.password')}</label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input className={`form-input ${fieldErrors.password ? 'input-error' : ''}`}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={t('login.password')}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setError('') }}
                                    style={{ paddingLeft: '42px', paddingRight: '48px' }}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{
                                    position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                                    background: 'none', border: 'none', color: 'var(--text-muted)',
                                    cursor: 'pointer', display: 'flex',
                                }}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                            </div>
                            <FieldErr name="password" />
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}
                            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '0.88rem', marginTop: '6px' }}>
                            <LogIn size={17} /> {loading ? t('login.signingIn') : t('login.signIn')}
                        </button>
                    </form>

                    {/* Demo users */}
                    <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-glass)', paddingTop: '20px' }}>
                        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', textAlign: 'center', marginBottom: '10px' }}>{t('login.quickLogin')}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                            {demoUsers.map(d => (
                                <button key={d.user} type="button" onClick={() => fillDemo(d)}
                                    style={{
                                        padding: '5px 11px', borderRadius: 'var(--radius-full)',
                                        background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                                        color: d.color, fontSize: '0.68rem', fontWeight: 700,
                                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                        transition: 'all 0.2s ease',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = d.color; e.currentTarget.style.transform = 'translateY(-1px)' }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = 'none' }}
                                >{d.role}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

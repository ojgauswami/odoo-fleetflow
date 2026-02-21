import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Truck, Navigation, Wrench, Receipt,
    TrendingUp, BarChart3, Search, Menu, X, LogOut, User,
    Sun, Moon, Zap, Shield, Clock, ChevronLeft, ChevronRight, Globe, ChevronDown
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useTranslation } from 'react-i18next'

const allNavItems = [
    { path: '/dashboard', labelKey: 'menu.dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst'] },
    { path: '/vehicles', labelKey: 'menu.vehicleRegistry', icon: Truck, roles: ['Super Admin', 'Manager', 'Dispatcher'] },
    { path: '/trips', labelKey: 'menu.tripDispatcher', icon: Navigation, roles: ['Super Admin', 'Manager', 'Dispatcher'] },
    { path: '/maintenance', labelKey: 'menu.maintenance', icon: Wrench, roles: ['Super Admin', 'Manager', 'Safety Officer'] },
    { path: '/expenses', labelKey: 'menu.tripExpenses', icon: Receipt, roles: ['Super Admin', 'Manager', 'Financial Analyst', 'Dispatcher'] },
    { path: '/performance', labelKey: 'menu.performance', icon: TrendingUp, roles: ['Super Admin', 'Manager', 'Safety Officer'] },
    { path: '/analytics', labelKey: 'menu.analytics', icon: BarChart3, roles: ['Super Admin', 'Manager', 'Financial Analyst'] },
    { path: '/admin', labelKey: 'menu.adminPanel', icon: Shield, roles: ['Super Admin'] },
]

export default function Layout() {
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useTheme()
    const { t, i18n } = useTranslation()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarExpanded, setSidebarExpanded] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const navItems = allNavItems.filter(item => item.roles.includes(user?.role))

    // Find active item for dynamic title
    const activeItem = allNavItems.find(item => item.path === location.pathname)
    const pageTitle = activeItem ? t(activeItem.labelKey) : 'FleetFlow'

    const sidebarWidth = sidebarExpanded ? '240px' : '68px'

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* ──── SIDEBAR ──── */}
            <aside style={{
                width: sidebarWidth,
                minWidth: sidebarWidth,
                background: 'var(--grd-sidebar)',
                backdropFilter: 'var(--blur-xl)',
                WebkitBackdropFilter: 'var(--blur-xl)',
                borderRight: '1px solid var(--border-glass)',
                display: 'flex', flexDirection: 'column',
                transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                zIndex: 50,
                overflow: 'hidden',
            }}>
                {/* Logo area */}
                <div style={{
                    padding: sidebarExpanded ? '20px 18px' : '20px 14px',
                    display: 'flex', alignItems: 'center',
                    justifyContent: sidebarExpanded ? 'space-between' : 'center',
                    borderBottom: '1px solid var(--border-glass)',
                    minHeight: '68px',
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        cursor: 'pointer', overflow: 'hidden',
                    }} onClick={() => navigate('/dashboard')}>
                        <div style={{
                            width: '34px', height: '34px', minWidth: '34px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--grd-accent)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 14px rgba(124,122,255,0.30)',
                        }}>
                            <Zap size={17} color="white" />
                        </div>
                        {sidebarExpanded && (
                            <div style={{ animation: 'fadeIn 0.2s ease' }}>
                                <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.1 }}>FleetFlow</div>
                                <div style={{ fontSize: '0.55rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Fleet Control</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Nav items */}
                <nav style={{ flex: 1, padding: sidebarExpanded ? '10px 10px' : '10px 8px', overflowY: 'auto' }}>
                    {navItems.map((item, i) => (
                        <NavLink key={item.path} to={item.path}
                            title={!sidebarExpanded ? t(item.labelKey) : undefined}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center',
                                gap: sidebarExpanded ? '10px' : '0',
                                padding: sidebarExpanded ? '10px 12px' : '10px',
                                marginBottom: '2px',
                                borderRadius: 'var(--radius-md)',
                                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                                background: isActive ? 'var(--accent-dim)' : 'transparent',
                                fontSize: '0.8rem', fontWeight: isActive ? 700 : 500,
                                textDecoration: 'none',
                                transition: 'all 0.25s ease',
                                border: isActive ? '1px solid var(--border-accent)' : '1px solid transparent',
                                justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                                animation: `fadeInUp 0.3s ease ${i * 0.04}s both`,
                                position: 'relative',
                                overflow: 'hidden',
                            })}
                            onMouseEnter={(e) => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = 'var(--bg-glass-hover)' }}
                            onMouseLeave={(e) => { if (!e.currentTarget.classList.contains('active')) e.currentTarget.style.background = '' }}
                        >
                            <item.icon size={17} style={{ minWidth: '17px' }} />
                            {sidebarExpanded && <span>{t(item.labelKey)}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Collapse toggle */}
                <button
                    onClick={() => setSidebarExpanded(!sidebarExpanded)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '8px', margin: '0 10px 8px',
                        background: 'var(--bg-elevated)', border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)',
                        cursor: 'pointer', transition: 'all 0.25s ease',
                        fontSize: '0', fontFamily: 'Inter, sans-serif',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-elevated)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                    title={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                >
                    {sidebarExpanded ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
                </button>

                {/* User card */}
                <div style={{ padding: sidebarExpanded ? '12px 10px' : '12px 8px', borderTop: '1px solid var(--border-glass)' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center',
                        gap: sidebarExpanded ? '9px' : '0',
                        padding: sidebarExpanded ? '10px 12px' : '10px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--border-glass)',
                        justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                    }}>
                        <div style={{
                            width: '30px', height: '30px', minWidth: '30px',
                            borderRadius: 'var(--radius-sm)',
                            background: 'var(--grd-accent)', display: 'flex', alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <User size={13} color="white" />
                        </div>
                        {sidebarExpanded && (
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.username}</div>
                                <div style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--accent)' }}>{user?.role}</div>
                            </div>
                        )}
                    </div>
                    <button onClick={() => { logout(); navigate('/login') }}
                        title={t('menu.signOut')}
                        style={{
                            display: 'flex', alignItems: 'center',
                            gap: sidebarExpanded ? '8px' : '0',
                            justifyContent: sidebarExpanded ? 'flex-start' : 'center',
                            width: '100%', padding: sidebarExpanded ? '9px 12px' : '9px',
                            marginTop: '6px',
                            background: 'none', border: 'none', borderRadius: 'var(--radius-md)',
                            color: 'var(--danger)', fontSize: '0.76rem', fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s ease',
                            fontFamily: 'Inter, sans-serif',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-dim)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                        <LogOut size={15} />
                        {sidebarExpanded && t('menu.signOut')}
                    </button>
                </div>
            </aside>

            {/* ──── MAIN ──── */}
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                {/* Topbar */}
                <header style={{
                    padding: '14px 28px',
                    display: 'flex', alignItems: 'center', gap: '16px',
                    background: 'var(--bg-glass)',
                    backdropFilter: 'var(--blur-lg)',
                    WebkitBackdropFilter: 'var(--blur-lg)',
                    borderBottom: '1px solid var(--border-glass)',
                    position: 'sticky', top: 0, zIndex: 40,
                    minHeight: '68px',
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>{pageTitle}</h1>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={10} />
                            {currentTime.toLocaleString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                        </div>
                    </div>
                    <div style={{ flex: 1 }} />

                    {/* Search */}
                    <div style={{ position: 'relative', maxWidth: '260px', flex: '0 1 260px' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" placeholder={t('topbar.search')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '9px 14px 9px 34px',
                                background: 'var(--bg-input)', backdropFilter: 'var(--blur-sm)',
                                border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)', fontFamily: 'Inter,sans-serif',
                                fontSize: '0.8rem', fontWeight: 500, outline: 'none',
                                transition: 'all 0.25s ease',
                            }}
                            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-glass)'}
                        />
                    </div>

                    {/* Role badge */}
                    <div style={{
                        padding: '5px 12px', borderRadius: 'var(--radius-full)',
                        background: 'var(--accent-dim)', border: '1px solid var(--border-accent)',
                        fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent)',
                        letterSpacing: '0.02em',
                    }}>
                        {user?.role}
                    </div>

                    {/* Language Switcher */}
                    <div style={{ position: 'relative' }}>
                        <select
                            value={i18n.language}
                            onChange={(e) => changeLanguage(e.target.value)}
                            style={{
                                appearance: 'none',
                                padding: '9px 28px 9px 30px',
                                background: 'var(--bg-glass)',
                                backdropFilter: 'var(--blur-sm)',
                                border: '1px solid var(--border-glass)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--text-primary)',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                outline: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                            }}
                            title={t('topbar.language')}
                        >
                            <option value="en">Eng</option>
                            <option value="hi">हिंदी</option>
                            <option value="gu">ગુજ</option>
                        </select>
                        <Globe size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        <ChevronDown size={11} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    </div>

                    {/* Theme toggle */}
                    <button onClick={toggleTheme}
                        style={{
                            padding: '9px', background: 'var(--bg-glass)', backdropFilter: 'var(--blur-sm)',
                            border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)',
                            color: theme === 'dark' ? 'var(--amber)' : 'var(--accent)',
                            cursor: 'pointer', display: 'flex', transition: 'all 0.3s ease',
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-glass-strong)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-glass)'}
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    </button>
                </header>

                {/* Content */}
                <div style={{ flex: 1, padding: '22px 28px', overflowY: 'auto' }}>
                    <Outlet context={{ searchTerm }} />
                </div>
            </main>
        </div>
    )
}


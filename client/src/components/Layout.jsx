import { useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    LayoutDashboard, Truck, Navigation, Wrench, Receipt,
    TrendingUp, BarChart3, Search, SlidersHorizontal,
    ArrowUpDown, ChevronDown, Menu, X, LogOut, User
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/vehicles', label: 'Vehicle Registry', icon: Truck },
    { path: '/trips', label: 'Trip Dispatcher', icon: Navigation },
    { path: '/maintenance', label: 'Maintenance', icon: Wrench },
    { path: '/expenses', label: 'Trip & Expense', icon: Receipt },
    { path: '/performance', label: 'Performance', icon: TrendingUp },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/vehicles': 'Vehicle Registry',
    '/trips': 'Trip Dispatcher',
    '/maintenance': 'Maintenance',
    '/expenses': 'Trip & Expense',
    '/performance': 'Performance',
    '/analytics': 'Analytics',
}

export default function Layout() {
    const location = useLocation()
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const [searchTerm, setSearchTerm] = useState('')
    const [collapsed, setCollapsed] = useState(false)
    const pageTitle = pageTitles[location.pathname] || 'FleetFlow'

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div style={{ display: 'flex', width: '100%', minHeight: '100vh' }}>
            {/* SIDEBAR */}
            <aside
                style={{
                    width: collapsed ? '72px' : '260px',
                    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
                    borderRight: '1px solid #334155',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'width 0.3s ease',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    zIndex: 40,
                    overflow: 'hidden',
                }}
            >
                {/* Logo */}
                <div style={{
                    padding: '20px 16px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    minHeight: '72px'
                }}>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#94a3b8',
                            cursor: 'pointer',
                            padding: '4px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {collapsed ? <Menu size={22} /> : <X size={22} />}
                    </button>
                    {!collapsed && (
                        <div>
                            <span style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #818cf8, #06b6d4)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                letterSpacing: '-0.02em'
                            }}>
                                FleetFlow
                            </span>
                            <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                Fleet Management
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: collapsed ? '12px 16px' : '11px 16px',
                                borderRadius: '10px',
                                textDecoration: 'none',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 600 : 500,
                                color: isActive ? '#f1f5f9' : '#94a3b8',
                                background: isActive
                                    ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.1))'
                                    : 'transparent',
                                borderLeft: isActive ? '3px solid #6366f1' : '3px solid transparent',
                                transition: 'all 0.2s ease',
                                justifyContent: collapsed ? 'center' : 'flex-start',
                            })}
                        >
                            <item.icon size={20} />
                            {!collapsed && <span>{item.label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* User Info & Logout */}
                <div style={{
                    padding: collapsed ? '12px 8px' : '16px',
                    borderTop: '1px solid #334155',
                }}>
                    {!collapsed && user && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            marginBottom: '12px',
                            padding: '10px 12px',
                            background: 'rgba(99,102,241,0.08)',
                            borderRadius: '10px',
                        }}>
                            <div style={{
                                width: '32px', height: '32px',
                                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                                borderRadius: '8px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <User size={16} style={{ color: 'white' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#f1f5f9' }}>{user.username}</div>
                                <div style={{ fontSize: '0.6875rem', color: '#64748b' }}>{user.role}</div>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            width: '100%', padding: '10px 12px',
                            background: 'rgba(239,68,68,0.08)',
                            border: '1px solid rgba(239,68,68,0.15)',
                            borderRadius: '10px', color: '#f87171',
                            fontSize: '0.8125rem', fontWeight: 600,
                            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.2s ease',
                            justifyContent: collapsed ? 'center' : 'flex-start',
                        }}
                    >
                        <LogOut size={18} />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div style={{
                flex: 1,
                marginLeft: collapsed ? '72px' : '260px',
                transition: 'margin-left 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* TOP BAR */}
                <header style={{
                    height: '72px',
                    background: '#0f172a',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 28px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 30,
                    backdropFilter: 'blur(12px)',
                }}>
                    <h1 style={{
                        fontSize: '1.25rem',
                        fontWeight: 700,
                        color: '#f1f5f9',
                        letterSpacing: '-0.01em'
                    }}>
                        {pageTitle}
                    </h1>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Search */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            width: '260px'
                        }}>
                            <Search size={16} style={{ color: '#64748b' }} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    outline: 'none',
                                    color: '#f1f5f9',
                                    fontSize: '0.875rem',
                                    fontFamily: 'Inter, sans-serif',
                                    width: '100%',
                                }}
                            />
                        </div>

                        {/* Group by */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '10px',
                            padding: '8px 14px',
                            color: '#94a3b8',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            cursor: 'pointer',
                        }}>
                            <SlidersHorizontal size={14} />
                            <span>Group by</span>
                            <ChevronDown size={14} />
                        </div>

                        {/* Filter */}
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
                        >
                            <SlidersHorizontal size={14} />
                            Filter
                        </button>

                        {/* Sort by */}
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '0.8125rem' }}
                        >
                            <ArrowUpDown size={14} />
                            Sort by
                        </button>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main style={{ flex: 1, padding: '28px', overflowY: 'auto' }}>
                    <Outlet context={{ searchTerm }} />
                </main>
            </div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Edit3, Trash2, Shield, User, ShieldCheck, ShieldAlert, Crown } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'
import { useToast } from '../components/ToastSystem'
import { useAuth } from '../context/AuthContext'

const roleIcons = {
    'Super Admin': <Crown size={14} />,
    'Manager': <ShieldCheck size={14} />,
    'Dispatcher': <User size={14} />,
    'Safety Officer': <ShieldAlert size={14} />,
    'Financial Analyst': <Shield size={14} />,
}
const roleColors = {
    'Super Admin': 'var(--amber)',
    'Manager': 'var(--accent)',
    'Dispatcher': 'var(--cyan)',
    'Safety Officer': 'var(--success)',
    'Financial Analyst': 'var(--pink)',
}
const roleBgColors = {
    'Super Admin': 'var(--amber-dim)',
    'Manager': 'var(--accent-dim)',
    'Dispatcher': 'var(--cyan-dim)',
    'Safety Officer': 'var(--success-dim)',
    'Financial Analyst': 'var(--pink-dim)',
}

const assignableRoles = ['Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst']

export default function AdminPanel() {
    const { searchTerm } = useOutletContext()
    const { user: currentUser } = useAuth()
    const toast = useToast()
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingUser, setEditingUser] = useState(null)
    const [form, setForm] = useState({ username: '', role: 'Dispatcher' })
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState('')

    const fetchUsers = () => {
        axios.get('/api/auth/users').then(r => { setUsers(r.data); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(fetchUsers, [])

    const filtered = users.filter(u => !searchTerm || u.username.toLowerCase().includes(searchTerm.toLowerCase()) || u.role.toLowerCase().includes(searchTerm.toLowerCase()))

    const validate = () => {
        const errs = {}
        if (!editingUser || form.username !== editingUser.username) {
            if (!form.username.trim()) errs.username = 'Username is required'
            else if (form.username.trim().length < 3) errs.username = 'Min 3 characters'
            else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) errs.username = 'Only letters, numbers, underscore'
        }
        if (!form.role) errs.role = 'Role is required'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const openCreate = () => { setEditingUser(null); setForm({ username: '', role: 'Dispatcher' }); setErrors({}); setServerError(''); setModalOpen(true) }
    const openEdit = (u) => { setEditingUser(u); setForm({ username: u.username, role: u.role }); setErrors({}); setServerError(''); setModalOpen(true) }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setServerError('')
        try {
            if (editingUser) {
                await axios.put(`/api/auth/users/${editingUser.id}`, { username: form.username.trim(), role: form.role })
                toast?.success('User Updated', `${form.username} updated successfully`)
            } else {
                await axios.post('/api/auth/users', { username: form.username.trim(), role: form.role })
                toast?.celebrate('User Created! 🎉', `${form.username} added as ${form.role}`)
            }
            setModalOpen(false); fetchUsers()
        } catch (err) {
            setServerError(err.response?.data?.error || 'Operation failed')
        }
    }

    const handleDelete = async (u) => {
        if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return
        try {
            await axios.delete(`/api/auth/users/${u.id}`)
            toast?.info('User Deleted', `${u.username} has been removed`)
            fetchUsers()
        } catch (err) {
            toast?.error('Error', err.response?.data?.error || 'Failed to delete')
        }
    }

    const roleCounts = assignableRoles.reduce((acc, r) => {
        acc[r] = users.filter(u => u.role === r).length
        return acc
    }, {})
    roleCounts['Super Admin'] = users.filter(u => u.role === 'Super Admin').length

    const FieldErr = ({ name }) => errors[name] ? <div className="field-error">⚠ {errors[name]}</div> : null

    if (loading) return <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '55px', borderRadius: 'var(--radius-md)' }} />)}</div>

    return (
        <div>
            {/* Role distribution cards */}
            <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '14px', marginBottom: '24px' }}>
                {['Super Admin', ...assignableRoles].map((role, i) => (
                    <div key={role} className={`kpi-card animate-fade-in-${i + 1}`} style={{ padding: '18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <div style={{ background: roleBgColors[role], borderRadius: 'var(--radius-sm)', padding: '6px', display: 'flex', border: '1px solid var(--border-glass)' }}>
                                <span style={{ color: roleColors[role] }}>{roleIcons[role]}</span>
                            </div>
                            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{role}</span>
                        </div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: roleColors[role] }}>{roleCounts[role] || 0}</div>
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 700 }}>{filtered.length} users total</p>
                <button className="btn btn-primary" onClick={openCreate}><Plus size={17} /> Add User</button>
            </div>

            {/* Users table */}
            <div className="glass-card animate-fade-in-1" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr><th>Username</th><th>Role</th><th>Created</th><th>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(u => (
                                <tr key={u.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '32px', height: '32px', background: roleBgColors[u.role], borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-glass)' }}>
                                                <span style={{ color: roleColors[u.role] }}>{roleIcons[u.role]}</span>
                                            </div>
                                            <div>
                                                <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{u.username}</span>
                                                {u.id === currentUser?.id && (
                                                    <span style={{ marginLeft: '8px', fontSize: '0.6rem', fontWeight: 700, color: 'var(--amber)', background: 'var(--amber-dim)', padding: '2px 6px', borderRadius: '4px' }}>YOU</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span style={{
                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                            padding: '5px 12px', borderRadius: 'var(--radius-full)',
                                            background: roleBgColors[u.role], color: roleColors[u.role],
                                            fontSize: '0.72rem', fontWeight: 800,
                                        }}>
                                            {roleIcons[u.role]} {u.role}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '0.78rem' }}>{new Date(u.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td>
                                        {u.role !== 'Super Admin' ? (
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                <button className="btn btn-secondary" style={{ padding: '5px 8px', fontSize: '0' }} onClick={() => openEdit(u)} title="Edit User"><Edit3 size={14} /></button>
                                                <button className="btn btn-danger" style={{ padding: '5px 8px', fontSize: '0' }} onClick={() => handleDelete(u)} title="Delete User"><Trash2 size={14} /></button>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, fontStyle: 'italic' }}>Protected</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create / Edit Modal */}
            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? `Edit User: ${editingUser.username}` : 'Add New User'}>
                {serverError && <div className="error-banner">{serverError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Username</label>
                        <input className={`form-input ${errors.username ? 'input-error' : ''}`}
                            placeholder="e.g. amit_safety"
                            value={form.username}
                            onChange={e => setForm({ ...form, username: e.target.value })}
                        />
                        <FieldErr name="username" />
                        {!editingUser && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>Password will be set to <code style={{ background: 'var(--bg-input)', padding: '1px 6px', borderRadius: '3px' }}>password123</code></div>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            {assignableRoles.map(r => (
                                <button
                                    key={r} type="button"
                                    onClick={() => setForm({ ...form, role: r })}
                                    style={{
                                        padding: '12px 14px', borderRadius: 'var(--radius-md)',
                                        border: form.role === r ? `2px solid ${roleColors[r]}` : '1px solid var(--border-glass)',
                                        background: form.role === r ? roleBgColors[r] : 'var(--bg-input)',
                                        color: form.role === r ? roleColors[r] : 'var(--text-muted)',
                                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                                        display: 'flex', alignItems: 'center', gap: '8px',
                                        fontSize: '0.78rem', fontWeight: form.role === r ? 800 : 500,
                                        transition: 'all 0.25s ease',
                                    }}
                                >
                                    {roleIcons[r]} {r}
                                </button>
                            ))}
                        </div>
                        <FieldErr name="role" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingUser ? 'Save Changes' : 'Create User'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

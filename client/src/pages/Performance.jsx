import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Trophy, Star, AlertTriangle, Download, ArrowUpDown, ArrowUp, ArrowDown, Phone, Mail } from 'lucide-react'
import axios from 'axios'
import { exportCSV } from '../utils/export'

const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase().replace(/ /g, '-')}`}>{s}</span>
const getScoreColor = (score) => score >= 90 ? 'var(--success)' : score >= 75 ? 'var(--amber)' : 'var(--danger)'

export default function Performance() {
    const { searchTerm } = useOutletContext()
    const [drivers, setDrivers] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [sortBy, setSortBy] = useState('name')
    const [sortOrder, setSortOrder] = useState('asc')
    const [statusFilter, setStatusFilter] = useState('')

    useEffect(() => {
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        if (statusFilter) params.set('status', statusFilter)
        params.set('sortBy', sortBy)
        params.set('sortOrder', sortOrder)
        Promise.all([axios.get(`/api/drivers?${params}`), axios.get('/api/vehicles')])
            .then(([d, v]) => { setDrivers(d.data); setVehicles(v.data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [searchTerm, statusFilter, sortBy, sortOrder])

    const handleSort = (col) => {
        if (sortBy === col) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortOrder('asc') }
    }

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />
        return sortOrder === 'asc' ? <ArrowUp size={11} style={{ color: 'var(--accent)' }} /> : <ArrowDown size={11} style={{ color: 'var(--accent)' }} />
    }

    const topPerformers = useMemo(() => {
        return [...drivers].sort((a, b) => (Number(b.safety_score_percent) + Number(b.completion_rate_percent)) - (Number(a.safety_score_percent) + Number(a.completion_rate_percent))).slice(0, 3)
    }, [drivers])

    const fleetStatus = useMemo(() => ({
        idle: vehicles.filter(v => v.status === 'Idle').length,
        onTrip: vehicles.filter(v => v.status === 'On Trip').length,
        inShop: vehicles.filter(v => v.status === 'In Shop').length,
    }), [vehicles])

    if (loading) return <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '55px', borderRadius: 'var(--radius-md)' }} />)}</div>

    return (
        <div>
            {/* Top Performers */}
            <div className="animate-fade-in" style={{ marginBottom: '22px' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}><Trophy size={15} style={{ color: 'var(--amber)' }} /> Top Performers</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {topPerformers.map((d, i) => (
                        <div key={d.id} className={`kpi-card animate-fade-in-${i + 1}`} style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                                <div style={{
                                    width: '36px', height: '36px', borderRadius: 'var(--radius-sm)',
                                    background: i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : 'linear-gradient(135deg, #cd7c2e, #a0522d)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: 'white', fontSize: '0.85rem'
                                }}>{i + 1}</div>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{d.name}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.license_number}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '20px', fontSize: '0.72rem' }}>
                                <div><span style={{ color: 'var(--text-muted)' }}>Safety</span><div style={{ fontWeight: 800, color: getScoreColor(Number(d.safety_score_percent)), fontSize: '1.1rem' }}>{Number(d.safety_score_percent).toFixed(0)}%</div></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Completion</span><div style={{ fontWeight: 800, color: getScoreColor(Number(d.completion_rate_percent)), fontSize: '1.1rem' }}>{Number(d.completion_rate_percent).toFixed(0)}%</div></div>
                                <div><span style={{ color: 'var(--text-muted)' }}>Complaints</span><div style={{ fontWeight: 800, color: d.complaints_count === 0 ? 'var(--success)' : 'var(--amber)', fontSize: '1.1rem' }}>{d.complaints_count}</div></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Fleet Status */}
            <div className="animate-fade-in-3" style={{ marginBottom: '22px' }}>
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>Fleet Status</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                    {[
                        { label: 'Idle', count: fleetStatus.idle, color: 'var(--success)', bg: 'var(--success-dim)' },
                        { label: 'On Trip', count: fleetStatus.onTrip, color: 'var(--info)', bg: 'var(--info-dim)' },
                        { label: 'In Shop', count: fleetStatus.inShop, color: 'var(--amber)', bg: 'var(--warning-dim)' },
                    ].map(s => (
                        <div key={s.label} className="kpi-card" style={{ padding: '18px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', fontWeight: 900, color: s.color }}>{s.count}</div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Driver Table */}
            <div className="animate-fade-in-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 700 }}>{drivers.length} drivers</p>
                    <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        <option value="On Duty">On Duty</option>
                        <option value="Suspended">Suspended</option>
                    </select>
                </div>
                <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => exportCSV(drivers, 'drivers.csv')}><Download size={15} /> CSV</button>
            </div>

            <div className="glass-card animate-fade-in-5" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr>
                            <th className="sortable" onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>Driver <SortIcon col="name" /></th>
                            <th>Contact</th>
                            <th>License</th>
                            <th className="sortable" onClick={() => handleSort('completion_rate_percent')} style={{ cursor: 'pointer' }}>Completion <SortIcon col="completion_rate_percent" /></th>
                            <th className="sortable" onClick={() => handleSort('safety_score_percent')} style={{ cursor: 'pointer' }}>Safety <SortIcon col="safety_score_percent" /></th>
                            <th className="sortable" onClick={() => handleSort('complaints_count')} style={{ cursor: 'pointer' }}>Complaints <SortIcon col="complaints_count" /></th>
                            <th className="sortable" onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon col="status" /></th>
                        </tr></thead>
                        <tbody>
                            {drivers.map(d => (
                                <tr key={d.id}>
                                    <td>
                                        <div style={{ fontWeight: 800, color: 'var(--text-primary)' }}>{d.name}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.72rem' }}>
                                            {d.mobile && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)' }}><Phone size={11} style={{ color: 'var(--accent)' }} /> {d.mobile}</div>}
                                            {d.email && <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-secondary)', marginTop: '2px' }}><Mail size={11} style={{ color: 'var(--pink)' }} /> {d.email}</div>}
                                            {!d.mobile && !d.email && <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontStyle: 'italic' }}>No contact</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{d.license_number}</div>
                                        <div style={{ fontSize: '0.62rem', color: new Date(d.license_expiry_date) < new Date() ? 'var(--danger)' : 'var(--text-muted)', marginTop: '2px' }}>
                                            Exp: {new Date(d.license_expiry_date).toLocaleDateString('en-IN')}
                                            {new Date(d.license_expiry_date) < new Date() && <span style={{ marginLeft: '4px' }}>⚠</span>}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: 'var(--border-subtle)', overflow: 'hidden', maxWidth: '70px' }}>
                                                <div style={{ height: '100%', width: `${Number(d.completion_rate_percent)}%`, background: getScoreColor(Number(d.completion_rate_percent)), borderRadius: '3px', transition: 'width 0.4s ease' }} />
                                            </div>
                                            <span style={{ fontWeight: 800, color: getScoreColor(Number(d.completion_rate_percent)), fontSize: '0.82rem' }}>{Number(d.completion_rate_percent).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: 'var(--border-subtle)', overflow: 'hidden', maxWidth: '70px' }}>
                                                <div style={{ height: '100%', width: `${Number(d.safety_score_percent)}%`, background: getScoreColor(Number(d.safety_score_percent)), borderRadius: '3px', transition: 'width 0.4s ease' }} />
                                            </div>
                                            <span style={{ fontWeight: 800, color: getScoreColor(Number(d.safety_score_percent)), fontSize: '0.82rem' }}>{Number(d.safety_score_percent).toFixed(1)}%</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {d.complaints_count > 0 && <AlertTriangle size={13} style={{ color: d.complaints_count >= 3 ? 'var(--danger)' : 'var(--amber)' }} />}
                                            <span style={{ fontWeight: 800, color: d.complaints_count === 0 ? 'var(--success)' : d.complaints_count >= 3 ? 'var(--danger)' : 'var(--amber)', fontSize: '0.9rem' }}>{d.complaints_count}</span>
                                        </div>
                                    </td>
                                    <td>{statusBadge(d.status)}</td>
                                </tr>
                            ))}
                            {drivers.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>No drivers found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Shield, Star, AlertCircle, Award, TrendingUp, UserCheck } from 'lucide-react'
import axios from 'axios'

const statusBadge = (status) => {
    const cls = { 'On Duty': 'badge-on-duty', 'Suspended': 'badge-suspended' }
    return <span className={`badge ${cls[status] || ''}`}>{status}</span>
}

export default function Performance() {
    const { searchTerm } = useOutletContext()
    const [drivers, setDrivers] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            axios.get('/api/drivers'),
            axios.get('/api/vehicles')
        ]).then(([driversRes, vehiclesRes]) => {
            setDrivers(driversRes.data)
            setVehicles(vehiclesRes.data)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const filteredDrivers = drivers.filter(d =>
        !searchTerm || d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.license_number.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getScoreColor = (score) => {
        if (score >= 90) return '#22c55e'
        if (score >= 75) return '#f59e0b'
        return '#ef4444'
    }

    if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>Loading performance data...</div>

    // Top performers
    const topDrivers = [...drivers].sort((a, b) => b.safety_score_percent - a.safety_score_percent).slice(0, 3)

    return (
        <div>
            {/* Top Performers */}
            <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} style={{ color: '#f59e0b' }} /> Top Performers
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {topDrivers.map((d, i) => (
                        <div key={d.id} className="kpi-card" style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute', top: '12px', right: '12px',
                                background: i === 0 ? 'rgba(245,158,11,0.2)' : 'rgba(100,116,139,0.2)',
                                borderRadius: '8px', padding: '4px 10px',
                                fontSize: '0.7rem', fontWeight: 700,
                                color: i === 0 ? '#f59e0b' : '#94a3b8'
                            }}>
                                #{i + 1}
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>{d.name}</div>
                            <div style={{ display: 'flex', gap: '20px', marginTop: '12px' }}>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Safety</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(d.safety_score_percent) }}>
                                        {Number(d.safety_score_percent).toFixed(0)}%
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Completion</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(d.completion_rate_percent) }}>
                                        {Number(d.completion_rate_percent).toFixed(0)}%
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Complaints</div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: d.complaints_count === 0 ? '#22c55e' : '#f59e0b' }}>
                                        {d.complaints_count}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Driver Performance Table */}
            <div style={{ marginBottom: '28px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <UserCheck size={18} style={{ color: '#818cf8' }} /> All Drivers
                </h3>
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Driver</th>
                                    <th>License</th>
                                    <th>License Expiry</th>
                                    <th>Completion Rate</th>
                                    <th>Safety Score</th>
                                    <th>Complaints</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredDrivers.map(d => (
                                    <tr key={d.id}>
                                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{d.name}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{d.license_number}</td>
                                        <td>{new Date(d.license_expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '60px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${d.completion_rate_percent}%`, height: '100%', background: getScoreColor(d.completion_rate_percent), borderRadius: '3px' }} />
                                                </div>
                                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: getScoreColor(d.completion_rate_percent) }}>
                                                    {Number(d.completion_rate_percent).toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '60px', height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${d.safety_score_percent}%`, height: '100%', background: getScoreColor(d.safety_score_percent), borderRadius: '3px' }} />
                                                </div>
                                                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: getScoreColor(d.safety_score_percent) }}>
                                                    {Number(d.safety_score_percent).toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                color: d.complaints_count === 0 ? '#22c55e' : d.complaints_count <= 2 ? '#f59e0b' : '#ef4444',
                                                fontWeight: 600,
                                            }}>
                                                {d.complaints_count > 0 && <AlertCircle size={14} />}
                                                {d.complaints_count}
                                            </span>
                                        </td>
                                        <td>{statusBadge(d.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Vehicle Fleet Summary */}
            <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} style={{ color: '#06b6d4' }} /> Fleet Status Summary
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    {['Idle', 'On Trip', 'In Shop'].map(status => {
                        const count = vehicles.filter(v => v.status === status).length
                        const colors = { 'Idle': '#22c55e', 'On Trip': '#818cf8', 'In Shop': '#f59e0b' }
                        return (
                            <div key={status} className="kpi-card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600 }}>{status}</span>
                                    <span style={{ fontSize: '2rem', fontWeight: 800, color: colors[status] }}>{count}</span>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                                    {count === 1 ? 'vehicle' : 'vehicles'}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

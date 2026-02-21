import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Truck, AlertTriangle, Package, MapPin, ArrowRight } from 'lucide-react'
import axios from 'axios'

const statusBadge = (status) => {
    const cls = {
        'Draft': 'badge-draft',
        'Dispatched': 'badge-dispatched',
        'Completed': 'badge-completed',
    }
    return <span className={`badge ${cls[status] || ''}`}>{status}</span>
}

export default function Dashboard() {
    const { searchTerm } = useOutletContext()
    const [data, setData] = useState({ kpis: { activeFleet: 0, maintenanceAlerts: 0, pendingCargo: 0 }, activeTrips: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        axios.get('/api/dashboard').then(res => {
            setData(res.data)
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    const filtered = data.activeTrips.filter(t =>
        !searchTerm || t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driver_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>Loading dashboard...</div>

    return (
        <div>
            {/* KPI Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(99,102,241,0.15)', borderRadius: '10px', padding: '10px', display: 'flex' }}>
                            <Truck size={22} style={{ color: '#818cf8' }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Fleet</span>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                        {data.kpis.activeFleet}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>vehicles on trip</div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(245,158,11,0.15)', borderRadius: '10px', padding: '10px', display: 'flex' }}>
                            <AlertTriangle size={22} style={{ color: '#f59e0b' }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Maintenance Alerts</span>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f59e0b', letterSpacing: '-0.02em' }}>
                        {data.kpis.maintenanceAlerts}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>vehicles in shop</div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(6,182,212,0.15)', borderRadius: '10px', padding: '10px', display: 'flex' }}>
                            <Package size={22} style={{ color: '#06b6d4' }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Pending Cargo</span>
                    </div>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#06b6d4', letterSpacing: '-0.02em' }}>
                        {(data.kpis.pendingCargo / 1000).toFixed(1)}T
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>total cargo weight</div>
                </div>
            </div>

            {/* Active Trips Table */}
            <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '16px',
                overflow: 'hidden',
            }}>
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9' }}>Active Trips</h2>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{filtered.length} trips</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Route</th>
                                <th>Vehicle</th>
                                <th>Driver</th>
                                <th>Cargo</th>
                                <th>Est. Fuel Cost</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(trip => (
                                <tr key={trip.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={14} style={{ color: '#6366f1' }} />
                                            <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{trip.origin}</span>
                                            <ArrowRight size={14} style={{ color: '#64748b' }} />
                                            <span style={{ fontWeight: 600, color: '#f1f5f9' }}>{trip.destination}</span>
                                        </div>
                                    </td>
                                    <td>{trip.plate}</td>
                                    <td>{trip.driver_name}</td>
                                    <td>{(trip.cargo_weight_kg / 1000).toFixed(1)}T</td>
                                    <td>₹{Number(trip.estimated_fuel_cost).toLocaleString('en-IN')}</td>
                                    <td>{statusBadge(trip.status)}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No active trips</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

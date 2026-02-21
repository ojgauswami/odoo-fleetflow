import { useState, useEffect } from 'react'
import { Clock, Truck, User } from 'lucide-react'
import axios from 'axios'

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 6 AM to 7 PM

const statusColors = {
    'Dispatched': 'var(--cyan)',
    'Completed': 'var(--success)',
    'Draft': 'var(--text-muted)',
    'Cancelled': 'var(--danger)',
}

export default function TimelineView() {
    const [trips, setTrips] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [viewMode, setViewMode] = useState('vehicles') // 'vehicles' or 'drivers'

    useEffect(() => {
        Promise.all([axios.get('/api/trips'), axios.get('/api/vehicles'), axios.get('/api/drivers')])
            .then(([t, v, d]) => { setTrips(t.data); setVehicles(v.data); setDrivers(d.data); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    if (loading) return <div className="shimmer" style={{ height: '400px', borderRadius: 'var(--radius-xl)' }} />

    // Build timeline rows
    const rows = viewMode === 'vehicles'
        ? vehicles.map(v => ({
            id: v.id,
            label: v.plate,
            sublabel: v.model,
            icon: <Truck size={14} />,
            status: v.status,
            trips: trips.filter(t => t.vehicle_id === v.id),
        }))
        : drivers.map(d => ({
            id: d.id,
            label: d.name,
            sublabel: d.license_number,
            icon: <User size={14} />,
            status: d.status,
            trips: trips.filter(t => t.driver_id === d.id),
        }))

    // Simulate trip times (since we don't have actual timestamps)
    const getBarPosition = (trip, index) => {
        const hash = (trip.id * 7 + index * 3) % 10
        const start = 6 + hash // 6-16 hours
        const duration = 2 + (trip.cargo_weight_kg % 5) // 2-6 hours
        return { start, duration: Math.min(duration, 19 - start) }
    }

    const currentHour = new Date().getHours()

    return (
        <div>
            {/* View toggle */}
            <div className="animate-fade-in" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Clock size={18} style={{ color: 'var(--accent)' }} />
                <h3 style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)' }}>Schedule Timeline</h3>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                    {['vehicles', 'drivers'].map(m => (
                        <button key={m} onClick={() => setViewMode(m)}
                            className={viewMode === m ? 'btn btn-primary' : 'btn btn-secondary'}
                            style={{ padding: '6px 14px', fontSize: '0.73rem', textTransform: 'capitalize' }}
                        >
                            {m === 'vehicles' ? <Truck size={13} /> : <User size={13} />} {m}
                        </button>
                    ))}
                </div>
            </div>

            {/* Timeline */}
            <div className="glass-card animate-fade-in-1" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <div style={{ minWidth: '900px' }}>
                        {/* Header - Hours */}
                        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)' }}>
                            <div style={{ width: '180px', minWidth: '180px', padding: '12px 16px', background: 'var(--bg-elevated)', fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                {viewMode === 'vehicles' ? 'Vehicle' : 'Driver'}
                            </div>
                            {HOURS.map(h => (
                                <div key={h} style={{
                                    flex: 1, padding: '12px 4px', textAlign: 'center',
                                    background: h === currentHour ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                                    fontSize: '0.68rem', fontWeight: 700,
                                    color: h === currentHour ? 'var(--accent)' : 'var(--text-muted)',
                                    borderLeft: '1px solid var(--border-subtle)',
                                }}>
                                    {h > 12 ? `${h - 12}PM` : h === 12 ? '12PM' : `${h}AM`}
                                </div>
                            ))}
                        </div>

                        {/* Rows */}
                        {rows.map((row, ri) => (
                            <div key={row.id} style={{
                                display: 'flex', borderBottom: '1px solid var(--border-subtle)',
                                transition: 'all 0.2s ease',
                                animation: `fadeInUp 0.3s ease ${ri * 0.03}s both`,
                            }}
                                className="hover-lift"
                            >
                                {/* Label */}
                                <div style={{
                                    width: '180px', minWidth: '180px', padding: '10px 16px',
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    borderRight: '1px solid var(--border-subtle)',
                                    background: 'var(--bg-glass-strong)',
                                }}>
                                    <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{row.icon}</div>
                                    <div>
                                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: viewMode === 'vehicles' ? 'monospace' : 'inherit' }}>{row.label}</div>
                                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>{row.sublabel}</div>
                                    </div>
                                </div>

                                {/* Timeline cells */}
                                <div style={{ flex: 1, display: 'flex', position: 'relative', minHeight: '48px' }}>
                                    {/* Grid lines */}
                                    {HOURS.map(h => (
                                        <div key={h} style={{
                                            flex: 1,
                                            borderLeft: '1px solid var(--border-subtle)',
                                            background: h === currentHour ? 'rgba(147,51,234,0.03)' : 'transparent',
                                        }} />
                                    ))}

                                    {/* Current time line */}
                                    {currentHour >= 6 && currentHour <= 19 && (
                                        <div style={{
                                            position: 'absolute', top: 0, bottom: 0,
                                            left: `${((currentHour - 6 + new Date().getMinutes() / 60) / 14) * 100}%`,
                                            width: '2px', background: 'var(--accent)',
                                            boxShadow: '0 0 8px var(--accent)',
                                            zIndex: 5,
                                        }} />
                                    )}

                                    {/* Trip bars */}
                                    {row.trips.map((trip, ti) => {
                                        const { start, duration } = getBarPosition(trip, ti)
                                        const left = ((start - 6) / 14) * 100
                                        const width = (duration / 14) * 100
                                        const color = statusColors[trip.status] || 'var(--accent)'
                                        return (
                                            <div key={trip.id} style={{
                                                position: 'absolute',
                                                left: `${left}%`, width: `${width}%`,
                                                top: '6px', bottom: '6px',
                                                background: `linear-gradient(135deg, ${color}33, ${color}22)`,
                                                border: `1px solid ${color}55`,
                                                borderRadius: 'var(--radius-sm)',
                                                display: 'flex', alignItems: 'center',
                                                padding: '2px 8px', overflow: 'hidden',
                                                cursor: 'pointer', zIndex: 4,
                                                transition: 'all 0.3s ease',
                                                fontSize: '0.62rem', fontWeight: 700, color,
                                                whiteSpace: 'nowrap',
                                            }}
                                                title={`${trip.origin} → ${trip.destination} (${trip.status})`}
                                            >
                                                {width > 8 && `${trip.origin} → ${trip.destination}`}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}

                        {rows.length === 0 && (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                                No {viewMode} found
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}



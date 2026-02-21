import { useState, useEffect } from 'react'
import { Truck, AlertTriangle, TrendingUp, Package, MapPin, ArrowRight } from 'lucide-react'
import axios from 'axios'
import { useTranslation } from 'react-i18next'

const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase().replace(/ /g, '-')}`}>{s}</span>

export default function Dashboard() {
    const { t } = useTranslation()
    const [kpis, setKpis] = useState({ activeFleet: 0, maintenanceAlerts: 0, pendingCargo: 0 })
    const [analytics, setAnalytics] = useState({ utilizationRate: 0, totalVehicles: 0, activeVehicles: 0 })
    const [activeTrips, setActiveTrips] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([axios.get('/api/dashboard'), axios.get('/api/analytics/summary')])
            .then(([dash, an]) => {
                setKpis(dash.data.kpis)
                setActiveTrips(dash.data.activeTrips)
                setAnalytics(an.data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    const kpiCards = [
        { label: t('dashboard.activeFleet'), value: kpis.activeFleet, icon: <Truck size={19} />, color: 'var(--info)', bg: 'var(--info-dim)', sub: t('dashboard.totalVehicles', { count: analytics.totalVehicles }) },
        { label: t('dashboard.maintenanceAlerts'), value: kpis.maintenanceAlerts, icon: <AlertTriangle size={19} />, color: 'var(--amber)', bg: 'var(--warning-dim)', sub: t('dashboard.vehiclesInShop') },
        { label: t('dashboard.utilizationRate'), value: `${analytics.utilizationRate}%`, icon: <TrendingUp size={19} />, color: 'var(--accent)', bg: 'var(--accent-dim)', sub: t('dashboard.onTrip', { count: analytics.activeVehicles }) },
        { label: t('dashboard.pendingCargo'), value: `${(kpis.pendingCargo / 1000).toFixed(1)}T`, icon: <Package size={19} />, color: 'var(--cyan)', bg: 'var(--cyan-dim)', sub: t('dashboard.awaitingDelivery') },
    ]

    if (loading) return <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3, 4].map(i => <div key={i} className="shimmer" style={{ height: '100px', borderRadius: 'var(--radius-xl)' }} />)}</div>

    return (
        <div>
            {/* KPI Cards */}
            <div className="kpi-grid-3" style={{ marginBottom: '24px' }}>
                {kpiCards.map((k, i) => (
                    <div key={i} className={`kpi-card animate-fade-in-${i + 1}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                            <div>
                                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>{k.label}</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900, color: k.color, lineHeight: 1, letterSpacing: '-0.04em' }}>{k.value}</div>
                            </div>
                            <div style={{ padding: '10px', background: k.bg, borderRadius: 'var(--radius-md)', display: 'flex', color: k.color, border: '1px solid var(--border-glass)' }}>{k.icon}</div>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{k.sub}</div>
                    </div>
                ))}
            </div>

            {/* Active Trips */}
            <div className="animate-fade-in-5">
                <h3 style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={15} style={{ color: 'var(--accent)' }} /> {t('dashboard.liveTrips')}
                    <span style={{
                        marginLeft: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)',
                        background: 'var(--info-dim)', color: 'var(--info)',
                        fontSize: '0.65rem', fontWeight: 800,
                    }}>{activeTrips.length}</span>
                </h3>

                <div className="glass-card" style={{ overflow: 'hidden' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr>
                                <th>{t('dashboard.route')}</th>
                                <th>{t('dashboard.vehicle')}</th>
                                <th>{t('dashboard.driver')}</th>
                                <th>{t('dashboard.cargo')}</th>
                                <th>{t('dashboard.status')}</th>
                            </tr></thead>
                            <tbody>
                                {activeTrips.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <MapPin size={13} style={{ color: 'var(--accent)' }} />
                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.origin}</span>
                                                <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />
                                                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{t.destination}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 600 }}>{t.plate}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.vehicle_model}</div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{t.driver_name}</td>
                                        <td>{(Number(t.cargo_weight_kg) / 1000).toFixed(1)}T</td>
                                        <td>{statusBadge(t.status)}</td>
                                    </tr>
                                ))}
                                {activeTrips.length === 0 && (
                                    <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>{t('dashboard.noTrips')}</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

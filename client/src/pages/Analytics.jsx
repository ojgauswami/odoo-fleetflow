import { useState, useEffect } from 'react'
import { Fuel, TrendingUp, Truck, Download, FileText, Activity } from 'lucide-react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts'
import { useTheme } from '../context/ThemeContext'
import { exportCSV, exportPDF } from '../utils/export'

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: 'var(--bg-glass-strong)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '14px 18px', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', marginBottom: '8px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
            {payload.map((p, i) => <div key={i} style={{ color: p.color, fontSize: '0.83rem', fontWeight: 700 }}>{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}</div>)}
        </div>
    )
}

export default function Analytics() {
    const { theme } = useTheme()
    const [summary, setSummary] = useState(null)
    const [fuelTrend, setFuelTrend] = useState([])
    const [costliest, setCostliest] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([axios.get('/api/analytics/summary'), axios.get('/api/analytics/fuel-trend'), axios.get('/api/analytics/costliest-vehicles')])
            .then(([s, f, c]) => {
                setSummary(s.data)
                setFuelTrend(f.data)
                setCostliest(c.data.map(v => ({ ...v, label: v.plate, maintenance_cost: Number(v.maintenance_cost), fuel_cost: Number(v.fuel_cost), total_cost: Number(v.total_cost) })))
                setLoading(false)
            }).catch(() => setLoading(false))
    }, [])

    const gridColor = theme === 'dark' ? 'rgba(130,90,255,0.08)' : 'rgba(147,51,234,0.06)'
    const axisColor = theme === 'dark' ? '#5e5590' : '#9e97c0'

    if (loading) return <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>{[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '150px', borderRadius: 'var(--radius-2xl)' }} />)}</div>

    const kpis = [
        { label: 'Total Fuel Cost', value: `₹${summary ? (summary.totalFuelCost / 100000).toFixed(2) : '0'}L`, sub: 'across all trips', icon: Fuel, color: 'var(--pink)', bg: 'var(--pink-dim)' },
        { label: 'Fleet ROI', value: `${summary?.fleetROI || 0}%`, sub: '(revenue − costs) ÷ acquisition', icon: TrendingUp, color: 'var(--success)', bg: 'var(--success-dim)' },
        { label: 'Utilization Rate', value: `${summary?.utilizationRate || 0}%`, sub: `${summary?.activeVehicles || 0} of ${summary?.totalVehicles || 0} active`, icon: Activity, color: 'var(--cyan)', bg: 'var(--cyan-dim)' },
    ]

    return (
        <div>
            {/* KPIs */}
            <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '28px' }}>
                {kpis.map((kpi, i) => (
                    <div key={i} className={`kpi-card animate-fade-in-${i + 1}`}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <div style={{ background: kpi.bg, borderRadius: 'var(--radius-md)', padding: '10px', display: 'flex', border: '1px solid var(--border-glass)', transition: 'all 0.3s ease' }}>
                                <kpi.icon size={20} style={{ color: kpi.color }} />
                            </div>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{kpi.label}</span>
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: kpi.color, letterSpacing: '-0.04em', lineHeight: 1 }}>{kpi.value}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px', fontWeight: 500 }}>{kpi.sub}</div>
                    </div>
                ))}
            </div>

            {/* Export actions */}
            <div className="animate-fade-in-3" style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => exportCSV(costliest, 'costliest_vehicles.csv')}><Download size={15} /> Export CSV</button>
                <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => exportPDF('Fleet Analytics Report', costliest)}><FileText size={15} /> PDF Report</button>
            </div>

            {/* Charts */}
            <div className="chart-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="glass-card animate-fade-in-3" style={{ padding: '28px', overflow: 'visible' }}>
                    <h3 style={{ fontSize: '0.93rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '24px' }}>Fuel Efficiency Trend (km/L)</h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <AreaChart data={fuelTrend}>
                            <defs>
                                <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#9333ea" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#9333ea" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="month" stroke={axisColor} fontSize={11} fontWeight={600} />
                            <YAxis stroke={axisColor} fontSize={11} fontWeight={600} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '0.73rem', fontWeight: 600 }} />
                            <Area type="monotone" dataKey="km_per_litre" stroke="#9333ea" strokeWidth={3} fill="url(#fuelGrad)" dot={{ fill: '#9333ea', strokeWidth: 2, r: 5, stroke: '#050510' }} activeDot={{ r: 8, strokeWidth: 0, fill: '#9333ea' }} name="km/L" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-card animate-fade-in-4" style={{ padding: '28px', overflow: 'visible' }}>
                    <h3 style={{ fontSize: '0.93rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '24px' }}>Top 5 Costliest Vehicles</h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={costliest} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
                            <XAxis type="number" stroke={axisColor} fontSize={11} fontWeight={600} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <YAxis dataKey="label" type="category" stroke={axisColor} fontSize={10} fontWeight={700} width={115} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '0.73rem', fontWeight: 600 }} />
                            <Bar dataKey="maintenance_cost" fill="#f59e0b" name="Maintenance" stackId="a" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="fuel_cost" fill="#ec4899" name="Fuel" stackId="a" radius={[0, 6, 6, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}



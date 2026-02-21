import { useState, useEffect } from 'react'
import { Fuel, TrendingUp, Percent, IndianRupee, Truck } from 'lucide-react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '10px',
                padding: '12px 16px',
                boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            }}>
                <div style={{ color: '#94a3b8', fontSize: '0.75rem', marginBottom: '6px', fontWeight: 600 }}>{label}</div>
                {payload.map((p, i) => (
                    <div key={i} style={{ color: p.color, fontSize: '0.875rem', fontWeight: 700 }}>
                        {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString('en-IN') : p.value}
                    </div>
                ))}
            </div>
        )
    }
    return null
}

export default function Analytics() {
    const [summary, setSummary] = useState(null)
    const [fuelTrend, setFuelTrend] = useState([])
    const [costliest, setCostliest] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        Promise.all([
            axios.get('/api/analytics/summary'),
            axios.get('/api/analytics/fuel-trend'),
            axios.get('/api/analytics/costliest-vehicles'),
        ]).then(([summaryRes, fuelRes, costRes]) => {
            setSummary(summaryRes.data)
            setFuelTrend(fuelRes.data)
            setCostliest(costRes.data.map(c => ({
                ...c,
                label: c.plate,
                maintenance_cost: Number(c.maintenance_cost),
                fuel_cost: Number(c.fuel_cost),
                total_cost: Number(c.total_cost),
            })))
            setLoading(false)
        }).catch(() => setLoading(false))
    }, [])

    if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>Loading analytics...</div>

    return (
        <div>
            {/* KPI Widgets */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px', display: 'flex' }}>
                            <Fuel size={22} style={{ color: '#ef4444' }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Fuel Cost</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                        ₹{summary ? (summary.totalFuelCost / 100000).toFixed(2) : '0'}L
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>across all trips</div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(34,197,94,0.15)', borderRadius: '10px', padding: '10px', display: 'flex' }}>
                            <TrendingUp size={22} style={{ color: '#22c55e' }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fleet ROI</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.02em' }}>
                        {summary ? summary.fleetROI : 0}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>(revenue - costs) / acquisition</div>
                </div>

                <div className="kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                        <div style={{ background: 'rgba(6,182,212,0.15)', borderRadius: '10px', padding: '10px', display: 'flex' }}>
                            <Truck size={22} style={{ color: '#06b6d4' }} />
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: '0.8125rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Utilization Rate</span>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#06b6d4', letterSpacing: '-0.02em' }}>
                        {summary ? summary.utilizationRate : 0}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        {summary ? summary.activeVehicles : 0} of {summary ? summary.totalVehicles : 0} vehicles active
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Fuel Efficiency Trend Line Chart */}
                <div style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    padding: '24px',
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>
                        Fuel Efficiency Trend (km/L)
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={fuelTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="km_per_litre"
                                stroke="#818cf8"
                                strokeWidth={3}
                                dot={{ fill: '#818cf8', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, strokeWidth: 0 }}
                                name="km/L"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Top 5 Costliest Vehicles Bar Chart */}
                <div style={{
                    background: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '16px',
                    padding: '24px',
                }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '20px' }}>
                        Top 5 Costliest Vehicles
                    </h3>
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart data={costliest} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                            <XAxis type="number" stroke="#64748b" fontSize={12} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                            <YAxis dataKey="label" type="category" stroke="#64748b" fontSize={11} width={120} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />
                            <Bar dataKey="maintenance_cost" fill="#f59e0b" name="Maintenance" stackId="a" radius={[0, 0, 0, 0]} />
                            <Bar dataKey="fuel_cost" fill="#ef4444" name="Fuel" stackId="a" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    )
}

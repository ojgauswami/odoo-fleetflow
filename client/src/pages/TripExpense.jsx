import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'
import { exportCSV } from '../utils/export'
import { useToast } from '../components/ToastSystem'

const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase().replace(/ /g, '-')}`}>{s}</span>
const emptyForm = { trip_id: '', vehicle_id: '', driver_id: '', distance_km: '', fuel_expense: '', misc_expense: '' }

export default function TripExpense() {
    const { searchTerm } = useOutletContext()
    const toast = useToast()
    const [expenses, setExpenses] = useState([])
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState('desc')

    const fetchAll = () => {
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        if (statusFilter) params.set('status', statusFilter)
        params.set('sortBy', sortBy)
        params.set('sortOrder', sortOrder)
        Promise.all([axios.get(`/api/expenses?${params}`), axios.get('/api/trips')])
            .then(([e, t]) => { setExpenses(e.data); setTrips(t.data); setLoading(false) })
            .catch(() => setLoading(false))
    }
    useEffect(fetchAll, [searchTerm, statusFilter, sortBy, sortOrder])

    const handleSort = (col) => {
        if (sortBy === col) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortOrder('asc') }
    }

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />
        return sortOrder === 'asc' ? <ArrowUp size={11} style={{ color: 'var(--accent)' }} /> : <ArrowDown size={11} style={{ color: 'var(--accent)' }} />
    }

    const handleTripSelect = (tripId) => {
        const trip = trips.find(t => t.id === parseInt(tripId))
        if (trip) setForm({ ...form, trip_id: tripId, vehicle_id: trip.vehicle_id, driver_id: trip.driver_id })
        else setForm({ ...form, trip_id: tripId, vehicle_id: '', driver_id: '' })
    }

    const validate = () => {
        const errs = {}
        if (!form.trip_id) errs.trip_id = 'Trip is required'
        if (form.distance_km && parseFloat(form.distance_km) < 0) errs.distance_km = 'Cannot be negative'
        if (form.fuel_expense && parseFloat(form.fuel_expense) < 0) errs.fuel_expense = 'Cannot be negative'
        if (form.misc_expense && parseFloat(form.misc_expense) < 0) errs.misc_expense = 'Cannot be negative'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setServerError('')
        try {
            await axios.post('/api/expenses', { trip_id: parseInt(form.trip_id), vehicle_id: parseInt(form.vehicle_id), driver_id: parseInt(form.driver_id), distance_km: parseFloat(form.distance_km) || 0, fuel_expense: parseFloat(form.fuel_expense) || 0, misc_expense: parseFloat(form.misc_expense) || 0 })
            setModalOpen(false); setForm(emptyForm)
            toast?.success('Expense Added', 'Expense record created successfully')
            fetchAll()
        } catch (err) { setServerError(err.response?.data?.error || 'Failed') }
    }

    const totalDistance = expenses.reduce((s, e) => s + Number(e.distance_km || 0), 0)
    const totalFuel = expenses.reduce((s, e) => s + Number(e.fuel_expense || 0), 0)
    const totalMisc = expenses.reduce((s, e) => s + Number(e.misc_expense || 0), 0)
    const costPerKm = totalDistance > 0 ? ((totalFuel + totalMisc) / totalDistance).toFixed(2) : '0'

    const FieldErr = ({ name }) => errors[name] ? <div className="field-error">⚠ {errors[name]}</div> : null

    if (loading) return <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '55px', borderRadius: 'var(--radius-md)' }} />)}</div>

    return (
        <div>
            {/* Cost summary cards */}
            <div className="kpi-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '22px' }}>
                {[
                    { label: 'Total Fuel Cost', value: `₹${totalFuel.toLocaleString('en-IN')}`, color: 'var(--pink)' },
                    { label: 'Cost per KM', value: `₹${costPerKm}/km`, color: 'var(--cyan)' },
                    { label: 'Total Distance', value: `${totalDistance.toLocaleString('en-IN')} km`, color: 'var(--accent)' },
                ].map((c, i) => (
                    <div key={i} className={`kpi-card animate-fade-in-${i + 1}`} style={{ padding: '20px' }}>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{c.label}</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: c.color, letterSpacing: '-0.03em' }}>{c.value}</div>
                    </div>
                ))}
            </div>

            <div className="animate-fade-in-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 700 }}>{expenses.length} expense records</p>
                    <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        {['Pending', 'Approved', 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => exportCSV(expenses, 'expenses.csv')}><Download size={15} /> CSV</button>
                    <button className="btn btn-primary" onClick={() => { setModalOpen(true); setErrors({}); setServerError(''); setForm(emptyForm) }}><Plus size={17} /> Add Expense</button>
                </div>
            </div>

            <div className="glass-card animate-fade-in-4" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr>
                            <th>Route</th>
                            <th>Vehicle</th>
                            <th>Driver</th>
                            <th className="sortable" onClick={() => handleSort('distance_km')} style={{ cursor: 'pointer' }}>Distance <SortIcon col="distance_km" /></th>
                            <th className="sortable" onClick={() => handleSort('fuel_expense')} style={{ cursor: 'pointer' }}>Fuel <SortIcon col="fuel_expense" /></th>
                            <th className="sortable" onClick={() => handleSort('misc_expense')} style={{ cursor: 'pointer' }}>Misc <SortIcon col="misc_expense" /></th>
                            <th>Total</th>
                            <th className="sortable" onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon col="status" /></th>
                        </tr></thead>
                        <tbody>
                            {expenses.map(e => (
                                <tr key={e.id}>
                                    <td style={{ fontSize: '0.8rem', fontWeight: 600 }}>{e.origin} → {e.destination}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{e.plate}</td>
                                    <td>{e.driver_name}</td>
                                    <td>{Number(e.distance_km).toLocaleString('en-IN')} km</td>
                                    <td>₹{Number(e.fuel_expense).toLocaleString('en-IN')}</td>
                                    <td>₹{Number(e.misc_expense).toLocaleString('en-IN')}</td>
                                    <td style={{ fontWeight: 800, color: 'var(--text-primary)' }}>₹{(Number(e.fuel_expense) + Number(e.misc_expense)).toLocaleString('en-IN')}</td>
                                    <td>{statusBadge(e.status)}</td>
                                </tr>
                            ))}
                            {expenses.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>No expenses found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setServerError('') }} title="Add Expense">
                {serverError && <div className="error-banner">{serverError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label className="form-label">Trip</label>
                        <select className={`form-select ${errors.trip_id ? 'input-error' : ''}`} value={form.trip_id} onChange={e => handleTripSelect(e.target.value)}>
                            <option value="">Select a trip...</option>
                            {trips.map(t => <option key={t.id} value={t.id}>{t.origin} → {t.destination} ({t.plate})</option>)}
                        </select>
                        <FieldErr name="trip_id" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                        <div className="form-group"><label className="form-label">Distance (km)</label>
                            <input className={`form-input ${errors.distance_km ? 'input-error' : ''}`} type="number" placeholder="720" value={form.distance_km} onChange={e => setForm({ ...form, distance_km: e.target.value })} />
                            <FieldErr name="distance_km" />
                        </div>
                        <div className="form-group"><label className="form-label">Fuel (₹)</label>
                            <input className={`form-input ${errors.fuel_expense ? 'input-error' : ''}`} type="number" placeholder="14500" value={form.fuel_expense} onChange={e => setForm({ ...form, fuel_expense: e.target.value })} />
                            <FieldErr name="fuel_expense" />
                        </div>
                        <div className="form-group"><label className="form-label">Misc (₹)</label>
                            <input className={`form-input ${errors.misc_expense ? 'input-error' : ''}`} type="number" placeholder="2500" value={form.misc_expense} onChange={e => setForm({ ...form, misc_expense: e.target.value })} />
                            <FieldErr name="misc_expense" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setServerError('') }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Add Expense</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

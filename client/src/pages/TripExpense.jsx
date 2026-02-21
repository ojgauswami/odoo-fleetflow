import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'

const statusBadge = (status) => {
    const cls = { 'Pending': 'badge-pending', 'Approved': 'badge-approved', 'Rejected': 'badge-rejected' }
    return <span className={`badge ${cls[status] || ''}`}>{status}</span>
}

const emptyForm = { trip_id: '', vehicle_id: '', driver_id: '', distance_km: '', fuel_expense: '', misc_expense: '' }

export default function TripExpense() {
    const { searchTerm } = useOutletContext()
    const [expenses, setExpenses] = useState([])
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const fetchExpenses = () => {
        axios.get('/api/expenses').then(res => { setExpenses(res.data); setLoading(false) }).catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchExpenses()
        axios.get('/api/trips').then(res => setTrips(res.data))
    }, [])

    const filtered = expenses.filter(e =>
        !searchTerm || e.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.driver_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.origin.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleTripSelect = (tripId) => {
        const trip = trips.find(t => t.id === parseInt(tripId))
        if (trip) {
            setForm({ ...form, trip_id: tripId, vehicle_id: trip.vehicle_id, driver_id: trip.driver_id })
        } else {
            setForm({ ...form, trip_id: tripId, vehicle_id: '', driver_id: '' })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await axios.post('/api/expenses', {
                trip_id: parseInt(form.trip_id),
                vehicle_id: parseInt(form.vehicle_id),
                driver_id: parseInt(form.driver_id),
                distance_km: parseFloat(form.distance_km) || 0,
                fuel_expense: parseFloat(form.fuel_expense) || 0,
                misc_expense: parseFloat(form.misc_expense) || 0,
            })
            setModalOpen(false)
            setForm(emptyForm)
            fetchExpenses()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to add expense')
        }
    }

    if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>Loading expenses...</div>

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{filtered.length} expense records</p>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                    <Plus size={18} /> Add Expense
                </button>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Route</th>
                                <th>Vehicle</th>
                                <th>Driver</th>
                                <th>Distance</th>
                                <th>Fuel Expense</th>
                                <th>Misc Expense</th>
                                <th>Total</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(e => (
                                <tr key={e.id}>
                                    <td style={{ fontSize: '0.8125rem' }}>{e.origin} → {e.destination}</td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{e.plate}</td>
                                    <td>{e.driver_name}</td>
                                    <td>{Number(e.distance_km).toLocaleString('en-IN')} km</td>
                                    <td>₹{Number(e.fuel_expense).toLocaleString('en-IN')}</td>
                                    <td>₹{Number(e.misc_expense).toLocaleString('en-IN')}</td>
                                    <td style={{ fontWeight: 700, color: '#f1f5f9' }}>
                                        ₹{(Number(e.fuel_expense) + Number(e.misc_expense)).toLocaleString('en-IN')}
                                    </td>
                                    <td>{statusBadge(e.status)}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No expenses found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setError('') }} title="Add Expense">
                {error && <div className="error-banner">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Trip</label>
                        <select className="form-select" value={form.trip_id} onChange={e => handleTripSelect(e.target.value)} required>
                            <option value="">Select a trip...</option>
                            {trips.map(t => (
                                <option key={t.id} value={t.id}>{t.origin} → {t.destination} ({t.plate})</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Distance (km)</label>
                            <input className="form-input" type="number" placeholder="720" value={form.distance_km}
                                onChange={e => setForm({ ...form, distance_km: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Fuel Expense (₹)</label>
                            <input className="form-input" type="number" placeholder="14500" value={form.fuel_expense}
                                onChange={e => setForm({ ...form, fuel_expense: e.target.value })} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Misc Expense (₹)</label>
                            <input className="form-input" type="number" placeholder="2500" value={form.misc_expense}
                                onChange={e => setForm({ ...form, misc_expense: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setError('') }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Add Expense</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

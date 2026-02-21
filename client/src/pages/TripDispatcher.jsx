import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, MapPin, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'

const statusBadge = (status) => {
    const cls = { 'Draft': 'badge-draft', 'Dispatched': 'badge-dispatched', 'Completed': 'badge-completed' }
    return <span className={`badge ${cls[status] || ''}`}>{status}</span>
}

const emptyForm = { vehicle_id: '', driver_id: '', origin: '', destination: '', cargo_weight_kg: '', estimated_fuel_cost: '' }

export default function TripDispatcher() {
    const { searchTerm } = useOutletContext()
    const [trips, setTrips] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const fetchTrips = () => {
        axios.get('/api/trips').then(res => { setTrips(res.data); setLoading(false) }).catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchTrips()
        axios.get('/api/vehicles').then(res => setVehicles(res.data))
        axios.get('/api/drivers').then(res => setDrivers(res.data))
    }, [])

    const availableVehicles = vehicles.filter(v => v.status === 'Idle')
    const availableDrivers = drivers.filter(d => d.status === 'On Duty')

    const filtered = trips.filter(t =>
        !searchTerm || t.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.destination.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driver_name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSuccess('')
        try {
            await axios.post('/api/trips', {
                ...form,
                vehicle_id: parseInt(form.vehicle_id),
                driver_id: parseInt(form.driver_id),
                cargo_weight_kg: parseFloat(form.cargo_weight_kg),
                estimated_fuel_cost: parseFloat(form.estimated_fuel_cost) || 0,
            })
            setModalOpen(false)
            setForm(emptyForm)
            setSuccess('Trip dispatched successfully!')
            fetchTrips()
            axios.get('/api/vehicles').then(res => setVehicles(res.data))
            setTimeout(() => setSuccess(''), 3000)
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to dispatch trip')
        }
    }

    const handleComplete = async (id) => {
        try {
            await axios.put(`/api/trips/${id}/complete`)
            fetchTrips()
            axios.get('/api/vehicles').then(res => setVehicles(res.data))
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to complete trip')
        }
    }

    if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>Loading trips...</div>

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{filtered.length} trips</p>
                <button className="btn btn-primary" onClick={() => { setModalOpen(true); setError(''); setSuccess('') }}>
                    <Plus size={18} /> New Trip
                </button>
            </div>

            {success && (
                <div style={{
                    background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
                    borderRadius: '10px', padding: '12px 16px', color: '#86efac', fontSize: '0.875rem',
                    marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                    <CheckCircle size={16} /> {success}
                </div>
            )}

            {/* Table */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Route</th>
                                <th>Vehicle</th>
                                <th>Driver</th>
                                <th>Cargo</th>
                                <th>Est. Fuel</th>
                                <th>Status</th>
                                <th>Actions</th>
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
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{trip.plate}</td>
                                    <td>{trip.driver_name}</td>
                                    <td>{(trip.cargo_weight_kg / 1000).toFixed(1)}T</td>
                                    <td>₹{Number(trip.estimated_fuel_cost).toLocaleString('en-IN')}</td>
                                    <td>{statusBadge(trip.status)}</td>
                                    <td>
                                        {trip.status === 'Dispatched' && (
                                            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                                onClick={() => handleComplete(trip.id)}>
                                                <CheckCircle size={14} /> Complete
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No trips found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Trip Modal */}
            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setError('') }} title="Dispatch New Trip">
                {error && (
                    <div className="error-banner">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Vehicle (Available)</label>
                        <select className="form-select" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
                            <option value="">Select a vehicle...</option>
                            {availableVehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.plate} — {v.model} (Max: {Number(v.max_payload_kg).toLocaleString()}kg)</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Driver (On Duty)</label>
                        <select className="form-select" value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })} required>
                            <option value="">Select a driver...</option>
                            {availableDrivers.map(d => (
                                <option key={d.id} value={d.id}>{d.name} — License: {d.license_number}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Origin</label>
                            <input className="form-input" placeholder="e.g. Surat" value={form.origin}
                                onChange={e => setForm({ ...form, origin: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Destination</label>
                            <input className="form-input" placeholder="e.g. Ahmedabad" value={form.destination}
                                onChange={e => setForm({ ...form, destination: e.target.value })} required />
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Cargo Weight (kg)</label>
                            <input className="form-input" type="number" placeholder="18000" value={form.cargo_weight_kg}
                                onChange={e => setForm({ ...form, cargo_weight_kg: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Est. Fuel Cost (₹)</label>
                            <input className="form-input" type="number" placeholder="12500" value={form.estimated_fuel_cost}
                                onChange={e => setForm({ ...form, estimated_fuel_cost: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setError('') }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Dispatch Trip</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

import { useState, useEffect, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, MapPin, ArrowRight, CheckCircle, XCircle, AlertCircle, Download, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown, Phone, Mail } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'
import { exportCSV } from '../utils/export'
import { useToast } from '../components/ToastSystem'

const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase().replace(/ /g, '-')}`}>{s}</span>
const emptyForm = { vehicle_id: '', driver_id: '', origin: '', destination: '', cargo_weight_kg: '', estimated_fuel_cost: '' }

export default function TripDispatcher() {
    const { searchTerm } = useOutletContext()
    const toast = useToast()
    const [trips, setTrips] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState('desc')
    const [shakeField, setShakeField] = useState('')

    const fetchAll = () => {
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        if (statusFilter) params.set('status', statusFilter)
        params.set('sortBy', sortBy)
        params.set('sortOrder', sortOrder)
        Promise.all([axios.get(`/api/trips?${params}`), axios.get('/api/vehicles'), axios.get('/api/drivers')])
            .then(([t, v, d]) => { setTrips(t.data); setVehicles(v.data); setDrivers(d.data); setLoading(false) })
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

    const availableVehicles = vehicles.filter(v => v.status === 'Idle')
    const availableDrivers = drivers.filter(d => d.status === 'On Duty')

    // Smart validation
    const selectedVehicle = vehicles.find(v => v.id === parseInt(form.vehicle_id))
    const selectedDriver = drivers.find(d => d.id === parseInt(form.driver_id))
    const cargoWeight = parseFloat(form.cargo_weight_kg) || 0

    const validationErrors = useMemo(() => {
        const errs = []
        if (selectedVehicle && cargoWeight > 0) {
            if (cargoWeight > parseFloat(selectedVehicle.max_payload_kg)) {
                errs.push({ field: 'cargo', msg: `Cargo (${cargoWeight.toLocaleString()}kg) exceeds max payload (${Number(selectedVehicle.max_payload_kg).toLocaleString()}kg)! 🚫` })
            }
        }
        if (selectedDriver) {
            const expiry = new Date(selectedDriver.license_expiry_date)
            if (expiry < new Date()) {
                errs.push({ field: 'driver', msg: `${selectedDriver.name}'s license expired on ${new Date(selectedDriver.license_expiry_date).toLocaleDateString('en-IN')}! 🪪` })
            }
            if (selectedDriver.status === 'Suspended') {
                errs.push({ field: 'driver', msg: `${selectedDriver.name} is Suspended — cannot assign trip!` })
            }
        }
        return errs
    }, [selectedVehicle, selectedDriver, cargoWeight])

    const isSubmitDisabled = validationErrors.length > 0

    useEffect(() => {
        if (validationErrors.length > 0) {
            const field = validationErrors[0].field
            setShakeField(field)
            setTimeout(() => setShakeField(''), 500)
        }
    }, [validationErrors.length])

    const capacityPercent = selectedVehicle && cargoWeight > 0
        ? Math.min((cargoWeight / parseFloat(selectedVehicle.max_payload_kg)) * 100, 120)
        : 0
    const capacityColor = capacityPercent > 100 ? 'var(--danger)' : capacityPercent > 80 ? 'var(--amber)' : 'var(--success)'

    const validate = () => {
        const errs = {}
        if (!form.origin.trim()) errs.origin = 'Origin is required'
        else if (form.origin.trim().length < 2) errs.origin = 'Min 2 characters'
        if (!form.destination.trim()) errs.destination = 'Destination is required'
        else if (form.destination.trim().length < 2) errs.destination = 'Min 2 characters'
        if (form.estimated_fuel_cost && parseFloat(form.estimated_fuel_cost) < 0) errs.estimated_fuel_cost = 'Cannot be negative'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        if (isSubmitDisabled) return
        setServerError('')
        try {
            await axios.post('/api/trips', { ...form, vehicle_id: parseInt(form.vehicle_id), driver_id: parseInt(form.driver_id), cargo_weight_kg: parseFloat(form.cargo_weight_kg), estimated_fuel_cost: parseFloat(form.estimated_fuel_cost) || 0 })
            setModalOpen(false); setForm(emptyForm)
            toast?.celebrate('Trip Dispatched! 🎉', `${form.origin} → ${form.destination} — Good luck on the road!`)
            fetchAll()
        } catch (err) {
            const errorMsg = err.response?.data?.error || 'Failed to dispatch'
            setServerError(errorMsg)
            toast?.error('Dispatch Failed', errorMsg)
        }
    }

    const handleComplete = async (id) => {
        try {
            await axios.put(`/api/trips/${id}/complete`)
            toast?.celebrate('Trip Completed! 🏁', 'Vehicle is now back to Idle. Great work!')
            fetchAll()
        } catch (err) { toast?.error('Error', err.response?.data?.error || 'Failed') }
    }

    const handleCancel = async (id) => {
        if (!confirm('Cancel this trip?')) return
        try {
            await axios.put(`/api/trips/${id}/cancel`)
            toast?.info('Trip Cancelled', 'Vehicle has been released back to Idle')
            fetchAll()
        } catch (err) { toast?.error('Error', err.response?.data?.error || 'Failed') }
    }

    const FieldErr = ({ name }) => errors[name] ? <div className="field-error">⚠ {errors[name]}</div> : null

    if (loading) return <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '55px', borderRadius: 'var(--radius-md)' }} />)}</div>

    return (
        <div>
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 700 }}>{trips.length} trips</p>
                    <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        {['Draft', 'Dispatched', 'Completed', 'Cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => exportCSV(trips, 'trips.csv')}><Download size={15} /> CSV</button>
                    <button className="btn btn-primary" onClick={() => { setModalOpen(true); setServerError(''); setErrors({}); setForm(emptyForm) }}><Plus size={17} /> New Trip</button>
                </div>
            </div>

            <div className="glass-card animate-fade-in-1" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr>
                            <th className="sortable" onClick={() => handleSort('origin')} style={{ cursor: 'pointer' }}>Route <SortIcon col="origin" /></th>
                            <th>Vehicle</th>
                            <th>Driver</th>
                            <th className="sortable" onClick={() => handleSort('cargo_weight_kg')} style={{ cursor: 'pointer' }}>Cargo <SortIcon col="cargo_weight_kg" /></th>
                            <th className="sortable" onClick={() => handleSort('estimated_fuel_cost')} style={{ cursor: 'pointer' }}>Est. Fuel <SortIcon col="estimated_fuel_cost" /></th>
                            <th className="sortable" onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon col="status" /></th>
                            <th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {trips.map(trip => (
                                <tr key={trip.id}>
                                    <td><div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}><MapPin size={13} style={{ color: 'var(--accent)' }} /><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trip.origin}</span><ArrowRight size={13} style={{ color: 'var(--text-muted)' }} /><span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{trip.destination}</span></div></td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{trip.plate}</td>
                                    <td>{trip.driver_name}</td>
                                    <td>{(trip.cargo_weight_kg / 1000).toFixed(1)}T</td>
                                    <td style={{ fontWeight: 600 }}>₹{Number(trip.estimated_fuel_cost).toLocaleString('en-IN')}</td>
                                    <td>{statusBadge(trip.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {trip.status === 'Dispatched' && <>
                                                <button className="btn btn-success" style={{ padding: '5px 9px', fontSize: '0.68rem' }} onClick={() => handleComplete(trip.id)}><CheckCircle size={13} /> Done</button>
                                                <button className="btn btn-danger" style={{ padding: '5px 9px', fontSize: '0.68rem' }} onClick={() => handleCancel(trip.id)}><XCircle size={13} /> Cancel</button>
                                            </>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {trips.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>No trips found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Dispatch Modal */}
            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setServerError('') }} title="Dispatch New Trip">
                {serverError && <div className="error-banner"><AlertCircle size={16} /> {serverError}</div>}
                {validationErrors.map((err, i) => (
                    <div key={i} className="error-banner" style={{ animation: 'shake 0.4s ease' }}><AlertTriangle size={16} /> {err.msg}</div>
                ))}

                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label className="form-label">Vehicle (Available: {availableVehicles.length})</label>
                        <select className="form-select" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
                            <option value="">Select a vehicle...</option>
                            {availableVehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.model} (Max: {Number(v.max_payload_kg).toLocaleString()}kg)</option>)}
                        </select>
                    </div>

                    <div className="form-group" style={{ animation: shakeField === 'driver' ? 'shake 0.4s ease' : 'none' }}>
                        <label className="form-label">Driver (On Duty: {availableDrivers.length})</label>
                        <select className="form-select" value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })} required
                            style={{ borderColor: validationErrors.some(e => e.field === 'driver') ? 'var(--danger)' : undefined }}>
                            <option value="">Select a driver...</option>
                            {availableDrivers.map(d => <option key={d.id} value={d.id}>{d.name} — {d.license_number}</option>)}
                        </select>
                        {selectedDriver && (
                            <div style={{ marginTop: '6px' }}>
                                <div style={{ fontSize: '0.7rem', color: new Date(selectedDriver.license_expiry_date) < new Date() ? 'var(--danger)' : 'var(--text-muted)' }}>
                                    License expires: {new Date(selectedDriver.license_expiry_date).toLocaleDateString('en-IN')} {new Date(selectedDriver.license_expiry_date) < new Date() && '⚠ EXPIRED'}
                                </div>
                                {(selectedDriver.mobile || selectedDriver.email) && (
                                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                        {selectedDriver.mobile && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={10} /> {selectedDriver.mobile}</span>}
                                        {selectedDriver.email && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={10} /> {selectedDriver.email}</span>}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div className="form-group">
                            <label className="form-label">Origin</label>
                            <input className={`form-input ${errors.origin ? 'input-error' : ''}`} placeholder="e.g. Surat" value={form.origin} onChange={e => setForm({ ...form, origin: e.target.value })} />
                            <FieldErr name="origin" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Destination</label>
                            <input className={`form-input ${errors.destination ? 'input-error' : ''}`} placeholder="e.g. Ahmedabad" value={form.destination} onChange={e => setForm({ ...form, destination: e.target.value })} />
                            <FieldErr name="destination" />
                        </div>
                    </div>

                    <div className="form-group" style={{ animation: shakeField === 'cargo' ? 'shake 0.4s ease' : 'none' }}>
                        <label className="form-label">Cargo Weight (kg)</label>
                        <input className="form-input" type="number" placeholder="18000" value={form.cargo_weight_kg}
                            onChange={e => setForm({ ...form, cargo_weight_kg: e.target.value })}
                            required
                            style={{ borderColor: validationErrors.some(e => e.field === 'cargo') ? 'var(--danger)' : undefined }}
                        />
                        {selectedVehicle && cargoWeight > 0 && (
                            <div style={{ marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', marginBottom: '4px' }}>
                                    <span style={{ color: capacityColor, fontWeight: 700 }}>{capacityPercent.toFixed(0)}% capacity</span>
                                    <span style={{ color: 'var(--text-muted)' }}>Max: {Number(selectedVehicle.max_payload_kg).toLocaleString('en-IN')} kg</span>
                                </div>
                                <div style={{ height: '6px', borderRadius: '3px', background: 'var(--border-subtle)', overflow: 'hidden' }}>
                                    <div style={{
                                        height: '100%', width: `${Math.min(capacityPercent, 100)}%`,
                                        background: capacityPercent > 100 ? 'linear-gradient(90deg, var(--amber), var(--danger))' : capacityPercent > 80 ? 'var(--amber)' : 'var(--success)',
                                        borderRadius: '3px', transition: 'all 0.4s ease',
                                    }} />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="form-group">
                        <label className="form-label">Est. Fuel Cost (₹)</label>
                        <input className={`form-input ${errors.estimated_fuel_cost ? 'input-error' : ''}`} type="number" placeholder="12500" value={form.estimated_fuel_cost} onChange={e => setForm({ ...form, estimated_fuel_cost: e.target.value })} />
                        <FieldErr name="estimated_fuel_cost" />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setServerError('') }}>Cancel</button>
                        <button type="submit" className="btn btn-primary"
                            disabled={isSubmitDisabled}
                            style={{ opacity: isSubmitDisabled ? 0.4 : 1, cursor: isSubmitDisabled ? 'not-allowed' : 'pointer' }}>
                            {isSubmitDisabled && <AlertTriangle size={15} />}
                            {isSubmitDisabled ? "Can't Dispatch" : 'Dispatch Trip'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

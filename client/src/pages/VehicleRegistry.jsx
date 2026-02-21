import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Edit3, Trash2, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'
import { exportCSV } from '../utils/export'
import { useToast } from '../components/ToastSystem'

const statusBadge = (s) => <span className={`badge badge-${s.toLowerCase().replace(/ /g, '-')}`}>{s}</span>
const typeColors = { 'Trailer Truck': 'var(--accent)', 'Mini': 'var(--success)', 'Tanker': 'var(--amber)', 'Flatbed': 'var(--cyan)', 'Refrigerated': 'var(--pink)', 'Container': 'var(--info)' }
const emptyForm = { plate: '', model: '', type: 'Trailer Truck', max_payload_kg: '', odometer: '', acquisition_cost: '' }

export default function VehicleRegistry() {
    const { searchTerm } = useOutletContext()
    const toast = useToast()
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(emptyForm)
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [typeFilter, setTypeFilter] = useState('')
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState('desc')

    const fetchData = () => {
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        if (statusFilter) params.set('status', statusFilter)
        if (typeFilter) params.set('type', typeFilter)
        params.set('sortBy', sortBy)
        params.set('sortOrder', sortOrder)
        axios.get(`/api/vehicles?${params}`).then(r => { setVehicles(r.data); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(fetchData, [searchTerm, statusFilter, typeFilter, sortBy, sortOrder])

    const handleSort = (col) => {
        if (sortBy === col) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortOrder('asc') }
    }

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />
        return sortOrder === 'asc' ? <ArrowUp size={11} style={{ color: 'var(--accent)' }} /> : <ArrowDown size={11} style={{ color: 'var(--accent)' }} />
    }

    const validate = () => {
        const errs = {}
        if (!form.plate.trim()) errs.plate = 'Plate number is required'
        else if (!/^[A-Z]{2}-\d{2}-[A-Z]{1,2}-\d{4}$/i.test(form.plate.trim())) errs.plate = 'Format: XX-00-XX-0000'
        if (!form.model.trim()) errs.model = 'Model is required'
        else if (form.model.trim().length < 3) errs.model = 'Min 3 characters'
        if (!form.max_payload_kg) errs.max_payload_kg = 'Payload is required'
        else if (parseFloat(form.max_payload_kg) <= 0) errs.max_payload_kg = 'Must be > 0'
        if (form.odometer && parseFloat(form.odometer) < 0) errs.odometer = 'Cannot be negative'
        if (form.acquisition_cost && parseFloat(form.acquisition_cost) < 0) errs.acquisition_cost = 'Cannot be negative'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const openEdit = (v) => { setEditingId(v.id); setForm({ plate: v.plate, model: v.model, type: v.type, max_payload_kg: v.max_payload_kg, odometer: v.odometer, acquisition_cost: v.acquisition_cost || '' }); setModalOpen(true); setErrors({}); setServerError('') }
    const openCreate = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); setErrors({}); setServerError('') }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setServerError('')
        const payload = { ...form, plate: form.plate.trim().toUpperCase(), model: form.model.trim(), max_payload_kg: parseFloat(form.max_payload_kg), odometer: parseInt(form.odometer) || 0, acquisition_cost: parseFloat(form.acquisition_cost) || 0 }
        try {
            if (editingId) {
                await axios.put(`/api/vehicles/${editingId}`, payload)
                toast?.success('Vehicle Updated', `${payload.plate} saved successfully`)
            } else {
                await axios.post('/api/vehicles', payload)
                toast?.celebrate('Vehicle Added! 🚛', `${payload.plate} registered successfully`)
            }
            setModalOpen(false); fetchData()
        } catch (err) { setServerError(err.response?.data?.error || 'Operation failed') }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return
        try {
            await axios.delete(`/api/vehicles/${id}`)
            toast?.info('Vehicle Deleted', 'Vehicle removed from registry')
            fetchData()
        } catch (err) { toast?.error('Error', err.response?.data?.error || 'Failed to delete') }
    }

    const FieldErr = ({ name }) => errors[name] ? <div className="field-error">⚠ {errors[name]}</div> : null

    if (loading) return <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '55px', borderRadius: 'var(--radius-md)' }} />)}</div>

    return (
        <div>
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 700 }}>{vehicles.length} vehicles</p>
                    <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="">All Status</option>
                        {['Idle', 'On Trip', 'In Shop'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <select className="form-select" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
                        <option value="">All Types</option>
                        {['Trailer Truck', 'Mini', 'Tanker', 'Flatbed', 'Refrigerated', 'Container'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => exportCSV(vehicles, 'vehicles.csv')}><Download size={15} /> CSV</button>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={17} /> New Vehicle</button>
                </div>
            </div>

            <div className="glass-card animate-fade-in-1" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr>
                            <th className="sortable" onClick={() => handleSort('plate')} style={{ cursor: 'pointer' }}>Plate <SortIcon col="plate" /></th>
                            <th className="sortable" onClick={() => handleSort('model')} style={{ cursor: 'pointer' }}>Model <SortIcon col="model" /></th>
                            <th className="sortable" onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>Type <SortIcon col="type" /></th>
                            <th className="sortable" onClick={() => handleSort('max_payload_kg')} style={{ cursor: 'pointer' }}>Capacity <SortIcon col="max_payload_kg" /></th>
                            <th className="sortable" onClick={() => handleSort('odometer')} style={{ cursor: 'pointer' }}>Odometer <SortIcon col="odometer" /></th>
                            <th>Cost</th>
                            <th className="sortable" onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>Status <SortIcon col="status" /></th>
                            <th style={{ width: '100px' }}>Actions</th>
                        </tr></thead>
                        <tbody>
                            {vehicles.map(v => (
                                <tr key={v.id}>
                                    <td style={{ fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{v.plate}</td>
                                    <td style={{ fontWeight: 600 }}>{v.model}</td>
                                    <td><span style={{ color: typeColors[v.type] || 'var(--text-secondary)', fontWeight: 700, fontSize: '0.78rem' }}>{v.type}</span></td>
                                    <td>{Number(v.max_payload_kg).toLocaleString('en-IN')} kg</td>
                                    <td>{Number(v.odometer).toLocaleString('en-IN')} km</td>
                                    <td style={{ fontWeight: 600 }}>₹{Number(v.acquisition_cost || 0).toLocaleString('en-IN')}</td>
                                    <td>{statusBadge(v.status)}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <button className="btn btn-secondary" style={{ padding: '5px 8px', fontSize: '0' }} onClick={() => openEdit(v)} title="Edit"><Edit3 size={14} /></button>
                                            <button className="btn btn-danger" style={{ padding: '5px 8px', fontSize: '0' }} onClick={() => handleDelete(v.id)} title="Delete"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {vehicles.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>No vehicles found</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Edit Vehicle' : 'New Vehicle'}>
                {serverError && <div className="error-banner">{serverError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Plate Number</label>
                        <input className={`form-input ${errors.plate ? 'input-error' : ''}`} placeholder="e.g. GJ-05-BX-1234" value={form.plate} onChange={e => setForm({ ...form, plate: e.target.value })} />
                        <FieldErr name="plate" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Model</label>
                        <input className={`form-input ${errors.model ? 'input-error' : ''}`} placeholder="e.g. Tata Prima 2017" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })} />
                        <FieldErr name="model" />
                    </div>
                    <div className="form-group"><label className="form-label">Type</label>
                        <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            {['Trailer Truck', 'Mini', 'Tanker', 'Flatbed', 'Refrigerated', 'Container'].map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div className="form-group">
                            <label className="form-label">Max Payload (kg)</label>
                            <input className={`form-input ${errors.max_payload_kg ? 'input-error' : ''}`} type="number" placeholder="25000" value={form.max_payload_kg} onChange={e => setForm({ ...form, max_payload_kg: e.target.value })} />
                            <FieldErr name="max_payload_kg" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Odometer (km)</label>
                            <input className={`form-input ${errors.odometer ? 'input-error' : ''}`} type="number" placeholder="0" value={form.odometer} onChange={e => setForm({ ...form, odometer: e.target.value })} />
                            <FieldErr name="odometer" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Acquisition Cost (₹)</label>
                        <input className={`form-input ${errors.acquisition_cost ? 'input-error' : ''}`} type="number" placeholder="3200000" value={form.acquisition_cost} onChange={e => setForm({ ...form, acquisition_cost: e.target.value })} />
                        <FieldErr name="acquisition_cost" />
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Vehicle'}</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

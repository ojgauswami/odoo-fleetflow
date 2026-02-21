import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'

const statusBadge = (status) => {
    const cls = { 'Idle': 'badge-idle', 'On Trip': 'badge-on-trip', 'In Shop': 'badge-in-shop' }
    return <span className={`badge ${cls[status] || ''}`}>{status}</span>
}

const typeColors = {
    'Trailer Truck': '#818cf8',
    'Mini': '#22c55e',
    'Tanker': '#f59e0b',
    'Flatbed': '#06b6d4',
    'Refrigerated': '#a78bfa',
    'Container': '#fb923c',
}

const emptyForm = { plate: '', model: '', type: 'Trailer Truck', max_payload_kg: '', odometer: '', acquisition_cost: '' }

export default function VehicleRegistry() {
    const { searchTerm } = useOutletContext()
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const fetch = () => {
        axios.get('/api/vehicles').then(res => { setVehicles(res.data); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(fetch, [])

    const filtered = vehicles.filter(v =>
        !searchTerm || v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await axios.post('/api/vehicles', {
                ...form,
                max_payload_kg: parseFloat(form.max_payload_kg),
                odometer: parseInt(form.odometer) || 0,
                acquisition_cost: parseFloat(form.acquisition_cost) || 0,
            })
            setModalOpen(false)
            setForm(emptyForm)
            fetch()
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create vehicle')
        }
    }

    if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>Loading vehicles...</div>

    return (
        <div>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{filtered.length} vehicles registered</p>
                </div>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                    <Plus size={18} /> New Vehicle
                </button>
            </div>

            {/* Table */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Plate</th>
                                <th>Model</th>
                                <th>Type</th>
                                <th>Capacity (kg)</th>
                                <th>Odometer (km)</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(v => (
                                <tr key={v.id}>
                                    <td style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: '0.02em' }}>{v.plate}</td>
                                    <td>{v.model}</td>
                                    <td>
                                        <span style={{
                                            color: typeColors[v.type] || '#94a3b8',
                                            fontWeight: 600,
                                            fontSize: '0.8125rem'
                                        }}>
                                            {v.type}
                                        </span>
                                    </td>
                                    <td>{Number(v.max_payload_kg).toLocaleString('en-IN')}</td>
                                    <td>{Number(v.odometer).toLocaleString('en-IN')}</td>
                                    <td>{statusBadge(v.status)}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No vehicles found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* New Vehicle Modal */}
            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setError('') }} title="New Vehicle">
                {error && <div className="error-banner">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Plate Number</label>
                        <input className="form-input" placeholder="e.g. GJ-05-BX-1234" value={form.plate}
                            onChange={e => setForm({ ...form, plate: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Model</label>
                        <input className="form-input" placeholder="e.g. Tata Prima 2017" value={form.model}
                            onChange={e => setForm({ ...form, model: e.target.value })} required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select className="form-select" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                            {['Trailer Truck', 'Mini', 'Tanker', 'Flatbed', 'Refrigerated', 'Container'].map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Max Payload (kg)</label>
                            <input className="form-input" type="number" placeholder="25000" value={form.max_payload_kg}
                                onChange={e => setForm({ ...form, max_payload_kg: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Odometer (km)</label>
                            <input className="form-input" type="number" placeholder="0" value={form.odometer}
                                onChange={e => setForm({ ...form, odometer: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Acquisition Cost (₹)</label>
                        <input className="form-input" type="number" placeholder="3200000" value={form.acquisition_cost}
                            onChange={e => setForm({ ...form, acquisition_cost: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setError('') }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Vehicle</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

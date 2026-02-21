import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Wrench } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'

const emptyForm = { vehicle_id: '', issue_service: '', date: '', cost: '' }

export default function Maintenance() {
    const { searchTerm } = useOutletContext()
    const [logs, setLogs] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [error, setError] = useState('')

    const fetchLogs = () => {
        axios.get('/api/maintenance').then(res => { setLogs(res.data); setLoading(false) }).catch(() => setLoading(false))
    }

    useEffect(() => {
        fetchLogs()
        axios.get('/api/vehicles').then(res => setVehicles(res.data))
    }, [])

    const filtered = logs.filter(m =>
        !searchTerm || m.issue_service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.plate.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        try {
            await axios.post('/api/maintenance', {
                vehicle_id: parseInt(form.vehicle_id),
                issue_service: form.issue_service,
                date: form.date,
                cost: parseFloat(form.cost) || 0,
            })
            setModalOpen(false)
            setForm(emptyForm)
            fetchLogs()
            axios.get('/api/vehicles').then(res => setVehicles(res.data))
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create maintenance log')
        }
    }

    if (loading) return <div style={{ color: '#64748b', textAlign: 'center', padding: '60px' }}>Loading maintenance logs...</div>

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{filtered.length} maintenance records</p>
                <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
                    <Plus size={18} /> New Service
                </button>
            </div>

            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Vehicle</th>
                                <th>Issue / Service</th>
                                <th>Date</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(m => (
                                <tr key={m.id}>
                                    <td>
                                        <div>
                                            <div style={{ fontWeight: 600, color: '#f1f5f9', fontFamily: 'monospace' }}>{m.plate}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.vehicle_model}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Wrench size={14} style={{ color: '#f59e0b' }} />
                                            <span>{m.issue_service}</span>
                                        </div>
                                    </td>
                                    <td>{new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                    <td style={{ fontWeight: 600, color: '#fbbf24' }}>₹{Number(m.cost).toLocaleString('en-IN')}</td>
                                </tr>
                            ))}
                            {filtered.length === 0 && (
                                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No maintenance logs found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setError('') }} title="New Service Log">
                {error && <div className="error-banner">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Vehicle</label>
                        <select className="form-select" value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })} required>
                            <option value="">Select a vehicle...</option>
                            {vehicles.map(v => (
                                <option key={v.id} value={v.id}>{v.plate} — {v.model}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Issue / Service Description</label>
                        <input className="form-input" placeholder="e.g. Brake pad replacement" value={form.issue_service}
                            onChange={e => setForm({ ...form, issue_service: e.target.value })} required />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input className="form-input" type="date" value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cost (₹)</label>
                            <input className="form-input" type="number" placeholder="12000" value={form.cost}
                                onChange={e => setForm({ ...form, cost: e.target.value })} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setError('') }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Log</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

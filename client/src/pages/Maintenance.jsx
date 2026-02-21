import { useState, useEffect } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Plus, Wrench, CheckCircle, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import axios from 'axios'
import Modal from '../components/Modal'
import { exportCSV } from '../utils/export'
import { useToast } from '../components/ToastSystem'

const emptyForm = { vehicle_id: '', issue_service: '', date: '', cost: '' }

export default function Maintenance() {
    const { searchTerm } = useOutletContext()
    const toast = useToast()
    const [logs, setLogs] = useState([])
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalOpen, setModalOpen] = useState(false)
    const [form, setForm] = useState(emptyForm)
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState('')
    const [sortBy, setSortBy] = useState('date')
    const [sortOrder, setSortOrder] = useState('desc')

    const fetchAll = () => {
        const params = new URLSearchParams()
        if (searchTerm) params.set('search', searchTerm)
        params.set('sortBy', sortBy)
        params.set('sortOrder', sortOrder)
        Promise.all([axios.get(`/api/maintenance?${params}`), axios.get('/api/vehicles')])
            .then(([l, v]) => { setLogs(l.data); setVehicles(v.data); setLoading(false) })
            .catch(() => setLoading(false))
    }
    useEffect(fetchAll, [searchTerm, sortBy, sortOrder])

    const handleSort = (col) => {
        if (sortBy === col) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
        else { setSortBy(col); setSortOrder('asc') }
    }

    const SortIcon = ({ col }) => {
        if (sortBy !== col) return <ArrowUpDown size={11} style={{ opacity: 0.3 }} />
        return sortOrder === 'asc' ? <ArrowUp size={11} style={{ color: 'var(--accent)' }} /> : <ArrowDown size={11} style={{ color: 'var(--accent)' }} />
    }

    const inShopVehicles = vehicles.filter(v => v.status === 'In Shop')

    const validate = () => {
        const errs = {}
        if (!form.vehicle_id) errs.vehicle_id = 'Vehicle is required'
        if (!form.issue_service.trim()) errs.issue_service = 'Service description is required'
        else if (form.issue_service.trim().length < 5) errs.issue_service = 'Min 5 characters'
        if (!form.date) errs.date = 'Date is required'
        else {
            const d = new Date(form.date); const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1)
            if (d > tomorrow) errs.date = 'Cannot be a future date'
        }
        if (form.cost && parseFloat(form.cost) < 0) errs.cost = 'Cannot be negative'
        setErrors(errs)
        return Object.keys(errs).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setServerError('')
        try {
            await axios.post('/api/maintenance', { vehicle_id: parseInt(form.vehicle_id), issue_service: form.issue_service.trim(), date: form.date, cost: parseFloat(form.cost) || 0 })
            setModalOpen(false); setForm(emptyForm)
            toast?.success('Service Logged', 'Maintenance record created successfully')
            fetchAll()
        } catch (err) { setServerError(err.response?.data?.error || 'Failed') }
    }

    const handleComplete = async (logId) => {
        try {
            const res = await axios.put(`/api/maintenance/${logId}/complete`)
            toast?.celebrate('Maintenance Done! ✅', res.data.message)
            fetchAll()
        } catch (err) { toast?.error('Error', err.response?.data?.error || 'Failed') }
    }

    const FieldErr = ({ name }) => errors[name] ? <div className="field-error">⚠ {errors[name]}</div> : null

    if (loading) return <div style={{ display: 'grid', gap: '12px' }}>{[1, 2, 3].map(i => <div key={i} className="shimmer" style={{ height: '55px', borderRadius: 'var(--radius-md)' }} />)}</div>

    return (
        <div>
            <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 700 }}>{logs.length} records</p>
                    {inShopVehicles.length > 0 && (
                        <span className="badge badge-in-shop">{inShopVehicles.length} in shop</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '8px 14px' }} onClick={() => exportCSV(logs, 'maintenance.csv')}><Download size={15} /> CSV</button>
                    <button className="btn btn-primary" onClick={() => { setModalOpen(true); setErrors({}); setServerError(''); setForm(emptyForm) }}><Plus size={17} /> New Service</button>
                </div>
            </div>

            <div className="glass-card animate-fade-in-1" style={{ overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead><tr>
                            <th>Vehicle</th>
                            <th className="sortable" onClick={() => handleSort('issue_service')} style={{ cursor: 'pointer' }}>Service / Issue <SortIcon col="issue_service" /></th>
                            <th className="sortable" onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>Date <SortIcon col="date" /></th>
                            <th className="sortable" onClick={() => handleSort('cost')} style={{ cursor: 'pointer' }}>Cost <SortIcon col="cost" /></th>
                            <th>Vehicle Status</th>
                            <th>Actions</th>
                        </tr></thead>
                        <tbody>
                            {logs.map(m => {
                                const vehicle = vehicles.find(v => v.id === m.vehicle_id)
                                const isInShop = vehicle?.status === 'In Shop'
                                return (
                                    <tr key={m.id}>
                                        <td>
                                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: '0.8rem' }}>{m.plate}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>{m.vehicle_model}</div>
                                        </td>
                                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Wrench size={14} style={{ color: 'var(--amber)' }} /><span>{m.issue_service}</span></div></td>
                                        <td>{new Date(m.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td style={{ fontWeight: 700, color: 'var(--amber)' }}>₹{Number(m.cost).toLocaleString('en-IN')}</td>
                                        <td>{isInShop ? <span className="badge badge-in-shop">In Shop</span> : <span className="badge badge-idle">Available</span>}</td>
                                        <td>
                                            {isInShop && (
                                                <button className="btn btn-success" style={{ padding: '5px 10px', fontSize: '0.68rem' }} onClick={() => handleComplete(m.id)}><CheckCircle size={13} /> Mark Done</button>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {logs.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '50px' }}>No maintenance logs</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setServerError('') }} title="New Service Log">
                {serverError && <div className="error-banner">{serverError}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group"><label className="form-label">Vehicle</label>
                        <select className={`form-select ${errors.vehicle_id ? 'input-error' : ''}`} value={form.vehicle_id} onChange={e => setForm({ ...form, vehicle_id: e.target.value })}>
                            <option value="">Select a vehicle...</option>
                            {vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} — {v.model} ({v.status})</option>)}
                        </select>
                        <FieldErr name="vehicle_id" />
                    </div>
                    <div className="form-group"><label className="form-label">Issue / Service</label>
                        <input className={`form-input ${errors.issue_service ? 'input-error' : ''}`} placeholder="e.g. Brake pad replacement" value={form.issue_service} onChange={e => setForm({ ...form, issue_service: e.target.value })} />
                        <FieldErr name="issue_service" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                        <div className="form-group"><label className="form-label">Date</label>
                            <input className={`form-input ${errors.date ? 'input-error' : ''}`} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                            <FieldErr name="date" />
                        </div>
                        <div className="form-group"><label className="form-label">Cost (₹)</label>
                            <input className={`form-input ${errors.cost ? 'input-error' : ''}`} type="number" placeholder="12000" value={form.cost} onChange={e => setForm({ ...form, cost: e.target.value })} />
                            <FieldErr name="cost" />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '22px' }}>
                        <button type="button" className="btn btn-secondary" onClick={() => { setModalOpen(false); setServerError('') }}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Create Log</button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}

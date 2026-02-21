import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children }) {
    if (!isOpen) return null

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-sm)', padding: '6px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', transition: 'all 0.2s ease' }}>
                        <X size={16} />
                    </button>
                </div>
                {children}
            </div>
        </div>
    )
}


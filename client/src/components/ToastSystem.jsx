import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { AlertTriangle, CheckCircle, Info, XCircle, X, Volume2 } from 'lucide-react'
import confetti from 'canvas-confetti'

const ToastContext = createContext(null)

let toastIdCounter = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback(({ type = 'info', title, message, duration = 5000, sound = false, celebrate = false }) => {
        const id = ++toastIdCounter

        // Sound effect
        if (sound) {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
                const osc = audioCtx.createOscillator()
                const gain = audioCtx.createGain()
                osc.connect(gain)
                gain.connect(audioCtx.destination)
                gain.gain.value = 0.1
                if (type === 'error' || type === 'critical') {
                    osc.frequency.value = 440
                    osc.type = 'square'
                    osc.start(); osc.stop(audioCtx.currentTime + 0.15)
                    setTimeout(() => {
                        const osc2 = audioCtx.createOscillator()
                        const g2 = audioCtx.createGain()
                        osc2.connect(g2); g2.connect(audioCtx.destination)
                        g2.gain.value = 0.1; osc2.frequency.value = 330; osc2.type = 'square'
                        osc2.start(); osc2.stop(audioCtx.currentTime + 0.15)
                    }, 180)
                } else {
                    osc.frequency.value = 660
                    osc.type = 'sine'
                    osc.start(); osc.stop(audioCtx.currentTime + 0.1)
                    setTimeout(() => {
                        const osc2 = audioCtx.createOscillator()
                        const g2 = audioCtx.createGain()
                        osc2.connect(g2); g2.connect(audioCtx.destination)
                        g2.gain.value = 0.08; osc2.frequency.value = 880; osc2.type = 'sine'
                        osc2.start(); osc2.stop(audioCtx.currentTime + 0.12)
                    }, 120)
                }
            } catch (e) { /* ignore audio errors */ }
        }

        // Confetti celebration
        if (celebrate) {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#9333ea', '#3b82f6', '#06b6d4', '#10b981', '#f59e0b'] })
            setTimeout(() => confetti({ particleCount: 40, spread: 50, origin: { x: 0.3, y: 0.5 } }), 300)
            setTimeout(() => confetti({ particleCount: 40, spread: 50, origin: { x: 0.7, y: 0.5 } }), 600)
        }

        setToasts(prev => [...prev, { id, type, title, message }])

        if (duration > 0) {
            setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
        }

        return id
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    // Shortcut methods
    const toast = {
        success: (title, message, opts = {}) => addToast({ type: 'success', title, message, ...opts }),
        error: (title, message, opts = {}) => addToast({ type: 'error', title, message, sound: true, ...opts }),
        critical: (title, message, opts = {}) => addToast({ type: 'critical', title, message, sound: true, duration: 8000, ...opts }),
        info: (title, message, opts = {}) => addToast({ type: 'info', title, message, ...opts }),
        celebrate: (title, message, opts = {}) => addToast({ type: 'success', title, message, celebrate: true, sound: true, ...opts }),
    }

    const icons = {
        success: <CheckCircle size={18} />,
        error: <XCircle size={18} />,
        critical: <AlertTriangle size={18} />,
        info: <Info size={18} />,
    }

    const colors = {
        success: { bg: 'var(--success-dim)', border: 'rgba(16,185,129,0.3)', color: 'var(--success)', glow: '0 0 30px rgba(16,185,129,0.15)' },
        error: { bg: 'var(--danger-dim)', border: 'rgba(239,68,68,0.3)', color: 'var(--danger)', glow: '0 0 30px rgba(239,68,68,0.15)' },
        critical: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)', color: '#ff4444', glow: '0 0 40px rgba(239,68,68,0.25)' },
        info: { bg: 'var(--info-dim)', border: 'rgba(59,130,246,0.3)', color: 'var(--info)', glow: '0 0 30px rgba(59,130,246,0.15)' },
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}

            {/* Toast Container */}
            <div style={{
                position: 'fixed', top: '20px', right: '20px',
                display: 'flex', flexDirection: 'column', gap: '10px',
                zIndex: 9999, pointerEvents: 'none', maxWidth: '400px',
            }}>
                {toasts.map(t => {
                    const c = colors[t.type] || colors.info
                    return (
                        <div key={t.id} style={{
                            background: c.bg, backdropFilter: 'blur(20px)',
                            border: `1px solid ${c.border}`,
                            borderRadius: 'var(--radius-lg)', padding: '14px 18px',
                            display: 'flex', alignItems: 'flex-start', gap: '12px',
                            boxShadow: `var(--shadow-md), ${c.glow}`,
                            animation: t.type === 'critical' ? 'toastSlideIn 0.4s ease, criticalPulse 1s ease-in-out infinite' : 'toastSlideIn 0.4s ease',
                            pointerEvents: 'auto', cursor: 'pointer',
                            minWidth: '300px',
                        }}
                            onClick={() => removeToast(t.id)}
                        >
                            <div style={{ color: c.color, flexShrink: 0, marginTop: '2px' }}>
                                {t.type === 'critical' && <Volume2 size={18} />}
                                {t.type !== 'critical' && icons[t.type]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.83rem', color: c.color, marginBottom: '2px' }}>{t.title}</div>
                                {t.message && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{t.message}</div>}
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeToast(t.id) }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', flexShrink: 0 }}>
                                <X size={14} />
                            </button>
                        </div>
                    )
                })}
            </div>

            <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(80px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes criticalPulse {
          0%, 100% { box-shadow: var(--shadow-md), 0 0 30px rgba(239,68,68,0.15); }
          50% { box-shadow: var(--shadow-md), 0 0 50px rgba(239,68,68,0.3); }
        }
      `}</style>
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}



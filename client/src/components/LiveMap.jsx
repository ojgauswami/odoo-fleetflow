import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Truck, AlertTriangle, Navigation } from 'lucide-react'
import axios from 'axios'
import { useToast } from './ToastSystem'

// Indian city coordinates
const CITY_COORDS = {
    'Mumbai': [19.076, 72.8777], 'Delhi': [28.7041, 77.1025], 'Bangalore': [12.9716, 77.5946],
    'Hyderabad': [17.385, 78.4867], 'Ahmedabad': [23.0225, 72.5714], 'Chennai': [13.0827, 80.2707],
    'Kolkata': [22.5726, 88.3639], 'Surat': [21.1702, 72.8311], 'Pune': [18.5204, 73.8567],
    'Jaipur': [26.9124, 75.7873], 'Lucknow': [26.8467, 80.9462], 'Kanpur': [26.4499, 80.3319],
    'Nagpur': [21.1458, 79.0882], 'Indore': [22.7196, 75.8577], 'Thane': [19.2183, 72.9781],
    'Bhopal': [23.2599, 77.4126], 'Vadodara': [22.3072, 73.1812], 'Patna': [25.6093, 85.1376],
    'Rajkot': [22.3039, 70.8022], 'Nashik': [19.9975, 73.7898], 'Amritsar': [31.634, 74.8723],
    'Coimbatore': [11.0168, 76.9558], 'Visakhapatnam': [17.6868, 83.2185], 'Kochi': [9.9312, 76.2673],
    'Jodhpur': [26.2389, 73.0243], 'Udaipur': [24.5854, 73.7125],
}

// Find closest city match
function getCityCoords(name) {
    if (!name) return [20.5937, 78.9629] // India center
    const key = Object.keys(CITY_COORDS).find(c => name.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(name.toLowerCase()))
    return key ? CITY_COORDS[key] : [20.5937 + (Math.random() - 0.5) * 4, 78.9629 + (Math.random() - 0.5) * 8]
}

// Interpolate position along route
function interpolatePos(origin, dest, progress) {
    return [
        origin[0] + (dest[0] - origin[0]) * progress,
        origin[1] + (dest[1] - origin[1]) * progress,
    ]
}

// Truck icon SVG
function createTruckIcon(color = '#9333ea', size = 32) {
    return L.divIcon({
        className: '',
        html: `<div style="width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;background:${color};border-radius:50%;border:3px solid rgba(255,255,255,0.3);box-shadow:0 0 20px ${color}44, 0 4px 12px rgba(0,0,0,0.4);animation:pulse-map 2s ease-in-out infinite;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
    </div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    })
}

// City marker
function createCityIcon() {
    return L.divIcon({
        className: '',
        html: `<div style="width:10px;height:10px;background:var(--cyan, #06b6d4);border-radius:50%;border:2px solid rgba(255,255,255,0.4);box-shadow:0 0 12px rgba(6,182,212,0.4);"></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
    })
}

// Auto-fit map to markers
function MapBounds({ positions }) {
    const map = useMap()
    useEffect(() => {
        if (positions.length > 0) {
            const bounds = L.latLngBounds(positions)
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 7 })
        }
    }, [positions, map])
    return null
}

export default function LiveMap() {
    const toast = useToast()
    const [trips, setTrips] = useState([])
    const [loading, setLoading] = useState(true)
    const [simProgress, setSimProgress] = useState({})
    const [speedAlerts, setSpeedAlerts] = useState({})
    const intervalRef = useRef(null)

    useEffect(() => {
        axios.get('/api/trips?status=Dispatched')
            .then(res => {
                setTrips(res.data.filter(t => t.status === 'Dispatched'))
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [])

    // Simulate movement
    useEffect(() => {
        if (trips.length === 0) return

        // Initialize progress
        const initial = {}
        trips.forEach(t => { initial[t.id] = Math.random() * 0.4 + 0.1 })
        setSimProgress(initial)

        intervalRef.current = setInterval(() => {
            setSimProgress(prev => {
                const next = { ...prev }
                Object.keys(next).forEach(id => {
                    const speed = 0.003 + Math.random() * 0.005
                    next[id] = Math.min(next[id] + speed, 0.95)

                    // Random speeding alert (5% chance per tick)
                    if (Math.random() < 0.05 && !speedAlerts[id]) {
                        const trip = trips.find(t => t.id === parseInt(id))
                        if (trip) {
                            setSpeedAlerts(prev2 => ({ ...prev2, [id]: true }))
                            toast?.critical(
                                '⚡ Speeding Alert!',
                                `${trip.driver_name} on ${trip.plate} exceeded speed limit near ${trip.destination}!`
                            )
                            setTimeout(() => setSpeedAlerts(prev2 => { const n = { ...prev2 }; delete n[id]; return n }), 8000)
                        }
                    }
                })
                return next
            })
        }, 2000)

        return () => clearInterval(intervalRef.current)
    }, [trips])

    if (loading) return <div className="shimmer" style={{ height: '500px', borderRadius: 'var(--radius-xl)' }} />

    // Build markers
    const vehicleMarkers = trips.map(trip => {
        const origin = getCityCoords(trip.origin)
        const dest = getCityCoords(trip.destination)
        const progress = simProgress[trip.id] || 0.5
        const pos = interpolatePos(origin, dest, progress)
        const isSpeeding = speedAlerts[trip.id]
        return { trip, origin, dest, pos, isSpeeding }
    })

    const allPositions = vehicleMarkers.flatMap(m => [m.origin, m.dest, m.pos])

    return (
        <div>
            {/* Stats bar */}
            <div className="animate-fade-in" style={{ display: 'flex', gap: '14px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--accent-dim)', borderRadius: 'var(--radius-md)', padding: '8px 16px', border: '1px solid var(--border-glass)' }}>
                    <Truck size={15} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)' }}>{trips.length}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>Vehicles on Road</span>
                </div>
                {Object.keys(speedAlerts).length > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--danger-dim)', borderRadius: 'var(--radius-md)', padding: '8px 16px', border: '1px solid rgba(239,68,68,0.3)', animation: 'criticalPulse 1.5s ease-in-out infinite' }}>
                        <AlertTriangle size={15} style={{ color: 'var(--danger)' }} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--danger)' }}>{Object.keys(speedAlerts).length} Speed Alert(s)</span>
                    </div>
                )}
            </div>

            {/* Map */}
            <div className="glass-card animate-fade-in-1" style={{ overflow: 'hidden', borderRadius: 'var(--radius-xl)' }}>
                <div style={{ height: '520px', position: 'relative' }}>
                    {trips.length === 0 ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', flexDirection: 'column', gap: '12px' }}>
                            <Navigation size={40} style={{ opacity: 0.3 }} />
                            <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>No active trips to track</p>
                        </div>
                    ) : (
                        <MapContainer center={[22, 78]} zoom={5} style={{ height: '100%', width: '100%', background: '#0a0a1f' }}
                            zoomControl={true} attributionControl={false}>
                            <TileLayer
                                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                            />
                            <MapBounds positions={allPositions} />

                            {vehicleMarkers.map(({ trip, origin, dest, pos, isSpeeding }) => (
                                <div key={trip.id}>
                                    {/* Route line */}
                                    <Polyline positions={[origin, dest]} pathOptions={{ color: isSpeeding ? '#ef4444' : '#9333ea', weight: 2, opacity: 0.5, dashArray: '8 6' }} />
                                    <Polyline positions={[origin, pos]} pathOptions={{ color: isSpeeding ? '#ef4444' : '#06b6d4', weight: 3, opacity: 0.8 }} />

                                    {/* Origin */}
                                    <Marker position={origin} icon={createCityIcon()}>
                                        <Popup><b>{trip.origin}</b></Popup>
                                    </Marker>
                                    {/* Destination */}
                                    <Marker position={dest} icon={createCityIcon()}>
                                        <Popup><b>{trip.destination}</b></Popup>
                                    </Marker>

                                    {/* Vehicle */}
                                    <Marker position={pos} icon={createTruckIcon(isSpeeding ? '#ef4444' : '#9333ea')}>
                                        <Popup>
                                            <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px' }}>
                                                <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>{trip.plate}</div>
                                                <div style={{ fontSize: '12px', color: '#666' }}>{trip.driver_name}</div>
                                                <div style={{ fontSize: '12px', marginTop: '4px' }}>{trip.origin} → {trip.destination}</div>
                                                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Cargo: {(trip.cargo_weight_kg / 1000).toFixed(1)}T</div>
                                                {isSpeeding && <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '12px', marginTop: '4px' }}>⚠ SPEEDING</div>}
                                            </div>
                                        </Popup>
                                    </Marker>
                                </div>
                            ))}
                        </MapContainer>
                    )}

                    {/* Map overlay legend */}
                    <div style={{ position: 'absolute', bottom: '16px', left: '16px', background: 'var(--bg-glass-strong)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', padding: '12px 16px', zIndex: 1000, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        <div style={{ fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Legend</div>
                        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#9333ea' }} /> Normal</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Speeding</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#06b6d4' }} /> City</span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .leaflet-container { font-family: Inter, sans-serif; }
        .leaflet-popup-content-wrapper { background: rgba(12,12,35,0.95); color: white; border-radius: 12px; border: 1px solid rgba(130,90,255,0.2); box-shadow: 0 8px 30px rgba(0,0,0,0.4); }
        .leaflet-popup-tip { background: rgba(12,12,35,0.95); }
        .leaflet-popup-close-button { color: #888 !important; }
        @keyframes pulse-map {
          0%, 100% { box-shadow: 0 0 20px currentColor; transform: scale(1); }
          50% { box-shadow: 0 0 35px currentColor; transform: scale(1.08); }
        }
      `}</style>
        </div>
    )
}



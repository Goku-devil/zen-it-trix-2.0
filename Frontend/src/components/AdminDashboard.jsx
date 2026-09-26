import { useEffect, useState } from 'react'
import { nonTechnicalEvents, technicalEvents } from '../data'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const events = [...technicalEvents, ...nonTechnicalEvents]
const emptyForm = { fullName: '', email: '', phone: '', college: '', eventName: '', teamSize: '1' }
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const passStyles = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap');@page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}html,body{margin:0}body{width:194mm;min-height:281mm;padding:0;display:grid;grid-template-columns:repeat(2,1fr);grid-auto-rows:136mm;gap:5mm;align-content:start;background:#100c1d;color:#f6f2e9;font-family:'Space Grotesk',sans-serif;background-image:linear-gradient(rgba(246,242,233,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(246,242,233,.08) 1px,transparent 1px);background-size:9mm 9mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}.pass{position:relative;width:auto;height:136mm;overflow:hidden;padding:10mm 8mm 8mm;border:1px solid rgba(246,242,233,.35);background:linear-gradient(145deg,#171127,#0d0a17);box-shadow:3mm 3mm 0 rgba(213,255,75,.16);break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact}.pass:before{content:'';position:absolute;top:0;right:0;width:35mm;height:35mm;background:#ff4f9a;clip-path:polygon(100% 0,100% 100%,0 0);opacity:.85}.kicker,.small,.meta{font:8pt 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.08em}.kicker{color:#a7a0b7}.code{position:relative;margin:12mm 0 5mm;color:#d5ff4b;font:500 25pt 'DM Mono',monospace;letter-spacing:-.06em}.name{margin:0;font-size:18pt;font-weight:700;letter-spacing:-.05em;overflow-wrap:anywhere}.meta{margin:3mm 0;color:#a7a0b7;line-height:1.5}.event{display:inline-block;margin:4mm 0 2mm;padding:2mm 3mm;background:#d5ff4b;color:#100c1d;font:500 8pt 'DM Mono',monospace;text-transform:uppercase}.pass img{display:block;width:100%;max-height:32mm;object-fit:contain;margin:8mm 0 5mm;padding:2mm;background:#f6f2e9}.small{color:#a7a0b7}@media print{body{width:194mm;min-height:281mm}}`

async function parse(response) {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Request failed.')
    return data
}

export default function AdminDashboard() {
    const [token, setToken] = useState(() => sessionStorage.getItem('zen-admin-token') || '')
    const [credentials, setCredentials] = useState({ username: '', password: '' })
    const [registrations, setRegistrations] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState([])
    const [status, setStatus] = useState({ type: '', message: '' })
    const [isLoading, setIsLoading] = useState(false)

    const request = async (path, options = {}) => parse(await fetch(`${API_URL}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers } }))
    const loadRegistrations = async () => {
        try { setRegistrations(await request('/admin/registrations')) } catch (error) { setStatus({ type: 'error', message: error.message }) }
    }
    useEffect(() => { if (token) loadRegistrations() }, [token])

    const login = async (event) => {
        event.preventDefault(); setIsLoading(true)
        try {
            const result = await parse(await fetch(`${API_URL}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) }))
            sessionStorage.setItem('zen-admin-token', result.token); setToken(result.token); setStatus({ type: '', message: '' })
        } catch (error) { setStatus({ type: 'error', message: error.message }) } finally { setIsLoading(false) }
    }
    const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    const addStudent = async (event) => {
        event.preventDefault(); setIsLoading(true)
        try {
            const result = await request('/admin/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, teamSize: Number(form.teamSize) }) })
            setForm(emptyForm); setStatus({ type: 'success', message: `Student registered with pass ZEN${String(result.registrationId).padStart(3, '0')}.` }); await loadRegistrations()
        } catch (error) { setStatus({ type: 'error', message: error.message }) } finally { setIsLoading(false) }
    }
    const exportReport = async () => {
        try {
            const response = await fetch(`${API_URL}/registrations/export`, { headers: { Authorization: `Bearer ${token}` } })
            if (!response.ok) throw new Error('Report export failed.')
            const link = document.createElement('a'); link.href = URL.createObjectURL(await response.blob()); link.download = 'zen-it-trix-attendance-report.csv'; link.click()
        } catch (error) { setStatus({ type: 'error', message: error.message }) }
    }
    const barcode = async (registration) => {
        const response = await fetch(`${API_URL}/admin/registrations/${registration.id}/barcode`, { headers: { Authorization: `Bearer ${token}` } })
        if (!response.ok) throw new Error('Barcode request failed.')
        return await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; response.blob().then((blob) => reader.readAsDataURL(blob)).catch(reject) })
    }
    const markPresent = async (registration) => {
        await request(`/admin/registrations/${registration.id}/present`, { method: 'POST' })
        setRegistrations((current) => current.map((item) => item.id === registration.id ? { ...item, present: 1, presentAt: new Date().toISOString() } : item))
    }
    const printSelected = async (ids = selectedIds) => {
        if (!ids.length) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) { setStatus({ type: 'error', message: 'Please allow pop-ups to print passes.' }); return }
        printWindow.document.write('<p style="font-family:sans-serif;padding:24px">Preparing passes...</p>')
        try {
            const selected = registrations.filter((registration) => ids.includes(registration.id))
            await Promise.all(selected.map(markPresent))
            const barcodes = await Promise.all(selected.map(barcode))
            const cards = selected.map((registration, index) => `<article class="pass"><div class="kicker">Zen-it-trix 2.0 // Student pass</div><div class="code">${escapeHtml(registration.passCode)}</div><div class="name">${escapeHtml(registration.fullName)}</div><div class="meta">${escapeHtml(registration.college)}</div><div class="event">${escapeHtml(registration.eventName)}</div><img src="${barcodes[index]}" alt="Barcode for ${escapeHtml(registration.passCode)}"><div class="small">Present this pass at check-in</div></article>`).join('')
            printWindow.document.open(); printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Zen-it-trix passes</title><style>${passStyles}</style></head><body>${cards}</body></html>`); printWindow.document.close()
            setTimeout(() => { printWindow.focus(); printWindow.print() }, 250)
        } catch (error) { printWindow.close(); setStatus({ type: 'error', message: 'Passes could not be prepared for printing.' }) }
    }
    const toggle = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id])
    const filtered = registrations.filter((registration) => [registration.passCode, registration.fullName, registration.email, registration.college, registration.eventName].some((value) => value.toLowerCase().includes(search.toLowerCase())))
    const logout = () => { sessionStorage.removeItem('zen-admin-token'); setToken(''); setRegistrations([]) }

    if (!token) return <main className="admin-page"><section className="admin-login"><p className="eyebrow">Restricted // Admin desk</p><h1>Enter the <em>control room.</em></h1><p>Manage registrations and issue student passes.</p><form onSubmit={login}><label>Username<input value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} required /></label><label>Password<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required /></label>{status.message && <p className="admin-status error">{status.message}</p>}<button className="registration-submit">Open admin desk <span>↗</span></button></form></section></main>

    return <main className="admin-page"><header className="admin-header"><div><p className="eyebrow">Zen-it-trix 2.0 // Admin desk</p><h1>Registration <em>control.</em></h1></div><div className="admin-actions"><button type="button" onClick={exportReport}>Generate report</button><button type="button" onClick={logout}>Sign out</button></div></header><section className="admin-layout"><section className="admin-panel"><p className="track-label">01 / On-spot registration</p><h2>Add a student.</h2><form onSubmit={addStudent}><label>Full name<input name="fullName" value={form.fullName} onChange={updateField} required /></label><div className="registration-fields"><label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label><label>Phone<input name="phone" value={form.phone} onChange={updateField} required /></label></div><label>College / institution<input name="college" value={form.college} onChange={updateField} required /></label><div className="registration-fields"><label>Event<select name="eventName" value={form.eventName} onChange={updateField} required><option value="">Choose an event</option>{events.map((event) => <option key={event.name} value={event.name}>{event.name}</option>)}</select></label><label>Team size<input name="teamSize" type="number" min="1" max="10" value={form.teamSize} onChange={updateField} required /></label></div>{status.message && <p className={`admin-status ${status.type}`}>{status.message}</p>}<button className="registration-submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Register and assign pass'} <span>↗</span></button></form></section><section className="admin-panel admin-list"><div className="admin-list-heading"><div><p className="track-label">02 / Current students</p><h2>{filtered.length} of {registrations.length} registered.</h2></div><div className="admin-list-actions"><button type="button" onClick={loadRegistrations}>Refresh</button>{selectedIds.length > 0 && <button className="bulk-pass-button" type="button" onClick={() => printSelected()}>Print {selectedIds.length} passes</button>}</div></div><label className="admin-search">Search students<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pass, name, email, college, or event" /></label><div className="registration-table"><div className="registration-table-row registration-table-head"><span>Select</span><span>Pass</span><span>Student</span><span>Event</span><span>Status</span><span>Action</span></div>{filtered.map((registration) => <div className="registration-table-row" key={registration.id}><input className="student-checkbox" type="checkbox" checked={selectedIds.includes(registration.id)} onChange={() => toggle(registration.id)} aria-label={`Select ${registration.fullName}`} /><strong>{registration.passCode}</strong><span><b>{registration.fullName}</b><small>{registration.college}</small></span><span>{registration.eventName}</span><span className={`attendance-status ${registration.present ? 'present' : ''}`}>{registration.present ? 'Present' : 'Not present'}</span><button type="button" onClick={() => printSelected([registration.id])}>Print</button></div>)}</div></section></section></main>
}

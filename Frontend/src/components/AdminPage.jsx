import { useEffect, useState } from 'react'
import { nonTechnicalEvents, technicalEvents } from '../data'
import { zenLogo } from '../assets/logoDataUrl'
import CollegeSelector from './CollegeSelector'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const events = [...technicalEvents, ...nonTechnicalEvents]
const emptyForm = { fullName: '', email: '', phone: '', college: '', eventName: '', teamSize: '1' }
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const themedPassStyles = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap');
@page { size: A4 portrait; margin: 8mm; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { width: 194mm; min-height: 281mm; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: 136mm; gap: 5mm; align-content: start; background: #100c1d; color: #f6f2e9; font-family: 'Space Grotesk', sans-serif; background-image: linear-gradient(rgba(246,242,233,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(246,242,233,.08) 1px, transparent 1px); background-size: 9mm 9mm; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.pass { position: relative; width: auto; height: 136mm; overflow: hidden; padding: 8mm 7mm 6mm; border: 1px solid rgba(246,242,233,.35); background: linear-gradient(145deg,#171127,#0d0a17); box-shadow: 3mm 3mm 0 rgba(213,255,75,.16); break-inside: avoid; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.pass:before { content: ''; position: absolute; top: 0; right: 0; width: 32mm; height: 32mm; background: #ff4f9a; clip-path: polygon(100% 0,100% 100%,0 0); opacity: .85; }
.pass-header { display: flex; align-items: center; gap: 3mm; position: relative; z-index: 2; }
.pass-logo { width: 13mm; height: 13mm; border-radius: 50%; object-fit: contain; flex-shrink: 0; }
.kicker, .small, .meta { font: 8pt 'DM Mono', monospace; text-transform: uppercase; letter-spacing: .08em; }
.kicker { color: #a7a0b7; }
.sub-kicker { font: 7pt 'DM Mono', monospace; color: #d5ff4b; text-transform: uppercase; letter-spacing: .08em; }
.code { position: relative; margin: 5mm 0 3mm; color: #d5ff4b; font: 500 23pt 'DM Mono', monospace; letter-spacing: -.06em; }
.name { margin: 0; font-size: 16pt; font-weight: 700; letter-spacing: -.05em; overflow-wrap: anywhere; }
.meta { margin: 2mm 0; color: #a7a0b7; line-height: 1.4; }
.event { display: inline-block; margin: 3mm 0 2mm; padding: 1.5mm 3mm; background: #d5ff4b; color: #100c1d; font: 500 8pt 'DM Mono', monospace; text-transform: uppercase; }
.pass img.barcode { display: block; width: 100%; max-height: 28mm; object-fit: contain; margin: 5mm 0 3mm; padding: 2mm; background: #f6f2e9; position: relative; z-index: 2; }
.small { color: #a7a0b7; }
.pass:only-child { grid-column: 1 / -1; width: 86mm; justify-self: center; }
@media print { body { width: 194mm; min-height: 281mm; } }`
const applyPassStyles = (html) => html.replace(/<style>[\s\S]*?<\/style>/, `<style>${themedPassStyles}</style>`)

async function readResponse(response) {
    const contentType = response.headers.get('content-type') || ''
    const data = contentType.includes('application/json') ? await response.json() : await response.text()
    if (!response.ok) throw new Error(data.message || 'Request failed.')
    return data
}

export default function AdminPage() {
    const [token, setToken] = useState(() => sessionStorage.getItem('zen-admin-token') || '')
    const [credentials, setCredentials] = useState({ username: '', password: '' })
    const [registrations, setRegistrations] = useState([])
    const [form, setForm] = useState(emptyForm)
    const [formKey, setFormKey] = useState(0)
    const [status, setStatus] = useState({ type: '', message: '' })
    const [isLoading, setIsLoading] = useState(false)
    const [pass, setPass] = useState(null)
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState([])

    const request = async (path, options = {}) => readResponse(await fetch(`${API_URL}${path}`, { ...options, headers: { Authorization: `Bearer ${token}`, ...options.headers } }))

    const loadRegistrations = async () => {
        try {
            setRegistrations(await request('/admin/registrations'))
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        }
    }

    useEffect(() => {
        if (token) loadRegistrations()
    }, [token])

    const handleLogin = async (event) => {
        event.preventDefault()
        setIsLoading(true)
        try {
            const result = await readResponse(await fetch(`${API_URL}/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) }))
            sessionStorage.setItem('zen-admin-token', result.token)
            setToken(result.token)
            setStatus({ type: '', message: '' })
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

    const handleOnSpotRegistration = async (event) => {
        event.preventDefault()
        setIsLoading(true)
        try {
            const result = await request('/admin/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, teamSize: Number(form.teamSize) }) })
            setForm(emptyForm)
            setFormKey((k) => k + 1)
            setStatus({ type: 'success', message: `Student registered with pass ${result.registrationId ? `ZEN${String(result.registrationId).padStart(3, '0')}` : 'assigned'}.` })
            await loadRegistrations()
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setIsLoading(false)
        }
    }

    const exportRegistrations = async () => {
        try {
            const response = await fetch(`${API_URL}/registrations/export`, { headers: { Authorization: `Bearer ${token}` } })
            const blob = await response.blob()
            if (!response.ok) throw new Error('Export failed.')
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'zen-it-trix-registrations.csv'
            link.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        }
    }

    const getBarcodeDataUrl = async (registration) => {
        const response = await fetch(`${API_URL}/admin/registrations/${registration.id}/barcode`, { headers: { Authorization: `Bearer ${token}` } })
        if (!response.ok) throw new Error('Barcode request failed.')
        const blob = await response.blob()
        return await new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    }

    const markPresent = async (registration) => {
        await request(`/admin/registrations/${registration.id}/present`, { method: 'POST' })
        setRegistrations((current) => current.map((item) => item.id === registration.id ? { ...item, present: 1, presentAt: new Date().toISOString() } : item))
    }

    const printPass = async (registration) => {
        try {
            await markPresent(registration)
            const barcodeUrl = await getBarcodeDataUrl(registration)
            setPass({ ...registration, barcodeUrl })
            setTimeout(() => window.print(), 100)
        } catch (error) {
            setStatus({ type: 'error', message: 'The student pass could not be prepared.' })
        }
    }

    const downloadPass = async (registration) => {
        try {
            const barcodeUrl = await getBarcodeDataUrl(registration)
            const passHtml = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(registration.passCode)} pass</title><link rel="icon" type="image/png" href="${zenLogo}"><style>@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap');*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#100c1d;color:#f6f2e9;font-family:'Space Grotesk',sans-serif;background-image:linear-gradient(rgba(246,242,233,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(246,242,233,.08) 1px,transparent 1px);background-size:34px 34px}.pass{position:relative;width:360px;overflow:hidden;padding:32px 28px;border:1px solid rgba(246,242,233,.25);background:linear-gradient(145deg,#171127,#0d0a17);box-shadow:12px 12px 0 rgba(213,255,75,.16)}.pass:before{content:'';position:absolute;top:0;right:0;width:110px;height:110px;background:#ff4f9a;clip-path:polygon(100% 0,100% 100%,0 0);opacity:.85}.pass-header{display:flex;align-items:center;gap:12px;position:relative;z-index:2}.pass-logo{width:48px;height:48px;border-radius:50%;object-fit:contain;flex-shrink:0}.kicker,.small,.meta{font:10px 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.08em}.kicker{color:#a7a0b7}.sub-kicker{font:9px 'DM Mono',monospace;color:#d5ff4b;text-transform:uppercase;letter-spacing:.08em}.code{position:relative;margin:28px 0 16px;color:#d5ff4b;font:500 42px 'DM Mono',monospace;letter-spacing:-.06em}.name{margin:0;font-size:25px;font-weight:700;letter-spacing:-.05em}.meta{margin:8px 0;color:#a7a0b7;line-height:1.7}.event{display:inline-block;margin:14px 0 8px;padding:8px 10px;background:#d5ff4b;color:#100c1d;font:500 11px 'DM Mono',monospace;text-transform:uppercase}.pass img.barcode{display:block;width:100%;margin:24px 0 14px;background:#f6f2e9;padding:8px}.small{color:#a7a0b7}</style></head><body><article class="pass"><div class="pass-header"><img class="pass-logo" src="${zenLogo}" alt="Zen-it-trix Logo"><div><div class="kicker">Zen-it-trix 2.0</div><div class="sub-kicker">Student pass</div></div></div><div class="code">${escapeHtml(registration.passCode)}</div><div class="name">${escapeHtml(registration.fullName)}</div><div class="meta">${escapeHtml(registration.college)}</div><div class="event">${escapeHtml(registration.eventName)}</div><img class="barcode" src="${barcodeUrl}" alt="Barcode for ${escapeHtml(registration.passCode)}"><div class="small">Present this pass at check-in</div></article></body></html>`
            const url = URL.createObjectURL(new Blob([applyPassStyles(passHtml)], { type: 'text/html' }))
            const link = document.createElement('a')
            link.href = url
            link.download = `${registration.passCode}-pass.html`
            link.click()
            URL.revokeObjectURL(url)
        } catch (error) {
            setStatus({ type: 'error', message: 'The student pass could not be downloaded.' })
        }
    }

    const toggleStudent = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id])

    const downloadGroupPass = async () => {
        if (!selectedIds.length) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            setStatus({ type: 'error', message: 'Please allow pop-ups to print the selected passes.' })
            return
        }
        printWindow.document.write('<p style="font-family: sans-serif; padding: 24px">Preparing four passes for printing...</p>')
        try {
            const selectedStudents = registrations.filter((registration) => selectedIds.includes(registration.id))
            await Promise.all(selectedStudents.map(markPresent))
            const barcodeUrls = await Promise.all(selectedStudents.map((registration) => getBarcodeDataUrl(registration)))
            const cards = selectedStudents.map((registration, index) => `<article class="pass"><div class="pass-header"><img class="pass-logo" src="${zenLogo}" alt="Zen-it-trix Logo"><div><div class="kicker">Zen-it-trix 2.0</div><div class="sub-kicker">Student pass</div></div></div><div class="code">${escapeHtml(registration.passCode)}</div><div class="name">${escapeHtml(registration.fullName)}</div><div class="meta">${escapeHtml(registration.college)}</div><div class="event">${escapeHtml(registration.eventName)}</div><img class="barcode" src="${barcodeUrls[index]}" alt="Barcode for ${escapeHtml(registration.passCode)}"><div class="small">Present this pass at check-in</div></article>`).join('')
            const groupHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Zen-it-trix group passes</title><link rel="icon" type="image/png" href="${zenLogo}"><style>@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap');*{box-sizing:border-box}body{margin:0;padding:32px;display:grid;grid-template-columns:repeat(2,minmax(300px,360px));justify-content:center;gap:28px;background:#100c1d;color:#f6f2e9;font-family:'Space Grotesk',sans-serif;background-image:linear-gradient(rgba(246,242,233,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(246,242,233,.08) 1px,transparent 1px);background-size:34px 34px}.pass{position:relative;overflow:hidden;padding:32px 28px;border:1px solid rgba(246,242,233,.25);background:linear-gradient(145deg,#171127,#0d0a17);box-shadow:12px 12px 0 rgba(213,255,75,.16)}.pass:before{content:'';position:absolute;top:0;right:0;width:110px;height:110px;background:#ff4f9a;clip-path:polygon(100% 0,100% 100%,0 0);opacity:.85}.pass-header{display:flex;align-items:center;gap:12px;position:relative;z-index:2}.pass-logo{width:48px;height:48px;border-radius:50%;object-fit:contain;flex-shrink:0}.kicker,.small,.meta{font:10px 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.08em}.kicker{color:#a7a0b7}.sub-kicker{font:9px 'DM Mono',monospace;color:#d5ff4b;text-transform:uppercase;letter-spacing:.08em}.code{position:relative;margin:28px 0 16px;color:#d5ff4b;font:500 42px 'DM Mono',monospace;letter-spacing:-.06em}.name{margin:0;font-size:25px;font-weight:700;letter-spacing:-.05em}.meta{margin:8px 0;color:#a7a0b7;line-height:1.7}.event{display:inline-block;margin:14px 0 8px;padding:8px 10px;background:#d5ff4b;color:#100c1d;font:500 11px 'DM Mono',monospace;text-transform:uppercase}.pass img.barcode{display:block;width:100%;margin:24px 0 14px;background:#f6f2e9;padding:8px}.small{color:#a7a0b7}@media print{body{background:#100c1d}}</style></head><body>${cards}</body></html>`
            printWindow.document.open()
            printWindow.document.write(applyPassStyles(groupHtml))
            printWindow.document.close()
            setTimeout(() => {
                printWindow.focus()
                printWindow.print()
            }, 250)
        } catch (error) {
            printWindow.close()
            setStatus({ type: 'error', message: 'The selected student passes could not be prepared for printing.' })
        }
    }

    const logout = () => {
        sessionStorage.removeItem('zen-admin-token')
        setToken('')
        setRegistrations([])
    }

    const filteredRegistrations = registrations.filter((registration) => [registration.passCode, registration.fullName, registration.email, registration.college, registration.eventName].some((value) => value.toLowerCase().includes(search.trim().toLowerCase())))
    const studentRows = filteredRegistrations.map((registration) => <div className="registration-table-row" key={registration.id}>
        <input className="student-checkbox" type="checkbox" checked={selectedIds.includes(registration.id)} onChange={() => toggleStudent(registration.id)} aria-label={`Select ${registration.fullName}`} />
        <strong>{registration.passCode}</strong>
        <span><b>{registration.fullName}</b><small>{registration.college}</small></span>
        <span>{registration.eventName}</span>
        <span className={`attendance-status ${registration.present ? 'present' : ''}`}>{registration.present ? 'Present' : 'Not present'}</span>
        <div className="pass-actions"><button type="button" onClick={() => printPass(registration)}>Print</button><button type="button" onClick={() => downloadPass(registration)}>Download</button></div>
    </div>)

    if (!token) return <main className="admin-page"><section className="admin-login"><p className="eyebrow">Restricted // Admin desk</p><h1>Enter the <em>control room.</em></h1><p>Manage on-spot registrations and issue student passes for Zen-it-trix 2.0.</p><form onSubmit={handleLogin}><label>Username<input value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} required autoComplete="username" /></label><label>Password<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required autoComplete="current-password" /></label>{status.message && <p className="admin-status error">{status.message}</p>}<button className="registration-submit" disabled={isLoading}>{isLoading ? 'Checking...' : 'Open admin desk'} <span>↗</span></button></form></section></main>

    return <main className="admin-page"><header className="admin-header"><div><p className="eyebrow">Zen-it-trix 2.0 // Admin desk</p><h1>Registration <em>control.</em></h1></div><div className="admin-actions"><button type="button" onClick={exportRegistrations}>Export Excel CSV</button><button type="button" onClick={logout}>Sign out</button></div></header><section className="admin-layout"><section className="admin-panel"><p className="track-label">01 / On-spot registration</p><h2>Add a student.</h2><form onSubmit={handleOnSpotRegistration}><label>Full name<input name="fullName" value={form.fullName} onChange={updateField} required /></label><div className="registration-fields"><label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label><label>Phone<input name="phone" value={form.phone} onChange={updateField} required /></label></div><CollegeSelector key={formKey} value={form.college} onChange={(college) => setForm((curr) => ({ ...curr, college }))} disabled={isLoading} /><div className="registration-fields"><label>Event<select name="eventName" value={form.eventName} onChange={updateField} required><option value="">Choose an event</option>{events.map((event) => <option key={event.name} value={event.name}>{event.name}</option>)}</select></label><label>Team size<input name="teamSize" type="number" min="1" max="10" value={form.teamSize} onChange={updateField} required /></label></div>{status.message && <p className={`admin-status ${status.type}`}>{status.message}</p>}<button className="registration-submit" disabled={isLoading}>{isLoading ? 'Saving...' : 'Register and assign pass'} <span>↗</span></button></form></section><section className="admin-panel admin-list"><div className="admin-list-heading"><div><p className="track-label">02 / Current students</p><h2>{filteredRegistrations.length} of {registrations.length} registered.</h2></div><div className="admin-list-actions"><button type="button" onClick={loadRegistrations}>Refresh</button>{selectedIds.length === 4 && <button className="bulk-pass-button" type="button" onClick={downloadGroupPass}>Print 4 passes</button>}</div></div><label className="admin-search">Search students<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pass, name, email, college, or event" /></label><div className="registration-table"><div className="registration-table-row registration-table-head"><span>Select</span><span>Pass</span><span>Student</span><span>Event</span><span>Action</span></div>{studentRows}</div></section></section>{pass && <section className="student-pass" aria-label="Printable student pass"><div className="pass-kicker">Zen-it-trix 2.0 // Student pass</div><h2>{pass.passCode}</h2><p className="pass-name">{pass.fullName}</p><p>{pass.college}</p><p>{pass.eventName}</p><img src={pass.barcodeUrl} alt={`Barcode for ${pass.passCode}`} /><small>Present this pass at check-in</small></section>}</main>
}

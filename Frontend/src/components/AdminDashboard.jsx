import { useEffect, useState } from 'react'
import { getEventConfig, getFilteredEvents, nonTechnicalEvents, technicalEvents, yearsOfStudy } from '../data'
import { zenLogo } from '../assets/logoDataUrl'
import CollegeSelector from './CollegeSelector'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const emptyForm = { fullName: '', email: '', phone: '', college: '', yearOfStudy: '1st Year', technicalEvent: '', nonTechnicalEvent: '', teamName: '', teamSize: '2' }
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const passStyles = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap');@page{size:A4 portrait;margin:8mm}*{box-sizing:border-box}html,body{margin:0}body{width:194mm;min-height:281mm;padding:0;display:grid;grid-template-columns:repeat(2,1fr);grid-auto-rows:136mm;gap:5mm;align-content:start;background:#100c1d;color:#f6f2e9;font-family:'Space Grotesk',sans-serif;background-image:linear-gradient(rgba(246,242,233,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(246,242,233,.08) 1px,transparent 1px);background-size:9mm 9mm;print-color-adjust:exact;-webkit-print-color-adjust:exact}.pass{position:relative;width:auto;height:136mm;overflow:hidden;padding:8mm 7mm 6mm;border:1px solid rgba(246,242,233,.35);background:linear-gradient(145deg,#171127,#0d0a17);box-shadow:3mm 3mm 0 rgba(213,255,75,.16);break-inside:avoid;print-color-adjust:exact;-webkit-print-color-adjust:exact}.pass:before{content:'';position:absolute;top:0;right:0;width:32mm;height:32mm;background:#ff4f9a;clip-path:polygon(100% 0,100% 100%,0 0);opacity:.85}.pass-header{display:flex;align-items:center;gap:3mm;position:relative;z-index:2}.pass-logo{width:13mm;height:13mm;border-radius:50%;object-fit:contain;flex-shrink:0}.kicker,.small,.meta{font:8pt 'DM Mono',monospace;text-transform:uppercase;letter-spacing:.08em}.kicker{color:#a7a0b7}.sub-kicker{font:7pt 'DM Mono',monospace;color:#d5ff4b;text-transform:uppercase;letter-spacing:.08em}.code{position:relative;margin:5mm 0 3mm;color:#d5ff4b;font:500 23pt 'DM Mono',monospace;letter-spacing:-.06em}.name{margin:0;font-size:16pt;font-weight:700;letter-spacing:-.05em;overflow-wrap:anywhere}.meta{margin:2mm 0;color:#a7a0b7;line-height:1.4}.event{display:inline-block;margin:3mm 0 2mm;padding:1.5mm 3mm;background:#d5ff4b;color:#100c1d;font:500 8pt 'DM Mono',monospace;text-transform:uppercase}.pass img.barcode{display:block;width:100%;max-height:28mm;object-fit:contain;margin:5mm 0 3mm;padding:2mm;background:#f6f2e9;position:relative;z-index:2}.small{color:#a7a0b7}@media print{body{width:194mm;min-height:281mm}}`

async function parse(response) {
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Request failed.')
    return data
}

export default function AdminDashboard() {
    const [token, setToken] = useState(() => sessionStorage.getItem('zen-admin-token') || '')
    const [credentials, setCredentials] = useState({ username: '', password: '' })
    const [registrations, setRegistrations] = useState([])
    const [registrationType, setRegistrationType] = useState('individual')
    const [form, setForm] = useState(emptyForm)
    const [memberNames, setMemberNames] = useState(['', '', '', ''])
    const [formKey, setFormKey] = useState(0)
    const [search, setSearch] = useState('')
    const [selectedIds, setSelectedIds] = useState([])
    const [status, setStatus] = useState({ type: '', message: '' })
    const [isLoading, setIsLoading] = useState(false)

    const isTeam = registrationType === 'team'
    const techConfig = getEventConfig(form.technicalEvent)
    const nonTechConfig = getEventConfig(form.nonTechnicalEvent)
    const isStrictTeam = Boolean((techConfig && techConfig.type === 'team' && !techConfig.team_and_individual) || (nonTechConfig && nonTechConfig.type === 'team' && !nonTechConfig.team_and_individual))
    const isStrictIndividual = Boolean((techConfig && techConfig.type === 'individual' && !techConfig.team_and_individual) || (nonTechConfig && nonTechConfig.type === 'individual' && !nonTechConfig.team_and_individual))
    const availableTechEvents = getFilteredEvents(technicalEvents, registrationType)
    const availableNonTechEvents = getFilteredEvents(nonTechnicalEvents, registrationType)

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

    const handleTechnicalChange = (event) => {
        const selectedName = event.target.value
        const config = getEventConfig(selectedName)
        setForm((current) => {
            const next = { ...current, technicalEvent: selectedName }
            if (config?.type === 'team' && !config.team_and_individual) {
                setRegistrationType('team')
                next.teamSize = config.defaultTeamSize ? String(config.defaultTeamSize) : (Number(current.teamSize) >= 2 ? current.teamSize : '2')
            }
            return next
        })
    }

    const handleNonTechnicalChange = (event) => {
        const selectedName = event.target.value
        const config = getEventConfig(selectedName)
        setForm((current) => {
            const next = { ...current, nonTechnicalEvent: selectedName }
            if (config?.type === 'team' && !config.team_and_individual) {
                setRegistrationType('team')
                next.teamSize = config.defaultTeamSize ? String(config.defaultTeamSize) : (Number(current.teamSize) >= 2 ? current.teamSize : '2')
            }
            return next
        })
    }

    const handleTypeToggle = (type) => {
        if (type === 'individual' && isStrictTeam) return
        if (type === 'team' && isStrictIndividual) return
        setRegistrationType(type)
        setForm((curr) => {
            const next = { ...curr }
            const tConfig = getEventConfig(curr.technicalEvent)
            const ntConfig = getEventConfig(curr.nonTechnicalEvent)
            const isTechValid = !tConfig || tConfig.team_and_individual || (type === 'team' && tConfig.type === 'team') || (type === 'individual' && tConfig.type === 'individual')
            const isNonTechValid = !ntConfig || ntConfig.team_and_individual || (type === 'team' && ntConfig.type === 'team') || (type === 'individual' && ntConfig.type === 'individual')
            if (!isTechValid) next.technicalEvent = ''
            if (!isNonTechValid) next.nonTechnicalEvent = ''
            if (type === 'team') {
                const activeConfig = getEventConfig(next.technicalEvent) || getEventConfig(next.nonTechnicalEvent)
                const size = activeConfig?.defaultTeamSize && activeConfig.defaultTeamSize >= 2
                    ? String(activeConfig.defaultTeamSize)
                    : (Number(curr.teamSize) >= 2 ? curr.teamSize : '2')
                next.teamSize = size
            } else {
                next.teamSize = '1'
            }
            return next
        })
    }

    const handleMemberNameChange = (index, value) => {
        setMemberNames((current) => {
            const next = [...current]
            next[index] = value
            return next
        })
    }

    const addStudent = async (event) => {
        event.preventDefault(); setIsLoading(true)
        const tech = form.technicalEvent.trim()
        const nonTech = form.nonTechnicalEvent.trim()
        if (!tech && !nonTech) {
            setStatus({ type: 'error', message: 'Please select at least one event (Technical or Non-Technical).' })
            setIsLoading(false)
            return
        }

        const teamSizeNum = isTeam ? Number(form.teamSize) : 1
        const teamMembers = isTeam
            ? [form.fullName.trim(), ...memberNames.slice(0, teamSizeNum - 1).map((m) => m.trim())]
            : []

        if (isTeam && !form.teamName.trim()) {
            setStatus({ type: 'error', message: 'Team name is required for team registrations.' })
            setIsLoading(false)
            return
        }

        const combinedEventName = [tech, nonTech].filter(Boolean).join(' + ')

        try {
            const payload = {
                fullName: form.fullName.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                college: form.college.trim(),
                yearOfStudy: form.yearOfStudy,
                eventName: combinedEventName,
                technicalEvent: tech || null,
                nonTechnicalEvent: nonTech || null,
                registrationType,
                teamName: isTeam ? form.teamName.trim() : null,
                teamSize: teamSizeNum,
                teamMembers,
            }
            const result = await request('/admin/registrations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
            setForm(emptyForm); setMemberNames(['', '', '', '']); setRegistrationType('individual'); setFormKey((k) => k + 1)
            setStatus({ type: 'success', message: `Registered successfully with pass ZEN${String(result.registrationId).padStart(3, '0')}.` })
            await loadRegistrations()
        } catch (error) { setStatus({ type: 'error', message: error.message }) } finally { setIsLoading(false) }
    }

    const exportReport = async () => {
        try {
            const response = await fetch(`${API_URL}/registrations/export`, { headers: { Authorization: `Bearer ${token}` } })
            if (!response.ok) throw new Error('Report export failed.')
            const link = document.createElement('a'); link.href = URL.createObjectURL(await response.blob()); link.download = 'zen-it-trix-attendance-report.csv'; link.click()
        } catch (error) { setStatus({ type: 'error', message: error.message }) }
    }

    const fetchBarcode = async (code) => {
        const response = await fetch(`${API_URL}/barcode/${encodeURIComponent(code)}`)
        if (!response.ok) throw new Error(`Barcode request for ${code} failed.`)
        const blob = await response.blob()
        return new Promise((resolve, reject) => {
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

    const printSelected = async (ids = selectedIds) => {
        if (!ids.length) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) { setStatus({ type: 'error', message: 'Please allow pop-ups to print passes.' }); return }
        printWindow.document.write('<p style="font-family:sans-serif;padding:24px">Preparing passes for each student and team member...</p>')
        try {
            const selected = registrations.filter((registration) => ids.includes(registration.id))
            await Promise.all(selected.map(markPresent))

            const passItems = []
            for (const reg of selected) {
                if (reg.registrationType === 'team' && reg.teamMembers && reg.teamMembers.length > 0) {
                    reg.teamMembers.forEach((memberName, idx) => {
                        passItems.push({
                            code: `${reg.passCode}-${idx + 1}`,
                            fullName: memberName,
                            college: reg.college,
                            yearOfStudy: reg.yearOfStudy,
                            eventName: reg.eventName,
                            isTeam: true,
                            teamName: reg.teamName,
                            memberIndex: idx + 1,
                            isLeader: idx === 0,
                            teamSize: reg.teamSize || reg.teamMembers.length,
                        })
                    })
                } else {
                    passItems.push({
                        code: reg.passCode,
                        fullName: reg.fullName,
                        college: reg.college,
                        yearOfStudy: reg.yearOfStudy,
                        eventName: reg.eventName,
                        isTeam: false,
                        teamName: null,
                        memberIndex: 1,
                        isLeader: false,
                    })
                }
            }

            const barcodes = await Promise.all(passItems.map((item) => fetchBarcode(item.code)))
            const cards = passItems.map((item, index) => `<article class="pass"><div class="pass-header"><img class="pass-logo" src="${zenLogo}" alt="Zen-it-trix Logo"><div><div class="kicker">Zen-it-trix 2.0 // Pass</div><div class="sub-kicker">${item.isTeam ? `Team: ${escapeHtml(item.teamName || 'Pass')} · Member ${item.memberIndex}${item.isLeader ? ' (Leader)' : ''}` : 'Student pass'}</div></div></div><div class="code">${escapeHtml(item.code)}</div><div class="name">${escapeHtml(item.fullName)}</div><div class="meta">${escapeHtml(item.college)} · ${escapeHtml(item.yearOfStudy || '')}</div><div class="event">${escapeHtml(item.eventName)}</div><img class="barcode" src="${barcodes[index]}" alt="Barcode for ${escapeHtml(item.code)}"><div class="small">${item.isTeam ? `Team: ${escapeHtml(item.teamName || '')} · Present this pass at check-in` : 'Present this pass at check-in'}</div></article>`).join('')
            printWindow.document.open(); printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Zen-it-trix passes (${passItems.length} passes)</title><link rel="icon" type="image/png" href="${zenLogo}"><style>${passStyles}</style></head><body>${cards}</body></html>`); printWindow.document.close()
            setTimeout(() => { printWindow.focus(); printWindow.print() }, 250)
        } catch (err) { printWindow.close(); setStatus({ type: 'error', message: 'Passes could not be prepared for printing: ' + err.message }) }
    }

    const toggle = (id) => setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id])
    const filtered = registrations.filter((registration) => [registration.passCode, registration.fullName, registration.email, registration.college, registration.eventName, registration.teamName || '', registration.yearOfStudy || ''].some((value) => value.toLowerCase().includes(search.toLowerCase())))
    const logout = () => { sessionStorage.removeItem('zen-admin-token'); setToken(''); setRegistrations([]) }

    if (!token) return <main className="admin-page"><section className="admin-login"><p className="eyebrow">Restricted // Admin desk</p><h1>Enter the <em>control room.</em></h1><p>Manage registrations and issue student passes.</p><form onSubmit={login}><label>Username<input value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} required /></label><label>Password<input type="password" value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} required /></label>{status.message && <p className="admin-status error">{status.message}</p>}<button className="registration-submit">Open admin desk <span>↗</span></button></form></section></main>

    return <main className="admin-page"><header className="admin-header"><div><p className="eyebrow">Zen-it-trix 2.0 // Admin desk</p><h1>Registration <em>control.</em></h1></div><div className="admin-actions"><button type="button" onClick={exportReport}>Generate report</button><button type="button" onClick={logout}>Sign out</button></div></header><section className="admin-layout"><section className="admin-panel"><p className="track-label">01 / On-spot registration</p><h2>Add a student or team.</h2><div className="registration-type-toggle" role="group" aria-label="Registration type"><button type="button" className={!isTeam ? 'active' : ''} onClick={() => handleTypeToggle('individual')} disabled={isStrictTeam}><span>👤</span> Individual</button><button type="button" className={isTeam ? 'active' : ''} onClick={() => handleTypeToggle('team')} disabled={isStrictIndividual}><span>👥</span> Team {isStrictTeam && '(Req)'}</button></div><form onSubmit={addStudent}><label>{isTeam ? 'Team leader full name' : 'Full name'}<input name="fullName" value={form.fullName} onChange={updateField} required /></label><div className="registration-fields"><label>Email<input name="email" type="email" value={form.email} onChange={updateField} required /></label><label>Phone<input name="phone" value={form.phone} onChange={updateField} required /></label></div><CollegeSelector key={formKey} value={form.college} onChange={(college) => setForm((curr) => ({ ...curr, college }))} disabled={isLoading} /><div className="registration-fields"><label>Year of study<select name="yearOfStudy" value={form.yearOfStudy} onChange={updateField} required>{yearsOfStudy.map((year) => <option key={year} value={year}>{year}</option>)}</select></label></div><div className="event-selection-box"><div className="event-selection-box-header"><span className="event-box-title">Events (Pick up to 2 events)</span><span className="event-box-badge">1 Tech + 1 Non-Tech</span></div><p className="event-box-note">Each student can participate in 1 Technical event and/or 1 Non-Technical event (at least 1 required).</p><div className="registration-fields"><label>Technical event {form.technicalEvent && '✓'}<select name="technicalEvent" value={form.technicalEvent} onChange={handleTechnicalChange}><option value="">-- No technical event --</option>{availableTechEvents.map((event) => <option key={event.name} value={event.name}>{event.name} {event.team_and_individual ? '(Solo & Team)' : (event.type === 'team' ? '(Team)' : '')}</option>)}</select></label><label>Non-technical event {form.nonTechnicalEvent && '✓'}<select name="nonTechnicalEvent" value={form.nonTechnicalEvent} onChange={handleNonTechnicalChange}><option value="">-- No non-technical event --</option>{availableNonTechEvents.map((event) => <option key={event.name} value={event.name}>{event.name} {event.team_and_individual ? '(Solo & Team)' : (event.type === 'team' ? '(Team)' : '')}</option>)}</select></label></div></div>{isTeam && <div className="team-details-section"><div className="team-section-header"><span className="team-badge">Team specifications</span><span className="team-lead-note">Leader: {form.fullName || 'Member 1'}</span></div><div className="registration-fields"><label>Team name<input name="teamName" placeholder="e.g. CyberKnights" value={form.teamName} onChange={updateField} required /></label><label>Team size (Max 5)<select name="teamSize" value={form.teamSize} onChange={updateField} required><option value="2">2 Members</option><option value="3">3 Members</option><option value="4">4 Members</option><option value="5">5 Members</option></select></label></div><div className="team-members-grid">{Array.from({ length: Number(form.teamSize) - 1 }).map((_, idx) => <label key={idx + 2}>Member {idx + 2} name<input type="text" placeholder={`Member ${idx + 2} name`} value={memberNames[idx] || ''} onChange={(e) => handleMemberNameChange(idx, e.target.value)} required /></label>)}</div></div>}{status.message && <p className={`admin-status ${status.type}`}>{status.message}</p>}<button className="registration-submit" disabled={isLoading}>{isLoading ? 'Saving...' : (isTeam ? 'Register team pass' : 'Register and assign pass')} <span>↗</span></button></form></section><section className="admin-panel admin-list"><div className="admin-list-heading"><div><p className="track-label">02 / Current registrations</p><h2>{filtered.length} of {registrations.length} registered.</h2></div><div className="admin-list-actions"><button type="button" onClick={loadRegistrations}>Refresh</button>{selectedIds.length > 0 && <button className="bulk-pass-button" type="button" onClick={() => printSelected()}>Print {selectedIds.length} passes</button>}</div></div><label className="admin-search">Search registrations<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pass, name, email, college, event, team..." /></label><div className="registration-table"><div className="registration-table-row registration-table-head"><span>Select</span><span>Pass</span><span>Student / Team</span><span>Event</span><span>Status</span><span>Action</span></div>{filtered.map((registration) => <div className="registration-table-row" key={registration.id}><input className="student-checkbox" type="checkbox" checked={selectedIds.includes(registration.id)} onChange={() => toggle(registration.id)} aria-label={`Select ${registration.fullName}`} /><strong>{registration.passCode}</strong><span><b>{registration.fullName}</b><small>{registration.college} · {registration.yearOfStudy}</small>{registration.registrationType === 'team' && <small style={{ color: 'var(--lime)', marginTop: '2px' }}>Team: {registration.teamName} ({registration.teamSize} members: {registration.teamMembersList})</small>}</span><span>{registration.eventName}</span><span className={`attendance-status ${registration.present ? 'present' : ''}`}>{registration.present ? 'Present' : 'Not present'}</span><button type="button" onClick={() => printSelected([registration.id])}>Print</button></div>)}</div></section></section></main>
}

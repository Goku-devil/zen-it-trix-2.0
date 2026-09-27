import { useState } from 'react'
import CollegeSelector from './CollegeSelector'
import {
    technicalEvents,
    nonTechnicalEvents,
    getEventConfig,
    getFilteredEvents,
    isTechnicalEvent,
    isNonTechnicalEvent,
    yearsOfStudy,
} from '../data'
import { zenLogo } from '../assets/logoDataUrl'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'
const escapeHtml = (value) => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const passStyles = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap');
@page { size: A4 portrait; margin: 8mm; }
* { box-sizing: border-box; }
html, body { margin: 0; }
body { width: 194mm; min-height: 281mm; padding: 0; display: grid; grid-template-columns: repeat(2, 1fr); grid-auto-rows: 136mm; gap: 5mm; align-content: start; background: #100c1d; color: #f6f2e9; font-family: 'Space Grotesk', sans-serif; background-image: linear-gradient(rgba(246,242,233,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(246,242,233,.08) 1px, transparent 1px); background-size: 9mm 9mm; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.pass { position: relative; width: auto; height: 136mm; overflow: hidden; padding: 8mm 7mm 6mm; border: 1px solid rgba(246,242,233,.35); background: linear-gradient(145deg,#171127,#0d0a17); box-shadow: 3mm 3mm 0 rgba(213,255,75,.16); break-inside: avoid; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
.pass:before { content: ''; position: absolute; top: 0; right: 0; width: 32mm; height: 32mm; background: #ff4f9a; clip-path: polygon(100% 0,100% 100%,0 0); opacity:.85; }
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

export default function RegistrationForm({ initialEvent = '', onClose }) {
    const isInitialTech = isTechnicalEvent(initialEvent)
    const isInitialNonTech = isNonTechnicalEvent(initialEvent)
    const initialTechEvent = isInitialTech ? initialEvent : ''
    const initialNonTechEvent = isInitialNonTech ? initialEvent : ''

    const initialConfig = getEventConfig(initialEvent)
    const initialType = (initialConfig?.type === 'team' && !initialConfig?.team_and_individual)
        ? 'team'
        : 'individual'
    const initialTeamSize = initialConfig?.defaultTeamSize && initialConfig.defaultTeamSize >= 2
        ? String(initialConfig.defaultTeamSize)
        : '2'

    const [registrationType, setRegistrationType] = useState(initialType)
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        phone: '',
        college: '',
        yearOfStudy: '1st Year',
        technicalEvent: initialTechEvent,
        nonTechnicalEvent: initialNonTechEvent,
        teamName: '',
        teamSize: initialType === 'team' ? initialTeamSize : '2',
    })
    const [memberNames, setMemberNames] = useState(['', '', '', ''])
    const [status, setStatus] = useState({ type: '', message: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formKey, setFormKey] = useState(0)
    const [confirmedRegistration, setConfirmedRegistration] = useState(null)

    const techConfig = getEventConfig(form.technicalEvent)
    const nonTechConfig = getEventConfig(form.nonTechnicalEvent)

    const isStrictTeam = Boolean(
        (techConfig && techConfig.type === 'team' && !techConfig.team_and_individual) ||
        (nonTechConfig && nonTechConfig.type === 'team' && !nonTechConfig.team_and_individual)
    )

    const isStrictIndividual = Boolean(
        (techConfig && techConfig.type === 'individual' && !techConfig.team_and_individual) ||
        (nonTechConfig && nonTechConfig.type === 'individual' && !nonTechConfig.team_and_individual)
    )

    const availableTechEvents = getFilteredEvents(technicalEvents, registrationType)
    const availableNonTechEvents = getFilteredEvents(nonTechnicalEvents, registrationType)

    const updateField = (event) => {
        const { name, value } = event.target
        setForm((current) => ({ ...current, [name]: value }))
    }

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

            const isTechValid = !tConfig || tConfig.team_and_individual ||
                (type === 'team' && tConfig.type === 'team') ||
                (type === 'individual' && tConfig.type === 'individual')

            const isNonTechValid = !ntConfig || ntConfig.team_and_individual ||
                (type === 'team' && ntConfig.type === 'team') ||
                (type === 'individual' && ntConfig.type === 'individual')

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

    const fetchBarcode = async (code) => {
        const res = await fetch(`${API_URL}/barcode/${encodeURIComponent(code)}`)
        if (!res.ok) throw new Error(`Barcode generation failed for ${code}`)
        const blob = await res.blob()
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result)
            reader.onerror = reject
            reader.readAsDataURL(blob)
        })
    }

    const printPasses = async (reg = confirmedRegistration) => {
        if (!reg) return
        const printWindow = window.open('', '_blank')
        if (!printWindow) {
            alert('Please allow pop-ups to print your passes.')
            return
        }
        printWindow.document.write('<p style="font-family:sans-serif;padding:24px">Preparing passes for each member...</p>')

        try {
            const passItems = []
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

            const barcodes = await Promise.all(passItems.map((item) => fetchBarcode(item.code)))

            const cards = passItems.map((item, index) => `
                <article class="pass">
                    <div class="pass-header">
                        <img class="pass-logo" src="${zenLogo}" alt="Zen-it-trix Logo">
                        <div>
                            <div class="kicker">Zen-it-trix 2.0 // Pass</div>
                            <div class="sub-kicker">${item.isTeam ? `Team: ${escapeHtml(item.teamName || 'Pass')} · Member ${item.memberIndex}${item.isLeader ? ' (Leader)' : ''}` : 'Student pass'}</div>
                        </div>
                    </div>
                    <div class="code">${escapeHtml(item.code)}</div>
                    <div class="name">${escapeHtml(item.fullName)}</div>
                    <div class="meta">${escapeHtml(item.college)} · ${escapeHtml(item.yearOfStudy || '')}</div>
                    <div class="event">${escapeHtml(item.eventName)}</div>
                    <img class="barcode" src="${barcodes[index]}" alt="Barcode for ${escapeHtml(item.code)}">
                    <div class="small">${item.isTeam ? `Team: ${escapeHtml(item.teamName || '')} · Present this pass at check-in` : 'Present this pass at check-in'}</div>
                </article>
            `).join('')

            printWindow.document.open()
            printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Zen-it-trix passes (${passItems.length} passes)</title><link rel="icon" type="image/png" href="${zenLogo}"><style>${passStyles}</style></head><body>${cards}</body></html>`)
            printWindow.document.close()
            setTimeout(() => { printWindow.focus(); printWindow.print() }, 250)
        } catch (err) {
            printWindow.close()
            alert('Could not prepare passes: ' + err.message)
        }
    }

    const handleSubmit = async (event) => {
        event.preventDefault()
        setIsSubmitting(true)
        setStatus({ type: '', message: '' })

        const tech = form.technicalEvent.trim()
        const nonTech = form.nonTechnicalEvent.trim()

        if (!tech && !nonTech) {
            setStatus({ type: 'error', message: 'Please select at least one event (Technical or Non-Technical).' })
            setIsSubmitting(false)
            return
        }

        const isTeam = registrationType === 'team'
        const teamSizeNum = isTeam ? Number(form.teamSize) : 1

        const teamMembers = isTeam
            ? [form.fullName.trim(), ...memberNames.slice(0, teamSizeNum - 1).map((m) => m.trim())]
            : []

        if (isTeam && !form.teamName.trim()) {
            setStatus({ type: 'error', message: 'Please enter a team name.' })
            setIsSubmitting(false)
            return
        }

        if (isTeam) {
            const missingMember = teamMembers.findIndex((m) => !m)
            if (missingMember !== -1) {
                setStatus({
                    type: 'error',
                    message: missingMember === 0
                        ? 'Please enter the team leader name.'
                        : `Please enter the name for Member ${missingMember + 1}.`,
                })
                setIsSubmitting(false)
                return
            }
        }

        const combinedEventName = [tech, nonTech].filter(Boolean).join(' + ')

        try {
            const response = await fetch(`${API_URL}/registrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
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
                }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || 'Registration could not be completed.')

            const passIdStr = result.passCode || `ZEN${String(result.registrationId).padStart(3, '0')}`
            const fullRegData = {
                ...result,
                passCode: passIdStr,
                fullName: form.fullName.trim(),
                college: form.college.trim(),
                yearOfStudy: form.yearOfStudy,
                eventName: combinedEventName,
                registrationType,
                teamName: isTeam ? form.teamName.trim() : null,
                teamMembers: isTeam ? teamMembers : [form.fullName.trim()],
            }

            setConfirmedRegistration(fullRegData)
            setStatus({
                type: 'success',
                message: isTeam
                    ? `Registration confirmed for Team "${form.teamName.trim()}"! Passes issued for all ${teamMembers.length} members.`
                    : `Registration confirmed for ${form.fullName.trim()}! Pass issued.`,
            })

            setForm({
                fullName: '',
                email: '',
                phone: '',
                college: '',
                yearOfStudy: '1st Year',
                technicalEvent: '',
                nonTechnicalEvent: '',
                teamName: '',
                teamSize: '2',
            })
            setMemberNames(['', '', '', ''])
            setRegistrationType('individual')
            setFormKey((k) => k + 1)
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setIsSubmitting(false)
        }
    }

    const isTeam = registrationType === 'team'

    return (
        <div className="registration-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
            <section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
                <button className="registration-close" type="button" onClick={onClose} aria-label="Close registration form">×</button>
                <p className="eyebrow">Registration // Zen-it-trix 2.0</p>
                <h2 id="registration-title">Save your <em>spot.</em></h2>
                <p className="registration-intro">Bring your curiosity, choose your arena, and we will see you on campus.</p>

                {confirmedRegistration ? (
                    <div className="registration-success-card">
                        <div className="success-header">
                            <span className="success-badge">✓ Registration Confirmed</span>
                            <h3>{confirmedRegistration.registrationType === 'team' ? `Team: ${confirmedRegistration.teamName}` : confirmedRegistration.fullName}</h3>
                            <p className="success-event-name">{confirmedRegistration.eventName}</p>
                        </div>

                        <div className="success-pass-list">
                            <span className="pass-list-heading">
                                {confirmedRegistration.registrationType === 'team'
                                    ? `Official passes for each team member (${confirmedRegistration.teamMembers.length} passes):`
                                    : 'Official student pass:'}
                            </span>
                            <div className="pass-badges-grid">
                                {confirmedRegistration.teamMembers.map((name, idx) => {
                                    const code = confirmedRegistration.registrationType === 'team'
                                        ? `${confirmedRegistration.passCode}-${idx + 1}`
                                        : confirmedRegistration.passCode
                                    return (
                                        <div className="pass-pill-item" key={code}>
                                            <span className="pass-code-tag">{code}</span>
                                            <span className="pass-member-name">
                                                {name} {idx === 0 && confirmedRegistration.registrationType === 'team' ? '(Leader)' : ''}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="success-actions">
                            <button
                                type="button"
                                className="registration-submit print-passes-button"
                                onClick={() => printPasses(confirmedRegistration)}
                            >
                                <span>🖨️ Print passes for each member ({confirmedRegistration.teamMembers.length})</span>
                                <span>↗</span>
                            </button>
                            <button
                                type="button"
                                className="register-another-button"
                                onClick={() => {
                                    setConfirmedRegistration(null)
                                    setStatus({ type: '', message: '' })
                                }}
                            >
                                Register another student or team
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="registration-type-toggle" role="group" aria-label="Registration type">
                            <button
                                type="button"
                                className={!isTeam ? 'active' : ''}
                                onClick={() => handleTypeToggle('individual')}
                                disabled={isStrictTeam}
                                title={isStrictTeam ? 'This event requires a team registration' : 'Individual registration'}
                            >
                                <span>👤</span> Individual
                            </button>
                            <button
                                type="button"
                                className={isTeam ? 'active' : ''}
                                onClick={() => handleTypeToggle('team')}
                                disabled={isStrictIndividual}
                                title={isStrictIndividual ? 'This event is strictly for individuals' : 'Team registration'}
                            >
                                <span>👥</span> Team {isStrictTeam && '(Required)'}
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <label>
                                {isTeam ? 'Team leader full name' : 'Full name'}
                                <input
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={updateField}
                                    required
                                    autoComplete="name"
                                    placeholder={isTeam ? 'Leader name' : 'Your name'}
                                />
                            </label>

                            <div className="registration-fields">
                                <label>
                                    Email
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={updateField}
                                        required
                                        autoComplete="email"
                                        placeholder={isTeam ? 'Leader email' : 'Your email'}
                                    />
                                </label>
                                <label>
                                    Phone
                                    <input
                                        name="phone"
                                        type="tel"
                                        value={form.phone}
                                        onChange={updateField}
                                        required
                                        autoComplete="tel"
                                        placeholder="10-digit number"
                                    />
                                </label>
                            </div>

                            <CollegeSelector
                                key={formKey}
                                value={form.college}
                                onChange={(college) => setForm((curr) => ({ ...curr, college }))}
                                disabled={isSubmitting}
                            />

                            <div className="registration-fields">
                                <label>
                                    Year of study
                                    <select
                                        name="yearOfStudy"
                                        value={form.yearOfStudy}
                                        onChange={updateField}
                                        required
                                    >
                                        {yearsOfStudy.map((year) => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </label>
                            </div>

                            <div className="event-selection-box">
                                <div className="event-selection-box-header">
                                    <span className="event-box-title">Events (Pick up to 2 events)</span>
                                    <span className="event-box-badge">1 Tech + 1 Non-Tech</span>
                                </div>
                                <p className="event-box-note">
                                    Each student can participate in 1 Technical event and/or 1 Non-Technical event (at least 1 required).
                                </p>

                                <div className="registration-fields">
                                    <label>
                                        Technical event {form.technicalEvent && <span className="selected-indicator">✓ Selected</span>}
                                        <select
                                            name="technicalEvent"
                                            value={form.technicalEvent}
                                            onChange={handleTechnicalChange}
                                        >
                                            <option value="">-- No technical event --</option>
                                            {availableTechEvents.map((event) => (
                                                <option key={event.name} value={event.name}>
                                                    {event.name} {event.team_and_individual ? '(Solo & Team)' : (event.type === 'team' ? '(Team)' : '')}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label>
                                        Non-technical event {form.nonTechnicalEvent && <span className="selected-indicator">✓ Selected</span>}
                                        <select
                                            name="nonTechnicalEvent"
                                            value={form.nonTechnicalEvent}
                                            onChange={handleNonTechnicalChange}
                                        >
                                            <option value="">-- No non-technical event --</option>
                                            {availableNonTechEvents.map((event) => (
                                                <option key={event.name} value={event.name}>
                                                    {event.name} {event.team_and_individual ? '(Solo & Team)' : (event.type === 'team' ? '(Team)' : '')}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                            </div>

                            {isTeam && (
                                <div className="team-details-section">
                                    <div className="team-section-header">
                                        <span className="team-badge">Team specifications</span>
                                        <span className="team-lead-note">Member 1: {form.fullName ? form.fullName : 'Team Leader'}</span>
                                    </div>

                                    <div className="registration-fields">
                                        <label>
                                            Team name
                                            <input
                                                name="teamName"
                                                placeholder="e.g. CodeStorm"
                                                value={form.teamName}
                                                onChange={updateField}
                                                required
                                            />
                                        </label>

                                        <label>
                                            Number of team members (Max 5)
                                            <select
                                                name="teamSize"
                                                value={form.teamSize}
                                                onChange={updateField}
                                                required
                                            >
                                                <option value="2">2 Members</option>
                                                <option value="3">3 Members</option>
                                                <option value="4">4 Members</option>
                                                <option value="5">5 Members</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className="team-members-grid">
                                        {Array.from({ length: Number(form.teamSize) - 1 }).map((_, idx) => {
                                            const memberNum = idx + 2
                                            return (
                                                <label key={memberNum}>
                                                    Member {memberNum} full name
                                                    <input
                                                        type="text"
                                                        placeholder={`Member ${memberNum} name`}
                                                        value={memberNames[idx] || ''}
                                                        onChange={(e) => handleMemberNameChange(idx, e.target.value)}
                                                        required
                                                    />
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {status.message && <p className={`registration-status ${status.type}`}>{status.message}</p>}
                            <button className="registration-submit" type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending...' : (isTeam ? 'Register team' : 'Complete registration')} <span>↗</span>
                            </button>
                        </form>
                    </>
                )}
            </section>
        </div>
    )
}

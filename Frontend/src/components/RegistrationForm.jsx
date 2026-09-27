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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

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

    // Filter available events for current mode
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

            const passIdStr = `ZEN${String(result.registrationId).padStart(3, '0')}`
            const refMessage = isTeam && result.teamName
                ? `Registration confirmed for Team "${result.teamName}" in ${combinedEventName}! Pass code: ${passIdStr}.`
                : `Registration confirmed for ${combinedEventName}! Pass code: ${passIdStr}.`

            setStatus({ type: 'success', message: refMessage })
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
            </section>
        </div>
    )
}

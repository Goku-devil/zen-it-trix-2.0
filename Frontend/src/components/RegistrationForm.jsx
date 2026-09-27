import { useState } from 'react'
import CollegeSelector from './CollegeSelector'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export default function RegistrationForm({ initialEvent = '', events, onClose }) {
    const [form, setForm] = useState({ fullName: '', email: '', phone: '', college: '', eventName: initialEvent, teamSize: '1' })
    const [status, setStatus] = useState({ type: '', message: '' })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formKey, setFormKey] = useState(0)

    const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

    const handleSubmit = async (event) => {
        event.preventDefault()
        setIsSubmitting(true)
        setStatus({ type: '', message: '' })

        try {
            const response = await fetch(`${API_URL}/registrations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, teamSize: Number(form.teamSize) }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.message || 'Registration could not be completed.')
            setStatus({ type: 'success', message: `Registration confirmed. Your reference is ${result.registrationId}.` })
            setForm({ fullName: '', email: '', phone: '', college: '', eventName: '', teamSize: '1' })
            setFormKey((k) => k + 1)
        } catch (error) {
            setStatus({ type: 'error', message: error.message })
        } finally {
            setIsSubmitting(false)
        }
    }

    return <div className="registration-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
        <section className="registration-modal" role="dialog" aria-modal="true" aria-labelledby="registration-title">
            <button className="registration-close" type="button" onClick={onClose} aria-label="Close registration form">×</button>
            <p className="eyebrow">Registration // Zen-it-trix 2.0</p>
            <h2 id="registration-title">Save your <em>spot.</em></h2>
            <p className="registration-intro">Bring your curiosity, choose your arena, and we will see you on campus.</p>
            <form onSubmit={handleSubmit}>
                <label>Full name<input name="fullName" value={form.fullName} onChange={updateField} required autoComplete="name" /></label>
                <div className="registration-fields">
                    <label>Email<input name="email" type="email" value={form.email} onChange={updateField} required autoComplete="email" /></label>
                    <label>Phone<input name="phone" type="tel" value={form.phone} onChange={updateField} required autoComplete="tel" /></label>
                </div>
                <CollegeSelector
                    key={formKey}
                    value={form.college}
                    onChange={(college) => setForm((curr) => ({ ...curr, college }))}
                    disabled={isSubmitting}
                />
                <div className="registration-fields">
                    <label>Event<select name="eventName" value={form.eventName} onChange={updateField} required><option value="">Choose an event</option>{events.map((event) => <option key={event.name} value={event.name}>{event.name}</option>)}</select></label>
                    <label>Team size<input name="teamSize" type="number" min="1" max="10" value={form.teamSize} onChange={updateField} required /></label>
                </div>
                {status.message && <p className={`registration-status ${status.type}`}>{status.message}</p>}
                <button className="registration-submit" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending...' : 'Complete registration'} <span>↗</span></button>
            </form>
        </section>
    </div>
}

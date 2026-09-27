import { useState } from 'react'

export default function EventCard({ event, onRegister }) {
    const [showDetails, setShowDetails] = useState(false)

    const isBoth = Boolean(event.team_and_individual)
    const isTeam = event.type === 'team'

    const formatBadgeText = isBoth
        ? 'Solo / Team'
        : (isTeam ? 'Team Only' : 'Individual')

    const badgeModifier = isBoth
        ? 'badge-both'
        : (isTeam ? 'badge-team' : 'badge-solo')

    return (
        <article className={`event-card ${event.color || 'blue'} ${showDetails ? 'details-expanded' : ''}`}>
            <div className="event-topline">
                <div className="event-number-tag">
                    <span className="event-number">// {event.number}</span>
                    <span className={`event-badge ${badgeModifier}`}>
                        {formatBadgeText}
                    </span>
                </div>
                <span className="event-format">{event.meta}</span>
            </div>

            <h3 className="event-title">{event.name}</h3>
            <p className="event-description">{event.description}</p>

            <div className="event-pill-row">
                <span className="event-pill" title="Event Venue">
                    <span className="pill-icon">📍</span>
                    <span>{event.venue}</span>
                </span>
                <span className="event-pill" title="Faculty/Student In-Charge">
                    <span className="pill-icon">👤</span>
                    <span>{event.inCharge}</span>
                </span>
            </div>

            <div className="event-drawer-wrap">
                <button
                    type="button"
                    className="event-toggle-drawer"
                    onClick={() => setShowDetails((prev) => !prev)}
                    aria-expanded={showDetails}
                >
                    <span>{showDetails ? 'Hide guidelines & info' : 'View guidelines & info'}</span>
                    <span className={`drawer-icon ${showDetails ? 'open' : ''}`}>▾</span>
                </button>

                {showDetails && (
                    <div className="event-drawer-content">
                        {event.rules && event.rules.length > 0 && (
                            <div className="event-rules-block">
                                <span className="drawer-label">Guidelines</span>
                                <ul>
                                    {event.rules.map((rule, idx) => (
                                        <li key={idx}>{rule}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <div className="event-contact-block">
                            <span className="drawer-label">Coordinator</span>
                            <div className="coord-contact-row">
                                <a href={`tel:${event.phone}`} className="coord-link">
                                    📞 {event.phone}
                                </a>
                                <a href={`mailto:${event.contact}`} className="coord-link">
                                    ✉️ {event.contact}
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="event-action-footer">
                <button
                    className="event-register-button"
                    type="button"
                    onClick={() => onRegister(event.name)}
                >
                    <span>Register for event</span>
                    <span className="btn-arrow" aria-hidden="true">↗</span>
                </button>
            </div>
        </article>
    )
}

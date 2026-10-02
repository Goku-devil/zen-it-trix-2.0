import { useState } from 'react'
import { whatsappGroupLink } from '../data'

export default function EventCard({ event, onRegister }) {
    const [isFlipped, setIsFlipped] = useState(false)

    const isBoth = Boolean(event.team_and_individual)
    const isTeam = event.type === 'team'

    const formatBadgeText = isBoth
        ? 'Solo / Team'
        : (isTeam ? 'Team Only' : 'Individual')

    const badgeModifier = isBoth
        ? 'badge-both'
        : (isTeam ? 'badge-team' : 'badge-solo')

    const communityLink = event.whatsapp || whatsappGroupLink

    return (
        <article className={`event-card ${event.color || 'blue'} ${isFlipped ? 'is-flipped' : ''}`}>
            <div className="event-card-inner">
                {/* FRONT FACE */}
                <div className="event-card-face event-card-front">
                    <div className="event-topline">
                        <div className="event-number-tag">
                            <span className="event-number">// {event.number}</span>
                            <span className={`event-badge ${badgeModifier}`}>
                                {formatBadgeText}
                            </span>
                        </div>
                        <span className="event-format">{event.meta}</span>
                    </div>

                    <div className="event-front-content">
                        <h3 className="event-title">{event.name}</h3>
                        <p className="event-description">{event.description}</p>

                        <div className="event-pill-row">
                            <span className="event-pill" title="Event Venue">
                                <span className="pill-icon">Venue:</span>
                                <span>{event.venue}</span>
                            </span>
                            <span className="event-pill" title="Faculty/Student In-Charge">
                                <span className="pill-icon">Lead:</span>
                                <span>{event.inCharge}</span>
                            </span>
                        </div>

                        {event.rules && event.rules.length > 0 && (
                            <div className="event-intel-box">
                                <div className="intel-top">
                                    <span className="intel-label">// KEY HIGHLIGHTS</span>
                                    <span className="intel-perk-tag">🏆 PRIZES & CERTIFICATES</span>
                                </div>
                                <ul className="intel-rules-list">
                                    {event.rules.slice(0, 2).map((rule, idx) => (
                                        <li key={idx}>
                                            <span className="intel-bullet">▸</span>
                                            <span>{rule}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <a
                            href={communityLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="event-community-btn"
                            onClick={(e) => e.stopPropagation()}
                            title="Join Zen-It-Trix WhatsApp Community"
                        >
                            <div className="community-btn-main">
                                <span className="community-icon-dot"></span>
                                <span className="community-btn-text">Join Community</span>
                            </div>
                            <span className="community-btn-badge">
                                <span>Group</span>
                                <span className="community-btn-arrow" aria-hidden="true">↗</span>
                            </span>
                        </a>
                    </div>

                    <div className="event-action-footer">
                        <button
                            type="button"
                            className="event-flip-button"
                            onClick={() => setIsFlipped(true)}
                            aria-label={`View full guidelines for ${event.name}`}
                        >
                            <span className="flip-icon-left" aria-hidden="true">↻</span>
                            <span>Full Guidelines</span>
                        </button>
                        <button
                            className="event-register-button"
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRegister(event.name)
                            }}
                        >
                            <span>Register</span>
                            <span className="btn-arrow" aria-hidden="true">↗</span>
                        </button>
                    </div>
                </div>

                {/* BACK FACE */}
                <div className="event-card-face event-card-back">
                    <div className="event-topline">
                        <div className="event-number-tag">
                            <span className="event-number">// {event.number}</span>
                            <span className="event-badge badge-rules">GUIDELINES</span>
                        </div>
                        <button
                            type="button"
                            className="event-flip-badge-btn unflip"
                            onClick={() => setIsFlipped(false)}
                            title="Flip back to overview"
                            aria-label={`Return to overview of ${event.name}`}
                        >
                            <span>Overview</span>
                            <span className="flip-icon" aria-hidden="true">↺</span>
                        </button>
                    </div>

                    <div className="event-card-back-body">
                        <div className="event-back-header">
                            <h4 className="event-back-title">{event.name}</h4>
                            <span className="event-back-format">{event.meta}</span>
                        </div>

                        {event.rules && event.rules.length > 0 && (
                            <div className="event-rules-block">
                                <span className="drawer-label">Rules & Regulations</span>
                                <ul className="event-rules-list">
                                    {event.rules.map((rule, idx) => (
                                        <li key={idx}>{rule}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="event-contact-block">
                            <span className="drawer-label">Coordinator & Venue</span>
                            <div className="coord-details-grid">
                                <div className="coord-detail-item">
                                    <span className="coord-label">Lead</span>
                                    <span className="coord-value">{event.inCharge}</span>
                                </div>
                                <div className="coord-detail-item">
                                    <span className="coord-label">Venue</span>
                                    <span className="coord-value">{event.venue}</span>
                                </div>
                                <div className="coord-detail-item">
                                    <span className="coord-label">Phone</span>
                                    <a
                                        href={`tel:${event.phone}`}
                                        className="coord-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {event.phone}
                                    </a>
                                </div>
                                <div className="coord-detail-item">
                                    <span className="coord-label">Email</span>
                                    <a
                                        href={`mailto:${event.contact}`}
                                        className="coord-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {event.contact}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="event-action-footer">
                        <button
                            type="button"
                            className="event-flip-button"
                            onClick={() => setIsFlipped(false)}
                            aria-label={`Return to overview of ${event.name}`}
                        >
                            <span className="flip-icon-left" aria-hidden="true">↺</span>
                            <span>Overview</span>
                        </button>
                        <button
                            className="event-register-button"
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                onRegister(event.name)
                            }}
                        >
                            <span>Register</span>
                            <span className="btn-arrow" aria-hidden="true">↗</span>
                        </button>
                    </div>
                </div>
            </div>
        </article>
    )
}

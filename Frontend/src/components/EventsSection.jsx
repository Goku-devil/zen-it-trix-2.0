import { useState } from 'react'
import EventCard from './EventCard'

function Track({ label, description, events, className, onRegister }) {
    const gridClassName = events.length > 4 ? 'event-grid two-column' : 'event-grid'

    return (
        <div className={`track-column ${className}`}>
            <div className="track-heading">
                <span className="track-label">{label}</span>
                <span className="track-arrow">↗</span>
            </div>
            <p className="track-description">{description}</p>
            <div className={gridClassName}>
                {events.map((event, index) => (
                    <EventCard key={`${event.name}-${event.number}-${index}`} event={event} onRegister={onRegister} />
                ))}
            </div>
        </div>
    )
}

export default function EventsSection({ technicalEvents, nonTechnicalEvents, onRegister }) {
    const [activeTrack, setActiveTrack] = useState('technical')
    const isTechnical = activeTrack === 'technical'

    return (
        <section className="events-section" id="events">
            <div className="section-heading">
                <p className="eyebrow">Choose your arena</p>
                <h2>
                    Two ways to<br /><em>show up.</em>
                </h2>
                <div className="event-toggle" role="tablist" aria-label="Choose event type">
                    <button
                        className={isTechnical ? 'active' : ''}
                        type="button"
                        role="tab"
                        aria-selected={isTechnical}
                        onClick={() => setActiveTrack('technical')}
                    >
                        Technical
                    </button>
                    <button
                        className={!isTechnical ? 'active' : ''}
                        type="button"
                        role="tab"
                        aria-selected={!isTechnical}
                        onClick={() => setActiveTrack('non-technical')}
                    >
                        Non-technical
                    </button>
                </div>
            </div>
            {isTechnical ? (
                <Track
                    key={activeTrack}
                    className="technical"
                    label="01 / Technical"
                    description="For the curious, the precise, and the ones who see a problem and think: I can fix that."
                    events={technicalEvents}
                    onRegister={onRegister}
                />
            ) : (
                <Track
                    key={activeTrack}
                    className="non-technical"
                    label="02 / Non-technical"
                    description="For the loud laughs, friendly rivalries, and people who bring the fun wherever they go."
                    events={nonTechnicalEvents}
                    onRegister={onRegister}
                />
            )}
        </section>
    )
}

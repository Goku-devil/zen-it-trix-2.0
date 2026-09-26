function ContactPanel({ label, title, events, className }) {
    const contacts = events.filter((event, index, list) => list.findIndex((item) => item.contact === event.contact) === index)

    return (
        <div className={`contact-panel ${className}`}>
            <p className="track-label">{label}</p>
            <h3>{title}</h3>
            <p className="contact-panel-copy">
                Questions about registration, rules, or your event? Reach the coordinator directly.
            </p>
            <div className="contact-list">
                {contacts.map((event) => (
                    <div className="contact-row" key={event.contact}>
                        <div>
                            <span>{event.name}</span>
                            <strong>{event.inCharge}</strong>
                        </div>
                        <a href={`mailto:${event.contact}`}>{event.contact}</a>
                        <a href={`tel:${event.phone}`} aria-label={`Call ${event.inCharge}`}>
                            {event.phone}
                        </a>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default function ContactSection({ technicalEvents, nonTechnicalEvents }) {
    return (
        <section className="contact-section" id="contact">
            <div className="contact-heading">
                <p className="eyebrow">Need a hand?</p>
                <h2>
                    Talk to the<br /><em>right people.</em>
                </h2>
            </div>
            <div className="contact-panels">
                <ContactPanel
                    className="technical"
                    label="01 / Technical events"
                    title="Build something great."
                    events={technicalEvents}
                />
                <ContactPanel
                    className="non-technical"
                    label="02 / Non-technical events"
                    title="Bring the energy."
                    events={nonTechnicalEvents}
                />
            </div>
        </section>
    )
}

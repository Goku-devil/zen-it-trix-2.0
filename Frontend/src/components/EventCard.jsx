export default function EventCard({ event, onRegister }) {
    return (
        <article className={`event-card ${event.color}`}>
            <div className="event-topline">
                <span className="event-number">{event.number}</span>
                <span className="event-format">{event.meta}</span>
            </div>
            <h3>{event.name}</h3>
            <p>{event.description}</p>
            <div className="event-details">
                <p>
                    <span>In-charge</span>
                    <strong>{event.inCharge}</strong>
                </p>
                <p>
                    <span>Contact no.</span>
                    <a href={`tel:${event.phone}`}>{event.phone}</a>
                </p>
                <p>
                    <span>Venue</span>
                    <strong>{event.venue}</strong>
                </p>
                <div>
                    <span>Rules</span>
                    <ul>
                        {event.rules.map((rule) => <li key={rule}>{rule}</li>)}
                    </ul>
                </div>
            </div>
            <button className="event-register-button" type="button" onClick={() => onRegister(event.name)}>
                Register now <span aria-hidden="true">↗</span>
            </button>
            <a className="contact-link" href={`mailto:${event.contact}`}>
                Contact coordinator <span aria-hidden="true">↗</span>
            </a>
            <span className="contact-email">{event.contact}</span>
        </article>
    )
}

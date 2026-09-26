export default function Schedule({ items }) {
    return (
        <section className="schedule-section" id="schedule">
            <div className="schedule-title">
                <p className="eyebrow">The day, mapped out</p>
                <h2>
                    Save the<br /><em>moments.</em>
                </h2>
            </div>
            <div className="schedule-list">
                {items.map(([time, activity, place]) => (
                    <div className="schedule-row" key={time}>
                        <time>{time}</time>
                        <strong>{activity}</strong>
                        <span>{place}</span>
                    </div>
                ))}
            </div>
        </section>
    )
}

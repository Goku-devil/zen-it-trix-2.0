import Brand from './Brand'

export default function Footer({ theme, onThemeChange }) {
    const quickLinks = [
        ['College website', 'https://aecsalem.edu.in/'],
        ['About the college', 'https://aecsalem.edu.in/vision-mission.php'],
        ['Campus directions', 'https://maps.app.goo.gl/K6DzyX7c3oPXhmZ69'],
        ['About the Department', 'https://aecsalem.edu.in/depart-IT.php'],
        ['Theme Inspiration [Omarchy]', 'hsttps://omarchy.org/themes/'],
    ]

    return (
        <footer>
            <div className="footer-college">
                <p className="footer-kicker">Hosted by</p>
                <h2>
                    Annapoorana<br /><em>Engineering College</em>
                </h2>
                <p>Department of Information Technology</p>
            </div>
            <div className="footer-symposium">
                <a href="#top"><Brand className="footer-brand" /></a>
                <p>Zen-it-trix 2.0 is a day for sharp minds, wild ideas, and good people.</p>
            </div>
            <div className="footer-links">
                <p className="footer-kicker">Quick links</p>
                {quickLinks.map(([label, href]) => (
                    <a href={href} key={label}>
                        {label}<span aria-hidden="true">↗</span>
                    </a>
                ))}
            </div>
            <div className="footer-contact">
                <p className="footer-kicker">Get in touch</p>
                <a href="mailto:hello@zenittrix.in">hello@zenittrix.in</a>
                <a href="tel:8234353434">+91 82343 53434</a>
                <p>Main Campus<br />Annapoorana Engineering College</p>
                <label className="theme-switcher">
                    Theme
                    <select value={theme} onChange={(event) => onThemeChange(event.target.value)}>
                        <option value="default">Signal Blue</option>
                        <option value="mocha">Catppuccin Mocha</option>
                        <option value="green">Terminal Green</option>
                    </select>
                </label>
            </div>
            <p className="copyright">© 2026 Zen-it-trix 2.0 · Annapoorana Engineering College</p>
        </footer>
    )
}

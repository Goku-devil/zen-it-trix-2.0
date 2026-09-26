import { useRef } from 'react'
import logo from '../assets/logo.png'

export default function Hero({ onRegister }) {
    const heroRef = useRef(null)

    const handlePointerMove = (event) => {
        const bounds = event.currentTarget.getBoundingClientRect()
        const x = ((event.clientX - bounds.left) / bounds.width) * 100
        const y = ((event.clientY - bounds.top) / bounds.height) * 100
        heroRef.current?.style.setProperty('--pointer-x', `${x}%`)
        heroRef.current?.style.setProperty('--pointer-y', `${y}%`)
    }

    return (
        <section className="hero" id="top" ref={heroRef} onPointerMove={handlePointerMove}>
            <div className="hero-particles" aria-hidden="true">
                {Array.from({ length: 18 }, (_, index) => <span key={index} style={{ '--particle-index': index }} />)}
            </div>
            <div className="hero-copy">
                <p className="eyebrow department-label">Department of Information Technology <span className="live-chip">LIVE // 2.0</span></p>
                <div className="hero-event-name">
                    <span>presents a festival of curious chaos</span>
                    <strong>Zen-IT-Trix <b>2.0</b></strong>
                </div>
                <p className="hero-text">
                    A day where sharp minds, wild ideas, and good people collide. Come for the challenge. Stay for the energy.
                </p>
                <div className="hero-actions">
                    <a className="primary-button" href="#events">
                        See all events <span>↓</span>
                    </a>
                    <button className="register-button" type="button" onClick={onRegister}>
                        Register now <span>↗</span>
                    </button>
                </div>
            </div>
            <div className="hero-art" aria-label="Zen-it-trix 2.0 event details">
                <div className="hero-art-label">[ INTERACTIVE PLAYGROUND ]</div>
                <div className="hero-grid" aria-hidden="true"></div>
                <div className="hero-glow" aria-hidden="true"></div>
                <img className="hero-logo" src={logo} alt="Zen-it-trix logo" />
                <div className="burst burst-one">THINK<br />LOUD<span>↗</span></div>
                <div className="burst burst-two">PLAY<br />HARD<span>✦</span></div>
                <div className="orbit orbit-one"></div>
                <div className="orbit orbit-two"></div>
                <div className="hero-sticker">APR<br /><strong>24</strong><br />2026</div>
                <p className="hero-location">AT THE<br /><strong>MAIN CAMPUS</strong></p>
                <span className="hero-mark">✳</span>
                <span className="hero-cursor-note">MOVE YOUR CURSOR<br /><b>TO BEND THE SIGNAL</b></span>
            </div>
        </section>
    )
}

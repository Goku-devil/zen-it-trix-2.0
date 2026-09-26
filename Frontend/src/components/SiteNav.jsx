import { useEffect, useState } from 'react'
import Brand from './Brand'

export default function SiteNav() {
    const [menuOpen, setMenuOpen] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    const closeMenu = () => setMenuOpen(false)

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            await document.documentElement.requestFullscreen?.()
        } else {
            await document.exitFullscreen?.()
        }
        setMenuOpen(false)
    }

    useEffect(() => {
        if (!menuOpen) return undefined

        const closeOnScroll = () => setMenuOpen(false)
        const closeOnOutsidePointer = (event) => {
            if (!event.target.closest('.site-nav')) setMenuOpen(false)
        }

        window.addEventListener('scroll', closeOnScroll, { passive: true })
        document.addEventListener('pointerdown', closeOnOutsidePointer)

        return () => {
            window.removeEventListener('scroll', closeOnScroll)
            document.removeEventListener('pointerdown', closeOnOutsidePointer)
        }
    }, [menuOpen])

    useEffect(() => {
        const updateFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement))
        document.addEventListener('fullscreenchange', updateFullscreenState)
        return () => document.removeEventListener('fullscreenchange', updateFullscreenState)
    }, [])

    return (
        <nav className={`site-nav${menuOpen ? ' menu-open' : ''}`} aria-label="Main navigation">
            <a href="#top"><Brand /></a>
            <div className="nav-links">
                <a href="#events" onClick={closeMenu}>
                    Events
                </a>
                <a href="#schedule" onClick={closeMenu}>
                    Schedule
                </a>
                <a href="#contact" onClick={closeMenu}>
                    Contact
                </a>
            </div>
            <a className="nav-cta" href="#events">
                Explore events <span>↘</span>
            </a>
            <button
                className="nav-toggle"
                type="button"
                aria-expanded={menuOpen}
                aria-controls="mobile-navigation"
                onClick={() => setMenuOpen((isOpen) => !isOpen)}
            >
                <span>{menuOpen ? 'Close' : 'Menu'}</span>
                <i aria-hidden="true">{menuOpen ? '×' : '+'}</i>
            </button>
            <div className="mobile-navigation" id="mobile-navigation">
                <span className="mobile-navigation-label">Navigate</span>
                <div className="mobile-navigation-links">
                    <a href="#events" onClick={closeMenu}>
                        01 <span>Events</span><b>↘</b>
                    </a>
                    <a href="#schedule" onClick={closeMenu}>
                        02 <span>Schedule</span><b>↘</b>
                    </a>
                    <a href="#contact" onClick={closeMenu}>
                        03 <span>Contact</span><b>↘</b>
                    </a>
                </div>
                <button
                    className="fullscreen-toggle"
                    type="button"
                    onClick={toggleFullscreen}
                    hidden={!document.fullscreenEnabled}
                >
                    <span>{isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}</span>
                    <b aria-hidden="true">{isFullscreen ? '↙' : '↗'}</b>
                </button>
            </div>
        </nav>
    )
}

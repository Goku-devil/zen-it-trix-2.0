import { useState } from 'react'
import './AppV2.css'
import { nonTechnicalEvents, schedule, technicalEvents } from './data'
import ContactSection from './components/ContactSection'
import AnimatedOverlay from './components/AnimatedOverlay'
import AdminPage from './components/AdminPage'
import AdminDashboard from './components/AdminDashboard'
import EventsSection from './components/EventsSection'
import Footer from './components/Footer'
import Hero from './components/Hero'
import RegistrationForm from './components/RegistrationForm'
import Schedule from './components/Schedule'
import SiteNav from './components/SiteNav'

function IntroStrip() {
    return <section className="intro-strip"><p><span className="strip-dot"></span> One campus. Two tracks. Endless ways to win.</p><p className="scroll-note">Scroll to discover <span>↓</span></p></section>
}

function App() {
    if (window.location.hash === '#admin') return <AdminDashboard />

    const [theme, setTheme] = useState('default')
    const [registration, setRegistration] = useState(null)

    return <main className={`theme-${theme}`}><AnimatedOverlay /><SiteNav /><Hero onRegister={() => setRegistration({})} /><IntroStrip /><EventsSection technicalEvents={technicalEvents} nonTechnicalEvents={nonTechnicalEvents} onRegister={(eventName) => setRegistration({ eventName })} /><Schedule items={schedule} /><ContactSection technicalEvents={technicalEvents} nonTechnicalEvents={nonTechnicalEvents} /><Footer theme={theme} onThemeChange={setTheme} />{registration && <RegistrationForm initialEvent={registration.eventName} events={[...technicalEvents, ...nonTechnicalEvents]} onClose={() => setRegistration(null)} />}</main>
}

export default App

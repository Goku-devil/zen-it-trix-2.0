import collegeLogo from '../assets/image.png'
import zenLogo from '../assets/logo.png'

export default function Brand({ className = '' }) {
    return (
        <span className={`brand ${className}`}>
            <img className="college-logo" src={collegeLogo} alt="Annapoorana Engineering College" />
            <img className="zen-logo" src={zenLogo} alt="Zen-it-trix logo" />
            zen-it-trix <b>2.0</b>
        </span>
    )
}

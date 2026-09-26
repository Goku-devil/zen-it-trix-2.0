import collegeLogo from '../assets/image.png'

export default function Brand({ className = '' }) {
    return (
        <span className={`brand ${className}`}>
            <img className="college-logo" src={collegeLogo} alt="Annapoorana Engineering College" />
            <span>ZT</span> zen-it-trix <b>2.0</b>
        </span>
    )
}

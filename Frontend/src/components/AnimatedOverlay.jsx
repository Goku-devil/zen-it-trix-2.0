export default function AnimatedOverlay() {
    return (
        <div className="animated-overlay" aria-hidden="true">
            <div className="overlay-wave overlay-wave-one"></div>
            <div className="overlay-wave overlay-wave-two"></div>
            <div className="overlay-orbit overlay-orbit-one"></div>
            <div className="overlay-orbit overlay-orbit-two"></div>
            <div className="overlay-spark overlay-spark-one">✦</div>
            <div className="overlay-spark overlay-spark-two">+</div>
            <div className="overlay-spark overlay-spark-three">✳</div>
            <div className="overlay-token overlay-token-one">LOL<br /><b>!</b></div>
            <div className="overlay-token overlay-token-two">IDEA<br /><b>↗</b></div>
            <div className="overlay-token overlay-token-three">PLAY<br /><b>✦</b></div>
            <div className="overlay-token overlay-token-four">404<br /><b>FUN</b></div>
        </div>
    )
}
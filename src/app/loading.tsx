"use client";

const TICK_COUNT = 13;
const START_ANGLE = -125;
const END_ANGLE = 125;
const CENTER = 110;

function polar(angle: number, radius: number) {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
        x: CENTER + radius * Math.cos(rad),
        y: CENTER + radius * Math.sin(rad),
    };
}

const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
    const angle = START_ANGLE + (i * (END_ANGLE - START_ANGLE)) / (TICK_COUNT - 1);
    const isMajor = i % 3 === 0;
    const isRedline = i >= TICK_COUNT - 2;
    const outer = polar(angle, 98);
    const inner = polar(angle, isMajor ? 78 : 88);
    return { angle, isMajor, isRedline, outer, inner };
});

export default function Loading() {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040E21] text-[#DCEBFA]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(191,152,13,0.14),transparent_58%)]" />

            <div className="relative z-10 flex flex-col items-center px-6 text-center">
                {/* Gauge */}
                <div className="relative h-52 w-52 sm:h-60 sm:w-60">
                    <svg viewBox="0 0 220 220" className="h-full w-full">
                        {/* Outer ring */}
                        <circle cx={CENTER} cy={CENTER} r={104} fill="none" stroke="#DCEBFA" strokeOpacity={0.08} strokeWidth={1} />

                        {/* Ticks */}
                        {ticks.map((t, i) => (
                            <line
                                key={i}
                                x1={t.inner.x}
                                y1={t.inner.y}
                                x2={t.outer.x}
                                y2={t.outer.y}
                                stroke={t.isRedline ? "#D41F2D" : t.isMajor ? "#D41F2D" : "#DCEBFA"}
                                strokeOpacity={t.isRedline || t.isMajor ? 0.9 : 0.25}
                                strokeWidth={t.isMajor ? 2 : 1}
                                strokeLinecap="round"
                            />
                        ))}

                        {/* Needle */}
                        <g className="gauge-needle" style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}>
                            <line
                                x1={CENTER}
                                y1={CENTER}
                                x2={CENTER}
                                y2={CENTER - 74}
                                stroke="#5FA8E8"
                                strokeWidth={2.5}
                                strokeLinecap="round"
                                style={{ filter: "drop-shadow(0 0 6px rgba(243,215,122,0.65))" }}
                            />
                        </g>

                        {/* Hub */}
                        <circle cx={CENTER} cy={CENTER} r={9} fill="#071A38" stroke="#D41F2D" strokeWidth={2} />
                        <circle cx={CENTER - 2.5} cy={CENTER - 2.5} r={2} fill="#5FA8E8" fillOpacity={0.8} />
                    </svg>
                </div>

                {/* Copy */}
                <h2 className="mt-8 font-serif text-2xl font-semibold text-[#DCEBFA] sm:text-3xl">Warming up the engine</h2>
                <p className="mt-2 text-sm text-[#8FA9C9]">Your showroom is just a moment away</p>

                {/* Progress line */}
                <div className="mt-7 h-[3px] w-52 overflow-hidden rounded-full bg-[#DCEBFA]/10 sm:w-64">
                    <div className="loading-fill h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#D41F2D] to-transparent" />
                </div>
            </div>

            <style jsx global>{`
                @keyframes gaugeSweep {
                    0% {
                        transform: rotate(${START_ANGLE}deg);
                    }
                    45% {
                        transform: rotate(${START_ANGLE}deg);
                    }
                    72% {
                        transform: rotate(${END_ANGLE - 8}deg);
                    }
                    84% {
                        transform: rotate(${END_ANGLE - 30}deg);
                    }
                    100% {
                        transform: rotate(${START_ANGLE}deg);
                    }
                }

                @keyframes loadingFill {
                    0% {
                        transform: translateX(-120%);
                    }
                    100% {
                        transform: translateX(320%);
                    }
                }

                .gauge-needle {
                    animation: gaugeSweep 2.6s cubic-bezier(0.45, 0, 0.2, 1) infinite;
                }

                .loading-fill {
                    animation: loadingFill 1.6s ease-in-out infinite;
                }

                @media (prefers-reduced-motion: reduce) {
                    .gauge-needle,
                    .loading-fill {
                        animation: none;
                    }
                }
            `}</style>
        </div>
    );
}
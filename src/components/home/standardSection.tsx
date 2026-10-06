"use client";

import {
    ShieldCheck,
    Tags,
    CreditCard,
    RefreshCw,
    Zap,
    Users,
} from "lucide-react";

const standards = [
    {
        icon: ShieldCheck,
        title: "Quality Inspected",
        description: "Multi-point checks before every vehicle is listed.",
    },
    {
        icon: Tags,
        title: "Transparent Pricing",
        description: "Clear figures with no unnecessary surprises.",
    },
    {
        icon: CreditCard,
        title: "Financing Options",
        description: "Flexible plans tailored to your budget.",
    },
    {
        icon: RefreshCw,
        title: "Trade-In Available",
        description: "A straightforward path when you're ready to upgrade.",
    },
    {
        icon: Zap,
        title: "Fast Transactions",
        description: "Efficient paperwork with dedicated support.",
    },
    {
        icon: Users,
        title: "Trusted Experts",
        description: "Guidance from experienced automotive specialists.",
    },
];
export default function StandardSection() {
    return (
        <>
            <section className="relative overflow-hidden bg-[var(--page-bg)] py-20 text-[var(--foreground)]">
                {/* Content */}
                <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
                    {/* Section Heading */}
                    <div className="mx-auto max-w-3xl text-center">
                        <div className="mb-5 flex items-center justify-center gap-3">
                            <span className="h-px w-10 bg-[#D41F2D]" />
                            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
                                AutoTrade Standard
                            </span>
                            <span className="h-px w-10 bg-[#D41F2D]" />
                        </div>

                        <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                            Trust, built into
                            <span className="block text-[#D41F2D]">
                                every detail.
                            </span>
                        </h2>

                        <p className="mt-5 text-sm leading-7 text-zinc-400 sm:text-base">
                            Every vehicle and every conversation is handled
                            with the same uncompromising standard.
                        </p>
                    </div>

                    {/* Standards Grid */}
                    <div className="mt-12 grid overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md sm:grid-cols-2 lg:grid-cols-3">
                        {standards.map((item, index) => {
                            const Icon = item.icon;

                            return (
                                <div
                                    key={item.title}
                                    className={`group relative border-white/10 p-7 transition-all duration-300 hover:bg-white/[0.07] md:p-8 ${index < 3
                                        ? "border-b"
                                        : "border-b sm:border-b-0"
                                        } ${index % 3 !== 2
                                            ? "lg:border-r"
                                            : ""
                                        } ${index % 2 === 0
                                            ? "sm:border-r lg:border-r"
                                            : "sm:border-r-0"
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className="flex size-12 items-center justify-center rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 transition-all duration-300 group-hover:border-[#D41F2D]/60 group-hover:bg-[#D41F2D]/20">
                                        <Icon className="size-6 text-[#D41F2D]" />
                                    </div>

                                    {/* Content */}
                                    <h3 className="mt-6 font-display text-xl font-semibold text-white">
                                        {item.title}
                                    </h3>

                                    <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-400">
                                        {item.description}
                                    </p>

                                    {/* Hover accent */}
                                    <div className="absolute bottom-0 left-0 h-px w-0 bg-[#D41F2D] transition-all duration-500 group-hover:w-full" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </>
    );
}
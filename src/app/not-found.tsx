import Link from "next/link";

import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";

const focusRing =
    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

/*
 * Silhouette of the BMW 5 Series photo, traced from the image.
 * Coordinates match the photo's own 1217 x 627 pixel grid, so any
 * detail drawn on top of it lines up with the car.
 */
const CAR_OUTLINE =
    "M692 115C685 116 677 116 670 116C663 117 655 117 648 117C640 118 633 118 626 119C618 120 611 120 604 121C596 122 589 123 582 124C574 124 567 125 560 126C553 127 545 128 538 129C531 130 523 130 516 132C509 133 502 135 495 138C488 140 481 143 474 146C468 149 461 153 455 157C448 160 442 164 436 168C430 172 424 177 418 181C412 185 406 189 400 194C394 198 388 203 383 207C377 212 371 218 365 220C358 222 350 219 343 219C336 220 327 219 321 222C316 225 314 233 310 239C306 244 304 252 299 256C293 259 284 258 277 259C270 261 262 261 255 263C248 264 240 265 233 266C226 267 219 268 211 270C204 272 197 274 190 277C183 279 177 282 170 284C163 287 156 291 150 294C143 297 136 299 129 302C123 305 116 309 110 312C103 316 97 320 91 325C86 329 79 334 75 339C70 345 68 352 65 359C62 365 59 372 56 379C53 386 48 392 46 398C43 405 43 413 42 420C41 427 41 435 41 442C41 450 41 457 41 464C41 472 42 479 43 486C43 494 39 502 41 508C43 515 48 521 54 524C60 528 69 527 75 530C82 533 87 539 92 544C97 549 102 555 107 559C113 564 120 567 127 570C134 572 141 572 149 573C156 574 163 574 171 574C178 574 186 574 193 573C200 572 208 571 214 568C221 566 227 561 233 557C240 553 245 548 252 545C258 542 266 540 273 539C280 538 288 538 295 538C302 538 310 539 317 539C324 540 332 540 339 541C346 541 354 541 361 541C368 542 376 544 383 545C390 546 397 547 405 548C412 549 420 549 427 549C434 550 442 551 449 552C456 552 464 552 471 554C478 555 485 559 491 561C498 563 506 564 513 566C520 568 527 569 533 573C539 576 543 584 549 588C555 592 562 595 569 597C576 599 584 600 591 600C598 601 606 601 613 601C620 601 628 601 635 601C642 600 650 599 657 596C664 594 670 590 676 585C681 581 686 575 690 569C695 563 697 555 701 549C705 544 709 537 715 534C721 530 730 531 737 530C744 529 752 528 759 527C766 526 774 525 781 524C788 523 796 522 803 521C810 520 817 519 825 518C832 516 839 516 847 515C854 514 861 512 869 512C876 511 883 510 891 510C898 511 905 512 913 513C920 513 928 510 934 511C941 512 948 515 953 519C958 523 960 533 965 537C971 542 978 545 985 547C992 549 1000 548 1007 548C1014 548 1022 549 1029 548C1036 547 1044 547 1051 544C1057 541 1062 535 1067 529C1071 523 1073 516 1076 509C1078 502 1079 495 1082 488C1085 481 1088 475 1092 469C1097 463 1104 460 1108 454C1112 448 1114 440 1116 433C1118 426 1119 419 1120 411C1121 404 1122 397 1122 389C1122 382 1123 375 1123 367C1122 360 1122 353 1120 346C1118 338 1115 331 1112 325C1108 319 1101 314 1098 308C1094 302 1091 295 1090 288C1089 281 1094 272 1091 266C1089 261 1079 258 1073 255C1066 252 1059 250 1053 246C1046 242 1041 238 1035 233C1029 228 1024 223 1019 218C1013 213 1007 208 1002 204C996 199 991 194 985 190C979 185 973 180 967 176C961 172 955 167 949 163C943 160 937 156 930 152C923 149 917 146 910 143C903 140 896 137 889 135C882 133 875 131 868 130C861 128 853 127 846 126C839 125 832 125 824 124C817 123 809 123 802 122C795 121 788 119 780 118C773 118 766 117 758 117C751 116 744 116 736 116C729 116 721 115 714 115C707 115 699 115 692 115Z";

export default function NotFound() {
    return (
        <>
            <Navbar />

            <main className="relative flex min-h-[calc(100svh_-_81px)] items-center overflow-hidden border-b border-white/10 bg-[#040E21]">

                {/* Showroom light, same gold glow as the hero */}
                <div className="pointer-events-none absolute right-[10%] top-1/3 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-white/[0.06] blur-[140px]" />

                <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-8 lg:py-16">

                    {/* =========================
                        MESSAGE
                    ========================== */}
                    <div className="max-w-xl">

                        <p className="text-sm font-semibold text-[#FF5C68]">
                            Error 404
                        </p>

                        <h1 className="mt-4 text-4xl font-black leading-[1.02] tracking-[-0.03em] text-white sm:text-5xl lg:text-6xl">
                            We can&apos;t find that page.
                        </h1>

                        <p className="mt-6 text-base leading-7 text-zinc-300 sm:text-lg">
                            The link may be out of date, or the car you were
                            looking for has already been sold. See what&apos;s
                            on the lot right now.
                        </p>

                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/cars"
                                className={`inline-flex items-center justify-center rounded-full bg-[#D41F2D] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#D41F2D]/10 transition-all duration-300 hover:bg-[#E8404B] hover:shadow-[#D41F2D]/25 ${focusRing}`}
                            >
                                Browse inventory
                            </Link>

                            <Link
                                href="/"
                                className={`inline-flex items-center justify-center rounded-full border border-[#D41F2D]/70 bg-[#040E21]/30 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-[#D41F2D] hover:bg-[#D41F2D]/15 ${focusRing}`}
                            >
                                Go to homepage
                            </Link>
                        </div>

                        <p className="mt-8 text-sm leading-6 text-zinc-400">
                            Looking for a specific car?{" "}
                            <Link
                                href="/contact"
                                className={`font-medium text-white underline decoration-[#D41F2D] decoration-2 underline-offset-4 transition-colors hover:text-[#FF5C68] ${focusRing}`}
                            >
                                Contact us
                            </Link>{" "}
                            and we&apos;ll help you find it.
                        </p>
                    </div>

                    {/* =========================
                        THE CAR
                        A dashed outline of the car that used to be
                        here, with a question mark where it should be.
                    ========================== */}
                    <div className="flex justify-center">
                        <svg
                            viewBox="10 90 1140 550"
                            fill="none"
                            aria-hidden="true"
                            className="h-auto w-full max-w-[640px]"
                        >
                            <defs>
                                <radialGradient id="nf-floor">
                                    <stop offset="0" stopColor="#D41F2D" stopOpacity="0.28" />
                                    <stop offset="1" stopColor="#D41F2D" stopOpacity="0" />
                                </radialGradient>

                                {/* Reveals the dashed outline as if it's being traced */}
                                <mask
                                    id="nf-car-mask"
                                    maskUnits="userSpaceOnUse"
                                    x="0"
                                    y="80"
                                    width="1217"
                                    height="560"
                                >
                                    <path
                                        className="nf-car-line"
                                        pathLength={1}
                                        d={CAR_OUTLINE}
                                        stroke="white"
                                        strokeWidth="14"
                                        fill="none"
                                    />
                                </mask>
                            </defs>

                            {/* Light on the showroom floor */}
                            <ellipse cx="580" cy="596" rx="540" ry="40" fill="url(#nf-floor)" />

                            {/* Body outline */}
                            <path
                                d={CAR_OUTLINE}
                                mask="url(#nf-car-mask)"
                                stroke="#D41F2D"
                                strokeOpacity="0.9"
                                strokeWidth="4"
                                strokeDasharray="22 16"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />

                            {/* Windows, wheels, lights, grille */}
                            <g
                                className="nf-car-detail"
                                stroke="#D41F2D"
                                strokeOpacity="0.55"
                                strokeWidth="3"
                                strokeDasharray="12 10"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                {/* Windshield and side windows */}
                                <path d="M354 246 C385 212 430 170 488 141 C540 132 660 131 766 142 C755 180 742 215 729 246 C660 250 560 244 470 243 C430 243 390 245 354 246Z" />
                                <path d="M790 141 C810 136 835 135 850 137 L871 252 C830 252 790 254 763 256 C770 220 780 175 790 141Z" />
                                <path d="M878 143 C905 140 930 144 945 153 C980 173 1000 200 1005 222 L1008 250 C960 250 915 251 880 252Z" />

                                {/* Wheels */}
                                <ellipse cx="655" cy="480" rx="57" ry="108" transform="rotate(-8 655 480)" />
                                <ellipse cx="1051" cy="446" rx="35" ry="86" transform="rotate(-4 1051 446)" />

                                {/* Headlights */}
                                <path d="M395 372 C405 352 470 338 560 337 C588 338 596 348 588 358 C560 380 500 392 440 392 C415 390 397 386 395 372Z" />
                                <path d="M62 350 C75 338 100 335 116 345 L112 380 C95 384 75 382 62 376Z" />

                                {/* Grille and plate */}
                                <path d="M117 360 C120 348 170 343 225 345 C232 346 234 352 233 375 L230 410 C220 420 150 420 127 415 C117 410 116 380 117 360Z" />
                                <path d="M241 350 C300 344 360 346 385 356 C392 362 392 372 388 388 L378 412 C350 422 270 420 245 414 C239 400 239 375 241 350Z" />
                                <path d="M152 432 L316 434 L316 472 L152 468Z" />

                                {/* Mirror, door seam, side skirt */}
                                <path d="M303 228 C303 218 320 212 340 214 C352 216 356 224 352 236 C340 246 320 248 308 244Z" />
                                <path d="M901 268 C907 330 912 420 908 470" />
                                <path d="M735 512 C820 492 900 484 972 478" />
                            </g>

                        </svg>
                    </div>
                </div>

                <style>{`
                    @media (prefers-reduced-motion: no-preference) {
                        .nf-car-line {
                            stroke-dasharray: 1;
                            stroke-dashoffset: 1;
                            animation: nf-draw 1.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s forwards;
                        }

                        .nf-car-detail {
                            opacity: 0;
                            animation: nf-fade 0.8s ease-out 1.5s forwards;
                        }

                        .nf-mark {
                            opacity: 0;
                            animation: nf-fade 0.6s ease-out 2s forwards;
                        }
                    }

                    @keyframes nf-draw {
                        to { stroke-dashoffset: 0; }
                    }

                    @keyframes nf-fade {
                        to { opacity: 1; }
                    }
                `}</style>
            </main>

            <Footer />
        </>
    );
}
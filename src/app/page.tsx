"use client";

import Navbar from "../components/layout/navbar";
import Footer from "../components/layout/footer";
import HeroSection from "../components/home/heroSection";
import ShowcaseSection from "../components/home/showcaseSection";
import StandardSection from "../components/home/standardSection";
import CTA from "../components/home/cta";

export default function Home() {
    return (
        <div>
            <Navbar />
            <main className="bg-[#191610] min-h-screen">
                <HeroSection />
                <ShowcaseSection />
                <StandardSection />
                <CTA />
            </main>
            <Footer/>
        </div>
    );
}
"use client";

import { useState, useEffect } from "react";
import { sound } from "@/lib/sound";
import { 
  SpeakerHigh, 
  SpeakerSimpleSlash, 
  LockOpen, 
  Terminal,
  PaperPlaneTilt,
  List
} from "@phosphor-icons/react";

interface NavbarProps {
  onOpenIdeasModal: (roundNum?: number) => void;
}

export function Navbar({ onOpenIdeasModal }: NavbarProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleToggleAudio = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      sound.playClick(1000);
    }
  };

  const navLinks = [
    { label: "[01] ROUNDS", href: "#rounds" },
    { label: "[02] RULES", href: "#rules" },
    { label: "[03] CO-ORDINATORS", href: "#coordinators" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#080808]/90 backdrop-blur-md border-b border-[#27272a] shadow-lg"
          : "bg-transparent border-b border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <a
          href="#"
          onClick={() => sound.playClick(800)}
          className="flex items-center gap-3 group select-none"
        >
          <div className="w-8 h-8 bg-[#ff5500] flex items-center justify-center text-black font-black text-xs group-hover:bg-white transition-colors">
            <LockOpen weight="bold" className="size-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-widest text-white uppercase group-hover:text-[#ff5500] transition-colors">
                CRACK THE LOCK
              </span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#ff5500]/10 text-[#ff5500] border border-[#ff5500]/40 font-bold uppercase tracking-wider">
                ASTHRA 11.0
              </span>
            </div>
            <span className="text-[10px] text-neutral-400 tracking-wider">
              INTER-COLLEGIATE TECH BATTLE
            </span>
          </div>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => sound.playClick(750)}
              className="text-neutral-400 hover:text-white hover:border-b-2 hover:border-[#ff5500] py-1 tracking-wider transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Status Beacon */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-neutral-900/90 border border-neutral-800 text-[11px] font-mono text-neutral-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff5500] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff5500]"></span>
            </span>
            <span className="text-[10px] tracking-wider uppercase text-neutral-400">
              SYS: <span className="text-white font-bold">ARMED</span>
            </span>
          </div>

          {/* Audio Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={isMuted ? "Sound Disabled" : "Sound Enabled"}
            aria-label="Toggle SFX"
            className="w-9 h-9 flex items-center justify-center bg-neutral-900 border border-neutral-800 hover:border-[#ff5500] text-neutral-300 hover:text-white transition-colors"
          >
            {isMuted ? (
              <SpeakerSimpleSlash weight="bold" className="size-4 text-neutral-500" />
            ) : (
              <SpeakerHigh weight="bold" className="size-4 text-[#ff5500]" />
            )}
          </button>

          {/* Ideas Modal CTA */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(1000);
              onOpenIdeasModal();
            }}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-[#ff5500] text-black font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-black transition-all active:translate-y-0.5 shadow-[3px_3px_0px_0px_#ffffff]"
          >
            <PaperPlaneTilt weight="bold" className="size-3.5" />
            <span>SUBMIT IDEAS</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => {
              sound.playClick(600);
              setMobileMenuOpen(!mobileMenuOpen);
            }}
            className="md:hidden w-9 h-9 flex items-center justify-center bg-neutral-900 border border-neutral-800 text-white"
          >
            <List weight="bold" className="size-4" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0a0c] border-b border-[#27272a] px-6 py-4 flex flex-col gap-3 font-mono text-xs">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => {
                sound.playClick(750);
                setMobileMenuOpen(false);
              }}
              className="text-neutral-300 hover:text-[#ff5500] py-2 border-b border-neutral-800 tracking-wider"
            >
              {link.label}
            </a>
          ))}
          <button
            type="button"
            onClick={() => {
              sound.playClick(1000);
              setMobileMenuOpen(false);
              onOpenIdeasModal();
            }}
            className="w-full mt-2 py-2.5 bg-[#ff5500] text-black font-bold tracking-wider uppercase text-center flex items-center justify-center gap-2"
          >
            <PaperPlaneTilt weight="bold" className="size-4" />
            HELP US BUILD THE EXPERIENCE
          </button>
        </div>
      )}
    </header>
  );
}


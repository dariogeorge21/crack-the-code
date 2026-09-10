"use client";

import { useState, useEffect } from "react";
import { 
  LockOpen, 
  PaperPlaneTilt, 
  List, 
  Play 
} from "@phosphor-icons/react";
import { MasterKeyHud } from "./master-key-hud";

interface NavbarProps {
  onOpenIdeasModal?: (roundNum?: number) => void;
  onStartGame?: () => void;
  activeTeamName?: string;
  activeTeamTimer?: string;
  activeTeamMasterCode?: string | null;
  activeTeamLevel?: number;
}

export function Navbar({
  onOpenIdeasModal,
  onStartGame,
  activeTeamName,
  activeTeamTimer,
  activeTeamMasterCode,
  activeTeamLevel,
}: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleStartGame = () => {
    if (onStartGame) {
      onStartGame();
      return;
    }
    const element = document.getElementById("rounds");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = "#rounds";
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
              className="text-neutral-400 hover:text-white hover:border-b-2 hover:border-[#ff5500] py-1 tracking-wider transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Master Key HUD in Header */}
          {activeTeamMasterCode && (
            <MasterKeyHud
              masterCode={activeTeamMasterCode}
              unlockedCount={activeTeamLevel && activeTeamLevel >= 3 ? 3 : 1}
              size="sm"
              className="hidden lg:flex"
            />
          )}

          {/* Start Game CTA */}
          <button
            type="button"
            onClick={handleStartGame}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-[#ff5500] text-black font-bold text-xs tracking-wider uppercase hover:bg-white hover:text-black transition-all active:translate-y-0.5 shadow-[3px_3px_0px_0px_#ffffff] cursor-pointer"
          >
            <Play weight="bold" className="size-3.5 shrink-0" />
            <span>
              {activeTeamName ? (
                <span className="flex items-center gap-1.5">
                  <span>RESUME [{activeTeamName}]</span>
                  {activeTeamTimer && (
                    <span className="px-1.5 py-0.2 bg-black text-[#ff5500] font-black text-[10px]">
                      {activeTeamTimer}
                    </span>
                  )}
                </span>
              ) : (
                "START GAME"
              )}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => {
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
          {activeTeamMasterCode && (
            <div className="py-2 border-b border-neutral-800 flex justify-center">
              <MasterKeyHud
                masterCode={activeTeamMasterCode}
                unlockedCount={activeTeamLevel && activeTeamLevel >= 3 ? 3 : 1}
                size="sm"
              />
            </div>
          )}
          {activeTeamName && (
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                handleStartGame();
              }}
              className="w-full py-2.5 bg-[#ff5500] text-black font-black tracking-wider uppercase text-center flex items-center justify-center gap-2"
            >
              <Play weight="bold" className="size-4" />
              <span>RESUME [{activeTeamName}] {activeTeamTimer ? `(${activeTeamTimer})` : ""}</span>
            </button>
          )}
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => {
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
              setMobileMenuOpen(false);
              onOpenIdeasModal?.();
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

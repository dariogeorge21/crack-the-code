"use client";

import { 
  LockOpen, 
  ArrowUp, 
  Terminal, 
  ShieldCheck, 
  Heart 
} from "@phosphor-icons/react";

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative bg-[#050507] border-t border-neutral-800 text-neutral-400 font-mono text-xs py-16 px-4 sm:px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-neutral-900">
          {/* Col 1: Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-[#ff5500] flex items-center justify-center text-black font-black">
                <LockOpen weight="bold" className="size-4" />
              </div>
              <span className="text-lg font-black text-white uppercase tracking-widest">
                CRACK THE LOCK
              </span>
              <span className="px-2 py-0.5 bg-[#ff5500]/10 border border-[#ff5500]/40 text-[#ff5500] text-[10px] font-bold">
                ASTHRA 11.0
              </span>
            </div>
            <p className="text-neutral-400 max-w-md leading-relaxed text-xs">
              An Inter-Collegiate Technical Competition. Four progressive technical challenges testing physical agility, cryptographic logic, DSA problem-solving, and master vault decryption.
            </p>
            <div className="mt-4 text-[11px] text-neutral-500">
              IDEAS TURN CHALLENGES — DIFFERENT CHALLENGES. ONE FINAL LOCK.
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h5 className="text-white font-bold uppercase tracking-wider text-xs mb-3">
              EVENT NAVIGATION
            </h5>
            <ul className="space-y-2 text-xs text-center md:text-left">
              <li>
                <a
                  href="#rules"
                  className="inline-block hover:text-[#ff5500] transition-colors"
                >
                  [01] Rules & Regulations
                </a>
              </li>
              <li>
                <a
                  href="#coordinators"
                  className="inline-block hover:text-[#ff5500] transition-colors"
                >
                  [03] Organising Team
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Status Telemetry */}
          <div>
            <h5 className="text-white font-bold uppercase tracking-wider text-xs mb-3">
              SYSTEM TELEMETRY
            </h5>
            <div className="space-y-1.5 text-[11px] text-neutral-400">
            
              <div>
                DURATION: <span className="text-white">3 HOURS STAGED</span>
              </div>
              <div>
                ROUNDS: <span className="text-white">4 SEQUENTIAL</span>
              </div>
              <div>
                TEAM FORMAT: <span className="text-white">2–3 DELEGATES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} ASTHRA 11.0. All Rights Reserved. Built for high-speed technical competition.
          </div>

          <button
            type="button"
            onClick={scrollToTop}
            className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-[#ff5500] hover:text-white transition-colors cursor-pointer"
          >
            <span>BACK TO TOP</span>
            <ArrowUp weight="bold" className="size-3.5 text-[#ff5500]" />
          </button>
        </div>
      </div>
    </footer>
  );
}


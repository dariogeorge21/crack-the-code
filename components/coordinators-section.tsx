"use client";

import { useState } from "react";
import { EVENT_DATA, Coordinator } from "@/lib/event-data";
import { sound } from "@/lib/sound";
import { 
  PhoneCall, 
  Copy, 
  Check, 
  EnvelopeSimple, 
  IdentificationCard,
  Users,
  Terminal,
  ShieldStar
} from "@phosphor-icons/react";

export function CoordinatorsSection() {
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const handleCopyPhone = (person: Coordinator) => {
    sound.playClick(900);
    navigator.clipboard.writeText(person.phone);
    setCopiedName(person.name);
    setTimeout(() => {
      setCopiedName(null);
    }, 2500);
  };

  return (
    <section
      id="coordinators"
      className="relative py-24 px-4 sm:px-6 lg:px-12 bg-[#080808] border-b border-[#27272a] scroll-mt-12"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="pb-12 border-b border-neutral-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-[10px] font-mono tracking-widest text-[#ff5500] uppercase mb-3">
              <span className="w-2 h-2 bg-[#ff5500]" />
              COMMAND DIRECTORY
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white">
              ORGANISING TEAM
            </h2>
            <p className="mt-3 text-sm text-neutral-400 font-mono max-w-xl">
              For registrations, rule clarifications, logistics and inquiries, contact the event student coordinators directly.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-950 p-3 border border-neutral-800">
            <ShieldStar weight="bold" className="size-4 text-[#ff5500]" />
            <span>ASTHRA 11.0 TECHNICAL COMMITTEE</span>
          </div>
        </div>

        {/* Coordinators Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {EVENT_DATA.coordinators.map((coordinator, idx) => (
            <div
              key={coordinator.name}
              className="p-8 bg-neutral-950 border-2 border-neutral-800 hover:border-[#ff5500] transition-all duration-300 shadow-[6px_6px_0px_0px_#27272a] hover:shadow-[6px_6px_0px_0px_#ff5500] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#ff5500] font-black">
                      0{idx + 1}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">
                        CO-ORDINATOR
                      </span>
                      <span className="text-xs font-mono text-[#ff5500] font-bold uppercase">
                        {coordinator.role}
                      </span>
                    </div>
                  </div>

                  <IdentificationCard weight="bold" className="size-6 text-neutral-600" />
                </div>

                <div className="mt-6">
                  <h3 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
                    {coordinator.name}
                  </h3>
                  <p className="text-xs text-neutral-400 font-mono mt-1">
                    Student Lead // ASTHRA 11.0 Operations
                  </p>
                </div>

                {/* Phone Contact Display Box */}
                <div className="mt-6 p-4 bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-black border border-neutral-700 flex items-center justify-center text-[#ff5500]">
                      <PhoneCall weight="bold" className="size-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-neutral-500 block">
                        PHONE NUMBER
                      </span>
                      <span className="text-sm sm:text-base font-mono font-black tracking-wider text-white">
                        {coordinator.displayPhone}
                      </span>
                    </div>
                  </div>

                  {/* Copy Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(coordinator)}
                    className="px-3 py-1.5 bg-black border border-neutral-700 hover:border-[#ff5500] text-xs font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copiedName === coordinator.name ? (
                      <>
                        <Check weight="bold" className="size-3.5 text-green-400" />
                        <span className="text-[10px] text-green-400 font-bold">COPIED</span>
                      </>
                    ) : (
                      <>
                        <Copy weight="bold" className="size-3.5 text-[#ff5500]" />
                        <span className="text-[10px] uppercase">COPY</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 pt-4 border-t border-neutral-900 grid grid-cols-2 gap-3 font-mono text-xs">
                <a
                  href={`tel:${coordinator.phone.replace(/\s+/g, "")}`}
                  onClick={() => sound.playClick(1000)}
                  className="py-3 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-center tracking-wider uppercase transition-all shadow-[3px_3px_0px_0px_#ffffff] flex items-center justify-center gap-2"
                >
                  <PhoneCall weight="bold" className="size-4" />
                  <span>CALL DIRECT</span>
                </a>

                <a
                  href={`mailto:${coordinator.email}`}
                  onClick={() => sound.playClick(800)}
                  className="py-3 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-neutral-200 text-center tracking-wider uppercase transition-all flex items-center justify-center gap-2"
                >
                  <EnvelopeSimple weight="bold" className="size-4" />
                  <span>EMAIL INQUIRY</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


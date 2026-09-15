"use client";

import { EVENT_DATA } from "@/constants";
import { IdentificationCard, ShieldStar } from "@phosphor-icons/react";

export function CoordinatorsSection() {
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
            <span>CRACK-THE-LOCK TECHNICAL TEAM</span>
          </div>
        </div>

        {/* Coordinators Grid: Minimized Cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
          {EVENT_DATA.coordinators.map((coordinator, idx) => (
            <div
              key={coordinator.name}
              className="p-5 sm:p-6 bg-neutral-950 border-2 border-neutral-800 hover:border-[#ff5500] transition-all duration-300 shadow-[4px_4px_0px_0px_#27272a] hover:shadow-[4px_4px_0px_0px_#ff5500] flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-neutral-900 border border-neutral-700 flex items-center justify-center text-[#ff5500] font-black text-sm group-hover:border-[#ff5500] transition-colors">
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

                <IdentificationCard weight="bold" className="size-5 text-neutral-600 group-hover:text-[#ff5500] transition-colors" />
              </div>

              <div className="mt-5 pt-1">
                <h3 className="text-xl sm:text-2xl font-black uppercase text-white tracking-tight group-hover:text-[#ff5500] transition-colors">
                  {coordinator.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


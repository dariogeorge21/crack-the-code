"use client";

import { EVENT_DATA } from "@/lib/event-data";
import { sound } from "@/lib/sound";
import { 
  ShieldCheck, 
  Clock, 
  UsersThree, 
  TreeStructure, 
  Desktop, 
  DeviceMobileSlash, 
  ChatSlash, 
  Prohibit, 
  Megaphone, 
  WarningDiamond, 
  Gavel
} from "@phosphor-icons/react";

export function RulesSection() {
  const getRuleIcon = (id: string) => {
    switch (id) {
      case "R01":
        return <UsersThree weight="bold" className="size-5 text-[#ff5500]" />;
      case "R02":
        return <Clock weight="bold" className="size-5 text-[#ff5500]" />;
      case "R03":
        return <TreeStructure weight="bold" className="size-5 text-[#ff5500]" />;
      case "R04":
        return <Desktop weight="bold" className="size-5 text-[#ff5500]" />;
      case "R05":
        return <DeviceMobileSlash weight="bold" className="size-5 text-red-500" />;
      case "R06":
        return <ChatSlash weight="bold" className="size-5 text-red-500" />;
      case "R07":
        return <Prohibit weight="bold" className="size-5 text-red-500" />;
      case "R08":
        return <Megaphone weight="bold" className="size-5 text-[#ff5500]" />;
      case "R09":
        return <WarningDiamond weight="bold" className="size-5 text-[#ff5500]" />;
      case "R10":
        return <Gavel weight="bold" className="size-5 text-[#ff5500]" />;
      default:
        return <ShieldCheck weight="bold" className="size-5 text-[#ff5500]" />;
    }
  };

  return (
    <section
      id="rules"
      className="relative py-24 px-4 sm:px-6 lg:px-12 bg-[#0a0a0c] border-b border-[#27272a] scroll-mt-12"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="pb-12 border-b border-neutral-800 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-[10px] font-mono tracking-widest text-[#ff5500] uppercase mb-3">
              <span className="w-2 h-2 bg-[#ff5500]" />
              CODE OF CONDUCT & PROTOCOLS
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight text-white">
              RULES & REGULATIONS
            </h2>
            <p className="mt-3 text-sm text-neutral-400 font-mono max-w-2xl">
              Strict adherence to operational protocols is enforced throughout the entire 3-hour duration of CRACK THE LOCK.
            </p>
          </div>

          <div className="p-4 bg-neutral-950 border border-neutral-800 font-mono text-xs max-w-sm">
            <span className="text-red-500 font-bold block mb-1">
              ZERO-TOLERANCE POLICY:
            </span>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Unfair practices, unauthorized devices, or inter-team collusions trigger instantaneous termination of candidacy.
            </p>
          </div>
        </div>

        {/* 10 Rules Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {EVENT_DATA.rules.map((rule, idx) => (
            <div
              key={rule.id}
              onMouseEnter={() => sound.playClick(1000 + idx * 30)}
              className={`p-5 rounded-none border flex flex-col justify-between transition-all duration-300 font-mono ${
                rule.critical
                  ? "bg-neutral-950 border-red-500/50 hover:border-red-500 hover:shadow-[4px_4px_0px_0px_#ef4444]"
                  : "bg-neutral-950/70 border-neutral-800 hover:border-[#ff5500] hover:shadow-[4px_4px_0px_0px_#ff5500]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800/80">
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 ${
                      rule.critical
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : "bg-[#ff5500]/10 text-[#ff5500] border border-[#ff5500]/30"
                    }`}
                  >
                    RULE {rule.id}
                  </span>
                  {getRuleIcon(rule.id)}
                </div>

                <h4 className="text-sm font-bold uppercase text-white tracking-wide">
                  {rule.title}
                </h4>

                <p className="mt-2 text-xs text-neutral-300 leading-relaxed font-sans">
                  {rule.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-900 flex items-center justify-between text-[10px] text-neutral-500">
                <span>PROTOCOL ENFORCED</span>
                <span>{rule.critical ? "CRITICAL" : "STANDARD"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

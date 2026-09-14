"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AirplaneTakeoff,
  TerminalWindow,
  ListNumbers,
  Info,
  WarningCircle,
} from "@phosphor-icons/react";

const EVENT_LOG = [
  { step: 1, action: "ENTER", target: "Rahul" },
  { step: 2, action: "CHECKIN", target: "Rahul" },
  { step: 3, action: "ENTER", target: "Anu" },
  { step: 4, action: "ENTER", target: "David" },
  { step: 5, action: "CHECKIN", target: "Anu" },
  { step: 6, action: "NEXT", target: "Rahul" },
  { step: 7, action: "CHECKIN", target: "David" },
  { step: 8, action: "SCREEN", target: "Rahul" },
  { step: 9, action: "ENTER", target: "Maria" },
  { step: 10, action: "CHECKIN", target: "Maria" },
  { step: 11, action: "NEXT", target: "Anu" },
  { step: 12, action: "SCREEN", target: "Anu" },
  { step: 13, action: "NEXT", target: "David" },
  { step: 14, action: "SCREEN", target: "David" },
  { step: 15, action: "ENTER", target: "John" },
  { step: 16, action: "NEXT", target: "Maria" },
  { step: 17, action: "CHECKIN", target: "John" },
  { step: 18, action: "SCREEN", target: "Maria" },
  { step: 19, action: "NEXT", target: "John" },
];

interface AirportProblemPaneProps {
  round?: number;
}

export function AirportProblemPane({ round = 3 }: AirportProblemPaneProps = {}) {
  const [activeTab, setActiveTab] = useState<"desc" | "log" | "rules">("desc");

  return (
    <div className="flex flex-col h-full bg-[#0a0a0d] border border-neutral-800 text-neutral-300 font-sans select-text overflow-hidden">
      {/* Problem Header Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-[#0d0d12] px-3 pt-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("desc")}
            className={`px-3 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "desc"
                ? "border-[#ff5500] text-[#ff5500] bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <TerminalWindow weight="bold" className="size-3.5" />
            <span>Description</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("log")}
            className={`px-3 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "log"
                ? "border-[#ff5500] text-[#ff5500] bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <ListNumbers weight="bold" className="size-3.5" />
            <span>Event Log (19 Steps)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`px-3 py-2 text-xs font-mono font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 border-b-2 ${
              activeTab === "rules"
                ? "border-[#ff5500] text-[#ff5500] bg-neutral-900/60"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Info weight="bold" className="size-3.5" />
            <span>Rules & Specs</span>
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-[#ff5500]/10 text-[#ff5500] border border-[#ff5500]/30">
            ROUND 0{round}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            MEDIUM
          </span>
        </div>
      </div>

      {/* Main Tab Content with custom scrollbar */}
      <div className="flex-1 overflow-y-auto p-5 text-sm space-y-6 scrollbar-thin scrollbar-thumb-neutral-700">
        {activeTab === "desc" && (
          <>
            {/* Title & Metadata */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#ff5500]">PROBLEM 0{round} //</span>
                <span className="text-xs font-mono text-neutral-500 uppercase">COCHIN AIRPORT SIMULATION</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                <AirplaneTakeoff weight="bold" className="size-6 text-[#ff5500]" />
                <span>Airport Security Checkpoint</span>
              </h1>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[11px]">
                  Tag: Queue (FIFO)
                </span>
                <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[11px]">
                  Simulation
                </span>
                <span className="px-2.5 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-300 font-mono text-[11px]">
                  Event Driven
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-950 border border-emerald-700/50 text-emerald-400 font-mono text-[11px]">
                  Target: 2-Digit Access Code
                </span>
              </div>
            </div>

            {/* Problem Statement Box */}
            <div className="bg-[#111116] border border-neutral-800 p-4 relative">
              <div className="text-[11px] font-mono font-bold text-[#ff5500] uppercase mb-2">
                Problem Statement
              </div>
              <p className="text-neutral-300 leading-relaxed text-xs sm:text-sm">
                <strong>Cochin International Airport</strong> has deployed an automated security management
                system to organize passengers at the security checkpoint.
              </p>
              <div className="mt-3 space-y-1.5 text-xs text-neutral-400 font-mono bg-black/40 p-3 border-l-2 border-[#ff5500]">
                <div>1. The passenger enters the airport terminal.</div>
                <div>2. The passenger checks in at the airline counter.</div>
                <div>3. After check-in, the passenger joins the waiting area for security screening.</div>
                <div>4. Security officers always screen the passenger who has been waiting the longest (FIFO).</div>
                <div>5. At various times, Airport Control requests the name of the passenger who will be screened next.</div>
              </div>
              <p className="text-neutral-300 mt-3 text-xs leading-relaxed">
                Your task is to simulate the events exactly as they occur in chronological order and determine the final <strong>Access Code</strong> to clear Round {round}.
              </p>
            </div>

            {/* Core Rules Quick Summary */}
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-2">
                Operations / Rules:
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-neutral-900/90 border border-neutral-800 p-2.5">
                  <span className="text-cyan-400 font-bold">ENTER &lt;name&gt;</span>
                  <p className="text-neutral-400 text-[11px] mt-1">
                    Passenger enters the airport. Has <em>no effect</em> on the waiting security line.
                  </p>
                </div>
                <div className="bg-neutral-900/90 border border-neutral-800 p-2.5">
                  <span className="text-emerald-400 font-bold">CHECKIN &lt;name&gt;</span>
                  <p className="text-neutral-400 text-[11px] mt-1">
                    Passenger joins the security waiting line (pushed into the FIFO queue).
                  </p>
                </div>
                <div className="bg-neutral-900/90 border border-neutral-800 p-2.5">
                  <span className="text-amber-400 font-bold">SCREEN</span>
                  <p className="text-neutral-400 text-[11px] mt-1">
                    Removes the passenger who has waited longest (pop from queue front).
                  </p>
                </div>
                <div className="bg-neutral-900/90 border border-neutral-800 p-2.5">
                  <span className="text-[#ff5500] font-bold">NEXT</span>
                  <p className="text-neutral-400 text-[11px] mt-1">
                    Airport Control requests who will be screened next (peek front passenger).
                  </p>
                </div>
              </div>
            </div>

            {/* Access Code Formula */}
            <div className="bg-neutral-950 border-2 border-[#ff5500]/60 p-4 relative">
              <div className="flex items-center gap-2 text-[#ff5500] font-mono font-bold text-xs uppercase mb-1">
                <ShieldCheck weight="bold" className="size-4" />
                <span>Access Code Formula</span>
              </div>
              <p className="text-xs text-neutral-300">
                After processing all 19 events, compute the 2-digit Access Code:
              </p>
              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-xs">
                <div className="p-2 bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px]">DIGIT 1 (TENS):</div>
                  <div className="text-white font-bold">Total passengers screened</div>
                </div>
                <div className="p-2 bg-neutral-900 border border-neutral-800">
                  <div className="text-neutral-400 text-[10px]">DIGIT 2 (UNITS):</div>
                  <div className="text-white font-bold">Passengers still waiting in line</div>
                </div>
              </div>
              <div className="mt-3 text-[11px] text-[#ff5500] font-mono font-bold">
                Output Format: Whenever NEXT appears, print the passenger name. Finally, print the 2-digit Access Code.
              </div>
            </div>
          </>
        )}

        {/* Tab 2: Full 19 Event Log Table */}
        {activeTab === "log" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-mono font-bold text-white uppercase">
                  Chronological Event Log (Steps 1 - 19)
                </h3>
                <p className="text-xs text-neutral-400 font-mono">
                  Simulate these events in order from Step 1 to Step 19.
                </p>
              </div>
              <span className="px-2 py-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                19 EVENTS
              </span>
            </div>

            <div className="border border-neutral-800 overflow-hidden font-mono text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 text-[11px]">
                    <th className="p-2.5 text-center w-16">#</th>
                    <th className="p-2.5 w-36">ACTION</th>
                    <th className="p-2.5">TARGET / PASSENGER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60 bg-[#0c0c10]">
                  {EVENT_LOG.map((item) => {
                    let actionBadge = "bg-neutral-800 text-neutral-300";
                    if (item.action === "ENTER") actionBadge = "bg-cyan-950/80 text-cyan-300 border border-cyan-800/60";
                    if (item.action === "CHECKIN") actionBadge = "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60";
                    if (item.action === "SCREEN") actionBadge = "bg-amber-950/80 text-amber-300 border border-amber-800/60";
                    if (item.action === "NEXT") actionBadge = "bg-[#ff5500]/20 text-[#ff5500] border border-[#ff5500]/60 font-bold";

                    return (
                      <tr key={item.step} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="p-2.5 text-center text-neutral-400 font-bold">{item.step}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 text-[10px] font-bold ${actionBadge}`}>
                            {item.action}
                          </span>
                        </td>
                        <td className="p-2.5 text-white font-bold">{item.target}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Rules & Hints */}
        {activeTab === "rules" && (
          <div className="space-y-4 font-mono text-xs">
            <div className="p-4 bg-neutral-900/80 border border-neutral-800">
              <h3 className="font-bold text-[#ff5500] uppercase mb-2 flex items-center gap-1.5">
                <WarningCircle weight="bold" className="size-4" />
                <span>Simulation Rules & Queue Mechanics</span>
              </h3>
              <ul className="space-y-2 text-neutral-300 list-disc list-inside text-xs leading-relaxed">
                <li>
                  <strong>FIFO Discipline:</strong> The security waiting line is strictly First-In, First-Out.
                  The passenger who calls <code>CHECKIN</code> earliest is at the front of the queue.
                </li>
                <li>
                  <strong>ENTER vs CHECKIN:</strong> When a passenger <code>ENTER</code>s, they are roaming the
                  terminal. They DO NOT join the screening queue until they <code>CHECKIN</code>.
                </li>
                <li>
                  <strong>SCREEN:</strong> Removes the front passenger from the waiting queue and increments the screened passenger counter.
                </li>
                <li>
                  <strong>NEXT:</strong> Looks at the front of the queue and prints their name. Does NOT remove them from the line.
                </li>
                <li>
                  <strong>Access Code Calculation:</strong>
                  <br />
                  First digit = Total number of passengers screened
                  <br />
                  Second digit = Number of passengers still waiting in the security line
                </li>
              </ul>
            </div>

            <div className="p-4 bg-black border border-neutral-800">
              <h4 className="text-neutral-400 font-bold uppercase mb-2">Algorithm Approach</h4>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Use a standard Queue or List structure (e.g. <code>list</code> or <code>collections.deque</code> in Python, or an array with head/tail pointers in C).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AirportProblemPane;

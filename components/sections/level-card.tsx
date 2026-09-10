"use client";

import { useState } from "react";
import Link from "next/link";
import { RoundData } from "@/lib/event-data";
import { 
  Lock, 
  LockOpen, 
  Key, 
  CheckCircle, 
  Lightbulb, 
  Cpu,
  Warning,
  TerminalWindow,
} from "@phosphor-icons/react";

interface LevelCardProps {
  round: RoundData;
  onOpenFeedback?: (roundNumber: number) => void;
}

export function LevelCard({ round }: LevelCardProps) {
  const isL1 = round.number === 1;

  // L1 Interactive unlock tester state
  const [digitInput, setDigitInput] = useState<string>("");
  const [isCracked, setIsCracked] = useState<boolean>(true); // default unlocked for L1
  const [feedbackMsg, setFeedbackMsg] = useState<string>("SYSTEM_OVERRIDE: UNLOCKED");
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const handleDigitPress = (digit: number) => {
    setDigitInput(digit.toString());

    // Single digit code for Level 1 is 7 (or any digit user wants to test)
    if (digit === 7) {
      setIsCracked(true);
      setFeedbackMsg("CORRECT KEY [7] // LEVEL 1 CLEARED!");
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      setFeedbackMsg(`TEST KEY [${digit}] REJECTED - TRY KEY 7`);
    }
  };

  return (
    <div
      className={`relative rounded-none border-2 flex flex-col justify-between transition-all duration-500 overflow-hidden ${
        isL1
          ? "border-[#ff5500] bg-neutral-950/95 shadow-[6px_6px_0px_0px_#ff5500] ring-1 ring-[#ff5500]/30"
          : "border-neutral-800 bg-[#0e0e11] grayscale contrast-125 opacity-80 hover:grayscale-0 hover:contrast-100 hover:opacity-100 hover:border-[#ff5500] hover:shadow-[6px_6px_0px_0px_#ffffff] group"
      }`}
    >
      {/* Corner indexing marker */}
      <div className="absolute top-0 right-0 px-3 py-1 bg-neutral-900 border-l border-b border-neutral-800 font-mono text-[10px] text-neutral-400">
        ROUND 0{round.number} / 04
      </div>

      {/* Card Body */}
      <div className="p-6 pb-6">
        {/* Top Badges & Lock State */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tighter px-2.5 py-0.5 ${
                isL1
                  ? "bg-[#ff5500] text-black"
                  : "bg-neutral-800 text-white group-hover:bg-[#ff5500] group-hover:text-black transition-colors"
              }`}
            >
              {round.code}
            </span>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                STAGE IDENTIFIER
              </span>
              <span className="text-xs font-bold text-neutral-200">
                {round.subtitle}
              </span>
            </div>
          </div>

          {/* Lock Icon Indicator */}
          <div>
            {isL1 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#ff5500]/10 border border-[#ff5500] text-[#ff5500]">
                <LockOpen weight="bold" className="size-5 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-wider">
                  UNLOCKED
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 border border-neutral-700 text-neutral-400 group-hover:text-[#ff5500] group-hover:border-[#ff5500] transition-colors">
                <Lock weight="bold" className="size-5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  LOCKED
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Round Name */}
        <h3 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-[#ff5500] transition-colors mt-2">
          {round.name}
        </h3>

        {/* Description */}
        <p className="mt-3 text-xs sm:text-sm text-neutral-300 leading-relaxed font-mono">
          {round.description}
        </p>

        {/* Interactive Feature for Level 1: Physical Activity Single-Digit Unlock Simulator */}
        {isL1 && (
          <div className={`mt-5 p-4 bg-neutral-900 border border-[#ff5500]/40 ${isShaking ? "animate-shake ring-2 ring-red-500" : ""}`}>
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800 text-xs font-mono">
              <span className="flex items-center gap-1 text-[#ff5500] font-bold">
                <Key weight="bold" className="size-3.5" />
                PHYSICAL STATION CIPHER:
              </span>
              <span className="text-[10px] text-neutral-400">SINGLE DIGIT KEY</span>
            </div>

            <p className="mt-2 text-[11px] text-neutral-400 font-mono">
              Find the hidden physical clue in the lab to punch in the single-digit key (Hint: <span className="text-white font-bold">7</span>):
            </p>

            {/* Interactive Single Digit Keypad */}
            <div className="mt-3 grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigitPress(d)}
                  className={`h-9 font-mono font-black text-xs transition-all border ${
                    digitInput === d.toString()
                      ? d === 7
                        ? "bg-[#ff5500] text-black border-[#ff5500]"
                        : "bg-red-500 text-white border-red-500"
                      : "bg-black text-neutral-200 border-neutral-700 hover:border-[#ff5500] hover:text-[#ff5500]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono">
              <span className={isCracked ? "text-[#ff5500] font-bold" : "text-neutral-400"}>
                {feedbackMsg}
              </span>
              <span className="text-neutral-500">PROP: TACTILE PUZZLE</span>
            </div>
          </div>
        )}

        {/* Locked Hover Hint for L2, L3, L4 */}
        {!isL1 && (
          <div className="mt-4 p-3 bg-neutral-900/60 border border-neutral-800 group-hover:border-neutral-700 transition-colors">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 group-hover:text-white transition-colors">
              <Warning weight="bold" className="size-3.5 text-neutral-500 group-hover:text-[#ff5500] transition-colors" />
              <span className="text-[11px] uppercase tracking-wider">
                REQUIRES CLEARING LEVEL 0{round.number - 1} TO UNLOCK
              </span>
            </div>
            {round.detailedMechanic && (
              <p className="mt-1.5 text-[11px] text-neutral-400 leading-normal">
                {round.detailedMechanic}
              </p>
            )}
            {round.number === 2 && (
              <div className="mt-3 pt-2 border-t border-neutral-800">
                <Link
                  href="/level2"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#ff5500] hover:bg-white text-black font-black uppercase text-[11px] tracking-wider transition-colors shadow-[2px_2px_0px_0px_#ffffff]"
                >
                  <TerminalWindow weight="bold" className="size-3.5" />
                  <span>ACCESS ROUND 02 ARENA</span>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Example Ideas Section */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80">
          <div className="flex items-center gap-2 mb-2.5">
            <Lightbulb weight="bold" className="size-3.5 text-[#ff5500]" />
            <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-neutral-300">
              EXAMPLE CHALLENGE IDEAS:
            </span>
          </div>
          <ul className="space-y-1.5">
            {round.example_ideas.map((idea, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-xs text-neutral-400 group-hover:text-neutral-200 transition-colors font-mono"
              >
                <span className="text-[#ff5500] font-bold mt-0.5">•</span>
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


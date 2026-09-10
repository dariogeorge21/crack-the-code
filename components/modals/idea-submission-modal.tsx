"use client";

import { useState, useEffect } from "react";
import { EVENT_DATA } from "@/lib/event-data";
import { 
  X, 
  PaperPlaneTilt, 
  CheckCircle, 
  Sparkle, 
  Lightbulb, 
  Terminal,
  ChatCircleText
} from "@phosphor-icons/react";

interface IdeaSubmissionModalProps {
  isOpen: boolean;
  initialRound?: number;
  onClose: () => void;
}

export function IdeaSubmissionModal({
  isOpen,
  initialRound = 1,
  onClose,
}: IdeaSubmissionModalProps) {
  const [selectedRound, setSelectedRound] = useState<number>(initialRound);
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [difficulty, setDifficulty] = useState("Medium-Hard");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0);

  useEffect(() => {
    setSelectedRound(initialRound);
  }, [initialRound, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ideaText.trim()) return;

    setIsSubmitted(true);
    setSubmittedCount((prev) => prev + 1);

    // Save locally
    try {
      const stored = JSON.parse(localStorage.getItem("crack_the_lock_ideas") || "[]");
      stored.push({
        round: selectedRound,
        name: name || "Anonymous Participant",
        college: college || "Affiliated Institution",
        idea: ideaText,
        difficulty,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem("crack_the_lock_ideas", JSON.stringify(stored));
    } catch {
      // Ignore
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setName("");
    setCollege("");
    setIdeaText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#0d0d10] border-2 border-[#ff5500] shadow-[8px_8px_0px_0px_#ffffff] rounded-none p-6 sm:p-8 font-mono text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          type="button"
          onClick={handleResetAndClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 w-9 h-9 bg-neutral-900 border border-neutral-700 hover:border-[#ff5500] hover:text-[#ff5500] flex items-center justify-center text-neutral-400 transition-colors"
        >
          <X weight="bold" className="size-5" />
        </button>

        {isSubmitted ? (
          /* Success State */
          <div className="py-8 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-[#ff5500] flex items-center justify-center text-black mb-4">
              <CheckCircle weight="bold" className="size-9" />
            </div>
            <span className="text-[10px] tracking-widest text-[#ff5500] uppercase font-bold">
              TRANSMISSION RECEIVED // ID: #CTL-{Math.floor(1000 + Math.random() * 9000)}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-white mt-1">
              THANK YOU FOR YOUR IDEA!
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-neutral-300 max-w-md font-mono leading-relaxed">
              Your challenge proposal for{" "}
              <span className="text-[#ff5500] font-bold">
                LEVEL 0{selectedRound}: {EVENT_DATA.rounds[selectedRound - 1]?.name}
              </span>{" "}
              has been recorded and routed to the ASTHRA 11.0 technical design committee.
            </p>
            <div className="mt-6 p-3 bg-neutral-900 border border-neutral-800 text-xs text-neutral-400">
              Total Community Ideas Logged:{" "}
              <span className="text-[#ff5500] font-bold">{submittedCount} suggestions</span>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="mt-6 px-8 py-3 bg-[#ff5500] hover:bg-white text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_#ffffff]"
            >
              RETURN TO ARENA
            </button>
          </div>
        ) : (
          /* Form State */
          <div>
            {/* Header */}
            <div className="border-b border-neutral-800 pb-4 mb-6">
              <div className="flex items-center gap-2 text-xs text-[#ff5500] font-bold tracking-widest uppercase mb-1">
                <Sparkle weight="bold" className="size-4" />
                ASTHRA 11.0 COMMUNITY BRAINSTORM
              </div>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                {EVENT_DATA.call_to_action.heading}
              </h2>
              <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
                {EVENT_DATA.call_to_action.description}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Round Selector */}
              <div>
                <label className="block text-xs uppercase font-bold text-neutral-300 mb-2">
                  Select Target Round:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {EVENT_DATA.rounds.map((r) => (
                    <button
                      key={r.number}
                      type="button"
                      onClick={() => {
                        setSelectedRound(r.number);
                      }}
                      className={`p-2 text-left border text-xs font-mono transition-all ${
                        selectedRound === r.number
                          ? "bg-[#ff5500] text-black border-[#ff5500] font-black"
                          : "bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-600"
                      }`}
                    >
                      <span className="block text-[10px] opacity-80">{r.code}</span>
                      <span className="block font-bold truncate">{r.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name and College Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                    Your Name / Handle:
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Rivera"
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-[#ff5500] text-white text-xs outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                    College / Organization:
                  </label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Dept of CS / Asthra"
                    className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-[#ff5500] text-white text-xs outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Difficulty Rating */}
              <div>
                <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                  Target Difficulty Level:
                </label>
                <div className="flex gap-2">
                  {["Medium", "Medium-Hard", "Hard", "Insane / CTF"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        setDifficulty(lvl);
                      }}
                      className={`flex-1 py-1.5 px-2 text-[11px] border font-mono transition-all ${
                        difficulty === lvl
                          ? "bg-neutral-800 text-[#ff5500] border-[#ff5500] font-bold"
                          : "bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Idea Description */}
              <div>
                <label className="block text-xs uppercase font-bold text-neutral-300 mb-1">
                  Describe Your Challenge Concept:
                </label>
                <textarea
                  required
                  rows={4}
                  value={ideaText}
                  onChange={(e) => setIdeaText(e.target.value)}
                  placeholder="Explain the puzzle premise, physical/code mechanic, constraints, and how teams solve or unlock the stage..."
                  className="w-full px-3 py-2.5 bg-neutral-950 border border-neutral-800 focus:border-[#ff5500] text-white text-xs outline-none transition-colors resize-none font-mono"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#ff5500] hover:bg-white text-black font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 transition-all shadow-[4px_4px_0px_0px_#ffffff] cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
                >
                  <PaperPlaneTilt weight="bold" className="size-4" />
                  <span>TRANSMIT CHALLENGE SUGGESTION</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


"use client";

import { useState, useEffect } from "react";
import { Team } from "@/types";
import { 
  Lock, 
  ShieldWarning, 
  X, 
  Key 
} from "@phosphor-icons/react";

interface GameAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTeamVerified: (team: Team) => void;
}

export function GameAuthModal({
  isOpen,
  onClose,
  onTeamVerified,
}: GameAuthModalProps) {
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCode("");
      setErrorMsg(null);
      setIsLoading(false);
    }
  }, [isOpen]);

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

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/game/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || "INVALID ACCESS CODE // ACCESS DENIED");
        setIsLoading(false);
        return;
      }

      if (data.success && data.team) {
        onClose();
        onTeamVerified(data.team);
      }
    } catch {
      setErrorMsg("NETWORK ERROR // UNABLE TO REACH AUTH SERVER");
    } finally {
      setIsLoading(false);
    }
  };

  const appendKey = (digit: string) => {
    if (code.length < 3) {
      setCode((prev) => prev + digit);
    }
  };

  const backspaceKey = () => {
    setCode((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-[#0b0b0e] border-2 border-[#ff5500] shadow-[8px_8px_0px_0px_#ffffff] rounded-none p-6 sm:p-8 font-mono text-white">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-8 h-8 bg-neutral-900 border border-neutral-700 hover:border-[#ff5500] hover:text-[#ff5500] flex items-center justify-center text-neutral-400 transition-colors"
        >
          <X weight="bold" className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 pb-4 mb-5 border-b border-neutral-800">
          <div className="w-7 h-7 bg-[#ff5500] flex items-center justify-center text-black font-black">
            <Lock weight="bold" className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-widest uppercase text-white">
              TEAM GATEWAY AUTHENTICATION
            </h3>
            <span className="text-[10px] text-neutral-400 tracking-wider">
              ASTHRA 11.0 // CRACK THE LOCK
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 bg-red-950/70 border border-red-500/70 text-red-400 text-xs flex items-center gap-2">
            <ShieldWarning weight="bold" className="size-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Team Code Entry */}
        <form onSubmit={handleVerifyCode} className="space-y-5">
          <div>
            <label className="block text-xs uppercase font-bold text-neutral-300 mb-2">
              ENTER 3-DIGIT TEAM CODE:
            </label>
            <div className="relative">
              <input
                type="text"
                autoFocus
                maxLength={3}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="e.g. 248"
                className="w-full px-4 py-3 bg-neutral-950 border-2 border-neutral-700 focus:border-[#ff5500] text-center text-2xl font-black tracking-[0.35em] text-[#ff5500] outline-none transition-colors"
              />
            </div>
            <p className="mt-1.5 text-[10px] text-neutral-500">
              Coordinators issued each team a unique 3-digit access credential.
            </p>
          </div>

          {/* Quick Tactile Keypad */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-neutral-900">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => appendKey(num)}
                className="py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-sm font-bold text-neutral-200 transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={backspaceKey}
              className="py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400 uppercase transition-colors"
            >
              DEL
            </button>
            <button
              type="button"
              onClick={() => appendKey("0")}
              className="py-2.5 bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-sm font-bold text-neutral-200 transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={() => setCode("")}
              className="py-2.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-400 uppercase transition-colors"
            >
              CLR
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || !code.trim()}
            className="w-full py-3.5 px-4 bg-[#ff5500] hover:bg-white text-black font-black text-xs tracking-widest uppercase transition-all shadow-[4px_4px_0px_0px_#ffffff] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer active:translate-y-0.5"
          >
            <Key weight="bold" className="size-4" />
            <span>{isLoading ? "VERIFYING TEAM CODE..." : "INITIALIZE SESSION"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

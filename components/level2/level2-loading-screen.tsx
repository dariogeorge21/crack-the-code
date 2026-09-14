"use client";

import React from "react";
import { Lightning } from "@phosphor-icons/react";

interface Level2LoadingScreenProps {
  message?: string;
  subMessage?: string;
}

export function Level2LoadingScreen({
  message = "VERIFYING BIOMETRIC CLEARANCE & SECURITY TOKENS...",
  subMessage = "Connecting to Central Command Vault",
}: Level2LoadingScreenProps) {
  return (
    <div className="min-h-screen bg-[#07070a] text-white font-mono flex flex-col items-center justify-center p-4">
      <Lightning weight="fill" className="size-10 text-[#ff5500] animate-spin mb-4" />
      <div className="text-sm font-black tracking-widest uppercase text-center">
        {message}
      </div>
      <div className="text-xs text-neutral-500 mt-2">{subMessage}</div>
    </div>
  );
}


"use client";

import { useState } from "react";
import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { RoundsSection } from "@/components/rounds-section";
import { RulesSection } from "@/components/rules-section";
import { CoordinatorsSection } from "@/components/coordinators-section";
import { Footer } from "@/components/footer";
import { IdeaSubmissionModal } from "@/components/idea-submission-modal";

export default function Home() {
  const [isIdeasModalOpen, setIsIdeasModalOpen] = useState(false);
  const [selectedRoundForModal, setSelectedRoundForModal] = useState<number>(1);

  const handleOpenIdeasModal = (roundNum: number = 1) => {
    setSelectedRoundForModal(roundNum);
    setIsIdeasModalOpen(true);
  };

  const handleCloseIdeasModal = () => {
    setIsIdeasModalOpen(false);
  };

  return (
    <main className="min-h-screen bg-[#080808] text-[#f4f4f5] flex flex-col font-mono selection:bg-[#ff5500] selection:text-white">
      {/* Top HUD Navigation Bar */}
      <Navbar onOpenIdeasModal={() => handleOpenIdeasModal(1)} />

      {/* Hero Section: Full Screen, Huge Typography "CRACK THE LOCK", ASTHRA 11.0 */}
      <HeroSection onOpenIdeasModal={() => handleOpenIdeasModal(1)} />

      {/* 4 Rounds Showcase: Rectangles with 0 corner-border, L1 unlocked + L2-L4 locked with B&W hover */}
      <RoundsSection onOpenIdeasModal={handleOpenIdeasModal} />

      {/* Rules & Regulations Section: 10 points structured brutalist grid */}
      <RulesSection />

      {/* Organising Team & Coordinators: Karthik Gopal & Diya Krishna */}
      <CoordinatorsSection />

      {/* Footer */}
      <Footer />

      {/* Ideas Submission Modal: "HELP US BUILD THE EXPERIENCE!" */}
      <IdeaSubmissionModal
        isOpen={isIdeasModalOpen}
        initialRound={selectedRoundForModal}
        onClose={handleCloseIdeasModal}
      />
    </main>
  );
}


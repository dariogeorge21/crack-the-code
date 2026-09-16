import { RoundData, RuleItem, Coordinator } from "@/types";

export const EVENT_DATA = {
  event: {
    name: "CRACK THE LOCK",
    edition: "ASTHRA 11.0",
    type: "An Inter-Collegiate Technical Competition",
    tagline: "IDEAS TURN CHALLENGES",
    hero_message: "DIFFERENT CHALLENGES. ONE FINAL LOCK.",
    meta: {
      duration: "3 HOURS",
      teamSize: "2–3 MEMBERS",
      roundsCount: "4 PROGRESSIVE ROUNDS",
      venue: "Main Computing & Hardware Labs",
      status: "PROTOCOL ARMED",
    },
  },
  call_to_action: {
    heading: "HELP US BUILD THE EXPERIENCE!",
    description:
      "We’re designing the rounds for CRACK THE LOCK and we want your suggestions, opinions and creative ideas. The challenges should be of medium-hard level, interesting and engaging!",
  },
  rounds: [
    {
      number: 1,
      code: "L1",
      name: "PHYSICAL CHALLENGE",
      subtitle: "Teamwork & On-Site Activity",
      description:
        "A physical, on-site challenge to kickstart the game. Tests teamwork, speed, observation and presence of mind. This is a physical activity where you are asked to perform an activity. And a code and a single digit number will unlock Level 1.",
      detailedMechanic:
        "Physical Station Challenge: Solve the tactile puzzle in the lab to discover the single-digit cipher key [7] that releases the physical vault.",
      example_ideas: [
        "Arrange items in a specific order",
        "Find clues hidden around the lab",
        "Complete a hands-on task within a time limit",
        "Solve a puzzle using physical props",
      ],
      feedback_prompt: "YOUR IDEAS?",
      isUnlockedInitially: true,
      accentColor: "#FF5500",
    },
    {
      number: 2,
      code: "L2",
      name: "TECHNICAL CHALLENGE",
      subtitle: "Star Pattern & Geometric Matrix",
      description:
        "A DSA based pattern challenge. Construct geometrically symmetrical matrix lattices to calibrate central optical sensors.",
      detailedMechanic:
        "Matrix & Pattern Geometry: Construct symmetrical star pattern matrices to calibrate optical sensor grids and reveal Master Key coordinates.",
      example_ideas: [
        "Implement nested loops for geometric patterns",
        "Handle dynamic line spacing and indentation",
        "Maintain strict horizontal and vertical symmetry",
        "Optimize terminal output formatting",
      ],
      feedback_prompt: "YOUR IDEAS?",
      isUnlockedInitially: false,
      accentColor: "#FF6B00",
    },
    {
      number: 3,
      code: "L3",
      name: "TECHNICAL CHALLENGE",
      subtitle: "DSA & Event Queue Simulation",
      description:
        "A DSA based question and round. Technical problems involving algorithms, coding, debugging and real-time thinking.",
      detailedMechanic:
        "Time and event-driven FIFO simulation: Model airport security queue operations and calculate the 2-digit system access code.",
      example_ideas: [
        "Debug a given code",
        "Implement a specific algorithm",
        "Solve a problem with constraints",
        "Mini CTF / web or network based challenge",
      ],
      feedback_prompt: "YOUR IDEAS?",
      isUnlockedInitially: false,
      accentColor: "#FF772A",
    },
    {
      number: 4,
      code: "L4",
      name: "FINAL LOCK",
      subtitle: "Expert Level Problem Statement",
      description:
        "Expert level problem statement. The final and most challenging round that combines multiple skills. Unlock the last lock and claim victory!",
      detailedMechanic:
        "Multi-tiered system breach: Synthesize multi-source telemetry, construct a full exploit script, and crack the master cryptographic lock.",
      example_ideas: [
        "Multi-step challenge combining previous rounds",
        "A real-world inspired problem",
        "Identify clues from multiple sources",
        "A final puzzle to unlock the system",
      ],
      feedback_prompt: "YOUR SUGGESTIONS?",
      isUnlockedInitially: false,
      accentColor: "#FF4500",
    },
  ] as RoundData[],

  rules: [
    {
      id: "R01",
      title: "Team Size",
      description: "Team size: 2–3 members.",
    },
    {
      id: "R02",
      title: "Competition Duration",
      description: "Competition duration: 3 hours.",
    },
    {
      id: "R03",
      title: "Progressive Rounds",
      description: "The event consists of 4 progressive technical rounds.",
    },
    {
      id: "R04",
      title: "Authorized Resources",
      description: "Participants must use only the resources provided by the organizers.",
    },
    {
      id: "R05",
      title: "Device Restrictions",
      description: "Mobile phones and unauthorized devices are not allowed during the competition.",
      critical: true,
    },
    {
      id: "R06",
      title: "Zero Cross-Communication",
      description: "No communication or sharing of solutions between teams.",
      critical: true,
    },
    {
      id: "R07",
      title: "Fair Play & Disqualification",
      description: "Any form of cheating, hacking, or system manipulation will lead to disqualification.",
      critical: true,
    },
    {
      id: "R08",
      title: "Organizer Directives",
      description: "Participants must follow the instructions of the organizers.",
    },
    {
      id: "R09",
      title: "Technical Issues",
      description: "Technical issues must be reported immediately.",
    },
    {
      id: "R10",
      title: "Final Verdict",
      description: "Judges’/organizers’ decision will be final.",
    },
  ] as RuleItem[],

  coordinators: [
    {
      name: "Karthik Gopal",
      role: "Student Coordinator",
      phone: "+91 94461 82341",
      displayPhone: "+91 94461 82341",
      email: "karthik.asthra@college.edu",
    },
    {
      name: "Diya Krishna",
      role: "Student Coordinator",
      phone: "+91 98472 56190",
      displayPhone: "+91 98472 56190",
      email: "diya.asthra@college.edu",
    },
    {
      name: "Amal Roy",
      role: "Student Coordinator",
      phone: "+91 97453 18204",
      displayPhone: "+91 97453 18204",
      email: "amal.asthra@college.edu",
    },
  ] as Coordinator[],
};

// Society information checked against Imperial College Union on 22 September 2026.
export const society = {
  name: "Economics, Finance & Data Science Society",
  unionUrl: "https://www.imperialcollegeunion.org/activities/a-to-z/efds-soc",
  universityUrl: "https://www.imperial.ac.uk/",
  careersUrl: "https://www.imperial.ac.uk/careers/",
  libraryUrl: "https://www.imperial.ac.uk/library/",
};
export const publicNavigation = [
  { label: "About", href: "/about" }, { label: "Events", href: "/events" },
  { label: "Careers", href: "/careers" }, { label: "Research", href: "/research" },
  { label: "Resources", href: "/resources" }, { label: "Sponsors", href: "/sponsors" },
];
export const exploreNavigation = [...publicNavigation,
  { label: "Competitions", href: "/competitions" }, { label: "Committee", href: "/committee" },
  { label: "Contact", href: "/contact" },
  { label: "Ask EFDS", href: "/chat" },
];

// Sponsorship tiers supplied by the EFDS committee on 24 September 2026.
export const sponsors = [
  { name: "Optiver", tier: "Founding Partner", href: "https://www.optiver.com/", logo: "/sponsors/optiver.svg", logoWidth: 218, logoHeight: 48 },
  { name: "Cornerstone Research", tier: "Founding Partner", href: "https://www.cornerstone.com/", logo: "/sponsors/cornerstone-research.svg", logoWidth: 318, logoHeight: 40 },
  { name: "Jane Street", tier: "Sponsor", href: "https://www.janestreet.com/", logo: "/sponsors/jane-street.svg", logoWidth: 181, logoHeight: 49 },
] as const;

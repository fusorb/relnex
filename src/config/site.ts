// Shared site constants. Navigation now lives in @/config/layout (facet
// LayoutConfig) - keep only identity + validation constraints here.

export const siteConfig = {
  name: "Relnex",
  tagline: "Knowledge Infrastructure for the Digital Age",
  description:
    "Relnex is the knowledge infrastructure layer of the Fusorb ecosystem, powering digital libraries, learning resources, and structured content systems.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "https://relnex.example.com/og.png",

  // Global validation constraints.
  minPasswordLength: 8,
  usernameMinLength: 3,
  usernameMaxLength: 32,
  defaultPageSize: 20,
  maxPageSize: 100,
  maxUploadSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/markdown",
  ],

  supportEmail: "support@relnex.example.com",
};

export type SiteConfig = typeof siteConfig;

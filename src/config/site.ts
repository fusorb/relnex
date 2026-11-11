import { ResourceTypeRenderer } from "@prisma-client";

export const siteConfig = {
  name: "Relnex",
  tagline: "Knowledge Infrastructure for the Digital Age",
  description:
    "Relnex is the knowledge infrastructure layer of the Fusorb ecosystem, powering digital libraries, learning resources, and structured content systems.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "https://relnex.example.com/og.png",

  // 1. Dynamic UI Creation Layout Strategies mapped to Prisma Enums
  resourceCreationPaths: {
    [ResourceTypeRenderer.ARTICLE]: "/resources/create/editor",
    [ResourceTypeRenderer.NOTE]: "/resources/create/editor",
    [ResourceTypeRenderer.AI_OUTPUT]: "/resources/create/editor",
    [ResourceTypeRenderer.VIDEO]: "/resources/create/upload",
    [ResourceTypeRenderer.IMAGE]: "/resources/create/upload",
    [ResourceTypeRenderer.FILE]: "/resources/create/upload",
    [ResourceTypeRenderer.LINK]: "/resources/create/link",
    [ResourceTypeRenderer.MODULE]: "/resources/create/module",
  } as Record<ResourceTypeRenderer, string>,

  // 2. Navigation Clusters
  mainNavItems: [
    { label: "Home", href: "/" },
    { label: "Features", href: "/#features" },
    { label: "About", href: "/#about" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Docs", href: "/api-docs" },
  ],
  authNavItems: [
    { label: "Login", href: "/login" },
    { label: "Register", href: "/register" },
  ],
  dashboardNavItems: [
    { label: "Overview", href: "/dashboard", icon: "dashboard" },
    { label: "My Resources", href: "/resources", icon: "fileText" },
    { label: "Collections", href: "/collections", icon: "layers" },
    { label: "Settings", href: "/settings", icon: "settings" },
  ],

  // 3. Marketing Presentation Blocks (Keep these to keep your markup files generic)
  features: [
    {
      title: "Powerful Knowledge Graph",
      description:
        "Build interconnected resources with semantic relationships and hierarchical structures",
      icon: "knowledge",
    },
    {
      title: "Rich Content Management",
      description:
        "Support for articles, notes, videos, images, and more with advanced formatting",
      icon: "article",
    },
  ],

  // 4. Global Validation Constraints
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

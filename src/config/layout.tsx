// facet-layout LayoutConfigs for Relnex. Single source of navigation truth for
// the app shell (console sidebar, auth panel, landing nav). Built on the shared
// site constants in @/config/site. (.tsx: nav items carry <Icon> elements.)

import type { LayoutConfig } from "@fusorb/facet-layout";
import { Icon } from "@fusorb/facet-components";
import { siteConfig } from "@/config/site";

export { siteConfig };

/** Console (dashboard) shell: brand + navigation sections. */
export const consoleLayoutConfig: LayoutConfig = {
  brand: {
    name: siteConfig.name,
    tagline: siteConfig.tagline,
    footerText: `© ${new Date().getFullYear()} ${siteConfig.name}`,
  },
  navigation: [
    {
      title: "Workspace",
      items: [
        { href: "/dashboard", label: "Overview", icon: <Icon name="layout-dashboard" /> },
        { href: "/resources", label: "Resources", icon: <Icon name="library" /> },
        { href: "/collections", label: "Collections", icon: <Icon name="layers" /> },
      ],
    },
    {
      title: "Graph",
      items: [
        { href: "/graph", label: "Graph view", icon: <Icon name="share-2" /> },
        { href: "/tags", label: "Tags", icon: <Icon name="tags" /> },
      ],
    },
    {
      title: "Account",
      items: [{ href: "/settings", label: "Settings", icon: <Icon name="settings" /> }],
    },
  ],
  features: { tenantSwitcher: true, themeToggle: true, search: true },
};

/** Auth pages shell (login / register / MFA): branded split panel. */
export const authLayoutConfig: LayoutConfig = {
  brand: {
    name: siteConfig.name,
    tagline: siteConfig.tagline,
    benefits: [
      "One connected knowledge graph",
      "Typed relations between resources",
      "Collections, tags, and search",
    ],
    footerText: `© ${new Date().getFullYear()} ${siteConfig.name}`,
  },
  navigation: [],
};

/** Landing (marketing) top navigation. */
export const landingNav = [
  { href: "/#features", label: "Features" },
  { href: "/api-docs", label: "API" },
] as const;

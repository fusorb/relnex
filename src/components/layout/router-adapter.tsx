"use client";

// Next.js adapter for facet-layout's framework-agnostic RouterAdapter. facet
// components never import a router directly - they receive this so nav links
// render as Next <Link> and active state follows the App Router path.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import type { RouterAdapter, RouterLinkProps } from "@fusorb/facet-layout";

function AdapterLink({ href, children, onClick, ...rest }: RouterLinkProps) {
  return (
    <Link href={href} onClick={onClick as never} {...rest}>
      {children}
    </Link>
  );
}

export function useRouterAdapter(): RouterAdapter {
  const pathname = usePathname();
  return useMemo<RouterAdapter>(
    () => ({
      Link: AdapterLink,
      asPath: pathname,
      isActive: (href: string) =>
        href !== "/" && (pathname === href || pathname.startsWith(`${href}/`)),
    }),
    [pathname],
  );
}

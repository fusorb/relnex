import { AuthLayout } from "@fusorb/facet-layout";
import { authLayoutConfig } from "@/config/layout";

export default function AuthGroupLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout config={authLayoutConfig}>{children}</AuthLayout>;
}

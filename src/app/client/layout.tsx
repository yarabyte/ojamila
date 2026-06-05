import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="client-shell flex min-h-screen flex-col">
      <SiteHeader activePath="/client" />
      <div className="client-page-main flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

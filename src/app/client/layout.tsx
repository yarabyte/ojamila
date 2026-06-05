import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { ClientNav } from "@/components/client/client-nav";
import { getClientPhoneFromCookies } from "@/lib/client-session";

export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const phone = await getClientPhoneFromCookies();

  return (
    <div className="client-shell flex min-h-screen flex-col">
      <SiteHeader activePath="/client" />
      <div className={phone ? "client-page-main safe-bottom-nav flex-1" : "page-main flex-1"}>
        {children}
      </div>
      {phone ? <ClientNav /> : null}
      <SiteFooter />
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from "@clerk/clerk-react";
import { SEO } from "@/components/SEO";
import { ALLOWED_ADMIN_EMAILS, CLERK_ENABLED, hasClientAdminAccess } from "@/lib/config";
import { BarChart3, ClipboardList, Lock, Mail, ShieldCheck, Users, AlertTriangle } from "lucide-react";

type PreviewLead = {
  nombre?: string;
  email?: string;
  telefono?: string;
  tipoCliente?: string;
  tipoPropiedad?: string;
  zona?: string;
  intervencion?: string;
  plazo?: string;
  presupuesto?: string;
  mensaje?: string;
  source?: string;
  ts?: string;
};

const normalise = (value?: string) => (value ? value.replaceAll("-", " ") : "—");

function readPreviewLeads(): PreviewLead[] {
  try {
    const raw = sessionStorage.getItem("eivitech_leads");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function DashboardShell() {
  const { user } = useUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const hasAccess = hasClientAdminAccess(email);
  const [leads, setLeads] = useState<PreviewLead[]>([]);

  useEffect(() => {
    setLeads(readPreviewLeads());
  }, []);

  const stats = useMemo(() => {
    const urgent = leads.filter((lead) => lead.plazo === "urgente").length;
    const reforms = leads.filter((lead) => lead.intervencion === "reforma-integral").length;
    return { total: leads.length, urgent, reforms };
  }, [leads]);

  if (!hasAccess) {
    return (
      <section className="container-x py-20">
        <div className="max-w-2xl rounded-sm border border-border bg-card p-8 shadow-card">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Lock size={22} />
          </div>
          <h1 className="display-md mt-5">Acceso no autorizado</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Has iniciado sesión, pero este usuario no está incluido en la lista de acceso operativo del CRM.
            Pide a un administrador que valide tu email en Clerk o en la configuración segura del backend.
          </p>
          <div className="mt-6 flex items-center gap-3">
            <UserButton />
            <span className="text-sm text-muted-foreground">{email}</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container-x py-12 md:py-16">
      <div className="mb-10 flex flex-wrap items-start justify-between gap-6">
        <div>
          <div className="eyebrow">CRM Eivitech</div>
          <h1 className="display-lg mt-4">Dashboard operativa</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground leading-relaxed">
            Área privada para revisar solicitudes, priorizar oportunidades y preparar el seguimiento comercial.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-sm border border-border bg-card px-4 py-3 shadow-soft">
          <UserButton />
          <div className="text-sm">
            <div className="font-medium">Usuario autorizado</div>
            <div className="text-muted-foreground">{email}</div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={ClipboardList} label="Solicitudes en preview" value={stats.total.toString()} />
        <MetricCard icon={AlertTriangle} label="Marcadas como urgentes" value={stats.urgent.toString()} />
        <MetricCard icon={BarChart3} label="Reformas integrales" value={stats.reforms.toString()} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-sm border border-border bg-card p-6 shadow-card">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">Solicitudes recibidas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Vista de prueba basada en sessionStorage. Para producción, conectar Supabase/CRM con RLS y Clerk.
              </p>
            </div>
            <Link to="/contacto" className="text-sm text-primary hover:underline">
              Crear prueba →
            </Link>
          </div>

          {leads.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-sm text-muted-foreground">
              Aún no hay solicitudes de prueba en este navegador. Completa el formulario de contacto para verificar el flujo visual.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="py-3 pr-4">Lead</th>
                    <th className="py-3 pr-4">Proyecto</th>
                    <th className="py-3 pr-4">Plazo</th>
                    <th className="py-3 pr-4">Origen</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.slice().reverse().map((lead, index) => (
                    <tr key={`${lead.email}-${lead.ts}-${index}`} className="border-b border-border/70 align-top">
                      <td className="py-4 pr-4">
                        <div className="font-medium">{lead.nombre || "Lead sin nombre"}</div>
                        <div className="text-muted-foreground">{lead.email || "—"}</div>
                        <div className="text-muted-foreground">{lead.telefono || "—"}</div>
                      </td>
                      <td className="py-4 pr-4">
                        <div>{normalise(lead.intervencion)}</div>
                        <div className="text-muted-foreground">{normalise(lead.tipoPropiedad)} · {lead.zona || "Ibiza"}</div>
                      </td>
                      <td className="py-4 pr-4 capitalize">{normalise(lead.plazo)}</td>
                      <td className="py-4 pr-4">
                        <div>{lead.source || "web"}</div>
                        <div className="text-muted-foreground">{lead.ts ? new Date(lead.ts).toLocaleString() : "—"}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Panel icon={ShieldCheck} title="Seguridad y privacidad">
            <p>
              Esta dashboard no debe recibir claves secretas en variables VITE_ ni guardar datos sensibles en el código.
              La seguridad real del CRM debe aplicarse en backend o base de datos con políticas de acceso.
            </p>
          </Panel>
          <Panel icon={Users} title="Usuarios autorizados">
            <p>
              Acceso previsto para Daniele, Luciano y colaboradores aprobados. La lista visual actual viene de configuración pública.
              En producción se debe reforzar con Clerk Organizations, roles o RLS en el backend.
            </p>
            {ALLOWED_ADMIN_EMAILS.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-xs text-muted-foreground">
                {ALLOWED_ADMIN_EMAILS.map((allowed) => <li key={allowed}>{allowed}</li>)}
              </ul>
            )}
          </Panel>
          <Panel icon={Mail} title="Próximo paso CRM real">
            <p>
              Conectar el formulario a un endpoint seguro para guardar leads, enviar email al cliente y notificar a Eivitech.
            </p>
          </Panel>
        </aside>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-6 shadow-soft">
      <Icon size={20} className="text-primary" />
      <div className="mt-5 text-3xl font-medium tracking-tight">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof ShieldCheck; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground shadow-soft">
      <div className="mb-3 flex items-center gap-2 font-medium text-foreground">
        <Icon size={17} className="text-primary" /> {title}
      </div>
      {children}
    </div>
  );
}

const Dashboard = () => (
  <>
    <SEO
      title="CRM Dashboard | Eivitech Ibiza"
      description="Dashboard privada para gestión de solicitudes comerciales de Eivitech Ibiza."
      path="/dashboard"
    />

    {!CLERK_ENABLED ? (
      <section className="container-x py-20">
        <div className="max-w-2xl rounded-sm border border-border bg-card p-8 shadow-card">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock size={22} />
          </div>
          <h1 className="display-md mt-5">Clerk todavía no está configurado</h1>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            Añade la variable de entorno VITE_CLERK_PUBLISHABLE_KEY en GitHub Actions o en el entorno de deploy.
            No añadas nunca CLERK_SECRET_KEY al frontend ni al repositorio público.
          </p>
        </div>
      </section>
    ) : (
      <>
        <SignedOut>
          <section className="container-x py-20">
            <div className="max-w-2xl rounded-sm border border-border bg-card p-8 shadow-card">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Lock size={22} />
              </div>
              <h1 className="display-md mt-5">Acceso privado al CRM</h1>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Inicia sesión con una cuenta autorizada para acceder a la dashboard operativa de Eivitech.
              </p>
              <SignInButton mode="modal">
                <button className="mt-6 rounded-sm bg-primary px-5 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  Iniciar sesión
                </button>
              </SignInButton>
            </div>
          </section>
        </SignedOut>
        <SignedIn>
          <DashboardShell />
        </SignedIn>
      </>
    )}
  </>
);

export default Dashboard;

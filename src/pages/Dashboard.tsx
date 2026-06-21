import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SignInButton, SignedIn, SignedOut, UserButton, useAuth, useUser } from "@clerk/clerk-react";
import { SEO } from "@/components/SEO";
import { ALLOWED_ADMIN_EMAILS, CLERK_ENABLED, hasClientAdminAccess } from "@/lib/config";
import { fetchCrmLeads } from "@/lib/crm";
import {
  AlertTriangle,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  FileText,
  Flag,
  Gauge,
  Lock,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";

type PreviewLead = {
  id?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  priority?: string;
  score?: number;
  nombre?: string;
  email?: string;
  telefono?: string;
  tipoCliente?: string;
  tipoPropiedad?: string;
  zona?: string;
  intervencion?: string;
  tieneFotos?: string;
  tieneProyecto?: string;
  plazo?: string;
  presupuesto?: string;
  mensaje?: string;
  source?: string;
  landing_page?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  timestamp?: string;
  ts?: string;
  nextAction?: string;
};

type ApiLead = {
  id?: string;
  created_at?: string;
  updated_at?: string;
  status?: string;
  priority?: string;
  score?: number;
  nombre?: string;
  email?: string;
  telefono?: string;
  tipo_cliente?: string;
  tipo_propiedad?: string;
  zona?: string | null;
  intervencion?: string;
  tiene_fotos?: string;
  tiene_proyecto?: string;
  plazo?: string;
  presupuesto?: string | null;
  mensaje?: string | null;
  source?: string | null;
  landing_page?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  next_action?: string | null;
};

type PipelineStage = {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
};

const PIPELINE: PipelineStage[] = [
  { id: "solicitud", title: "Solicitud recibida", description: "Revisar datos, origen y calidad del lead.", icon: ClipboardList },
  { id: "valoracion", title: "Primera valoración", description: "Contactar y pedir fotos, vídeos o planos.", icon: MessageCircle },
  { id: "visita", title: "Visita / revisión", description: "Preparar sopralluogo o revisión técnica.", icon: CalendarCheck },
  { id: "presupuesto", title: "Presupuesto", description: "Definir alcance, materiales y propuesta.", icon: FileText },
  { id: "followup", title: "Follow-up", description: "Dar seguimiento hasta decisión del cliente.", icon: Phone },
  { id: "cerrado", title: "Trabajo cerrado", description: "Marcar oportunidad ganada o perdida.", icon: CheckCircle2 },
  { id: "resena", title: "Reseña / portfolio", description: "Solicitar reseña y valorar case study.", icon: Star },
];

const STATUS_STAGE_MAP: Record<string, string> = {
  new: "solicitud",
  first_contact: "valoracion",
  visit_review: "visita",
  proposal: "presupuesto",
  follow_up: "followup",
  won: "cerrado",
  lost: "cerrado",
  review_portfolio: "resena",
};

const SERVICE_LABELS: Record<string, string> = {
  "reforma-integral": "Reforma integral",
  bano: "Baño",
  cocina: "Cocina",
  instalaciones: "Instalaciones",
  exterior: "Exterior",
  "local-comercial": "Local comercial",
  otro: "Otro",
};

const PROPERTY_LABELS: Record<string, string> = {
  villa: "Villa",
  apartamento: "Apartamento",
  casa: "Casa",
  "local-comercial": "Local comercial",
  otro: "Otro",
};

const CLIENT_LABELS: Record<string, string> = {
  propietario: "Propietario",
  comprador: "Comprador",
  inversor: "Inversor",
  agencia: "Agencia",
  empresa: "Empresa",
  otro: "Otro",
};

const normalise = (value?: string, map?: Record<string, string>) => {
  if (!value) return "—";
  return map?.[value] ?? value.replaceAll("-", " ");
};

const getLeadDate = (lead: PreviewLead) => lead.created_at ?? lead.updated_at ?? lead.ts ?? lead.timestamp;

function mapApiLead(lead: ApiLead): PreviewLead {
  return {
    id: lead.id,
    created_at: lead.created_at,
    updated_at: lead.updated_at,
    status: lead.status,
    priority: lead.priority,
    score: typeof lead.score === "number" ? lead.score : undefined,
    nombre: lead.nombre,
    email: lead.email,
    telefono: lead.telefono,
    tipoCliente: lead.tipo_cliente,
    tipoPropiedad: lead.tipo_propiedad,
    zona: lead.zona ?? undefined,
    intervencion: lead.intervencion,
    tieneFotos: lead.tiene_fotos,
    tieneProyecto: lead.tiene_proyecto,
    plazo: lead.plazo,
    presupuesto: lead.presupuesto ?? undefined,
    mensaje: lead.mensaje ?? undefined,
    source: lead.source ?? undefined,
    landing_page: lead.landing_page ?? undefined,
    referrer: lead.referrer ?? undefined,
    utm_source: lead.utm_source ?? undefined,
    utm_medium: lead.utm_medium ?? undefined,
    utm_campaign: lead.utm_campaign ?? undefined,
    utm_content: lead.utm_content ?? undefined,
    utm_term: lead.utm_term ?? undefined,
    nextAction: lead.next_action ?? undefined,
  };
}

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

function scoreLead(lead: PreviewLead) {
  if (typeof lead.score === "number") return lead.score;
  let score = 30;
  if (lead.plazo === "urgente") score += 25;
  if (lead.intervencion === "reforma-integral") score += 15;
  if (lead.tipoPropiedad === "villa" || lead.tipoPropiedad === "local-comercial") score += 10;
  if (lead.tieneFotos === "si") score += 10;
  if (lead.tieneProyecto === "si" || lead.tieneProyecto === "en-proceso") score += 10;
  if (lead.presupuesto) score += 10;
  if (lead.utm_source || lead.source?.includes("landing")) score += 5;
  return Math.min(score, 100);
}

function getPriority(score: number) {
  if (score >= 75) return { label: "Alta", tone: "bg-destructive/10 text-destructive border-destructive/20" };
  if (score >= 55) return { label: "Media", tone: "bg-primary/10 text-primary border-primary/20" };
  return { label: "Baja", tone: "bg-muted text-muted-foreground border-border" };
}

function getNextAction(lead: PreviewLead) {
  if (lead.nextAction) return lead.nextAction;
  if (lead.plazo === "urgente") return "Contactar por WhatsApp hoy y confirmar necesidad real.";
  if (lead.tieneFotos !== "si") return "Pedir fotos, vídeo o planos antes de preparar valoración.";
  if (lead.tieneProyecto === "no") return "Aclarar si necesita visita previa o apoyo técnico.";
  if (!lead.presupuesto) return "Preguntar si tiene una referencia de presupuesto orientativo.";
  return "Preparar primera valoración y proponer siguiente paso.";
}

function inferStage(lead: PreviewLead) {
  if (lead.status && STATUS_STAGE_MAP[lead.status]) return STATUS_STAGE_MAP[lead.status];
  if (lead.tieneFotos !== "si") return "valoracion";
  if (lead.tieneProyecto === "si" || lead.tieneProyecto === "en-proceso") return "visita";
  return "solicitud";
}

function getOrigin(lead: PreviewLead) {
  return lead.utm_source || lead.source || lead.referrer || "web";
}

function getWhatsAppHref(lead: PreviewLead) {
  const rawPhone = (lead.telefono || "").replace(/[^+\d]/g, "");
  const phone = rawPhone.startsWith("+") ? rawPhone.slice(1) : rawPhone;
  const message = encodeURIComponent(
    `Hola ${lead.nombre || ""}, gracias por contactar con Eivitech. Hemos recibido la información sobre tu proyecto en Ibiza. ¿Puedes enviarnos fotos, vídeos o planos del estado actual para valorar el siguiente paso?`
  );
  return phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/34674735188?text=${message}`;
}

function DashboardShell() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const hasAccess = hasClientAdminAccess(email);
  const [leads, setLeads] = useState<PreviewLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<"database" | "preview">("database");

  useEffect(() => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadLeads() {
      setLoading(true);
      setLoadError(null);

      try {
        const token = await getToken();
        if (!token) throw new Error("Missing Clerk token");
        const data = await fetchCrmLeads(token);
        if (cancelled) return;
        setLeads(data.leads.map((lead) => mapApiLead(lead as ApiLead)));
        setDataSource("database");
      } catch (error) {
        if (cancelled) return;
        console.error("[dashboard] failed to load CRM leads", error);
        setLoadError("No se han podido cargar los leads desde PostgreSQL. Revisa Clerk, usuarios autorizados o la API Railway.");
        setLeads(readPreviewLeads());
        setDataSource("preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadLeads();

    return () => {
      cancelled = true;
    };
  }, [getToken, hasAccess]);

  const enrichedLeads = useMemo(() => (
    leads.map((lead, index) => ({
      ...lead,
      id: lead.id || `${lead.email || "lead"}-${getLeadDate(lead) || index}`,
      score: scoreLead(lead),
      stage: inferStage(lead),
      nextAction: getNextAction(lead),
      origin: getOrigin(lead),
    })).sort((a, b) => b.score - a.score)
  ), [leads]);

  const stats = useMemo(() => {
    const highPriority = enrichedLeads.filter((lead) => lead.score >= 75).length;
    const urgent = enrichedLeads.filter((lead) => lead.plazo === "urgente").length;
    const missingAssets = enrichedLeads.filter((lead) => lead.tieneFotos !== "si").length;
    const visitReady = enrichedLeads.filter((lead) => lead.stage === "visita").length;
    return { total: enrichedLeads.length, highPriority, urgent, missingAssets, visitReady };
  }, [enrichedLeads]);

  const pipelineCounts = useMemo(() => {
    return PIPELINE.reduce<Record<string, number>>((acc, stage) => {
      acc[stage.id] = enrichedLeads.filter((lead) => lead.stage === stage.id).length;
      return acc;
    }, {});
  }, [enrichedLeads]);

  const originCounts = useMemo(() => {
    return enrichedLeads.reduce<Record<string, number>>((acc, lead) => {
      acc[lead.origin] = (acc[lead.origin] || 0) + 1;
      return acc;
    }, {});
  }, [enrichedLeads]);

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
          <p className="mt-4 max-w-3xl text-muted-foreground leading-relaxed">
            Panel privado conectado al CRM real: formulario, API Railway, PostgreSQL, primera valoración,
            visita, presupuesto, follow-up, trabajo cerrado, reseña y portfolio.
          </p>
          <div className="mt-4 inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            Fuente de datos: {dataSource === "database" ? "PostgreSQL Railway" : "preview local del navegador"}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-sm border border-border bg-card px-4 py-3 shadow-soft">
          <UserButton />
          <div className="text-sm">
            <div className="font-medium">Usuario autorizado</div>
            <div className="text-muted-foreground">{email}</div>
          </div>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 rounded-sm border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <MetricCard icon={ClipboardList} label="Solicitudes" value={stats.total.toString()} helper="Total recibidas" />
        <MetricCard icon={Flag} label="Alta prioridad" value={stats.highPriority.toString()} helper="Score ≥ 75" />
        <MetricCard icon={AlertTriangle} label="Urgentes" value={stats.urgent.toString()} helper="Plazo urgente" />
        <MetricCard icon={MessageCircle} label="Pedir material" value={stats.missingAssets.toString()} helper="Faltan fotos/vídeo" />
        <MetricCard icon={CalendarCheck} label="Listas para visita" value={stats.visitReady.toString()} helper="Con info inicial" />
      </div>

      <div className="mt-8 rounded-sm border border-border bg-card p-6 shadow-card">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl">Pipeline comercial</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Flujo operativo basado en el funnel: web → CRM → visita → presupuesto → follow-up → trabajo cerrado → reseña.
            </p>
          </div>
          <Link to="/contacto" className="rounded-sm border border-border px-4 py-2 text-sm text-primary hover:bg-accent">
            Crear solicitud de prueba
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
          {PIPELINE.map((stage) => (
            <PipelineCard key={stage.id} stage={stage} count={pipelineCounts[stage.id] || 0} />
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-sm border border-border bg-card p-6 shadow-card">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl">Oportunidades priorizadas</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ordenadas por score operativo: urgencia, tipo de proyecto, material disponible, proyecto técnico y presupuesto.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-sm text-muted-foreground">
              Cargando solicitudes desde el CRM…
            </div>
          ) : enrichedLeads.length === 0 ? (
            <div className="rounded-sm border border-dashed border-border bg-background p-8 text-sm text-muted-foreground">
              Aún no hay solicitudes guardadas en el CRM. Completa el formulario de contacto para verificar el flujo real.
            </div>
          ) : (
            <div className="space-y-4">
              {enrichedLeads.map((lead) => {
                const priority = getPriority(lead.score);
                return (
                  <article key={lead.id} className="rounded-sm border border-border bg-background p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-xl">{lead.nombre || "Lead sin nombre"}</h3>
                          <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${priority.tone}`}>
                            Prioridad {priority.label} · {lead.score}/100
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>{lead.email || "Sin email"}</span>
                          <span>{lead.telefono || "Sin teléfono"}</span>
                          <span>{lead.zona || "Ibiza"}</span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <a href={getWhatsAppHref(lead)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-sm bg-[#25D366] px-3 py-2 text-xs font-medium text-white">
                          <MessageCircle size={14} /> WhatsApp
                        </a>
                        {lead.email && (
                          <a href={`mailto:${lead.email}?subject=Eivitech Ibiza | Hemos recibido tu solicitud`} className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-xs font-medium hover:bg-accent">
                            <Mail size={14} /> Email
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
                      <Info label="Cliente" value={normalise(lead.tipoCliente, CLIENT_LABELS)} />
                      <Info label="Propiedad" value={normalise(lead.tipoPropiedad, PROPERTY_LABELS)} />
                      <Info label="Intervención" value={normalise(lead.intervencion, SERVICE_LABELS)} />
                      <Info label="Plazo" value={normalise(lead.plazo)} />
                    </div>

                    <div className="mt-4 rounded-sm bg-accent/50 p-4 text-sm">
                      <div className="font-medium">Próxima acción recomendada</div>
                      <p className="mt-1 text-muted-foreground">{lead.nextAction}</p>
                    </div>

                    <div className="mt-4 grid gap-3 text-xs text-muted-foreground md:grid-cols-3">
                      <Info label="Fotos / vídeo" value={lead.tieneFotos === "si" ? "Sí" : "No"} />
                      <Info label="Proyecto técnico" value={normalise(lead.tieneProyecto)} />
                      <Info label="Origen" value={`${lead.origin}${lead.utm_campaign ? ` · ${lead.utm_campaign}` : ""}`} />
                    </div>

                    {lead.mensaje && (
                      <p className="mt-4 border-l-2 border-primary/40 pl-4 text-sm text-muted-foreground">
                        {lead.mensaje}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Panel icon={Gauge} title="KPI tree operativo">
            <ul className="space-y-2">
              <li><strong>Adquisición:</strong> origen, landing, UTM, campaña.</li>
              <li><strong>Activación:</strong> form_start, form_submit, quote_request.</li>
              <li><strong>Calidad lead:</strong> urgencia, fotos, proyecto técnico, presupuesto.</li>
              <li><strong>Ventas:</strong> visita, presupuesto, follow-up, cierre.</li>
              <li><strong>Post-trabajo:</strong> reseña, portfolio, referral.</li>
            </ul>
          </Panel>

          <Panel icon={BarChart3} title="Origen de solicitudes">
            {Object.keys(originCounts).length === 0 ? (
              <p>Aún no hay datos de origen.</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(originCounts).map(([origin, count]) => (
                  <div key={origin} className="flex items-center justify-between rounded-sm bg-background px-3 py-2">
                    <span>{origin}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel icon={CheckCircle2} title="Checklist de seguimiento">
            <ol className="list-decimal space-y-2 pl-5">
              <li>Revisar datos y fuente del lead.</li>
              <li>Contactar por WhatsApp o email.</li>
              <li>Pedir fotos, vídeos o planos si faltan.</li>
              <li>Confirmar zona, alcance y urgencia.</li>
              <li>Preparar visita o revisión del proyecto.</li>
              <li>Registrar presupuesto y siguiente follow-up.</li>
            </ol>
          </Panel>

          <Panel icon={ShieldCheck} title="Privacidad y seguridad">
            <p>
              La dashboard ya está preparada para leer datos del backend Railway/PostgreSQL. Para producción completa,
              revisa política de conservación, roles, permisos y validación legal/privacy antes de activar automatizaciones.
            </p>
          </Panel>

          <Panel icon={Users} title="Usuarios autorizados">
            <p>
              Acceso previsto para Daniele, Luciano y colaboradores aprobados. La seguridad real de lectura de datos se aplica
              en el backend con Clerk y la tabla crm_users.
            </p>
            {ALLOWED_ADMIN_EMAILS.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-xs text-muted-foreground">
                {ALLOWED_ADMIN_EMAILS.map((allowed) => <li key={allowed}>{allowed}</li>)}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </section>
  );
}

function MetricCard({ icon: Icon, label, value, helper }: { icon: LucideIcon; label: string; value: string; helper: string }) {
  return (
    <div className="rounded-sm border border-border bg-card p-5 shadow-soft">
      <Icon size={20} className="text-primary" />
      <div className="mt-4 text-3xl font-medium tracking-tight">{value}</div>
      <div className="mt-1 text-sm font-medium">{label}</div>
      <div className="mt-1 text-xs text-muted-foreground">{helper}</div>
    </div>
  );
}

function PipelineCard({ stage, count }: { stage: PipelineStage; count: number }) {
  const Icon = stage.icon;
  return (
    <div className="rounded-sm border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-2">
        <Icon size={17} className="text-primary" />
        <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-medium">{count}</span>
      </div>
      <div className="mt-4 text-sm font-medium">{stage.title}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{stage.description}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium capitalize text-foreground">{value}</div>
    </div>
  );
}

function Panel({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
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
            No añadas nunca claves secretas al frontend ni al repositorio público.
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

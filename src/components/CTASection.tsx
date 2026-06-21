import { Link } from "react-router-dom";
import { whatsappUrl } from "@/data/site";
import { track } from "@/lib/tracking";
import { tr } from "@/lib/i18n";

export function CTASection({
  eyebrow = tr("Siguiente paso", "Prossimo passo", "Next step"),
  title = tr("Cuéntanos qué propiedad quieres reformar", "Raccontaci quale proprietà vuoi ristrutturare", "Tell us which property you want to renovate"),
  description = tr("Una primera valoración sin compromiso. Cuanto más nos cuentes sobre el proyecto, mejor podremos orientarte.", "Una prima valutazione senza impegno. Più ci racconti del progetto, meglio potremo orientarti.", "An initial assessment with no obligation. The more you tell us about the project, the better we can guide you."),
  primary = { label: tr("Solicitar valoración", "Richiedi una valutazione", "Request an assessment"), to: "/contacto" },
  whatsappMessage = tr("Hola, me gustaría solicitar una valoración para mi proyecto en Ibiza.", "Ciao, vorrei richiedere una valutazione per il mio progetto a Ibiza.", "Hello, I would like to request an assessment for my project in Ibiza."),
  dark = true,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  primary?: { label: string; to: string };
  whatsappMessage?: string;
  dark?: boolean;
}) {
  return (
    <section className={`section ${dark ? "bg-ink text-cream" : "bg-accent"}`}>
      <div className="container-x grid gap-10 md:grid-cols-2 md:items-end">
        <div>
          <div className={`eyebrow ${dark ? "text-cream/70" : ""}`}>{eyebrow}</div>
          <h2 className="display-lg mt-4 max-w-xl">{title}</h2>
        </div>
        <div className="space-y-6">
          <p className={`text-lg leading-relaxed ${dark ? "text-cream/80" : "text-muted-foreground"}`}>{description}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to={primary.to}
              className="inline-flex items-center rounded-sm bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              {primary.label}
            </Link>
            <a
              href={whatsappUrl(whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track("whatsapp_click", { source: "cta_section" })}
              className={`inline-flex items-center rounded-sm border px-6 py-3.5 text-sm font-medium transition ${
                dark
                  ? "border-cream/30 text-cream hover:bg-cream/10"
                  : "border-foreground/20 text-foreground hover:bg-foreground/5"
              }`}
            >
              {tr("Hablar por WhatsApp", "Parla su WhatsApp", "Chat on WhatsApp")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

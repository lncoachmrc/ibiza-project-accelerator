import { tr } from "@/lib/i18n";

export type FAQ = { q: string; a: string };

export const GENERAL_FAQS: FAQ[] = [
  {
    q: tr("¿Qué tipo de reformas realiza Eivitech?", "Che tipo di ristrutturazioni realizza Eivitech?", "What type of renovations does Eivitech carry out?"),
    a: tr("Reformas integrales y parciales en viviendas, apartamentos, villas y locales comerciales en Ibiza, incluyendo instalaciones, acabados y carpintería a medida.", "Ristrutturazioni complete e parziali di case, appartamenti, ville e locali commerciali a Ibiza, inclusi impianti, finiture e falegnameria su misura.", "Full and partial renovations of homes, apartments, villas and commercial spaces in Ibiza, including installations, finishes and custom carpentry."),
  },
  {
    q: tr("¿Trabajáis en toda Ibiza?", "Lavorate in tutta Ibiza?", "Do you work across all Ibiza?"),
    a: tr("Trabajamos en proyectos ubicados en distintas zonas de la isla. En la primera valoración confirmamos disponibilidad según la ubicación y el tipo de intervención.", "Lavoriamo su progetti in diverse zone dell'isola. Nella prima valutazione confermiamo la disponibilità in base alla posizione e al tipo di intervento.", "We work on projects in different areas of the island. During the first assessment we confirm availability based on location and type of work."),
  },
  {
    q: tr("¿Puedo solicitar una valoración si todavía no tengo proyecto técnico?", "Posso richiedere una valutazione se non ho ancora un progetto tecnico?", "Can I request an assessment if I don't have a technical project yet?"),
    a: tr("Sí. Podemos ayudarte a definir el proyecto desde la idea inicial. Si ya cuentas con arquitecto o proyecto técnico, trabajamos directamente con esa documentación.", "Sì. Possiamo aiutarti a definire il progetto dall'idea iniziale. Se hai già un architetto o un progetto tecnico, lavoriamo direttamente su quella documentazione.", "Yes. We can help define the project from the initial idea. If you already have an architect or technical project, we work directly with that documentation."),
  },
  {
    q: tr("¿Qué información necesitáis para preparar una primera valoración?", "Quali informazioni servono per preparare una prima valutazione?", "What information do you need for an initial assessment?"),
    a: tr("Una descripción del tipo de propiedad, la ubicación aproximada, el tipo de intervención que tienes en mente y, si es posible, fotos o vídeos del estado actual.", "Una descrizione del tipo di proprietà, la posizione approssimativa, il tipo di intervento che hai in mente e, se possibile, foto o video dello stato attuale.", "A description of the property type, approximate location, the type of work you have in mind and, if possible, photos or videos of the current state."),
  },
  {
    q: tr("¿Realizáis reformas para locales comerciales?", "Realizzate ristrutturazioni per locali commerciali?", "Do you renovate commercial spaces?"),
    a: tr("Sí. Coordinamos reformas de bares, restaurantes y locales considerando funcionalidad, estética y normativa.", "Sì. Coordiniamo ristrutturazioni di bar, ristoranti e locali considerando funzionalità, estetica e normativa.", "Yes. We coordinate renovations of bars, restaurants and commercial spaces considering functionality, aesthetics and regulations."),
  },
  {
    q: tr("¿Puedo enviar fotos o vídeos del estado actual?", "Posso inviare foto o video dello stato attuale?", "Can I send photos or videos of the current state?"),
    a: tr("Sí. Puedes adjuntarlos al enviar el formulario o compartirlos directamente por WhatsApp.", "Sì. Puoi allegarli quando invii il modulo o condividerli direttamente via WhatsApp.", "Yes. You can attach them when sending the form or share them directly via WhatsApp."),
  },
  {
    q: tr("¿Cómo se define el presupuesto?", "Come viene definito il preventivo?", "How is the budget/proposal defined?"),
    a: tr("El presupuesto se define después de entender el alcance del proyecto y, cuando es posible, tras una visita o revisión del estado actual.", "Il preventivo viene definito dopo aver compreso la portata del progetto e, quando possibile, dopo una visita o una revisione dello stato attuale.", "The proposal is defined after understanding the project scope and, when possible, after a visit or review of the current state."),
  },
  {
    q: tr("¿Los plazos dependen del tipo de reforma?", "Le tempistiche dipendono dal tipo di ristrutturazione?", "Do timelines depend on the type of renovation?"),
    a: tr("Sí. Los plazos dependen del tipo de intervención y de la disponibilidad de materiales y profesionales en cada momento.", "Sì. Le tempistiche dipendono dal tipo di intervento e dalla disponibilità di materiali e professionisti in quel momento.", "Yes. Timelines depend on the type of work and the availability of materials and professionals at that time."),
  },
];

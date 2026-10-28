import { EventsSection } from "../components/EventsSection";
import { PageHelpButton } from "../components/tour/PageHelpButton";

export function EventosPage() {
  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-slate-900">Eventos</h2>
        <PageHelpButton />
      </div>
      <EventsSection />
    </div>
  );
}

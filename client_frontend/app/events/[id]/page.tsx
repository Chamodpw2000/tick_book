import { notFound } from "next/navigation";
import Link from "next/link";
import { fetchEventDetail } from "@/lib/events-data";
import { BookingPanel } from "@/components/booking-panel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EventDetailsPage({ params }: Readonly<PageProps>) {
  const resolvedParams = await params;
  const event = await fetchEventDetail(resolvedParams.id);

  if (!event) {
    notFound();
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* Back button */}
      <div className="mb-2">
        <Link href="/events" className="text-sm font-semibold text-cyan-200 transition hover:text-cyan-100">
          &larr; Back to Events
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Content: Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-slate-950/90 via-slate-900/85 to-cyan-950/70 p-6 shadow-[0_24px_120px_rgba(2,6,23,0.45)] backdrop-blur-md">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Poster Image */}
              <div className="w-full md:w-1/3 shrink-0">
                <div className="aspect-[9/16] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 relative">
                  {event.imageUrl ? (
                    <img src={event.imageUrl} alt={event.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-cyan-900/40 via-slate-800/20 to-transparent flex items-center justify-center text-center p-4">
                      <span className="text-white/20 text-2xl font-bold uppercase tracking-widest">{event.name}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Header Details */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-4 mb-4">
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200 border border-cyan-500/30">
                    {event.meta.split(' · ')[0] || 'Live Event'}
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">{event.name}</h1>
                
                <div className="flex flex-col gap-4 text-slate-300">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10">
                      <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Date & Time</p>
                      <p className="font-semibold text-white">{event.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/10">
                      <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Location</p>
                      <p className="font-semibold text-white">{event.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Description Section */}
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-md">
            <h2 className="mb-4 text-2xl font-bold text-white">About the Event</h2>
            <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </section>

          {/* Artists Section */}
          {event.artists && event.artists.length > 0 && (
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur-md">
              <h2 className="mb-6 text-2xl font-bold text-white">Artist Lineup</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {event.artists.map((artist) => (
                  <div key={artist.id} className="flex items-center gap-4 rounded-xl border border-white/5 bg-slate-900/50 p-4">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-slate-800 shrink-0">
                      {artist.imageUrl ? (
                        <img src={artist.imageUrl} alt={artist.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-cyan-900/30 text-cyan-200 text-xl font-bold">
                          {artist.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{artist.name}</h3>
                      {artist.bio && <p className="text-sm text-slate-400 line-clamp-2">{artist.bio}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar: Right Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <BookingPanel
              ticketTypes={event.ticketTypes}
              eventId={event.key}
              eventName={event.name}
              eventDate={event.date}
              eventLocation={event.location}
              eventImageUrl={event.imageUrl ?? null}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

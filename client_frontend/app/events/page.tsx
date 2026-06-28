import Link from "next/link";

import { EventsSearchBar } from "@/components/events-search-bar";
import { fetchEventCards } from "@/lib/events-data";

type EventsPageProps = {
  searchParams?: Promise<
    Readonly<{
    q?: string;
    }>
  >;
};

export default async function EventsPage({ searchParams }: Readonly<EventsPageProps>) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams?.q?.trim() ?? "";
  const events = await fetchEventCards({ query });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-[2rem] border border-white/10 bg-linear-to-br from-slate-950/90 via-slate-900/85 to-cyan-950/70 p-6 shadow-[0_24px_120px_rgba(2,6,23,0.45)] backdrop-blur-md">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">Event Directory</p>
              <h1 className="mt-2 text-3xl font-semibold text-white sm:text-4xl">View All Events</h1>
            </div>
            <Link href="/" className="text-sm font-semibold text-cyan-200 transition hover:text-cyan-100">
              Back to home
            </Link>
          </div>

          <EventsSearchBar initialQuery={query} />

          <p className="text-sm text-slate-300">
            {events.length} event{events.length === 1 ? "" : "s"} found{query ? ` for "${query}"` : ""}.
          </p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {events.map((item) => (
          <article key={item.key} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <div className="mb-4 aspect-[9/16] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="h-full w-full bg-linear-to-br from-cyan-300/35 via-cyan-100/10 to-transparent" />
              )}
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{item.date}</p>
            <h2 className="mt-2 text-lg font-semibold text-white">{item.name}</h2>
            <p className="mt-2 text-sm text-slate-300">{item.meta}</p>
            <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
              <span className="text-sm font-semibold text-amber-200">{item.location}</span>
              <span className="text-sm font-semibold text-white">{item.price}</span>
            </div>
            <Link
              href={`/events/${item.key}`}
              className="mt-4 block w-full rounded-lg border border-white/15 bg-white/5 py-2 text-center text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
            >
              Get Tickets
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

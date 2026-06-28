import Link from "next/link";

import { fetchEventCards } from "@/lib/events-data";

export default async function Home() {
  const featuredEvents = await fetchEventCards({ limit: 8 });

  const popularCategories = [
    "Concerts",
    "Sports",
    "Theatre",
    "Festivals",
    "Comedy",
    "Family",
    "Conferences",
    "Workshops",
  ];

  const trustHighlights = [
    "Instant e-ticket delivery",
    "Verified event organizers",
    "Seat map previews",
    "Secure card checkout",
    "24/7 customer support",
    "Fast refund handling",
  ];

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-linear-to-br from-slate-950/90 via-slate-900/85 to-cyan-950/70 shadow-[0_24px_120px_rgba(2,6,23,0.45)] backdrop-blur-md">
        <section className="p-6 lg:p-8">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
              Live Event Marketplace
            </div>

            <div className="space-y-4">
              <h1 className="max-w-5xl text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
                Find Your Next Live Moment in Seconds.
              </h1>
              <p className="max-w-4xl text-base leading-7 text-slate-300 sm:text-lg">
                Search concerts, sports, theatre, and more. Compare availability, secure your seats,
                and get tickets delivered instantly.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {popularCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/10"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section id="events" className="p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h2 className=" font-semibold uppercase tracking-[0.18em] text-2xl text-amber-200">
                Trending This Week
              </h2>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center rounded-full border border-cyan-200/30 bg-cyan-300/15 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_0_1px_rgba(34,211,238,0.08)] transition hover:border-cyan-200/50 hover:bg-cyan-300/25 hover:text-white"
            >
              View all events
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {featuredEvents.slice(0,4).map((item) => (
              <article key={item.key} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="mb-4 aspect-[9/16] w-full overflow-hidden rounded-xl border border-white/10 bg-slate-900/60">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-cyan-300/35 via-cyan-100/10 to-transparent" />
                  )}
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">{item.date}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{item.name}</h3>
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
          </div>
        </section>
      </div>

      <section>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          <h2 className="text-2xl font-semibold text-white">Why people book with Tickety</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trustHighlights.map((item) => (
              <div key={item} className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-slate-950/65 p-6 backdrop-blur-md">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">Need Group Bookings?</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Corporate events, schools, and fan clubs</h2>
          </div>
          <a
            href="https://wa.me/94703660915?text=Hi%20Sales%20Team%2C%20I%20need%20help%20with%20a%20group%20booking."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Contact Sales
          </a>
        </div>
      </section>
    </main>
  );
}

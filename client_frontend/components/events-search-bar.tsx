"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type EventsSearchBarProps = {
  initialQuery: string;
};

export function EventsSearchBar({ initialQuery }: EventsSearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(initialQuery);

  React.useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  React.useEffect(() => {
    const timeoutId = globalThis.setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const normalized = query.trim();
      const currentQuery = (searchParams.get("q") ?? "").trim();

      if (normalized === currentQuery) {
        return;
      }

      if (normalized) {
        params.set("q", normalized);
      } else {
        params.delete("q");
      }

      const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 300);

    return () => {
      globalThis.clearTimeout(timeoutId);
    };
  }, [query, pathname, router, searchParams]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex gap-2">
        <input
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search events, category, city, venue..."
          className="h-11 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-cyan-300/50"
        />

        {query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/10"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}

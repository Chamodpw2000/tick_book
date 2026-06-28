export type HomeEventCard = {
  key: string;
  name: string;
  meta: string;
  price: string;
  date: string;
  location: string;
  imageUrl: string | null;
};

type BackendEvent = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  startTime?: string | null;
  bannerUrl?: string | null;
  eventTicketTypes?: Array<{
    id?: number | string;
    name?: string | null;
    price?: number | null;
    description?: string | null;
    currency?: string | null;
    availableQuantity?: number | null;
  }> | null;
  venueDetails?: {
    name?: string | null;
    city?: string | null;
    address?: string | null;
  } | null;
  eventArtists?: Array<{
    artistId?: string | number | null;
    artistDetails?: {
      name?: string | null;
      bio?: string | null;
      profileImageUrl?: string | null;
    } | null;
  }> | null;
};

export type EventDetail = {
  key: string;
  name: string;
  description: string;
  meta: string;
  price: string;
  date: string;
  location: string;
  imageUrl: string | null;
  artists: Array<{
    id: string;
    name: string;
    bio: string;
    imageUrl: string | null;
  }>;
  ticketTypes: Array<{
    id: string;
    name: string;
    price: number;
    currency: string;
    description: string;
    availableQuantity: number;
  }>;
};

const FALLBACK_EVENTS: HomeEventCard[] = [
  {
    key: "fallback-1",
    name: "Neon Nights Festival",
    meta: "Electronic · Riverfront Grounds",
    price: "From LKR 4,500",
    date: "Fri, Jun 14",
    location: "Colombo",
    imageUrl: null,
  },
  {
    key: "fallback-2",
    name: "Champions Derby",
    meta: "Sports · National Stadium",
    price: "From LKR 2,000",
    date: "Sat, Jun 22",
    location: "Kandy",
    imageUrl: null,
  },
  {
    key: "fallback-3",
    name: "Broadway Spotlight",
    meta: "Theatre · Grand Hall",
    price: "From LKR 3,500",
    date: "Sun, Jul 07",
    location: "Galle",
    imageUrl: null,
  },
  {
    key: "fallback-4",
    name: "Comedy After Dark",
    meta: "Stand-up · Blue Box Arena",
    price: "From LKR 1,800",
    date: "Thu, Jul 18",
    location: "Negombo",
    imageUrl: null,
  },
];

const formatDateLabel = (input?: string | null) => {
  if (!input) return "Date TBA";
  const parsed = new Date(input);
  if (Number.isNaN(parsed.getTime())) return "Date TBA";

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "2-digit",
  }).format(parsed);
};

const formatPriceLabel = (event: BackendEvent) => {
  const prices = (event.eventTicketTypes ?? [])
    .map((ticket) => Number(ticket.price))
    .filter((value) => Number.isFinite(value) && value > 0);

  if (prices.length === 0) return "See pricing";

  const minPrice = Math.min(...prices);
  return `From LKR ${minPrice.toLocaleString()}`;
};

const mapBackendEventToCard = (event: BackendEvent): HomeEventCard => {
  const venueName = event.venueDetails?.name?.trim();
  const venueCity = event.venueDetails?.city?.trim();
  const category = event.category?.trim();
  const categoryLabel = category ? `${category.charAt(0).toUpperCase()}${category.slice(1)}` : null;

  return {
    key: String(event.id),
    name: event.title?.trim() || "Untitled Event",
    meta: [categoryLabel, venueName].filter(Boolean).join(" · ") || "Live event",
    price: formatPriceLabel(event),
    date: formatDateLabel(event.startTime),
    location: venueCity || venueName || "Venue TBA",
    imageUrl: event.bannerUrl?.trim() || null,
  };
};

const filterCards = (cards: HomeEventCard[], query?: string) => {
  const q = query?.trim().toLowerCase();
  if (!q) return cards;

  return cards.filter((card) => {
    const haystack = [card.name, card.meta, card.location, card.date].join(" ").toLowerCase();
    return haystack.includes(q);
  });
};

export const fetchEventCards = async (options?: {
  limit?: number;
  query?: string;
}): Promise<HomeEventCard[]> => {
  const baseUrl =
    process.env.EVENT_SERVICE_URL ?? process.env.NEXT_PUBLIC_EVENT_SERVICE_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${baseUrl}/events`, { cache: "no-store" });
    if (!response.ok) {
      const fallback = filterCards(FALLBACK_EVENTS, options?.query);
      return options?.limit ? fallback.slice(0, options.limit) : fallback;
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      const fallback = filterCards(FALLBACK_EVENTS, options?.query);
      return options?.limit ? fallback.slice(0, options.limit) : fallback;
    }

    const mapped = payload.map((event) => mapBackendEventToCard(event as BackendEvent));
    const filtered = filterCards(mapped, options?.query);

    if (filtered.length === 0 && !options?.query) {
      return options?.limit ? FALLBACK_EVENTS.slice(0, options.limit) : FALLBACK_EVENTS;
    }

    return options?.limit ? filtered.slice(0, options.limit) : filtered;
  } catch {
    const fallback = filterCards(FALLBACK_EVENTS, options?.query);
    return options?.limit ? fallback.slice(0, options.limit) : fallback;
  }
};

export const fetchEventDetail = async (id: string): Promise<EventDetail | null> => {
  const baseUrl =
    process.env.EVENT_SERVICE_URL ?? process.env.NEXT_PUBLIC_EVENT_SERVICE_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${baseUrl}/events`, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload)) {
      return null;
    }

    const event = payload.find((e) => String((e as BackendEvent).id) === id) as BackendEvent | undefined;
    if (!event) return null;

    const venueName = event.venueDetails?.name?.trim();
    const venueCity = event.venueDetails?.city?.trim();
    const category = event.category?.trim();
    const categoryLabel = category ? `${category.charAt(0).toUpperCase()}${category.slice(1)}` : null;

    return {
      key: String(event.id),
      name: event.title?.trim() || "Untitled Event",
      description: event.description?.trim() || "No description available.",
      meta: [categoryLabel, venueName].filter(Boolean).join(" · ") || "Live event",
      price: formatPriceLabel(event),
      date: formatDateLabel(event.startTime),
      location: venueCity || venueName || "Venue TBA",
      imageUrl: event.bannerUrl?.trim() || null,
      artists: (event.eventArtists || []).map((ea) => ({
        id: String(ea.artistId || Math.random()),
        name: ea.artistDetails?.name?.trim() || "Unknown Artist",
        bio: ea.artistDetails?.bio?.trim() || "",
        imageUrl: ea.artistDetails?.profileImageUrl?.trim() || null,
      })),
      ticketTypes: (event.eventTicketTypes || []).map((tt) => ({
        id: String(tt.id || Math.random()),
        name: tt.name?.trim() || "General Admission",
        price: Number(tt.price) || 0,
        currency: tt.currency?.trim() || "USD",
        description: tt.description?.trim() || "",
        availableQuantity: Number(tt.availableQuantity) || 0,
      })),
    };
  } catch {
    return null;
  }
};

import { useState } from "react";
import { Link } from "wouter";
import { Search, Film, Calendar, Tv as TvIcon, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Series {
  id: string;
  title: string;
  titleTh?: string;
  network: string;
  year: number;
  episodes: number;
  status: "completed" | "ongoing";
  ships: string[];
  description: string;
  genre: string[];
}

const SERIES: Series[] = [
  {
    id: "my-ambulance",
    title: "My Ambulance",
    network: "GMMTV",
    year: 2019,
    episodes: 16,
    status: "completed",
    ships: ["Fah x Meaw"],
    description:
      "Two paramedics with clashing personalities are forced to work together, gradually discovering a bond neither expected.",
    genre: ["Romance", "Drama", "Medical"],
  },
  {
    id: "hormones",
    title: "Hormones",
    network: "GTH / GMMTV",
    year: 2013,
    episodes: 26,
    status: "completed",
    ships: ["Tar x Kwan"],
    description:
      "The landmark Thai teen drama that tackled sexuality, identity, and first love with raw honesty — including a groundbreaking GL storyline.",
    genre: ["Drama", "Teen", "Coming of Age"],
  },
  {
    id: "girl-from-nowhere",
    title: "Girl From Nowhere",
    titleTh: "เด็กใหม่",
    network: "Netflix / GMMTV",
    year: 2018,
    episodes: 22,
    status: "completed",
    ships: ["Nanno x Yuri"],
    description:
      "A mysterious transfer student named Nanno exposes the dark secrets of every school she attends. Season 2 introduces Yuri — and the internet never recovered.",
    genre: ["Thriller", "Dark", "Supernatural"],
  },
  {
    id: "wanshin-papatsorn",
    title: "Wanshin Papatsorn",
    titleTh: "วันสิ้นปาฏิหาริย์",
    network: "LINE TV",
    year: 2021,
    episodes: 12,
    status: "completed",
    ships: ["Prae x Fon"],
    description:
      "A quiet love story about healing, second chances, and two women finding their way back to each other across time and circumstance.",
    genre: ["Romance", "Drama", "Slice of Life"],
  },
  {
    id: "close-friend",
    title: "Close Friend the Series",
    network: "LINE TV",
    year: 2021,
    episodes: 8,
    status: "completed",
    ships: ["Nan x Prae"],
    description:
      "An anthology of love stories celebrating friendship that blossoms into something more — including an intimate GL episode that became a fan favourite.",
    genre: ["Romance", "Anthology", "Friendship"],
  },
  {
    id: "check-out",
    title: "Check Out",
    network: "GMMTV",
    year: 2022,
    episodes: 10,
    status: "completed",
    ships: ["Mook x Ying"],
    description:
      "Rivals assigned as roommates, a messy apartment, and feelings neither girl planned for. Warm, funny, and unapologetically soft.",
    genre: ["Comedy", "Romance", "College"],
  },
  {
    id: "only-friends",
    title: "Only Friends",
    network: "GMMTV",
    year: 2023,
    episodes: 12,
    status: "completed",
    ships: ["Sand x June", "Mew x Top"],
    description:
      "A group of friends navigating polyamory, jealousy, and desire at a Bangkok resort — including a GL storyline that stood out for its honesty.",
    genre: ["Drama", "Romance", "Adult"],
  },
  {
    id: "my-ride",
    title: "My Ride",
    network: "GMMTV",
    year: 2022,
    episodes: 10,
    status: "completed",
    ships: ["Aom x Peak"],
    description:
      "A spontaneous road trip turns into something neither girl can explain. Tender, quiet, and full of longing glances and unsaid words.",
    genre: ["Romance", "Road Trip", "Slow Burn"],
  },
  {
    id: "secret-crush-on-you",
    title: "Secret Crush on You",
    network: "GMMTV",
    year: 2022,
    episodes: 12,
    status: "completed",
    ships: ["Toon x Ming"],
    description:
      "A musical theatre nerd pines for the cool, mysterious student across the dorm — a sweet GL romance full of colour, song, and heart.",
    genre: ["Musical", "Comedy", "Romance"],
  },
  {
    id: "the-gifted-graduation",
    title: "The Gifted Graduation",
    network: "GMM25",
    year: 2020,
    episodes: 12,
    status: "completed",
    ships: ["Dao x Ploy"],
    description:
      "The final chapter of The Gifted universe — where gifted students face their last test, and a fan-beloved GL tension keeps viewers glued.",
    genre: ["Drama", "Thriller", "Sci-Fi"],
  },
];

type FilterStatus = "all" | "completed" | "ongoing";

export default function SeriesPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filtered = SERIES.filter((s) => {
    const matchesQuery =
      !query ||
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      (s.titleTh ?? "").includes(query) ||
      s.network.toLowerCase().includes(query.toLowerCase()) ||
      s.ships.some((sh) => sh.toLowerCase().includes(query.toLowerCase())) ||
      s.genre.some((g) => g.toLowerCase().includes(query.toLowerCase()));
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Canon Series</h1>
        <p className="text-sm text-white/40">Thai GL series — officially aired and fan-celebrated</p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full h-10"
            placeholder="Search series, ships, network..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "completed", "ongoing"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === f
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              {f === "all" ? "All" : f === "completed" ? "Completed" : "Ongoing"}
            </button>
          ))}
        </div>

        <p className="text-xs text-white/30">{filtered.length} series</p>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">No series found</div>
        ) : (
          <div className="space-y-4">
            {filtered.map((series) => (
              <Link key={series.id} href={`/search?q=${encodeURIComponent(series.title)}`}>
                <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden cursor-pointer hover:border-primary/30 hover:bg-card/60 transition-all group">
                  {/* Top bar with accent */}
                  <div className="h-px w-full hairline-gold opacity-50" />

                  <div className="p-5">
                    {/* Title + status */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h2 className="font-bold text-white text-lg leading-tight">{series.title}</h2>
                        {series.titleTh && (
                          <p className="text-xs text-white/40 mt-0.5">{series.titleTh}</p>
                        )}
                      </div>
                      <span className={`flex-shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                        series.status === "completed"
                          ? "bg-primary/15 text-primary border-primary/25"
                          : "bg-secondary/15 text-secondary border-secondary/25"
                      }`}>
                        {series.status === "completed"
                          ? <CheckCircle2 className="w-3 h-3" />
                          : <Clock className="w-3 h-3" />}
                        {series.status === "completed" ? "Completed" : "Ongoing"}
                      </span>
                    </div>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-white/40 mb-3">
                      <span className="flex items-center gap-1.5">
                        <TvIcon className="w-3 h-3" /> {series.network}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" /> {series.year}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Film className="w-3 h-3" /> {series.episodes} eps
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-white/60 leading-relaxed mb-3 line-clamp-2">
                      {series.description}
                    </p>

                    {/* Ships + genres */}
                    <div className="flex flex-wrap items-center gap-2">
                      {series.ships.map((ship) => (
                        <span
                          key={ship}
                          className="text-[11px] px-2.5 py-0.5 rounded-full font-medium bg-primary/12 text-primary border border-primary/25"
                        >
                          {ship}
                        </span>
                      ))}
                      {series.genre.map((g) => (
                        <span key={g} className="text-[11px] px-2 py-0.5 rounded-full bg-white/6 text-white/40 border border-white/10">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

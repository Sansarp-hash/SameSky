import { useState } from "react";
import { Link } from "wouter";
import { Heart, Search, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Ship {
  id: string;
  name: string;
  series: string;
  year: number;
  actresses: [string, string];
  tags: string[];
  fansCount: number;
  status: "canon" | "near-canon" | "fan-ship";
}

const SHIPS: Ship[] = [
  {
    id: "fah-meaw",
    name: "Fah x Meaw",
    series: "My Ambulance",
    year: 2019,
    actresses: ["Bow Maylada", "Sammy Cowell"],
    tags: ["canon", "slow burn", "rivals to lovers"],
    fansCount: 12840,
    status: "canon",
  },
  {
    id: "nan-prae",
    name: "Nan x Prae",
    series: "Close Friend the Series",
    year: 2021,
    actresses: ["Pimfah Warisara", "Lookjun Panisa"],
    tags: ["canon", "friends to lovers", "sweet"],
    fansCount: 9210,
    status: "canon",
  },
  {
    id: "nanno-yuri",
    name: "Nanno x Yuri",
    series: "Girl From Nowhere",
    year: 2021,
    actresses: ["Chicha Amatayakul", "Chanya McClory"],
    tags: ["enemies to lovers", "dark", "intense"],
    fansCount: 31500,
    status: "near-canon",
  },
  {
    id: "sand-june",
    name: "Sand x June",
    series: "Only Friends",
    year: 2023,
    actresses: ["First Kanaphan", "Note Pichaya"],
    tags: ["complicated", "angst", "mutual pining"],
    fansCount: 7650,
    status: "near-canon",
  },
  {
    id: "mook-ying",
    name: "Mook x Ying",
    series: "Check Out",
    year: 2022,
    actresses: ["Namtarn Pichukkana", "Rinrada Ooprasert"],
    tags: ["canon", "roommates", "cozy"],
    fansCount: 5430,
    status: "canon",
  },
  {
    id: "tar-kwan",
    name: "Tar x Kwan",
    series: "Hormones",
    year: 2013,
    actresses: ["Wanida Termthanaporn", "Apinya Sakuljaroensuk"],
    tags: ["classic", "first love", "coming of age"],
    fansCount: 18900,
    status: "canon",
  },
  {
    id: "lily-rose",
    name: "Lily x Rose",
    series: "Love Love You",
    year: 2020,
    actresses: ["Mint Chalida", "Baifern Pimchanok"],
    tags: ["fan-ship", "iconic duo", "chemistry"],
    fansCount: 22100,
    status: "fan-ship",
  },
  {
    id: "dao-ploy",
    name: "Dao x Ploy",
    series: "The Gifted Graduation",
    year: 2020,
    actresses: ["Nita Tiwanon", "Urassaya Sperbund"],
    tags: ["fan-ship", "intense", "protect her"],
    fansCount: 8760,
    status: "fan-ship",
  },
  {
    id: "prae-fon",
    name: "Prae x Fon",
    series: "Wanshin Papatsorn",
    year: 2021,
    actresses: ["Achiraya Nitibhon", "Supichaya Jitpirom"],
    tags: ["canon", "soulmates", "healing"],
    fansCount: 6340,
    status: "canon",
  },
  {
    id: "aom-peak",
    name: "Aom x Peak",
    series: "My Ride",
    year: 2022,
    actresses: ["Praewa Suthamphong", "Pear Trisadee"],
    tags: ["near-canon", "slow burn", "tender"],
    fansCount: 4120,
    status: "near-canon",
  },
  {
    id: "toon-ming",
    name: "Toon x Ming",
    series: "Secret Crush on You",
    year: 2022,
    actresses: ["Nook Thanaluk", "Luknam Fah"],
    tags: ["fan-ship", "sweet", "opposites attract"],
    fansCount: 3870,
    status: "fan-ship",
  },
  {
    id: "nam-view",
    name: "Nam x View",
    series: "Cutie Pie",
    year: 2022,
    actresses: ["Bua Nalinthip", "Sarocha Chankimha"],
    tags: ["fan-ship", "soft", "aesthetic"],
    fansCount: 5210,
    status: "fan-ship",
  },
];

const STATUS_LABELS: Record<Ship["status"], string> = {
  canon: "Canon",
  "near-canon": "Near Canon",
  "fan-ship": "Fan Ship",
};

const STATUS_COLORS: Record<Ship["status"], string> = {
  canon: "bg-primary/15 text-primary border-primary/30",
  "near-canon": "bg-secondary/15 text-secondary border-secondary/30",
  "fan-ship": "bg-white/8 text-white/60 border-white/15",
};

type FilterStatus = "all" | Ship["status"];

export default function ShipsPage() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filtered = SHIPS.filter((s) => {
    const matchesQuery =
      !query ||
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.series.toLowerCase().includes(query.toLowerCase()) ||
      s.actresses.some((a) => a.toLowerCase().includes(query.toLowerCase())) ||
      s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase()));
    const matchesFilter = filter === "all" || s.status === filter;
    return matchesQuery && matchesFilter;
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Ships</h1>
        <p className="text-sm text-white/40">Beloved GL pairings from Thai series and fan communities</p>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <Input
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-full h-10"
            placeholder="Search ships, series, actresses..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "canon", "near-canon", "fan-ship"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                filter === f
                  ? "bg-white/10 border-white/20 text-white"
                  : "border-white/10 text-white/50 hover:text-white hover:border-white/20"
              }`}
            >
              {f === "all" ? "All Ships" : STATUS_LABELS[f]}
            </button>
          ))}
        </div>

        {/* Stats */}
        <p className="text-xs text-white/30">{filtered.length} ship{filtered.length !== 1 ? "s" : ""}</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-white/30 text-sm">No ships found</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((ship) => (
              <Link key={ship.id} href={`/search?q=${encodeURIComponent(ship.name)}`}>
                <div
                  className="relative rounded-xl border border-border/60 bg-card/40 p-5 cursor-pointer hover:border-primary/30 hover:bg-card/60 transition-all group"
                >
                  {/* Status badge */}
                  <span className={`absolute top-4 right-4 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[ship.status]}`}>
                    {STATUS_LABELS[ship.status]}
                  </span>

                  {/* Ship name */}
                  <div className="flex items-center gap-2 mb-1 pr-20">
                    <Heart className="w-4 h-4 text-primary fill-primary flex-shrink-0" />
                    <span className="font-bold text-white text-lg leading-tight">{ship.name}</span>
                  </div>

                  {/* Series */}
                  <p className="text-sm text-white/60 mb-1 ml-6">{ship.series} · {ship.year}</p>

                  {/* Actresses */}
                  <p className="text-xs text-white/40 ml-6 mb-3">{ship.actresses.join(" & ")}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 ml-6 mb-3">
                    {ship.tags.map((tag) => (
                      <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-white/8 text-white/50 border border-white/10">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Fan count + explore link */}
                  <div className="flex items-center justify-between ml-6">
                    <span className="text-xs text-white/30">{ship.fansCount.toLocaleString()} fans</span>
                    <span className="text-xs text-primary/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Explore posts <ExternalLink className="w-3 h-3" />
                    </span>
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

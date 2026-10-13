/**
 * CULTURAL TEAM — 30 INSPIRATION SUGGESTIONS
 * Curated inspiration ideas provided to spark creativity.
 * (Clearly marked as "Ideas to Inspire You" — distinct from real student submissions).
 */

const INSPIRATION_IDEAS = [
  {
    id: "inspire-1",
    title: "Garba Night",
    category: "Cultural Events",
    tagline: "Vibrant dandiya rhythms, traditional attire, swirling lights, and nonstop festive beats.",
    icon: "🪘",
    gradient: "from-amber-500 to-rose-600"
  },
  {
    id: "inspire-2",
    title: "Freshers Party",
    category: "Parties and Celebrations",
    tagline: "The grand welcome bash with dazzling stage entries, red carpet vibes, and new friendships.",
    icon: "🎉",
    gradient: "from-purple-500 to-indigo-600"
  },
  {
    id: "inspire-3",
    title: "Welcome Party",
    category: "Parties and Celebrations",
    tagline: "An electrifying evening of music, ice-breaker games, and senior-junior bonding.",
    icon: "✨",
    gradient: "from-pink-500 to-rose-500"
  },
  {
    id: "inspire-4",
    title: "Navratri Special",
    category: "Cultural Events",
    tagline: "Authentic Gujarati folk melodies, high-energy raas, and festive celebration across campus.",
    icon: "🪔",
    gradient: "from-orange-500 to-yellow-500"
  },
  {
    id: "inspire-5",
    title: "Dance Competition",
    category: "Competitions",
    tagline: "Solo and group dance showdowns spanning classical, hip-hop, contemporary, and folk styles.",
    icon: "💃",
    gradient: "from-fuchsia-500 to-pink-600"
  },
  {
    id: "inspire-6",
    title: "Singing Competition",
    category: "Competitions",
    tagline: "Vocal battles across Bollywood, Western pop, semi-classical, and original melodies.",
    icon: "🎤",
    gradient: "from-cyan-500 to-blue-600"
  },
  {
    id: "inspire-7",
    title: "Battle of the Bands",
    category: "Music and Dance",
    tagline: "Electric guitars, roaring drum kits, and raw college rock bands claiming the crown.",
    icon: "🎸",
    gradient: "from-red-500 to-amber-600"
  },
  {
    id: "inspire-8",
    title: "DJ Night",
    category: "Music and Dance",
    tagline: "Bass drops, laser light spectacles, smoke cannons, and the ultimate campus dance floor.",
    icon: "🎧",
    gradient: "from-violet-600 to-cyan-500"
  },
  {
    id: "inspire-9",
    title: "Traditional Day",
    category: "Cultural Events",
    tagline: "Celebrate heritage in vibrant regional attires, ethnic fashion walks, and folklore storytelling.",
    icon: "👘",
    gradient: "from-amber-600 to-emerald-600"
  },
  {
    id: "inspire-10",
    title: "Bollywood Day",
    category: "Cultural Events",
    tagline: "Iconic movie character cosplays, dialogue battles, retro dance flash mobs, and filmi trivia.",
    icon: "🎬",
    gradient: "from-yellow-500 to-red-600"
  },
  {
    id: "inspire-11",
    title: "College Fest",
    category: "Cultural Events",
    tagline: "The flagship annual multi-day cultural festival featuring star performances and carnival stalls.",
    icon: "🎪",
    gradient: "from-purple-600 to-pink-600"
  },
  {
    id: "inspire-12",
    title: "Fashion Show",
    category: "Competitions",
    tagline: "Avant-garde couture, fusion ethnic runways, dramatic stage walks, and high-fashion flair.",
    icon: "👠",
    gradient: "from-rose-500 to-purple-600"
  },
  {
    id: "inspire-13",
    title: "Talent Hunt",
    category: "Competitions",
    tagline: "An open stage discovering campus hidden gems: magic, beatboxing, mimicry, juggling & more.",
    icon: "🌟",
    gradient: "from-amber-400 to-orange-600"
  },
  {
    id: "inspire-14",
    title: "Open Mic",
    category: "Music and Dance",
    tagline: "An intimate, soulful stage where raw voices, acoustic tunes, and untold thoughts find a spotlight.",
    icon: "🎙️",
    gradient: "from-teal-500 to-cyan-600"
  },
  {
    id: "inspire-15",
    title: "Poetry and Shayari Night",
    category: "Cultural Events",
    tagline: "Heartfelt verses, Urdu nazms, spoken-word poetry, and candle-lit literary eloquence.",
    icon: "📜",
    gradient: "from-stone-500 to-amber-700"
  },
  {
    id: "inspire-16",
    title: "Stand-Up Comedy",
    category: "Cultural Events",
    tagline: "Unfiltered campus humor, witty observational sets, and belly laughs that bring everyone together.",
    icon: "😂",
    gradient: "from-yellow-400 to-rose-500"
  },
  {
    id: "inspire-17",
    title: "Drama and Theatre Competition",
    category: "Competitions",
    tagline: "One-act stage plays, street theatre (Nukkad Natak), method acting, and thought-provoking scripts.",
    icon: "🎭",
    gradient: "from-indigo-600 to-purple-800"
  },
  {
    id: "inspire-18",
    title: "Photography Competition",
    category: "Competitions",
    tagline: "Capturing candid campus life, shadows, street stories, and aesthetic architectural frames.",
    icon: "📸",
    gradient: "from-slate-600 to-cyan-600"
  },
  {
    id: "inspire-19",
    title: "Art and Painting Competition",
    category: "Competitions",
    tagline: "Live canvas painting, charcoal sketching, digital illustration battles, and art exhibitions.",
    icon: "🎨",
    gradient: "from-emerald-500 to-teal-700"
  },
  {
    id: "inspire-20",
    title: "Treasure Hunt",
    category: "Competitions",
    tagline: "Cryptic riddles, campus-wide clue quests, timed puzzles, and thrilling team races.",
    icon: "🗺️",
    gradient: "from-amber-600 to-yellow-600"
  },
  {
    id: "inspire-21",
    title: "Rangoli Competition",
    category: "Cultural Events",
    tagline: "Intricate colored sand art, floral mandalas, and vibrant festive patterns lighting the pathways.",
    icon: "🌸",
    gradient: "from-fuchsia-600 to-rose-600"
  },
  {
    id: "inspire-22",
    title: "Mehendi Competition",
    category: "Cultural Events",
    tagline: "Traditional bridal henna patterns, Arabic geometry, and delicate bridal adornment artistry.",
    icon: "🌿",
    gradient: "from-emerald-600 to-green-700"
  },
  {
    id: "inspire-23",
    title: "Cultural Parade",
    category: "Cultural Events",
    tagline: "A grand campus procession with folk drummers, state banners, costumes, and joyous celebration.",
    icon: "🥁",
    gradient: "from-red-600 to-orange-500"
  },
  {
    id: "inspire-24",
    title: "Acoustic Music Night",
    category: "Music and Dance",
    tagline: "Unplugged guitars, cajon rhythms, campfire lighting, and heartfelt communal sing-alongs.",
    icon: "🪕",
    gradient: "from-amber-700 to-orange-700"
  },
  {
    id: "inspire-25",
    title: "Short Film Competition",
    category: "Competitions",
    tagline: "Screening 5-minute student films, cinematic cinematography, and creative storytelling.",
    icon: "📽️",
    gradient: "from-blue-600 to-indigo-700"
  },
  {
    id: "inspire-26",
    title: "Gaming Tournament",
    category: "Competitions",
    tagline: "High-stakes e-sports arena featuring BGMI, FIFA, Valorant, and fighting game brackets.",
    icon: "🎮",
    gradient: "from-violet-600 to-fuchsia-600"
  },
  {
    id: "inspire-27",
    title: "Inter-College Dance Battle",
    category: "Competitions",
    tagline: "Top crews from across colleges facing off in fierce 1v1 cyphers and all-styles group battles.",
    icon: "⚡",
    gradient: "from-cyan-500 to-purple-600"
  },
  {
    id: "inspire-28",
    title: "Food Festival",
    category: "Parties and Celebrations",
    tagline: "Student culinary pop-up stalls, regional street delights, dessert corners, and chef awards.",
    icon: "🍱",
    gradient: "from-orange-500 to-red-500"
  },
  {
    id: "inspire-29",
    title: "Theme Day Celebration",
    category: "Parties and Celebrations",
    tagline: "Twin Day, Retro 90s, Formal Gala, Character Cosplay, and fun coordinated campus dress-ups.",
    icon: "🎭",
    gradient: "from-pink-500 to-yellow-500"
  },
  {
    id: "inspire-30",
    title: "Festival Special Celebration",
    category: "Cultural Events",
    tagline: "Holi colors, Diwali diya illumination, Christmas carols, and unity across campus festivals.",
    icon: "🎆",
    gradient: "from-rose-500 to-amber-500"
  }
];

if (typeof window !== "undefined") {
  window.INSPIRATION_IDEAS = INSPIRATION_IDEAS;
}

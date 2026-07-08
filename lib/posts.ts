export type TagColor = "red" | "blue" | "green" | "yellow";

export interface Tag {
  label: string;
  color: TagColor;
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  tags: Tag[];
}

export const posts: Post[] = [
  {
    slug: "curious-geometry-of-benzene",
    title: "The Curious Geometry of Benzene",
    excerpt:
      "Six carbons, six hydrogens, and a ring that should not exist. How Kekule's dream solved the puzzle of aromaticity and why 1,3,5-cyclohexatriene refused to behave like an alkene.",
    date: "2026-06-22",
    readingTime: "8 min",
    tags: [
      { label: "Organic", color: "blue" },
      { label: "Structure", color: "green" },
    ],
  },
  {
    slug: "caffeine-molecular-biography",
    title: "Caffeine: A Molecular Biography",
    excerpt:
      "From coffee beans to adenosine receptors — tracing the purine alkaloid skeleton, its methylation pattern, and the competitive inhibition that keeps a third of the planet awake.",
    date: "2026-06-15",
    readingTime: "12 min",
    tags: [
      { label: "Biochemistry", color: "yellow" },
      { label: "Mechanism", color: "red" },
    ],
  },
  {
    slug: "reading-reaction-mechanisms",
    title: "Reading Reaction Mechanisms with Curved Arrows",
    excerpt:
      "Curved arrows are the grammar of organic chemistry. A practical walkthrough of electron-pushing notation, nucleophile-electrophile pairing, and the common mistakes that mislead beginners.",
    date: "2026-06-08",
    readingTime: "10 min",
    tags: [
      { label: "Organic", color: "blue" },
      { label: "Mechanism", color: "red" },
    ],
  },
  {
    slug: "hydrogen-bonds-hold-life-together",
    title: "Why Hydrogen Bonds Hold Life Together",
    excerpt:
      "Weak individually, indispensable collectively. The hydrogen bond explains water's density anomaly, DNA's double helix, and the folding pathways of globular proteins.",
    date: "2026-05-30",
    readingTime: "7 min",
    tags: [
      { label: "Physical", color: "blue" },
      { label: "Structure", color: "green" },
    ],
  },
  {
    slug: "aspirin-willow-bark-to-synthetic",
    title: "Aspirin: From Willow Bark to Synthetic Analgesic",
    excerpt:
      "Salicylic acid to acetylsalicylic acid — the esterification that tamed a bitter herbal extract, the COX-1 inhibition mechanism, and the industrial synthesis at scale.",
    date: "2026-05-21",
    readingTime: "9 min",
    tags: [
      { label: "Medicinal", color: "green" },
      { label: "Synthesis", color: "yellow" },
    ],
  },
  {
    slug: "visualizing-the-transition-state",
    title: "Visualizing the Transition State",
    excerpt:
      "The transition state exists for a single bond vibration. How Hammond's postulate, Bell-Evans-Polanyi, and reaction coordinate diagrams help us reason about the instantaneous.",
    date: "2026-05-12",
    readingTime: "11 min",
    tags: [
      { label: "Physical", color: "blue" },
      { label: "Mechanism", color: "red" },
    ],
  },
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${Number(d)}, ${y}`;
}

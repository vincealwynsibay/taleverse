import type { BookConfig } from "./gutenberg";

/**
 * The demo catalog: public-domain novels from Project Gutenberg.
 * `schedule` decides how each book behaves in the demo:
 *   complete → everything is free
 *   ongoing  → the newest chapters are early access, and a couple are scheduled
 */
export type CatalogEntry = {
  gutenbergId: number;
  slug: string;
  title: string;
  author: string;
  releaseYear: number;
  genres: string[];
  coverHue: number;
  schedule: "complete" | "ongoing";
  synopsis: string;
  split: BookConfig;
};

const roman = "[IVXLC]+";

export const catalog: CatalogEntry[] = [
  {
    gutenbergId: 345,
    slug: "dracula",
    title: "Dracula",
    author: "Bram Stoker",
    releaseYear: 1897,
    genres: ["Horror", "Gothic"],
    coverHue: 15,
    schedule: "ongoing",
    synopsis:
      "A young solicitor travels to Transylvania to close a property sale with a reclusive count, and finds himself a prisoner in a castle where the doors lock from the outside. Told through diaries, letters and newspaper cuttings, the story follows a small band of friends as an ancient hunger reaches England.",
    split: { heading: new RegExp(`^CHAPTER ${roman}$`), subtitles: true },
  },
  {
    gutenbergId: 1342,
    slug: "pride-and-prejudice",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    releaseYear: 1813,
    genres: ["Romance", "Literary"],
    coverHue: 340,
    schedule: "complete",
    synopsis:
      "Five unmarried sisters, one entailed estate, and a mother determined to see them settled. When the proud Mr. Darcy insults Elizabeth Bennet at a country ball, neither suspects how thoroughly first impressions can be wrong. Sharp, funny and endlessly reread.",
    split: { heading: new RegExp(`^CHAPTER ${roman}\\.?$`, "i") },
  },
  {
    gutenbergId: 84,
    slug: "frankenstein",
    title: "Frankenstein; or, The Modern Prometheus",
    author: "Mary Wollstonecraft Shelley",
    releaseYear: 1818,
    genres: ["Horror", "Science Fiction", "Gothic"],
    coverHue: 150,
    schedule: "ongoing",
    synopsis:
      "On an Arctic expedition, a ship's captain rescues a dying stranger from the ice. His name is Victor Frankenstein, and his story is of a young scientist who discovered the secret of life and then ran from what he made. The novel that invented science fiction.",
    split: { heading: /^((?:Letter|Chapter) \d+)$/ },
  },
  {
    gutenbergId: 1661,
    slug: "the-adventures-of-sherlock-holmes",
    title: "The Adventures of Sherlock Holmes",
    author: "Arthur Conan Doyle",
    releaseYear: 1892,
    genres: ["Mystery"],
    coverHue: 220,
    schedule: "complete",
    synopsis:
      "Twelve cases from 221B Baker Street: a king's blackmail, a league of red-headed men, a bride who vanishes from her own wedding. Dr. Watson records them all as the world's only consulting detective sees what everyone else merely looks at.",
    split: {
      heading: new RegExp(`^${roman}\\. ([A-Z][A-Z’'\\- ]+)$`),
      sectionBreak: new RegExp(`^${roman}\\.$`),
      minWords: 1000,
    },
  },
  {
    gutenbergId: 120,
    slug: "treasure-island",
    title: "Treasure Island",
    author: "Robert Louis Stevenson",
    releaseYear: 1883,
    genres: ["Adventure"],
    coverHue: 45,
    schedule: "ongoing",
    synopsis:
      "When an old sea captain dies at the Admiral Benbow inn, young Jim Hawkins finds a map in his sea-chest: an island, and an X. A ship is fitted out, a crew is hired, and a one-legged cook with a parrot on his shoulder smiles a little too warmly.",
    split: { heading: new RegExp(`^${roman}$`), subtitles: true },
  },
  {
    gutenbergId: 35,
    slug: "the-time-machine",
    title: "The Time Machine",
    author: "H. G. Wells",
    releaseYear: 1895,
    genres: ["Science Fiction"],
    coverHue: 265,
    schedule: "ongoing",
    synopsis:
      "A Victorian inventor tells his dinner guests that he has travelled to the year 802,701. There he found a gentle, childlike people living in a garden world, and something else that only comes out after dark.",
    split: { heading: new RegExp(`^(?:${roman}\\.|(Epilogue))$`), subtitles: true },
  },
  {
    gutenbergId: 11,
    slug: "alices-adventures-in-wonderland",
    title: "Alice's Adventures in Wonderland",
    author: "Lewis Carroll",
    releaseYear: 1865,
    genres: ["Fantasy"],
    coverHue: 190,
    schedule: "complete",
    synopsis:
      "A bored girl follows a waistcoated White Rabbit down a hole and lands in a country where size is negotiable, tea-time never ends and the Queen sentences everyone to death before lunch.",
    split: { heading: new RegExp(`^CHAPTER ${roman}\\.$`), subtitles: true },
  },
];

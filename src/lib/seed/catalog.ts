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
  {
    gutenbergId: 64317,
    slug: "the-great-gatsby",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    releaseYear: 1925,
    genres: ["Literary", "Romance"],
    coverHue: 240,
    schedule: "complete",
    synopsis:
      "Nick Carraway rents a cottage on Long Island next door to a mansion where the parties never stop and the host is a rumour. Jay Gatsby has built his whole life around one green light across the bay, and the summer of 1922 is when he finally reaches for it.",
    split: { heading: /^[IVX]+$/, dedupe: true },
  },
  {
    gutenbergId: 2701,
    slug: "moby-dick",
    title: "Moby-Dick; or, The Whale",
    author: "Herman Melville",
    releaseYear: 1851,
    genres: ["Adventure", "Literary"],
    coverHue: 210,
    schedule: "ongoing",
    synopsis:
      "Call him Ishmael. A restless sailor signs on to the whaler Pequod and discovers too late that its captain has only one purpose: to hunt down the white whale that took his leg, wherever on the oceans it leads.",
    split: { heading: /^(?:CHAPTER \d+\. (.+)|(Epilogue))$/, dedupe: true },
  },
  {
    gutenbergId: 174,
    slug: "the-picture-of-dorian-gray",
    title: "The Picture of Dorian Gray",
    author: "Oscar Wilde",
    releaseYear: 1890,
    genres: ["Gothic", "Literary"],
    coverHue: 300,
    schedule: "complete",
    synopsis:
      "A beautiful young man wishes that his portrait would age instead of him. The wish comes true. Free to do anything without a mark on his face, Dorian Gray finds out exactly how far that freedom goes, while the painting in the locked attic room keeps count.",
    split: { heading: new RegExp(`^CHAPTER ${roman}\\.$`), dedupe: true },
  },
  {
    gutenbergId: 1260,
    slug: "jane-eyre",
    title: "Jane Eyre",
    author: "Charlotte Brontë",
    releaseYear: 1847,
    genres: ["Romance", "Gothic"],
    coverHue: 25,
    schedule: "ongoing",
    synopsis:
      "Orphaned, unloved and sent away to a harsh charity school, Jane Eyre grows up refusing to be anyone's lesser. As governess at Thornfield Hall she falls for its brooding master, Mr. Rochester, and starts hearing laughter at night from the floor above.",
    split: { heading: new RegExp(`^CHAPTER ${roman}(?:—(.+))?$`) },
  },
  {
    gutenbergId: 36,
    slug: "the-war-of-the-worlds",
    title: "The War of the Worlds",
    author: "H. G. Wells",
    releaseYear: 1898,
    genres: ["Science Fiction"],
    coverHue: 5,
    schedule: "ongoing",
    synopsis:
      "Something falls on Horsell Common, and crowds gather to look at the cylinder cooling in its pit. Then the lid unscrews. One man's account of the first days of the Martian invasion, as southern England burns.",
    // Book One and Book Two both restart at chapter I, so no dedupe; contents entries are too short to survive.
    split: { heading: new RegExp(`^${roman}\\.$`), subtitles: true, sectionBreak: /^BOOK (ONE|TWO)/ },
  },
  {
    gutenbergId: 2852,
    slug: "the-hound-of-the-baskervilles",
    title: "The Hound of the Baskervilles",
    author: "Arthur Conan Doyle",
    releaseYear: 1902,
    genres: ["Mystery", "Horror"],
    coverHue: 95,
    schedule: "complete",
    synopsis:
      "Sir Charles Baskerville is found dead on the moor, his face twisted in terror, and beside the body the footprints of a gigantic hound. Holmes sends Watson to Dartmoor to guard the heir, where a family legend refuses to stay a legend.",
    split: { heading: /^Chapter \d+\.$/, subtitles: true, indent: 6 },
  },
  {
    gutenbergId: 43,
    slug: "dr-jekyll-and-mr-hyde",
    title: "The Strange Case of Dr. Jekyll and Mr. Hyde",
    author: "Robert Louis Stevenson",
    releaseYear: 1886,
    genres: ["Horror", "Gothic"],
    coverHue: 330,
    schedule: "complete",
    synopsis:
      "Why would a respected London doctor leave his fortune to a violent stranger called Edward Hyde? His friend Utterson, a lawyer, means to find out, and follows a trail of trampled children, a murder in the fog and a locked laboratory door.",
    split: {
      heading:
        /^(STORY OF THE DOOR|SEARCH FOR MR\. HYDE|DR\. JEKYLL WAS QUITE AT EASE|THE CAREW MURDER CASE|INCIDENT OF THE LETTER|INCIDENT OF DR\. LANYON|INCIDENT AT THE WINDOW|THE LAST NIGHT|DR\. LANYON’S NARRATIVE|HENRY JEKYLL’S FULL STATEMENT OF THE CASE)$/,
      dedupe: true,
    },
  },
  {
    gutenbergId: 55,
    slug: "the-wonderful-wizard-of-oz",
    title: "The Wonderful Wizard of Oz",
    author: "L. Frank Baum",
    releaseYear: 1900,
    genres: ["Fantasy"],
    coverHue: 140,
    schedule: "complete",
    synopsis:
      "A Kansas cyclone carries Dorothy and her dog Toto to a land of witches and talking scarecrows. To get home she must follow the yellow brick road to the Emerald City and ask the great and terrible Wizard for help.",
    split: { heading: new RegExp(`^Chapter ${roman}$`), subtitles: true },
  },
  {
    gutenbergId: 16,
    slug: "peter-pan",
    title: "Peter Pan",
    author: "J. M. Barrie",
    releaseYear: 1911,
    genres: ["Fantasy", "Adventure"],
    coverHue: 115,
    schedule: "ongoing",
    synopsis:
      "All children grow up, except one. Peter Pan flies in through the Darlings' nursery window looking for his shadow, and leaves with Wendy, John and Michael for Neverland: mermaids, Lost Boys, and a pirate captain with a hook for a hand.",
    split: { heading: new RegExp(`^Chapter ${roman}\\.$`), subtitles: true },
  },
  {
    gutenbergId: 215,
    slug: "the-call-of-the-wild",
    title: "The Call of the Wild",
    author: "Jack London",
    releaseYear: 1903,
    genres: ["Adventure"],
    coverHue: 55,
    schedule: "complete",
    synopsis:
      "Buck is a big, comfortable house dog in sunny California until he is stolen and sold to haul sleds in the Klondike gold rush. Under the club and the fang he learns the old law of the wild, and something older begins to call him.",
    split: { heading: new RegExp(`^Chapter ${roman}\\. (.+)$`), dedupe: true },
  },
];

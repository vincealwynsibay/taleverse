/**
 * Seeded community activity so the demo doesn't look empty. These readers are
 * local-only rows (their clerkIds can never sign in).
 */
export const seedReaders = [
  { key: "marisol", username: "marisol_reads" },
  { key: "tobias", username: "tobias.k" },
  { key: "nadia", username: "nadia_inkwell" },
  { key: "owen", username: "owenbooks" },
  { key: "priya", username: "priya.pages" },
  { key: "jun", username: "jun_after_dark" },
] as const;

type ReaderKey = (typeof seedReaders)[number]["key"];

export const seedReviews: Record<string, { by: ReaderKey; rating: number; body: string }[]> = {
  dracula: [
    { by: "jun", rating: 5, body: "Reading this a chapter at a time is the way to do it. The diary format makes every release feel like you're intercepting someone's mail." },
    { by: "nadia", rating: 5, body: "The first four chapters in the castle are some of the most unsettling things I've read, and I've read a lot of horror." },
    { by: "owen", rating: 4, body: "Drags a little in the middle, but Mina carries the whole second half. Worth the credits for early access." },
  ],
  "pride-and-prejudice": [
    { by: "marisol", rating: 5, body: "Third reread. Mr. Bennet's lines still make me laugh out loud on the train." },
    { by: "priya", rating: 5, body: "Elizabeth is so sharp. The proposal in chapter 34 lives in my head rent-free." },
    { by: "tobias", rating: 4, body: "Came in skeptical, left converted. The dialogue is faster than most modern novels." },
  ],
  frankenstein: [
    { by: "nadia", rating: 5, body: "Not the movie at all. It's a sad, angry book about responsibility, and the creature is the most eloquent person in it." },
    { by: "jun", rating: 4, body: "The frame narrative is wild: letters inside a story inside a story. Victor is the worst." },
  ],
  "the-adventures-of-sherlock-holmes": [
    { by: "owen", rating: 5, body: "Each story is a perfect one-sitting read. The Speckled Band is the best one, fight me." },
    { by: "tobias", rating: 5, body: "Holmes is insufferable and I love him. Great comfort reading." },
    { by: "marisol", rating: 4, body: "A Scandal in Bohemia is the best opener. Irene Adler deserved her own series." },
  ],
  "treasure-island": [
    { by: "priya", rating: 5, body: "Long John Silver is the blueprint for every charming villain since. Can't wait for the next chapter." },
    { by: "owen", rating: 4, body: "Pure adventure. Reads like it was written to be serialized, which it was!" },
  ],
  "the-time-machine": [
    { by: "tobias", rating: 4, body: "Short, strange and way ahead of its time. The Morlock chapters are genuinely creepy." },
    { by: "jun", rating: 5, body: "The far-future beach scene near the end is haunting. Finished it in one night." },
  ],
  "the-great-gatsby": [
    { by: "priya", rating: 5, body: "Every sentence is gorgeous. The last page wrecked me." },
    { by: "jun", rating: 4, body: "Short enough to read in a weekend, sad enough to think about for a month." },
  ],
  "moby-dick": [
    { by: "owen", rating: 4, body: "Yes, there's a whole chapter on rope. Read it anyway. Ahab is unforgettable." },
  ],
  "the-picture-of-dorian-gray": [
    { by: "nadia", rating: 5, body: "Lord Henry gets all the best lines. Deliciously wicked." },
    { by: "tobias", rating: 4, body: "The portrait reveal scenes are genuinely creepy." },
  ],
  "jane-eyre": [
    { by: "marisol", rating: 5, body: "Jane is the original no-nonsense heroine. That proposal scene in the garden!" },
    { by: "priya", rating: 4, body: "Slow start at Lowood, then I couldn't put it down." },
  ],
  "the-war-of-the-worlds": [
    { by: "jun", rating: 5, body: "The heat-ray scene on Horsell Common is still terrifying 125 years later." },
  ],
  "the-hound-of-the-baskervilles": [
    { by: "owen", rating: 5, body: "The best Holmes novel. Dartmoor in the fog is a whole mood." },
    { by: "tobias", rating: 5, body: "Watson gets to be the detective for a while and he's great at it." },
  ],
  "dr-jekyll-and-mr-hyde": [
    { by: "nadia", rating: 4, body: "Shorter and stranger than I expected. The final statement is chilling." },
  ],
  "the-wonderful-wizard-of-oz": [
    { by: "marisol", rating: 4, body: "Darker and funnier than the film. Silver shoes, not ruby!" },
  ],
  "peter-pan": [
    { by: "priya", rating: 5, body: "Much more bittersweet than I remembered. The narrator is hilarious." },
  ],
  "the-call-of-the-wild": [
    { by: "owen", rating: 5, body: "Told from a dog's point of view and somehow one of the toughest books I've read." },
  ],
  "alices-adventures-in-wonderland": [
    { by: "marisol", rating: 5, body: "Pure delightful nonsense. The Mad Tea-Party never gets old." },
    { by: "priya", rating: 4, body: "Funnier than I remembered from childhood. The wordplay is the real star." },
  ],
};

/** Comments on the first chapter of each novel (chapter number -> comments). */
export const seedComments: Record<string, { chapter: number; by: ReaderKey; body: string }[]> = {
  dracula: [
    { chapter: 1, by: "jun", body: "The locals crossing themselves and handing him a crucifix. Jonathan, buddy, take the hint." },
    { chapter: 1, by: "nadia", body: "Love that this is all journal entries. Feels so immediate." },
    { chapter: 2, by: "owen", body: "\"Welcome to my house! Enter freely and of your own will!\" chills." },
  ],
  "pride-and-prejudice": [
    { chapter: 1, by: "marisol", body: "That opening line. Iconic." },
    { chapter: 1, by: "tobias", body: "Mr. Bennet is a menace and I mean that as a compliment." },
  ],
  "treasure-island": [{ chapter: 1, by: "priya", body: "Fifteen men on the dead man's chest! Here we go." }],
  "the-adventures-of-sherlock-holmes": [{ chapter: 1, by: "owen", body: "\"You see, but you do not observe.\" Holmes in one line." }],
};

/** Deterministic, plausible view counts. */
export const seedViews: Record<string, number> = {
  dracula: 48210,
  "pride-and-prejudice": 61540,
  frankenstein: 33980,
  "the-adventures-of-sherlock-holmes": 52300,
  "treasure-island": 27150,
  "the-time-machine": 19870,
  "alices-adventures-in-wonderland": 24630,
  "the-great-gatsby": 58720,
  "moby-dick": 21480,
  "the-picture-of-dorian-gray": 39910,
  "jane-eyre": 44350,
  "the-war-of-the-worlds": 31260,
  "the-hound-of-the-baskervilles": 46890,
  "dr-jekyll-and-mr-hyde": 29540,
  "the-wonderful-wizard-of-oz": 26770,
  "peter-pan": 22310,
  "the-call-of-the-wild": 18940,
};

import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import type { BlogPost, BlogPostContent } from "./types";

const POSTS: BlogPost[] = [
  {
    slug: "dont-die-movement",
    datePublished: "2026-07-13",
    locales: {
      en: {
        title: "The “Don’t Die” Movement and the Question It Can’t Answer",
        hook: "Bryan Johnson is spending millions to never die. His project asks the right question — and gives an answer that can’t hold.",
        metaDescription:
          "Bryan Johnson’s “Don’t Die” movement takes death seriously — more seriously than most of us do. But longevity can only delay the question. What happens when you die?",
        sections: [
          {
            heading: "A war on death",
            body: "Bryan Johnson, the tech entrepreneur behind the Blueprint protocol, has turned his life into a public experiment with one goal: don’t die. Strict routines, constant measurement, millions of dollars a year — all documented openly and even given a slogan that doubles as a movement.\n\nIt would be easy to mock. Most coverage does. But before we smile at the supplements and the sleep scores, we should notice something: he is taking death more seriously than almost anyone else in public life.",
          },
          {
            heading: "He’s right about the problem",
            body: "Most of us live as if death were someone else’s appointment. We keep it off our calendars and out of our conversations, and we call that being well-adjusted.\n\nThe “Don’t Die” movement refuses to do that. It says out loud what everyone quietly knows: death is not natural background noise. It is an enemy. Something in us protests against it — and that protest is data. The Scriptures say God has “put eternity in their hearts.” We were not made to be at peace with dying, and no amount of adjustment ever quite makes us so.",
            scripture:
              "He has made everything beautiful in its time. Also He has put eternity in their hearts, except that no one can find out the work that God does from beginning to end.",
            scriptureRef: "Ecclesiastes 3:11 (NKJV)",
          },
          {
            heading: "The question the protocol can’t answer",
            body: "Suppose the project succeeds beyond every expectation. Suppose the measurements, the discipline, and the science buy decades — even a century. Every one of those years arrives at the same door.\n\nLongevity can change when you die. It cannot change that you die, and it has nothing at all to say about what comes after. That is the question hiding underneath the movement, the one no protocol can touch: not “how long?” but “then what?”",
            scripture: "And as it is appointed for men to die once, but after this the judgment.",
            scriptureRef: "Hebrews 9:27 (NKJV)",
          },
          {
            heading: "A better hope than not dying",
            body: "Christianity has never asked anyone to make peace with death. It calls death an enemy too — “the last enemy to be destroyed.” The difference is the strategy. The gospel does not promise an escape from dying; it announces that someone has gone through death and come out the other side, and that he offers to bring us with him.\n\nJesus did not say “you will not die.” He said something far stranger and far stronger: “whoever lives and believes in Me shall never die.” Not death postponed — death defeated.\n\nSo the “Don’t Die” movement is half right. Death is worth fighting. The question is whether you fight it with a protocol that can only delay it, or trust the one who has already beaten it.",
            scripture:
              "I am the resurrection and the life. He who believes in Me, though he may die, he shall live. And whoever lives and believes in Me shall never die.",
            scriptureRef: "John 11:25–26 (NKJV)",
          },
        ],
        personalTurn: {
          setup:
            "Bryan Johnson will find out one day whether the protocol worked. So will you. The difference is that he is at least preparing for the exam.",
          question: "If it happened tonight — would you be ready?",
        },
        sources: [
          {
            label: "Bryan Johnson — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Bryan_Johnson",
          },
          {
            label: "Don’t Die: The Man Who Wants to Live Forever (documentary) — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Don%27t_Die:_The_Man_Who_Wants_to_Live_Forever",
          },
        ],
      },
    },
  },
];

export function getPublishedPosts(): BlogPost[] {
  return POSTS.filter((post) => !post.draft).sort((a, b) =>
    b.datePublished.localeCompare(a.datePublished),
  );
}

export function getPost(slug: string): BlogPost | undefined {
  return getPublishedPosts().find((post) => post.slug === slug);
}

/** Locales a post declares, in SUPPORTED_LOCALES order. */
export function getPostLocales(post: BlogPost): Locale[] {
  return SUPPORTED_LOCALES.filter((locale) => post.locales[locale] !== undefined);
}

export function getPostContent(post: BlogPost, locale: Locale): BlogPostContent | undefined {
  return post.locales[locale];
}

export function getPostDateModified(post: BlogPost): string {
  return post.dateModified ?? post.datePublished;
}

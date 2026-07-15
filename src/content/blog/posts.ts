import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import type { BlogPost, BlogPostContent } from "./types";

const POSTS: BlogPost[] = [
  {
    slug: "dont-die-movement",
    datePublished: "2026-07-13",
    dateModified: "2026-07-15",
    locales: {
      en: {
        title: "The “Don’t Die” Movement and the Question It Can’t Answer",
        hook: "The man spending millions to never die just announced an incurable diagnosis. His project asks the right question — and still can’t answer it.",
        metaDescription:
          "Bryan Johnson, who spends millions a year trying not to die, announced he has an incurable autoimmune disease. His project asks the right question. What happens when you die?",
        sections: [
          {
            heading: "“My stomach is eating itself”",
            body: "On June 30th, Bryan Johnson — the man who has spent tens of millions of dollars trying not to die — announced that his own body is attacking itself. “I have an autoimmune disease,” he wrote. “My stomach is eating itself.”\n\nThe diagnosis is autoimmune gastritis: his immune system is destroying the cells of his stomach lining. It is chronic and incurable, though not fatal in itself — what it quietly raises is risk, of anemia, of nerve damage, of stomach cancer. It arrived unannounced, in the middle of the most measured, optimized, carefully guarded body on earth.\n\nJohnson’s response was pure Bryan Johnson: he said it only pushes his team harder to find a cure. But something important just became visible. The protocol did not get a vote.",
          },
          {
            heading: "A war on death",
            body: "Johnson, the tech entrepreneur behind the Blueprint protocol, turned his life into a public experiment with one goal: don’t die. Strict routines, constant measurement, millions of dollars a year — all documented openly and even given a slogan that doubles as a movement.\n\nIt would be easy to mock, and this month most coverage has. But before we smile at the supplements and the sleep scores, we should notice something: he is taking death more seriously than almost anyone else in public life.",
          },
          {
            heading: "He’s right about the problem",
            body: "Most of us live as if death were someone else’s appointment. We keep it off our calendars and out of our conversations, and we call that being well-adjusted.\n\nThe “Don’t Die” movement refuses to do that. It says out loud what everyone quietly knows: death is not natural background noise. It is an enemy. Something in us protests against it — and that protest is data. The Scriptures say God has “set eternity in the human heart.” We were not made to be at peace with dying, and no amount of adjustment ever quite makes us so.",
            scripture:
              "He has made everything beautiful in its time. He has also set eternity in the human heart; yet no one can fathom what God has done from beginning to end.",
            scriptureRef: "Ecclesiastes 3:11",
          },
          {
            heading: "The question the protocol can’t answer",
            body: "Suppose the project recovers from this and succeeds beyond every expectation. Suppose the measurements, the discipline, and the science buy decades — even a century. Every one of those years arrives at the same door.\n\nThis is what the diagnosis makes plain. A body can be measured every morning and still make a decision without asking. Longevity can change when you die. It cannot change that you die, and it has nothing at all to say about what comes after. That is the question hiding underneath the movement, the one no protocol can touch: not “how long?” but “then what?”",
            scripture: "Just as people are destined to die once, and after that to face judgment.",
            scriptureRef: "Hebrews 9:27",
          },
          {
            heading: "A better hope than not dying",
            body: "Christianity has never asked anyone to make peace with death. It calls death an enemy too — “the last enemy to be destroyed.” The difference is the strategy. The gospel does not promise an escape from dying; it announces that someone has gone through death and come out the other side, and that he offers to bring us with him.\n\nJesus did not say “you will not die.” He said something far stranger and far stronger: “whoever lives by believing in me will never die.” Not death postponed — death defeated.\n\nSo the “Don’t Die” movement is half right. Death is worth fighting. The question is whether you fight it with a protocol that can only delay it, or trust the one who has already beaten it.",
            scripture:
              "I am the resurrection and the life. The one who believes in me will live, even though they die; and whoever lives by believing in me will never die.",
            scriptureRef: "John 11:25–26",
          },
        ],
        personalTurn: {
          setup:
            "Bryan Johnson didn’t get a vote on his diagnosis, and neither will you on yours. There is an exam after the door, and it doesn’t wait until you feel ready — but you can see how you’d do on it right now.",
          question: "If it happened tonight — would you pass?",
        },
        sources: [
          {
            label: "“Bryan Johnson’s diagnosis shines light on hard-to-detect disease” — STAT News",
            url: "https://www.statnews.com/2026/07/08/bryan-johnson-autoimmune-gastritis-diagnosis-explained/",
          },
          {
            label: "“How did Bryan Johnson end up with an autoimmune disease?” — Northeastern University",
            url: "https://news.northeastern.edu/2026/07/06/bryan-johnson-autoimmune-gastritis/",
          },
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

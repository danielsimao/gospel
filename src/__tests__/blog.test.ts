import { describe, it, expect } from "vitest";
import en from "@/messages/en.json";
import pt from "@/messages/pt.json";
import { getPublishedPosts, getPostLocales, getPostContent } from "@/content/blog/posts";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("blog messages", () => {
  it("en and pt declare the same blog keys, all non-empty", () => {
    const enKeys = Object.keys(en.blog).sort();
    const ptKeys = Object.keys(pt.blog).sort();
    expect(ptKeys).toEqual(enKeys);

    for (const messages of [en.blog, pt.blog]) {
      for (const [key, value] of Object.entries(messages)) {
        expect(typeof value, `blog.${key}`).toBe("string");
        expect((value as string).length, `blog.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("both locales have the footer blog link", () => {
    expect(en.footer.blogLink.length).toBeGreaterThan(0);
    expect(pt.footer.blogLink.length).toBeGreaterThan(0);
  });
});

describe("blog registry", () => {
  const posts = getPublishedPosts();

  it("slugs are unique and well-formed", () => {
    const slugs = posts.map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(SLUG);
    }
  });

  it("dates are valid ISO dates and modified is not before published", () => {
    for (const post of posts) {
      expect(post.datePublished, post.slug).toMatch(ISO_DATE);
      if (post.dateModified) {
        expect(post.dateModified, post.slug).toMatch(ISO_DATE);
        expect(post.dateModified >= post.datePublished, post.slug).toBe(true);
      }
    }
  });

  it("every post has English content with at least one section", () => {
    for (const post of posts) {
      expect(getPostLocales(post), post.slug).toContain("en");
      const content = post.locales.en;
      expect(content.title.length, post.slug).toBeGreaterThan(0);
      expect(content.hook.length, post.slug).toBeGreaterThan(0);
      expect(content.metaDescription.length, post.slug).toBeGreaterThan(0);
      expect(content.sections.length, post.slug).toBeGreaterThan(0);
    }
  });

  it("posts are sorted newest first", () => {
    const dates = posts.map((post) => post.datePublished);
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it("every locale's content has a personal turn with setup and question", () => {
    for (const post of getPublishedPosts()) {
      for (const locale of getPostLocales(post)) {
        const content = getPostContent(post, locale)!;
        expect(content.personalTurn.setup.length).toBeGreaterThan(20);
        expect(content.personalTurn.question.length).toBeGreaterThan(10);
        expect(content.personalTurn.question).toMatch(/\?/);
      }
    }
  });
});

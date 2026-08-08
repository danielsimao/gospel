/**
 * The topic page's cover photo — full-strength, framed, title set into it.
 *
 * Replaces the standalone emblem that used to sit here: a 32px line icon
 * doesn't decode ("who is Jesus" as an abstract crook shape reads as noise),
 * where a photograph of the same idea does. Unlike the band textures, this is
 * foreground content shown at full opacity in a bordered frame, not a dimmed
 * background — so it carries no opacity damping and no radial mask.
 *
 * The title lives inside the frame rather than stacked below it: a scrim
 * fading up from the image's own near-black ground seats the H1 as a real
 * cover line, not a caption underneath a picture. Big Shoulders stays off
 * this — that face earns its one place on the score band's numerals and
 * nowhere else (see layout.tsx) — so this reaches for scale, weight and the
 * house glow on the existing sans instead.
 *
 * Grows one topic at a time as covers are generated and measured. A slug with
 * no entry here renders nothing, and the topic page falls back to its plain
 * heading — exactly as every topic page already looked before any cover
 * shipped.
 */
const TOPIC_COVERS: ReadonlySet<string> = new Set([
  "who-is-jesus",
  "am-i-a-good-person",
  "does-god-exist",
  "why-are-you-afraid-to-die",
]);

export function hasTopicCover(slug: string): boolean {
  return TOPIC_COVERS.has(slug);
}

export function TopicCover({ slug, title }: { slug: string; title: string }) {
  if (!TOPIC_COVERS.has(slug)) return null;
  return (
    <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10">
      <div aria-hidden="true" className="absolute inset-0">
        <picture>
          <source srcSet={`/graphics/covers/${slug}.avif`} type="image/avif" />
          <img
            src={`/graphics/covers/${slug}.webp`}
            alt=""
            loading="lazy"
            decoding="async"
            className="size-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-t from-[#060404] from-[15%] via-[#060404]/55 via-[48%] to-transparent" />
      </div>
      <h1
        className="absolute inset-x-0 bottom-0 p-5 text-balance text-3xl font-bold leading-[1.1] tracking-tight text-[#D4A843] sm:p-7 sm:text-4xl md:text-5xl"
        style={{ textShadow: "0 0 40px rgba(212,168,67,0.4), 0 2px 24px rgba(0,0,0,0.7)" }}
      >
        {title}
      </h1>
    </div>
  );
}

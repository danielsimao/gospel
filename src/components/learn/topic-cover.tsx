/**
 * The topic page's cover photo — full-strength, framed, above the title.
 *
 * Replaces the standalone emblem that used to sit here: a 32px line icon
 * doesn't decode ("who is Jesus" as an abstract crook shape reads as noise),
 * where a photograph of the same idea does. Unlike the band textures, this is
 * foreground content shown at full opacity in a bordered frame, not a dimmed
 * background — so it carries no opacity damping and no radial mask.
 *
 * Grows one topic at a time as covers are generated and measured. A slug with
 * no entry here renders nothing — the title stands alone, exactly as every
 * topic page already looked before any cover shipped.
 */
const TOPIC_COVERS: ReadonlySet<string> = new Set(["who-is-jesus"]);

export function TopicCover({ slug }: { slug: string }) {
  if (!TOPIC_COVERS.has(slug)) return null;
  return (
    <div
      aria-hidden="true"
      className="mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-white/10"
    >
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
    </div>
  );
}

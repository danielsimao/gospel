# Scripture permissions — where this site actually stands

**Superseded:** an earlier draft here was a permission request to Sociedade Bíblica de
Portugal for the ARC. **It was aimed at the wrong publisher** and has been deleted. This
site does not use ARC.

## What the site uses

| Locale | Translation | Rights holder | Allowance | Our usage |
|---|---|---|---|---|
| English | NKJV | Thomas Nelson / HarperCollins | 500 verses total, not a whole book, Scripture under 25% of the work | ~38 reproduced today, ~183 after the 7 reading passages |
| Portuguese | **Almeida Corrigida Fiel (ACF)** | Sociedade Bíblica Trinitariana do Brasil / Trinitarian Bible Society | **1,100 verses**, not a whole book, not 50% of the work | 145 for the reading passages |

Both clear comfortably. **No permission letter is required to ship.**

Required notices, already rendered on `/about` and in the footer:

- EN — *Scripture quotations are taken from the New King James Version®. Copyright © 1982
  by Thomas Nelson. Used by permission. All rights reserved.*
- PT — *Citações bíblicas extraídas de A Bíblia Sagrada — Almeida Corrigida Fiel (ACF),
  © 1994, 1995, 2007, 2011 Sociedade Bíblica Trinitariana do Brasil, Trinitarian Bible
  Society.*

## Two open items, neither blocking

**1. The TBS / SBTB contradiction.** Sociedade Bíblica Trinitariana do Brasil is the
Trinitarian Bible Society's Brazilian branch, not a separate licensee. SBTB publishes the
1,100-verse allowance quoted above. TBS UK's copyright FAQ says instead: *"May I post TBS
material on my website? No, we do not allow this. However, you may provide a link to the
publication on our site."* Those cannot both be applied literally to the same text.

The Brazilian term is the specific one for ACF and the one this site already relies on for
its existing quotations, so this is confirmation rather than permission. Worth a short
email before Phase 3 renders full passages.

- SBTB: `sbtb@biblias.com.br` · +55 11 2693-5663
- TBS UK: contact form only · Editorial Department

Ask two questions: does the 1,100-verse allowance cover in-page display on a free,
ad-free website; and how should the 50%-of-the-work condition be assessed for a page
whose main content is the passage itself.

**2. A licensed text source.** There is no official machine-readable ACF — SBTB offers a
web reader only. Every mirror found (GitHub repos, bolls.life, e-Sword and MySword
modules) redistributes copyrighted text without permission, and at least one asserts a
Creative Commons licence over text it does not own. Phase 3's passage JSON must be
produced from a licensed copy. Ask SBTB about this in the same email.

## Why Portuguese quotes ACF but links to ARC

This is deliberate, and it is worth writing down because it looks like an inconsistency
until you know why.

**Quoted text is ACF**, because that is the translation this site has chosen and because
its 1,100-verse allowance is what makes in-page reading possible at all.

**Outbound reading links are ARC**, because YouVersion does not carry ACF. Verified
2026-08-11: bible.com lists 17 Portuguese versions and ACF is not among them. There is no
way to send a reader to ACF on the platform the reading plan links to, so ARC is the
closest available Almeida and the fallback is forced rather than chosen.

**Corrected 2026-08-11: the fallback was pointing at the wrong ARC.** The nine reading
links used `bible.com/bible/212`, which is Almeida Revista e Corrigida in **Brazilian**
Portuguese (Sociedade Bíblica do Brasil). The European edition — Almeida Revista e
Corrigida (Portugal), Sociedade Bíblica de Portugal — is version **215**. A `tu`-form
site written for readers in Portugal was sending them to the Brazilian edition. All nine
now point at 215, verified resolving.

English is unaffected: it links to `bible.com/bible/114`, which is NKJV, the same
translation it quotes. English is the simple case — quoted and linked translations match.

## One thing still unresolved, for the owner

The site's ACF text uses Brazilian orthography (`unigênito`, six occurrences; the European
`unigénito`, none), while `docs/superpowers/plans/2026-07-16-content-runway-wave1.md`
states the intended convention is European. ACF is Sociedade Bíblica Trinitariana **do
Brasil**'s edition, so this is inherent to the translation rather than a typo — choosing
ACF means accepting Brazilian spelling in quoted scripture on a European-Portuguese site.
Worth confirming that trade is intended, since the alternative (ARC Portugal for quotes
too) would drop the allowance from 1,100 verses to whatever SBP grants, which is the
constraint that made this whole question hard in the first place.

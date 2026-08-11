# Permission request — Sociedade Bíblica de Portugal (ARC)

**Status:** drafted, not sent. Needs the owner's name, contact details and a final
read of the Portuguese before it goes.
**To:** `info@sociedadebiblica.pt` — the address SBP currently publishes.
**Why this exists:** `ifyoudiedtoday.com` quotes the Almeida Revista e Corrigida
throughout, and has done since launch, without permission. That is owed regardless of
the in-page reading feature that surfaced it. See
`docs/superpowers/specs/2026-08-10-next-steps-revamp-design.md` §5.3.

## What we are asking for

Two things, and it is worth asking for both at once rather than returning later:

1. **Retrospective cover for what is already published** — short quotations of ARC
   across the site's teaching pages, the blog and the presentation itself.
2. **Permission to display seven passages of John in full**, in-page, as a seven-day
   reading feature: John 1:1-18, 3:1-21, 4:1-26, 10:1-18, 14:1-14, 15:1-17 and
   20:1-31 — **145 verses in total**.

The site is free, carries no advertising, no paywall, no subscription and takes no
money of any kind.

biblia.pt's published terms permit redistribution of at most 50 verses as fair use,
which 145 plainly exceeds — hence the request. Note that a second pass could not find
that clause on the current version of the terms page, so it may have been revised; the
request stands on the copyright itself either way.

If permission is granted, we expect it may carry a requirement to link back to
biblia.pt. The reading component is being built so that a source link can render
alongside the attribution notice.

## Draft — Portuguese

> **Assunto:** Pedido de autorização para citação e apresentação de texto bíblico (ARC)
>
> Exmos. Senhores,
>
> Chamo-me [NOME] e mantenho o sítio ifyoudiedtoday.com, um projecto cristão gratuito,
> sem publicidade, sem subscrições e sem qualquer receita, disponível em inglês e em
> português europeu.
>
> O sítio cita a Almeida Revista e Corrigida em várias páginas, e faço este pedido em
> dois pontos.
>
> Primeiro, gostaria de regularizar as citações já publicadas — passagens curtas
> utilizadas ao longo das páginas de ensino, do blogue e da apresentação.
>
> Segundo, gostaria de pedir autorização para apresentar, na própria página, sete
> passagens do Evangelho de João como plano de leitura de sete dias: João 1:1-18,
> 3:1-21, 4:1-26, 10:1-18, 14:1-14, 15:1-17 e 20:1-31 — 145 versículos no total.
> Actualmente estas passagens são apenas ligadas a bible.com, e gostaríamos que o
> leitor as pudesse ler sem sair do sítio.
>
> Tenho conhecimento de que os termos do biblia.pt permitem a redistribuição de um
> máximo de 50 versículos a título de utilização justa, pelo que este pedido excede
> claramente esse limite e é feito por essa razão.
>
> Comprometo-me a apresentar a atribuição exigida — actualmente o sítio já apresenta
> "Tradução de João Ferreira de Almeida, Edição Revista e Corrigida. Copyright © 2001
> Sociedade Bíblica de Portugal." — e a incluir uma ligação para o biblia.pt, caso seja
> essa a vossa condição.
>
> Agradeço desde já a vossa atenção e fico a aguardar a vossa resposta.
>
> Com os melhores cumprimentos,
> [NOME]
> [CONTACTO]

**Note on the Portuguese:** this is a draft by the same hand as the rest of the drafted
PT strings on `feat/next-steps-revamp`, and idiom in this repo belongs to the owner. It
addresses SBP formally (`vós`/`Exmos. Senhores`), not with the `tu` the reader-facing
copy uses — that register is for the reader, not for a publisher's legal department.

## What happens with each answer

- **Granted** — Phase 3 ships: flipping Portuguese from link-out to in-page becomes a
  data change, not a code change. Add any required source link beside the notice.
- **Granted for the existing quotations only** — Phase 2 ships English in-page,
  Portuguese keeps its bible.com link permanently. This is already the recommended
  shape in §5.4, so nothing is blocked.
- **Declined, or no reply** — same as above. The reading component supports link-out per
  locale by design, precisely so this answer costs nothing already built.

There is no version of this where the Portuguese reader ends up worse off than today.

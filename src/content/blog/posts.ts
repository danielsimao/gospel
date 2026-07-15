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
      pt: {
        title: "O Movimento “Don’t Die” e a Pergunta a Que Não Consegue Responder",
        hook: "O homem que gasta milhões para nunca morrer acabou de anunciar um diagnóstico incurável. O projecto dele faz a pergunta certa — e continua sem lhe saber responder.",
        metaDescription:
          "Bryan Johnson, que gasta milhões por ano para não morrer, anunciou que tem uma doença autoimune incurável. O projecto dele faz a pergunta certa. O que acontece quando morreres?",
        sections: [
          {
            heading: "“O meu estômago está a comer-se a si próprio”",
            body: "No dia 30 de Junho, Bryan Johnson — o homem que já gastou dezenas de milhões de dólares para não morrer — anunciou que o próprio corpo está a atacar-se a si mesmo. “Tenho uma doença autoimune,” escreveu. “O meu estômago está a comer-se a si próprio.”\n\nO diagnóstico é gastrite autoimune: o sistema imunitário dele está a destruir as células do revestimento do estômago. É crónica e incurável, embora não seja fatal em si mesma — o que aumenta, silenciosamente, é o risco: de anemia, de danos nos nervos, de cancro do estômago. E chegou sem avisar, no meio do corpo mais medido, mais optimizado e mais vigiado do planeta.\n\nA resposta de Johnson foi tipicamente Bryan Johnson: disse que isto só obriga a equipa dele a trabalhar mais depressa para encontrar uma cura. Mas algo importante acabou de ficar à vista. O protocolo não teve voto na matéria.",
          },
          {
            heading: "Uma guerra contra a morte",
            body: "Johnson, o empresário de tecnologia por detrás do protocolo Blueprint, transformou a própria vida numa experiência pública com um único objectivo: não morrer. Rotinas rígidas, medição constante, milhões de dólares por ano — tudo documentado abertamente, e até com um slogan que serve de movimento.\n\nSeria fácil troçar, e este mês grande parte da cobertura fê-lo. Mas antes de sorrirmos dos suplementos e das métricas de sono, devíamos reparar numa coisa: ele leva a morte mais a sério do que quase toda a gente na vida pública.",
          },
          {
            heading: "Ele tem razão quanto ao problema",
            body: "A maioria de nós vive como se a morte fosse um compromisso de outra pessoa. Mantemo-la fora da agenda e fora das conversas, e chamamos a isso estar bem connosco.\n\nO movimento “Don’t Die” recusa-se a fazer isso. Diz em voz alta o que toda a gente sabe em silêncio: a morte não é ruído de fundo natural. É um inimigo. Há algo em nós que protesta contra ela — e esse protesto diz-nos alguma coisa. A Escritura diz que Deus pôs “o mundo no coração do homem” — um anseio maior do que o tempo que temos. Não fomos feitos para estar em paz com o morrer, e nenhum esforço de adaptação nos deixa verdadeiramente em paz.",
            scripture:
              "Tudo fez formoso em seu tempo; também pôs o mundo no coração do homem, sem que este possa descobrir a obra que Deus fez desde o princípio até ao fim.",
            scriptureRef: "Eclesiastes 3:11 (ARC)",
          },
          {
            heading: "A pergunta a que o protocolo não sabe responder",
            body: "Suponhamos que o projecto recupera disto e tem um sucesso além de todas as expectativas. Suponhamos que as medições, a disciplina e a ciência compram décadas — até um século. Cada um desses anos chega à mesma porta.\n\nÉ isto que o diagnóstico torna evidente. Um corpo pode ser medido todas as manhãs e, ainda assim, tomar uma decisão sem pedir licença. A longevidade pode mudar quando morres. Não pode mudar que morres — e não tem absolutamente nada a dizer sobre o que vem depois. Essa é a pergunta escondida debaixo do movimento, aquela em que nenhum protocolo toca: não é “quanto tempo?”, é “e depois?”",
            scripture: "E, como aos homens está ordenado morrerem uma vez, vindo depois disso o juízo.",
            scriptureRef: "Hebreus 9:27 (ARC)",
          },
          {
            heading: "Uma esperança melhor do que não morrer",
            body: "O cristianismo nunca pediu a ninguém que fizesse as pazes com a morte. Também lhe chama inimiga — “o último inimigo a ser destruído”. A diferença está na estratégia. O evangelho não promete uma fuga ao morrer; anuncia que alguém atravessou a morte e saiu do outro lado, e que se oferece para nos levar com Ele.\n\nJesus não disse “não vais morrer”. Disse algo muito mais estranho e muito mais forte: “todo aquele que vive e crê em mim nunca morrerá”. Não é a morte adiada — é a morte vencida.\n\nPortanto, o movimento “Don’t Die” está meio certo. Vale a pena lutar contra a morte. A questão é se lutas contra ela com um protocolo que só a pode adiar, ou se confias naquele que já a venceu.",
            scripture:
              "Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá; e todo aquele que vive e crê em mim nunca morrerá.",
            scriptureRef: "João 11:25–26 (ARC)",
          },
        ],
        personalTurn: {
          setup:
            "Bryan Johnson não teve voto no diagnóstico dele — e tu não vais ter voto no teu. Há um exame depois daquela porta, e ele não espera até estares pronto. Mas podes ver agora mesmo como te sairias.",
          question: "Se acontecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "“Bryan Johnson’s diagnosis shines light on hard-to-detect disease” — STAT News (em inglês)",
            url: "https://www.statnews.com/2026/07/08/bryan-johnson-autoimmune-gastritis-diagnosis-explained/",
          },
          {
            label: "“How did Bryan Johnson end up with an autoimmune disease?” — Northeastern University (em inglês)",
            url: "https://news.northeastern.edu/2026/07/06/bryan-johnson-autoimmune-gastritis/",
          },
          {
            label: "Bryan Johnson — Wikipédia (em inglês)",
            url: "https://en.wikipedia.org/wiki/Bryan_Johnson",
          },
          {
            label: "Don’t Die: The Man Who Wants to Live Forever (documentário) — Wikipédia (em inglês)",
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

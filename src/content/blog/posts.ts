import { SUPPORTED_LOCALES, type Locale } from "@/lib/i18n";
import type { BlogPost, BlogPostContent } from "./types";

const POSTS: BlogPost[] = [
  {
    slug: "the-final-whistle",
    datePublished: "2026-07-25",
    locales: {
      en: {
        title: "The Final Whistle and the One Nobody Schedules",
        metaTitle: "The Final Whistle Nobody Schedules",
        hook: "A billion people watched the clock run out on the greatest player alive. Every one of them is on a clock too.",
        metaDescription:
          "Spain beat Argentina in the 2026 World Cup final. Messi sat alone on the grass as the clock ran out. Every life has a final whistle. What happens after yours?",
        sections: [
          {
            heading: "He didn’t leave the pitch",
            body: "On July 19th, in front of the largest television audience on earth, Spain beat Argentina 1–0 in extra time. Ferran Torres scored. Lionel Messi played all one hundred and twenty minutes and had a single shot.\n\nWhen it ended, he didn’t walk to the tunnel. He sat down on the grass, alone, and stayed there while Spain celebrated a few metres away. He is thirty-nine. Nobody had to explain what the picture meant.",
          },
          {
            heading: "Nothing left to prove, and it still hurt",
            body: "This is the part worth sitting with. Messi has nothing left to win. He has the World Cup, the Copa América, the records, the arguments settled. There was no hole in the résumé that this final was going to fill.\n\nAnd it still broke him. Because what he lost that night wasn’t a trophy. It was time. The referee looked at his watch and decided that the thing Messi had been doing his whole life was now over, and Messi had no say in it at all.",
          },
          {
            heading: "Everyone gets a whistle",
            body: "Football is honest about one thing that the rest of life is careful to hide: the game ends whether or not you are finished playing it.\n\nThere is no extra time for men who are good at football. There is no appeal. The whistle is not a judgement on your talent, it is simply the end, and it comes at a moment somebody else chose. Every person watching that final has one of those coming. Almost none of them thought about it while they watched.",
            scripture: "So teach us to number our days, that we may gain a heart of wisdom.",
            scriptureRef: "Psalm 90:12",
          },
          {
            heading: "The medal ceremony afterwards",
            body: "Here is where the picture stops being about football. Every stadium empties. Every trophy tarnishes. The Scriptures are blunt about the shelf life of the things we run for — a perishable crown, is the phrase — and they are just as blunt about what waits on the other side of the whistle.\n\nIt is not nothing. It is not a fade to black. It is a reckoning, and it is appointed, and there is no version of your life that routes around it.",
            scripture:
              "And everyone who competes for the prize is temperate in all things. Now they do it to obtain a perishable crown, but we for an imperishable crown.",
            scriptureRef: "1 Corinthians 9:25",
          },
          {
            heading: "The one result that can’t be taken back",
            body: "Christianity does not tell you the whistle isn’t coming. It tells you someone has already been through it and come back out the other side, in a body, eating fish on a beach — and that he offers to bring you through with him.\n\nJesus never promised a longer game. He promised something far stranger: that death would stop being the end of the story for anyone who trusted him. Not extra time. A different competition entirely, and a crown nobody hands back.",
            scripture:
              "I am the resurrection and the life. He who believes in Me, though he may die, he shall live. And whoever lives and believes in Me shall never die.",
            scriptureRef: "John 11:25–26",
          },
        ],
        personalTurn: {
          setup:
            "Messi knew the date of his final. You don’t know yours. And there is an exam on the other side of that whistle that doesn’t wait until you feel ready — but you can see how you’d do on it right now.",
          question: "If the whistle went tonight — would you pass?",
        },
        sources: [
          {
            label: "“Spain’s persistence pays off to win 2026 World Cup as Messi, Argentina exit quietly” — ESPN",
            url: "https://www.espn.com/soccer/story/_/id/49402253/world-cup-spain-win-lionel-messi-argentina-reaction-analysis-ferran-torres",
          },
          {
            label: "“After World Cup final heartbreak, was that the end for Lionel Messi?” — NBC News",
            url: "https://www.nbcnews.com/sports/soccer/world-cup-final-heartbreak-was-end-lionel-messi-rcna588286",
          },
          {
            label: "2026 FIFA World Cup final — Wikipedia",
            url: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final",
          },
        ],
      },
      pt: {
        title: "O Apito Final — e Aquele Que Ninguém Marca",
        metaTitle: "O Apito Que Ninguém Marca",
        hook: "Mil milhões de pessoas viram o relógio esgotar-se para o melhor jogador vivo. Todas elas têm um relógio a contar.",
        metaDescription:
          "A Espanha venceu a Argentina na final do Mundial de 2026. Messi ficou sozinho na relva. Toda a vida tem um apito final. O que acontece depois do teu?",
        sections: [
          {
            heading: "Ele não saiu do relvado",
            body: "No dia 19 de Julho, perante a maior audiência televisiva do planeta, a Espanha venceu a Argentina por 1–0 no prolongamento. Ferran Torres marcou. Lionel Messi jogou os cento e vinte minutos completos e rematou uma única vez.\n\nQuando acabou, não foi para o túnel. Sentou-se na relva, sozinho, e ficou ali enquanto a Espanha festejava a poucos metros. Tem trinta e nove anos. Ninguém teve de explicar o que aquela imagem queria dizer.",
          },
          {
            heading: "Não tinha nada a provar — e doeu na mesma",
            body: "É esta a parte que vale a pena deixar assentar. Messi não tem mais nada para ganhar. Tem o Mundial, a Copa América, os recordes, as discussões todas arrumadas. Não havia um buraco no currículo que aquela final fosse preencher.\n\nE partiu-o na mesma. Porque o que ele perdeu naquela noite não foi um troféu. Foi tempo. O árbitro olhou para o relógio e decidiu que aquilo que Messi fez a vida inteira tinha acabado — e Messi não teve voto nenhum na matéria.",
          },
          {
            heading: "Toda a gente leva com o apito",
            body: "O futebol é honesto numa coisa que o resto da vida faz questão de esconder: o jogo acaba, quer tu tenhas acabado de jogar, quer não.\n\nNão há prolongamento para quem joga bem. Não há recurso. O apito não é um juízo sobre o teu talento — é simplesmente o fim, e chega num momento escolhido por outra pessoa. Todas as pessoas que viram aquela final têm um apito destes à espera. Quase nenhuma pensou nisso enquanto via.",
            scripture:
              "Ensina-nos a contar os nossos dias, de tal maneira que alcancemos corações sábios.",
            scriptureRef: "Salmo 90:12",
          },
          {
            heading: "A cerimónia que vem a seguir",
            body: "É aqui que a imagem deixa de ser sobre futebol. Todos os estádios se esvaziam. Todos os troféus perdem o brilho. A Escritura é directa quanto ao prazo de validade daquilo por que corremos — chama-lhe uma coroa corruptível — e é igualmente directa quanto ao que espera do outro lado do apito.\n\nNão é nada. Não é um ecrã a escurecer. É um acerto de contas, está marcado, e não há versão da tua vida que lhe dê a volta.",
            scripture:
              "E todo aquele que luta de tudo se abstém; eles o fazem para alcançar uma coroa corruptível, nós, porém, uma incorruptível.",
            scriptureRef: "1 Coríntios 9:25",
          },
          {
            heading: "O único resultado que não se tira a ninguém",
            body: "O cristianismo não te diz que o apito não vem. Diz-te que alguém já passou por ele e saiu do outro lado, em corpo, a comer peixe numa praia — e que se oferece para te levar com Ele.\n\nJesus nunca prometeu um jogo mais longo. Prometeu algo muito mais estranho: que a morte deixaria de ser o fim da história para quem confia n’Ele. Não é prolongamento. É outra competição — e uma coroa que ninguém devolve.",
            scripture:
              "Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá; e todo aquele que vive, e crê em mim, nunca irá morrer.",
            scriptureRef: "João 11:25–26",
          },
        ],
        personalTurn: {
          setup:
            "Messi sabia a data da final dele. Tu não sabes a tua. E há um exame do outro lado daquele apito que não espera até te sentires preparado — mas podes ver agora mesmo como te sairias.",
          question: "Se o apito soasse esta noite — passavas?",
        },
        sources: [
          {
            label: "“Spain’s persistence pays off to win 2026 World Cup” — ESPN (em inglês)",
            url: "https://www.espn.com/soccer/story/_/id/49402253/world-cup-spain-win-lionel-messi-argentina-reaction-analysis-ferran-torres",
          },
          {
            label: "“After World Cup final heartbreak, was that the end for Lionel Messi?” — NBC News (em inglês)",
            url: "https://www.nbcnews.com/sports/soccer/world-cup-final-heartbreak-was-end-lionel-messi-rcna588286",
          },
          {
            label: "Final do Campeonato do Mundo de 2026 — Wikipédia (em inglês)",
            url: "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_final",
          },
        ],
      },
    },
  },
  {
    slug: "the-headline-jesus-was-handed",
    datePublished: "2026-07-24",
    locales: {
      en: {
        title: "The Headline Jesus Was Handed",
        hook: "Thirteen nights of strikes, and the death toll scrolls past. Someone once pushed a headline exactly like it across a table to him — and his answer was not the one anybody expected.",
        metaDescription:
          "The Iran war escalated through July 2026. Someone brought Jesus a headline like it. His answer turned the news back on the reader. What happens when you die?",
        sections: [
          {
            heading: "Thirteen nights",
            body: "The ceasefire collapsed at the start of the month. After Iran struck three commercial vessels in the Strait of Hormuz on the 6th and 7th, US forces began a bombing campaign that has now run thirteen consecutive nights — coastal surveillance, air defence sites, logistics, maritime capability. Qatar, Kuwait and Jordan have come under Iranian fire in return.\n\nYou have read some version of that paragraph a dozen times this month. Your eyes moved over the numbers and kept going. That is not a criticism; it is how everybody reads a war they are not in.",
          },
          {
            heading: "Someone brought him the news",
            body: "There is a scene in Luke’s gospel where a group of people walk up to Jesus with a current event. Pilate had killed a group of Galileans while they were in the middle of offering sacrifices — soldiers, worshippers, blood on the temple floor. It was the ancient equivalent of pushing a phone across the table and saying, have you seen this.\n\nThey wanted the thing we always want from a headline: a verdict on somebody else. Were they worse than the rest? Was it deserved? Whose fault was it?",
          },
          {
            heading: "He refused the question they asked",
            body: "His answer was no — they were not worse. And then, before anybody could relax into that, he added a sentence nobody came for: unless you repent, you will all likewise perish.\n\nThen he raised a second story himself, unprompted. A tower in Siloam had fallen and killed eighteen people. Not politics, not persecution — a building accident. Same answer. Not worse than you. Same warning.\n\nHe took two headlines about other people and, in about thirty seconds, made both of them about the person reading them.",
            scripture:
              "Or those eighteen on whom the tower in Siloam fell and killed them, do you think that they were worse sinners than all other men who dwelt in Jerusalem? I tell you, no; but unless you repent you will all likewise perish.",
            scriptureRef: "Luke 13:4–5",
          },
          {
            heading: "Why he answered like that",
            body: "Because news about death is not information about strangers. It is notice.\n\nEvery name in this month’s reporting had a morning that started normally. Not one of them had the day marked. What separates you from them is not righteousness and it is not caution — it is a few miles and an amount of time nobody has told you the size of. And on the far side of that time there is not simply an ending. There is an appointment.",
            scripture: "And as it is appointed for men to die once, but after this the judgment.",
            scriptureRef: "Hebrews 9:27",
          },
          {
            heading: "The reason the notice comes with time attached",
            body: "Jesus did not tell those people to be afraid and leave it there. The whole point of saying it out loud, while they were still standing in front of him, was that there was still something to be done about it.\n\nGod’s answer to a world full of people who die unready was not better warnings. It was a substitute: he sent his Son to take the judgment in the place of guilty people, and to walk out of his own grave three days later. That offer stands for as long as you are reading this and not one minute longer.",
            scripture:
              "But God demonstrates His own love toward us, in that while we were still sinners, Christ died for us.",
            scriptureRef: "Romans 5:8",
          },
        ],
        personalTurn: {
          setup:
            "The people in this month’s headlines got no notice at all. You have just had one. There is an exam on the other side of that door, and it doesn’t wait until you feel ready — but you can see how you’d do on it right now.",
          question: "If it happened tonight — would you pass?",
        },
        sources: [
          {
            label: "“July 24, 2026 — Escalation in Iran war nears 2-week mark” — CNN",
            url: "https://www.cnn.com/2026/07/24/world/live-news/iran-war-trump",
          },
          {
            label: "“July 13, 2026 — US resumes strikes while Iran says it struck two tankers in Strait of Hormuz” — CNN",
            url: "https://www.cnn.com/2026/07/13/world/live-news/iran-war-trump",
          },
          {
            label: "2026 Iran war — Britannica",
            url: "https://www.britannica.com/event/2026-Iran-war",
          },
        ],
      },
      pt: {
        title: "A Notícia Que Trouxeram a Jesus",
        hook: "Treze noites de ataques, e o número de mortos passa no ecrã. Uma vez alguém empurrou uma notícia exactamente assim na direcção d’Ele — e a resposta não foi a que ninguém esperava.",
        metaDescription:
          "A guerra do Irão escalou em Julho de 2026. Trouxeram a Jesus uma notícia assim. A resposta d’Ele virou o assunto para o leitor. O que acontece quando morreres?",
        sections: [
          {
            heading: "Treze noites",
            body: "O cessar-fogo ruiu no início do mês. Depois de o Irão ter atingido três navios comerciais no Estreito de Ormuz nos dias 6 e 7, as forças norte-americanas iniciaram uma campanha de bombardeamento que já leva treze noites seguidas — vigilância costeira, defesa aérea, logística, capacidade naval. O Qatar, o Kuwait e a Jordânia foram alvo de fogo iraniano em resposta.\n\nJá leste alguma versão deste parágrafo uma dúzia de vezes este mês. Os teus olhos passaram por cima dos números e seguiram em frente. Não é uma crítica; é assim que toda a gente lê uma guerra em que não está.",
          },
          {
            heading: "Trouxeram-lhe a notícia",
            body: "Há uma cena no evangelho de Lucas em que um grupo de pessoas se aproxima de Jesus com um acontecimento do dia. Pilatos tinha mandado matar uns galileus enquanto ofereciam sacrifícios — soldados, adoradores, sangue no chão do templo. Era o equivalente antigo a empurrar um telemóvel sobre a mesa e dizer: já viste isto?\n\nQueriam aquilo que sempre queremos de uma notícia: um veredicto sobre outra pessoa. Seriam piores do que os outros? Terão merecido? De quem foi a culpa?",
          },
          {
            heading: "Ele recusou a pergunta que lhe fizeram",
            body: "A resposta foi não — não eram piores. E depois, antes que alguém pudesse descansar nisso, acrescentou uma frase que ninguém tinha ido buscar: se não vos arrependerdes, todos de igual modo perecereis.\n\nA seguir levantou Ele próprio uma segunda notícia, sem ninguém pedir. Uma torre em Siloé tinha caído e matado dezoito pessoas. Não era política, não era perseguição — foi um acidente de construção. Mesma resposta. Não eram piores do que tu. Mesmo aviso.\n\nPegou em duas notícias sobre outras pessoas e, em cerca de trinta segundos, tornou ambas em notícias sobre quem as estava a ouvir.",
            scripture:
              "E aqueles dezoito, sobre os quais caiu a torre de Siloé e os matou, cuidais que foram mais culpados do que todos os homens que habitam em Jerusalém? Não, vos digo; antes, se não vos arrependerdes, todos de igual modo perecereis.",
            scriptureRef: "Lucas 13:4–5",
          },
          {
            heading: "Porque é que respondeu assim",
            body: "Porque uma notícia sobre a morte não é informação sobre desconhecidos. É um aviso.\n\nCada nome nas notícias deste mês teve uma manhã que começou normal. Nenhum deles tinha o dia marcado. O que te separa deles não é justiça e não é prudência — são uns quantos quilómetros e uma quantidade de tempo cujo tamanho ninguém te disse. E do outro lado desse tempo não há apenas um fim. Há uma marcação.",
            scripture: "E, como aos homens está ordenado morrerem uma vez, vindo depois disso o juízo.",
            scriptureRef: "Hebreus 9:27",
          },
          {
            heading: "Porque é que o aviso vem com tempo agarrado",
            body: "Jesus não disse àquelas pessoas que tivessem medo e ficou-se por aí. O objectivo de o dizer em voz alta, enquanto ainda estavam ali à frente d’Ele, era precisamente que ainda havia alguma coisa a fazer.\n\nA resposta de Deus a um mundo cheio de gente que morre sem estar pronta não foi arranjar melhores avisos. Foi um substituto: enviou o Seu Filho para levar o juízo no lugar de culpados, e para sair do próprio túmulo três dias depois. Essa oferta mantém-se enquanto estás a ler isto, e nem um minuto mais.",
            scripture:
              "Mas Deus prova o seu amor para connosco, em que Cristo morreu por nós, sendo nós ainda pecadores.",
            scriptureRef: "Romanos 5:8",
          },
        ],
        personalTurn: {
          setup:
            "As pessoas das notícias deste mês não tiveram aviso nenhum. Tu acabaste de ter um. Há um exame do outro lado daquela porta, e ele não espera até estares pronto — mas podes ver agora mesmo como te sairias.",
          question: "Se acontecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "“Escalation in Iran war nears 2-week mark” — CNN (em inglês)",
            url: "https://www.cnn.com/2026/07/24/world/live-news/iran-war-trump",
          },
          {
            label: "“US resumes strikes while Iran says it struck two tankers in Strait of Hormuz” — CNN (em inglês)",
            url: "https://www.cnn.com/2026/07/13/world/live-news/iran-war-trump",
          },
          {
            label: "Guerra do Irão de 2026 — Britannica (em inglês)",
            url: "https://www.britannica.com/event/2026-Iran-war",
          },
        ],
      },
    },
  },
  {
    slug: "humanitys-last-exam",
    datePublished: "2026-07-23",
    locales: {
      en: {
        title: "Humanity’s Last Exam",
        hook: "The most capable machine ever built just scored 58% on a test actually called Humanity’s Last Exam. There is another last exam, and it cannot sit that one for you.",
        metaDescription:
          "AI labs are racing toward superintelligence while their own researchers ask to slow down. None of it can tell you what happens when you die.",
        sections: [
          {
            heading: "Fifty-eight per cent",
            body: "This month Meta Superintelligence Labs announced Muse Spark — native multimodal reasoning, visual chain of thought, a “Contemplating” mode that runs several reasoning agents in parallel. It scored 58% on a benchmark that researchers, without much irony, named Humanity’s Last Exam.\n\nMeanwhile the lab’s own superintelligence chief said their next model, still in training, has caught up with the current frontier. The pace is not slowing. Everyone in the field can feel it.",
          },
          {
            heading: "And the people building it are asking to slow down",
            body: "In the same weeks, a group of AI researchers published a proposal to delay superintelligence until 2040 — deliberately, by agreement — to give governments and societies time to deal with loss of control, concentrated power, and job disruption.\n\nRead that again. The people closest to the machine are asking for more time. Not because it will fail, but because it might work.",
          },
          {
            heading: "Where wisdom is not found",
            body: "There is a very old question in the book of Job that no benchmark has ever touched: where shall wisdom be found? Job asks it after listing everything human ingenuity can reach — miners cutting shafts through rock, finding sapphires in the dark, turning rivers aside. We are extremely good at reaching things.\n\nAnd then he says: but not that. Not the one thing. You can build a system that answers every question we know how to write down, and it will still have nothing to say about what happens to you.",
            scripture: "But where can wisdom be found? And where is the place of understanding?",
            scriptureRef: "Job 28:12",
          },
          {
            heading: "The other last exam",
            body: "Because there is a last exam, and it is not a benchmark. It is not multiple choice, it is not graded on a curve, and there is no model you can put in your seat.\n\nThe standard is God’s law — the commandments you already half-remember — and the marking is done by someone who was present for every answer you have ever given. This is the appointment underneath all the others, and no amount of compute moves it by a day.",
            scripture: "And as it is appointed for men to die once, but after this the judgment.",
            scriptureRef: "Hebrews 9:27",
          },
          {
            heading: "Someone already sat it",
            body: "Here is the part that no amount of intelligence would have predicted. God’s solution was not to lower the standard, and it was not to grade you kindly. It was to send someone to take the exam and the sentence in your place — a substitute who had never once failed it, punished as though he had failed all of it, so that guilty people could be counted righteous.\n\nThat is not a system upgrade. It is a swap. And unlike every benchmark ever published, it has already been passed on someone else’s behalf.",
            scripture:
              "For He made Him who knew no sin to be sin for us, that we might become the righteousness of God in Him.",
            scriptureRef: "2 Corinthians 5:21",
          },
        ],
        personalTurn: {
          setup:
            "You can ask the most capable system ever built anything at all, and it cannot tell you how you would do on the only exam that is definitely coming. You can find that out in about two minutes.",
          question: "If you sat it tonight — would you pass?",
        },
        sources: [
          {
            label: "“July 2026 AI Releases: OpenAI, Anthropic, Google DeepMind, Meta AI” — ThursdAI",
            url: "https://thursdai.news/releases/2026-07",
          },
          {
            label: "“AI News Briefs bulletin board for July 2026” — Radical Data Science",
            url: "https://radicaldatascience.wordpress.com/2026/07/24/ai-news-briefs-bulletin-board-for-july-2026/",
          },
          {
            label: "Humanity’s Last Exam — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Humanity%27s_Last_Exam",
          },
        ],
      },
      pt: {
        title: "O Último Exame da Humanidade",
        hook: "A máquina mais capaz alguma vez construída acabou de tirar 58% num teste chamado, literalmente, “O Último Exame da Humanidade”. Há outro último exame — e esse ela não o pode fazer por ti.",
        metaDescription:
          "Os laboratórios de IA correm para a superinteligência enquanto os investigadores pedem para abrandar. Nenhum deles sabe dizer-te o que acontece quando morreres.",
        sections: [
          {
            heading: "Cinquenta e oito por cento",
            body: "Este mês, os Meta Superintelligence Labs anunciaram o Muse Spark — raciocínio multimodal nativo, cadeia de raciocínio visual, um modo “Contemplating” que corre vários agentes de raciocínio em paralelo. Obteve 58% num teste a que os investigadores, sem grande ironia, chamaram “Humanity’s Last Exam” — o último exame da humanidade.\n\nEntretanto, o responsável pela superinteligência do mesmo laboratório disse que o modelo seguinte, ainda em treino, já apanhou a fronteira actual. O ritmo não está a abrandar. Toda a gente na área o sente.",
          },
          {
            heading: "E quem o está a construir pede para abrandar",
            body: "Nas mesmas semanas, um grupo de investigadores de IA publicou uma proposta para adiar a superinteligência até 2040 — deliberadamente, por acordo — para dar aos governos e às sociedades tempo para lidar com a perda de controlo, a concentração de poder e a destruição de empregos.\n\nLê outra vez. As pessoas mais próximas da máquina estão a pedir mais tempo. Não porque acreditem que vai falhar, mas porque pode resultar.",
          },
          {
            heading: "Onde a sabedoria não se encontra",
            body: "Há uma pergunta muito antiga no livro de Job em que nenhum teste alguma vez tocou: mas onde se achará a sabedoria? Job faz a pergunta depois de listar tudo aquilo a que o engenho humano chega — mineiros a abrir poços na rocha, a encontrar safiras no escuro, a desviar rios. Somos extremamente bons a chegar a coisas.\n\nE depois diz: menos àquela. Menos à única. Podes construir um sistema que responde a todas as perguntas que sabemos escrever, e continuará sem ter nada a dizer sobre o que te acontece a ti.",
            scripture: "Mas onde se achará a sabedoria? E onde está o lugar da inteligência?",
            scriptureRef: "Job 28:12",
          },
          {
            heading: "O outro último exame",
            body: "Porque há um último exame, e não é um benchmark. Não é de escolha múltipla, não é corrigido por curva, e não há modelo nenhum que possas sentar no teu lugar.\n\nO critério é a lei de Deus — os mandamentos de que já te lembras a meio — e quem corrige esteve presente em cada resposta que alguma vez deste. É esta a marcação por baixo de todas as outras, e não há capacidade de computação que a adie um dia que seja.",
            scripture: "E, como aos homens está ordenado morrerem uma vez, vindo depois disso o juízo.",
            scriptureRef: "Hebreus 9:27",
          },
          {
            heading: "Alguém já o fez",
            body: "E aqui está a parte que nenhuma inteligência teria previsto. A solução de Deus não foi baixar o critério, e não foi corrigir com benevolência. Foi enviar alguém para fazer o exame e cumprir a sentença no teu lugar — um substituto que nunca falhou uma única vez, castigado como se tivesse falhado tudo, para que culpados pudessem ser contados como justos.\n\nIsto não é uma actualização de sistema. É uma troca. E, ao contrário de todos os testes alguma vez publicados, já foi passado em nome de outra pessoa.",
            scripture:
              "Àquele que não conheceu pecado, o fez pecado por nós; para que nele fôssemos feitos justiça de Deus.",
            scriptureRef: "2 Coríntios 5:21",
          },
        ],
        personalTurn: {
          setup:
            "Podes perguntar o que quiseres ao sistema mais capaz alguma vez construído, e ele não te sabe dizer como te sairias no único exame que vem de certeza. Isso podes descobrir em dois minutos.",
          question: "Se o fizesses esta noite — passavas?",
        },
        sources: [
          {
            label: "“July 2026 AI Releases: OpenAI, Anthropic, Google DeepMind, Meta AI” — ThursdAI (em inglês)",
            url: "https://thursdai.news/releases/2026-07",
          },
          {
            label: "“AI News Briefs bulletin board for July 2026” — Radical Data Science (em inglês)",
            url: "https://radicaldatascience.wordpress.com/2026/07/24/ai-news-briefs-bulletin-board-for-july-2026/",
          },
          {
            label: "Humanity’s Last Exam — Wikipédia (em inglês)",
            url: "https://en.wikipedia.org/wiki/Humanity%27s_Last_Exam",
          },
        ],
      },
    },
  },
  {
    slug: "the-country-that-banned-the-feed",
    datePublished: "2026-07-22",
    draft: true,
    locales: {
      en: {
        title: "France Just Admitted Something Is Forming Its Children",
        metaTitle: "France Admitted What Forms a Child",
        hook: "The first blanket ban of its kind in Europe. A whole country conceding that what goes into a soul comes out of a life.",
        metaDescription:
          "France became the first EU country to pass a blanket social media ban for minors. A nation admitted that what forms a heart matters. Nobody is regulating yours.",
        sections: [
          {
            heading: "The first one to actually do it",
            body: "On July 22nd France became the first country in the European Union to pass a blanket ban on social media platforms for children, after years of mounting evidence about what endless feeds do to developing minds.\n\nOther governments have argued about it. France legislated. Whatever you think of the policy, notice the premise underneath it — a premise that took a decade of damage to force into law.",
          },
          {
            heading: "The premise nobody argued with",
            body: "The premise is this: what a person consumes every day forms who that person becomes. Not influences. Forms.\n\nThat is not a technology finding. It is one of the oldest claims in the Bible, and it is made about adults with exactly the same seriousness. Guard your heart, the proverb says, because everything else in your life flows out of it.",
            scripture: "Keep your heart with all diligence, for out of it spring the issues of life.",
            scriptureRef: "Proverbs 4:23",
          },
          {
            heading: "And nobody is regulating yours",
            body: "There is no age gate on your account. No parliament has ever debated what you scroll at midnight, what you click when you are alone, what you have quietly stopped feeling bad about.\n\nA law can keep certain things away from a child. It cannot get anything out of a grown adult. And when Jesus talked about this, he pushed the problem back one step further than the legislation does — the trouble is not only what goes in. It is what is already in there, waiting.",
            scripture:
              "For from within, out of the heart of men, proceed evil thoughts, adulteries, fornications, murders, thefts, covetousness, wickedness, deceit, lewdness, an evil eye, blasphemy, pride, foolishness. All these evil things come from within and defile a man.",
            scriptureRef: "Mark 7:21–23",
          },
          {
            heading: "Why this ends up being about death",
            body: "Because those are not just habits. They are the exact list you will be measured against, by someone who watched all of it happen and did not need a screenshot.\n\nThat is the appointment sitting on the far side of an ordinary life: not a review of your intentions, but a reckoning with what you actually are. It is appointed once, and then it is judged.",
            scripture: "And as it is appointed for men to die once, but after this the judgment.",
            scriptureRef: "Hebrews 9:27",
          },
          {
            heading: "The offer no law can make",
            body: "France can restrict an input. It cannot give anyone a different heart.\n\nGod promised precisely that, centuries before anybody had a feed to be worried about: not better filtering, not stricter rules — a replacement. The stone taken out, something living put in. That is what the gospel offers, and it is the only offer on the table that goes deeper than behaviour.",
            scripture:
              "I will give you a new heart and put a new spirit within you; I will take the heart of stone out of your flesh and give you a heart of flesh.",
            scriptureRef: "Ezekiel 36:26",
          },
        ],
        personalTurn: {
          setup:
            "A country just went to enormous trouble to protect its children from what would form them. Nobody did that for you, and the forming already happened. There is an exam that measures the result, and it doesn’t wait until you feel ready.",
          question: "If it happened tonight — would you pass?",
        },
        sources: [
          {
            label: "World news — CNN",
            url: "https://www.cnn.com/world",
          },
          {
            label: "Portal:Current events, July 2026 — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Portal:Current_events/July_2026",
          },
        ],
      },
      pt: {
        title: "A França Acabou de Admitir Que Alguma Coisa Está a Formar as Suas Crianças",
        metaTitle: "A França Admitiu o Que Forma a Criança",
        hook: "A primeira proibição geral do género na Europa. Um país inteiro a admitir que aquilo que entra numa alma sai depois numa vida.",
        metaDescription:
          "A França foi o primeiro país da UE a proibir as redes sociais a menores. Uma nação admitiu que o que forma o coração conta. O teu não está regulado por ninguém.",
        sections: [
          {
            heading: "O primeiro país a fazê-lo mesmo",
            body: "A 22 de Julho, a França tornou-se o primeiro país da União Europeia a aprovar uma proibição geral das plataformas de redes sociais para crianças, depois de anos de evidência acumulada sobre o que os feeds infinitos fazem a mentes em formação.\n\nOutros governos discutiram o assunto. A França legislou. Independentemente do que aches da medida, repara na premissa que está por baixo — uma premissa que precisou de uma década de estragos para chegar à lei.",
          },
          {
            heading: "A premissa que ninguém contestou",
            body: "A premissa é esta: aquilo que uma pessoa consome todos os dias forma aquilo em que essa pessoa se torna. Não influencia. Forma.\n\nIsto não é uma descoberta da tecnologia. É uma das afirmações mais antigas da Bíblia, e é feita sobre adultos exactamente com a mesma seriedade. Guarda o teu coração, diz o provérbio, porque tudo o resto na tua vida sai de lá.",
            scripture:
              "Sobre tudo o que se deve guardar, guarda o teu coração, porque dele procedem as saídas da vida.",
            scriptureRef: "Provérbios 4:23",
          },
          {
            heading: "E o teu não está regulado por ninguém",
            body: "Não há verificação de idade na tua conta. Nenhum parlamento alguma vez debateu o que percorres à meia-noite, no que clicas quando estás sozinho, aquilo por que já deixaste de te sentir mal em silêncio.\n\nUma lei consegue manter certas coisas longe de uma criança. Não consegue tirar nada de dentro de um adulto. E quando Jesus falou disto, empurrou o problema um passo mais fundo do que a legislação — o problema não é só o que entra. É o que já lá está, à espera.",
            scripture:
              "Porque de dentro, do coração dos homens, saem os maus pensamentos, os adultérios, as prostituições, os homicídios, os furtos, a avareza, as maldades, o engano, a dissolução, a inveja, a blasfémia, a soberba, a loucura. Todos estes males procedem de dentro e contaminam o homem.",
            scriptureRef: "Marcos 7:21–23",
          },
          {
            heading: "Porque é que isto acaba por ser sobre a morte",
            body: "Porque aquilo não são apenas hábitos. É exactamente a lista pela qual vais ser medido, por alguém que viu tudo acontecer e não precisou de capturas de ecrã.\n\nÉ essa a marcação que está do outro lado de uma vida vulgar: não uma revisão das tuas intenções, mas um acerto de contas com aquilo que realmente és. Está ordenado morrer uma vez — e depois disso, o juízo.",
            scripture: "E, como aos homens está ordenado morrerem uma vez, vindo depois disso o juízo.",
            scriptureRef: "Hebreus 9:27",
          },
          {
            heading: "A oferta que nenhuma lei consegue fazer",
            body: "A França pode restringir uma entrada. Não pode dar a ninguém um coração diferente.\n\nDeus prometeu precisamente isso, séculos antes de existir um feed para nos preocupar: não melhores filtros, não regras mais apertadas — uma substituição. A pedra tirada, algo vivo posto no lugar. É isso que o evangelho oferece, e é a única oferta em cima da mesa que vai mais fundo do que o comportamento.",
            scripture:
              "E dar-vos-ei um coração novo, e porei dentro de vós um espírito novo; e tirarei da vossa carne o coração de pedra, e vos darei um coração de carne.",
            scriptureRef: "Ezequiel 36:26",
          },
        ],
        personalTurn: {
          setup:
            "Um país deu-se a um trabalho enorme para proteger as suas crianças daquilo que as ia formar. Ninguém fez isso por ti, e a formação já aconteceu. Há um exame que mede o resultado, e ele não espera até estares pronto.",
          question: "Se acontecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "Notícias do mundo — CNN (em inglês)",
            url: "https://www.cnn.com/world",
          },
          {
            label: "Portal de acontecimentos actuais, Julho de 2026 — Wikipédia (em inglês)",
            url: "https://en.wikipedia.org/wiki/Portal:Current_events/July_2026",
          },
        ],
      },
    },
  },
  {
    slug: "four-in-twelve-days",
    datePublished: "2026-07-21",
    draft: true,
    locales: {
      en: {
        title: "Four in Twelve Days",
        hook: "Bonnie Tyler. Sam Neill. Brenda Fricker. Kevin Keegan. July emptied a generation, and the queue moved up one.",
        metaDescription:
          "Four names the world grew up with died within twelve days in July 2026. None of the deaths were shocking. That is the part worth stopping for.",
        sections: [
          {
            heading: "Twelve days",
            body: "Bonnie Tyler died on the 8th, aged 75, after complications from emergency surgery. Sam Neill died on the 13th in Sydney, aged 78 — Jurassic Park, Peaky Blinders, forty years of other people’s childhoods. Brenda Fricker, the first Irish actress to win an Oscar, died in Dublin on the 16th, aged 81. Kevin Keegan, once captain of England, died on the 20th, aged 75.\n\nFour in twelve days. Not one of them was a shock.",
          },
          {
            heading: "That’s the part worth stopping for",
            body: "We reserve our attention for the deaths that seem wrong — the young, the sudden, the violent. A 78-year-old actor dying after a long life gets a paragraph and a photo, and we scroll.\n\nBut the ordinary ones are the honest ones. They are what the process actually looks like when nothing goes wrong. This is the outcome of a successful life: famous, loved, awarded, finished.",
            scripture:
              "All flesh is grass, and all its loveliness is like the flower of the field… The grass withers, the flower fades, but the word of our God stands forever.",
            scriptureRef: "Isaiah 40:6, 8",
          },
          {
            heading: "The number nobody wants to do the arithmetic on",
            body: "Seventy years, the psalm says. Eighty if you are strong. It was written three thousand years ago and it is still, statistically, roughly right — which should be more unsettling than it is.\n\nSubtract your age from it. That is not a morbid exercise; it is arithmetic you already know the answer to and have chosen not to perform. The four names above did the same subtraction at your age and got a comfortable number too.",
            scripture:
              "The days of our lives are seventy years; and if by reason of strength they are eighty years, yet their boast is only labor and sorrow; for it is soon cut off, and we fly away.",
            scriptureRef: "Psalm 90:10",
          },
          {
            heading: "What the obituaries all leave out",
            body: "Every one of those write-ups ended at the same place: a list of what the person did, and then nothing. Career, awards, survived by. The story stops at the door because journalism cannot follow anyone through it.\n\nThe Bible does not stop there. It says the door opens onto an appointment — one death, then judgment — and that this is true of the famous and the unrecorded in exactly the same measure.",
            scripture: "And as it is appointed for men to die once, but after this the judgment.",
            scriptureRef: "Hebrews 9:27",
          },
          {
            heading: "The one obituary that got rewritten",
            body: "There is exactly one man in history whose obituary had to be withdrawn. He was executed publicly, buried in a borrowed tomb, and was seen alive by hundreds of people afterwards — and what he said about it was not that death is fine, but that he had beaten it and could take others through.\n\nThat claim is either the most important sentence ever spoken or it is nothing. There is no third option available.",
            scripture:
              "I am the resurrection and the life. He who believes in Me, though he may die, he shall live. And whoever lives and believes in Me shall never die.",
            scriptureRef: "John 11:25–26",
          },
        ],
        personalTurn: {
          setup:
            "You scrolled past four of them this month without stopping. There is a list you are already on, and an exam on the other side of it that doesn’t wait until you feel ready.",
          question: "If your name went up tonight — would you pass?",
        },
        sources: [
          {
            label: "“Remembering the celebrities and legends who died in 2026” — Parade",
            url: "https://parade.com/celebrities/celebrity-deaths-2026",
          },
          {
            label: "“Celebrity deaths of 2026” — LiveNOW from FOX",
            url: "https://www.livenowfox.com/news/celebrity-deaths-2026-list",
          },
          {
            label: "“People we’ve lost in 2026” — CNN",
            url: "https://www.cnn.com/2026/01/30/world/gallery/people-we-lost-2026",
          },
        ],
      },
      pt: {
        title: "Quatro em Doze Dias",
        hook: "Bonnie Tyler. Sam Neill. Brenda Fricker. Kevin Keegan. Julho esvaziou uma geração — e a fila andou um lugar.",
        metaDescription:
          "Quatro nomes com que o mundo cresceu morreram em doze dias, em Julho de 2026. Nenhuma das mortes foi chocante. É essa a parte que vale a pena parar para ver.",
        sections: [
          {
            heading: "Doze dias",
            body: "Bonnie Tyler morreu no dia 8, aos 75 anos, por complicações de uma cirurgia de urgência. Sam Neill morreu no dia 13, em Sydney, aos 78 — Parque Jurássico, Peaky Blinders, quarenta anos das infâncias dos outros. Brenda Fricker, a primeira actriz irlandesa a ganhar um Óscar, morreu em Dublin no dia 16, aos 81. Kevin Keegan, antigo capitão de Inglaterra, morreu no dia 20, aos 75.\n\nQuatro em doze dias. Nenhuma delas foi um choque.",
          },
          {
            heading: "É essa a parte que vale a pena parar para ver",
            body: "Guardamos a nossa atenção para as mortes que parecem erradas — as dos novos, as súbitas, as violentas. Um actor de 78 anos que morre depois de uma vida longa leva um parágrafo e uma fotografia, e nós seguimos a rolar.\n\nMas são as vulgares que são honestas. São aquilo a que o processo realmente se parece quando nada corre mal. É este o resultado de uma vida bem-sucedida: famoso, amado, premiado, terminado.",
            scripture:
              "Toda a carne é erva e toda a sua beleza como as flores do campo… Seca-se a erva, e cai a flor, mas a palavra de nosso Deus subsiste eternamente.",
            scriptureRef: "Isaías 40:6, 8",
          },
          {
            heading: "A conta que ninguém quer fazer",
            body: "Setenta anos, diz o salmo. Oitenta se fores robusto. Foi escrito há três mil anos e continua, estatisticamente, mais ou menos certo — o que devia inquietar-nos mais do que inquieta.\n\nSubtrai a tua idade. Não é um exercício mórbido; é uma conta cujo resultado já conheces e escolheste não fazer. Os quatro nomes aqui em cima fizeram a mesma subtracção na tua idade e também lhes deu um número confortável.",
            scripture:
              "Os dias da nossa vida chegam a setenta anos, e se alguns, pela sua robustez, chegam a oitenta anos, o orgulho deles é canseira e enfado, pois cedo se corta e vamos voando.",
            scriptureRef: "Salmo 90:10",
          },
          {
            heading: "O que todos os obituários deixam de fora",
            body: "Todos aqueles textos acabaram no mesmo sítio: uma lista do que a pessoa fez, e depois nada. Carreira, prémios, deixa família. A história pára à porta porque o jornalismo não consegue seguir ninguém através dela.\n\nA Bíblia não pára aí. Diz que a porta dá para uma marcação — uma morte, e depois o juízo — e que isto é verdade para os famosos e para os que ninguém registou exactamente na mesma medida.",
            scripture: "E, como aos homens está ordenado morrerem uma vez, vindo depois disso o juízo.",
            scriptureRef: "Hebreus 9:27",
          },
          {
            heading: "O único obituário que teve de ser reescrito",
            body: "Há exactamente um homem na história cujo obituário teve de ser retirado. Foi executado publicamente, sepultado num túmulo emprestado, e foi visto vivo por centenas de pessoas depois disso — e o que Ele disse sobre o assunto não foi que a morte não tem importância, mas que a tinha vencido e podia levar outros através dela.\n\nOu essa afirmação é a frase mais importante alguma vez dita, ou não é nada. Não há terceira opção disponível.",
            scripture:
              "Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá; e todo aquele que vive, e crê em mim, nunca irá morrer.",
            scriptureRef: "João 11:25–26",
          },
        ],
        personalTurn: {
          setup:
            "Passaste por quatro deles este mês sem parares. Há uma lista em que já estás, e um exame do outro lado dela que não espera até estares pronto.",
          question: "Se o teu nome aparecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "“Remembering the celebrities and legends who died in 2026” — Parade (em inglês)",
            url: "https://parade.com/celebrities/celebrity-deaths-2026",
          },
          {
            label: "“Celebrity deaths of 2026” — LiveNOW from FOX (em inglês)",
            url: "https://www.livenowfox.com/news/celebrity-deaths-2026-list",
          },
          {
            label: "“People we’ve lost in 2026” — CNN (em inglês)",
            url: "https://www.cnn.com/2026/01/30/world/gallery/people-we-lost-2026",
          },
        ],
      },
    },
  },
  {
    slug: "a-pill-for-the-body",
    datePublished: "2026-07-20",
    draft: true,
    locales: {
      en: {
        title: "A Pill for the Body. Nothing for the Record.",
        metaTitle: "A Pill for the Body, Not the Record",
        hook: "Europe just approved the first weight-loss pill of its kind. Hundreds of millions of people are about to fix something willpower never could — and it touches nothing that follows them through the door.",
        metaDescription:
          "The EU approved the first oral GLP-1 for weight management. Medicine can change the body. It cannot change what you have done. What happens when you die?",
        sections: [
          {
            heading: "The first one you can swallow",
            body: "This month the European Commission approved an oral version of Wegovy — the first GLP-1 pill approved for weight management in the European Union. No injection, no fridge, no needle. A tablet.\n\nIt is genuinely good news, and it is worth saying so plainly. Millions of people have spent decades losing a fight with their own appetite and blaming themselves for it. Something is finally on their side.",
          },
          {
            heading: "What it quietly proves",
            body: "But look at what the whole story assumes, without ever arguing for it. That there is something about you that needs fixing. That trying harder did not work. That the solution had to come from outside you.\n\nThat is not a pharmaceutical insight. It is the oldest diagnosis in the Bible, applied one level deeper — and the Bible says the same three things about a problem no tablet reaches.",
          },
          {
            heading: "The part medicine cannot reach",
            body: "Because there is a second ledger, and nothing on it is physical. The lies. The things taken. The person you were to someone who trusted you. Not a body-composition problem — a record.\n\nThe Scriptures are not sneering at physical health when they say bodily exercise profits a little. They are ranking it. A little is not nothing. It is just not the thing that outlasts you.",
            scripture:
              "For bodily exercise profits a little, but godliness is profitable for all things, having promise of the life that now is and of that which is to come.",
            scriptureRef: "1 Timothy 4:8",
          },
          {
            heading: "The trade nobody would take out loud",
            body: "Jesus asked a question that is still the sharpest thing ever said about self-improvement: what does it profit a man to gain the entire world and lose his own soul?\n\nNot to gain a smaller waist. The whole world. He is granting the best possible outcome of every optimisation project ever launched, and still calling it a bad trade, because of what is on the other side of the door.",
            scripture: "For what will it profit a man if he gains the whole world, and loses his own soul?",
            scriptureRef: "Mark 8:36",
          },
          {
            heading: "Also from outside you",
            body: "Here is the strange symmetry. The gospel agrees completely with the premise of the pill: you were never going to fix this from the inside, and effort was always going to fall short.\n\nSo it does not offer you a regime. It offers a rescue — mercy, not merit, applied to the record rather than the body. Something done for you, by someone else, and received rather than achieved.",
            scripture:
              "not by works of righteousness which we have done, but according to His mercy He saved us, through the washing of regeneration and renewing of the Holy Spirit.",
            scriptureRef: "Titus 3:5",
          },
        ],
        personalTurn: {
          setup:
            "You can now fix the body from a blister pack. The record is a different problem, and it is the one that goes through the door with you — but you can see where you stand on it right now.",
          question: "If it happened tonight — would you pass?",
        },
        sources: [
          {
            label: "Viral and news roundup, July 2026",
            url: "https://blog.mean.ceo/viral-trends-on-social-media-july-2026/",
          },
          {
            label: "Portal:Current events, July 2026 — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Portal:Current_events/July_2026",
          },
        ],
      },
      pt: {
        title: "Um Comprimido Para o Corpo. Nada Para o Registo.",
        metaTitle: "Um Comprimido Para o Corpo",
        hook: "A Europa acabou de aprovar o primeiro comprimido do género para perder peso. Centenas de milhões de pessoas vão resolver aquilo que a força de vontade nunca resolveu — e não toca em nada do que as segue pela porta fora.",
        metaDescription:
          "A UE aprovou o primeiro GLP-1 oral para controlo de peso. A medicina já muda o corpo. Continua a não mudar aquilo que fizeste. O que acontece quando morreres?",
        sections: [
          {
            heading: "O primeiro que se engole",
            body: "Este mês, a Comissão Europeia aprovou a versão oral do Wegovy — o primeiro comprimido GLP-1 aprovado para controlo de peso na União Europeia. Sem injecção, sem frigorífico, sem agulha. Um comprimido.\n\nÉ genuinamente boa notícia, e vale a pena dizê-lo com clareza. Milhões de pessoas passaram décadas a perder uma luta contra o próprio apetite e a culpar-se por isso. Finalmente há alguma coisa do lado delas.",
          },
          {
            heading: "O que isto prova em silêncio",
            body: "Mas repara no que a história toda assume, sem alguma vez o argumentar. Que há em ti algo que precisa de ser corrigido. Que esforçares-te mais não resultou. Que a solução tinha de vir de fora de ti.\n\nIsto não é uma descoberta farmacêutica. É o diagnóstico mais antigo da Bíblia, aplicado um nível mais fundo — e a Bíblia diz exactamente as mesmas três coisas sobre um problema a que nenhum comprimido chega.",
          },
          {
            heading: "A parte onde a medicina não chega",
            body: "Porque há um segundo registo, e nada do que lá está é físico. As mentiras. As coisas que tiraste. A pessoa que foste para alguém que confiou em ti. Não é um problema de composição corporal — é um cadastro.\n\nA Escritura não está a desprezar a saúde física quando diz que o exercício corporal para pouco aproveita. Está a ordenar as coisas. Pouco não é nada. Simplesmente não é aquilo que fica depois de ti.",
            scripture:
              "Porque o exercício corporal para pouco aproveita, mas a piedade para tudo é proveitosa, tendo a promessa da vida presente e da que há de vir.",
            scriptureRef: "1 Timóteo 4:8",
          },
          {
            heading: "A troca que ninguém aceitaria em voz alta",
            body: "Jesus fez uma pergunta que continua a ser a coisa mais afiada alguma vez dita sobre melhoria pessoal: que aproveita ao homem ganhar o mundo inteiro e perder a sua alma?\n\nNão é ganhar uma cintura mais fina. É o mundo inteiro. Ele está a conceder o melhor resultado possível de todos os projectos de optimização alguma vez lançados — e continua a chamar-lhe um mau negócio, por causa do que está do outro lado da porta.",
            scripture: "Pois que aproveitaria ao homem ganhar todo o mundo e perder a sua alma?",
            scriptureRef: "Marcos 8:36",
          },
          {
            heading: "Também vem de fora de ti",
            body: "E aqui está a simetria estranha. O evangelho concorda inteiramente com a premissa do comprimido: nunca ias resolver isto por dentro, e o esforço ia sempre ficar aquém.\n\nPor isso não te oferece um regime. Oferece um resgate — misericórdia, não mérito, aplicada ao registo e não ao corpo. Algo feito por ti, por outra pessoa, e recebido em vez de conquistado.",
            scripture:
              "Não pelas obras de justiça que houvéssemos feito, mas segundo a sua misericórdia, nos salvou pela lavagem da regeneração e da renovação do Espírito Santo.",
            scriptureRef: "Tito 3:5",
          },
        ],
        personalTurn: {
          setup:
            "Já podes corrigir o corpo a partir de uma cartela. O registo é outro problema, e é esse que passa a porta contigo — mas podes ver agora mesmo em que pé estás.",
          question: "Se acontecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "Resumo de notícias, Julho de 2026 (em inglês)",
            url: "https://blog.mean.ceo/viral-trends-on-social-media-july-2026/",
          },
          {
            label: "Portal de acontecimentos actuais, Julho de 2026 — Wikipédia (em inglês)",
            url: "https://en.wikipedia.org/wiki/Portal:Current_events/July_2026",
          },
        ],
      },
    },
  },
  {
    slug: "seven-days-of-mourning",
    datePublished: "2026-07-19",
    draft: true,
    locales: {
      en: {
        title: "Seven Days of Mourning",
        hook: "Venezuela stopped for a week over a number that kept climbing. Nobody has ever held a national day of mourning for gravity.",
        metaDescription:
          "Venezuela declared seven days of national mourning as the earthquake toll reached 2,295. Grief is the one thing everyone agrees on: death is wrong. Why?",
        sections: [
          {
            heading: "Two thousand two hundred and ninety-five",
            body: "Venezuela’s acting president declared seven days of national mourning as the death toll from the earthquakes rose to 2,295. Flags down, ceremonies held, a whole country instructed to stop.\n\nNumbers that size stop meaning anything after a while. Seven days is an attempt to make them mean something again.",
          },
          {
            heading: "Nobody mourns gravity",
            body: "Here is something so ordinary you have probably never noticed it. When a rock falls, nobody grieves. When a star collapses, no country lowers a flag. These are also natural processes, also inevitable, also nobody’s fault.\n\nBut when a person dies we behave as though a rule has been broken. Every culture, on every continent, in every century, treats it as an outrage rather than a statistic. That reaction is not learned, and it does not go away with education.",
          },
          {
            heading: "What the reaction is telling you",
            body: "The Bible has an explanation for this that no other account matches: you are protesting because it genuinely is wrong. Death is not a neutral feature of the system. It is described as an intruder, an enemy, something that got in — and something scheduled for destruction.\n\nYour grief is not a malfunction. It is accurate.",
            scripture: "The last enemy that will be destroyed is death.",
            scriptureRef: "1 Corinthians 15:26",
          },
          {
            heading: "God is not neutral about it either",
            body: "The shortest sentence in the Bible is two words long, and it is Jesus standing at the grave of a friend, crying — knowing, at that exact moment, that he was about to raise him.\n\nHe wept anyway. Whatever else Christianity is, it is not a religion that tells you to get over it. It agrees with the seven days.",
            scripture: "Jesus wept.",
            scriptureRef: "John 11:35",
          },
          {
            heading: "The end that is actually promised",
            body: "And what it promises is not consolation but reversal — a world with the intruder removed, described in the plainest possible terms: no more death, no more mourning, no more crying, no more pain, because the previous arrangement has gone.\n\nThat is either a fantasy or the single best piece of news ever reported. It rests entirely on whether one grave in Jerusalem stayed shut.",
            scripture:
              "And God will wipe away every tear from their eyes; there shall be no more death, nor sorrow, nor crying; there shall be no more pain, for the former things have passed away.",
            scriptureRef: "Revelation 21:4",
          },
        ],
        personalTurn: {
          setup:
            "A country stopped for seven days because 2,295 people crossed a line everybody crosses alone. There is an exam on the other side of that line, and it doesn’t wait until you feel ready.",
          question: "If it happened tonight — would you pass?",
        },
        sources: [
          {
            label: "Portal:Current events, July 2026 — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Portal:Current_events/July_2026",
          },
          {
            label: "World news — CNN",
            url: "https://www.cnn.com/world",
          },
        ],
      },
      pt: {
        title: "Sete Dias de Luto",
        hook: "A Venezuela parou uma semana por causa de um número que não parava de subir. Nunca ninguém decretou luto nacional pela gravidade.",
        metaDescription:
          "A Venezuela decretou sete dias de luto nacional com 2.295 mortos nos sismos. O luto é a única coisa em que todos concordam: a morte está errada. Porquê?",
        sections: [
          {
            heading: "Dois mil duzentos e noventa e cinco",
            body: "A presidente interina da Venezuela decretou sete dias de luto nacional quando o número de mortos dos sismos subiu para 2.295. Bandeiras a meia haste, cerimónias, um país inteiro mandado parar.\n\nNúmeros deste tamanho deixam de querer dizer alguma coisa passado algum tempo. Sete dias são uma tentativa de os fazer querer dizer outra vez.",
          },
          {
            heading: "Ninguém chora a gravidade",
            body: "Repara numa coisa tão banal que provavelmente nunca deste por ela. Quando uma pedra cai, ninguém sofre. Quando uma estrela colapsa, nenhum país baixa uma bandeira. Também são processos naturais, também são inevitáveis, também não são culpa de ninguém.\n\nMas quando uma pessoa morre, comportamo-nos como se uma regra tivesse sido quebrada. Todas as culturas, em todos os continentes, em todos os séculos, tratam isso como uma ofensa e não como uma estatística. Essa reacção não é aprendida, e não desaparece com instrução.",
          },
          {
            heading: "O que essa reacção te está a dizer",
            body: "A Bíblia tem uma explicação para isto que nenhuma outra iguala: estás a protestar porque aquilo está genuinamente errado. A morte não é uma característica neutra do sistema. É descrita como uma intrusa, uma inimiga, algo que entrou — e algo cuja destruição está marcada.\n\nO teu luto não é uma avaria. É exacto.",
            scripture: "Ora, o último inimigo que há de ser aniquilado é a morte.",
            scriptureRef: "1 Coríntios 15:26",
          },
          {
            heading: "Deus também não é neutro quanto a isso",
            body: "A frase mais curta da Bíblia tem duas palavras, e é Jesus junto ao túmulo de um amigo, a chorar — sabendo, naquele exacto momento, que estava prestes a ressuscitá-lo.\n\nChorou na mesma. Seja o que for o cristianismo, não é uma religião que te mande deixar isso para trás. Concorda com os sete dias.",
            scripture: "Jesus chorou.",
            scriptureRef: "João 11:35",
          },
          {
            heading: "O fim que é realmente prometido",
            body: "E o que promete não é consolo, é reversão — um mundo com a intrusa retirada, descrito nos termos mais simples possíveis: não haverá mais morte, nem pranto, nem clamor, nem dor, porque o arranjo anterior acabou.\n\nOu isto é uma fantasia, ou é a melhor notícia alguma vez dada. E assenta inteiramente em saber se um túmulo em Jerusalém ficou fechado.",
            scripture:
              "E Deus limpará de seus olhos toda a lágrima; e não haverá mais morte, nem pranto, nem clamor, nem dor; porque já as primeiras coisas são passadas.",
            scriptureRef: "Apocalipse 21:4",
          },
        ],
        personalTurn: {
          setup:
            "Um país parou sete dias porque 2.295 pessoas atravessaram uma linha que toda a gente atravessa sozinha. Há um exame do outro lado dessa linha, e ele não espera até estares pronto.",
          question: "Se acontecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "Portal de acontecimentos actuais, Julho de 2026 — Wikipédia (em inglês)",
            url: "https://en.wikipedia.org/wiki/Portal:Current_events/July_2026",
          },
          {
            label: "Notícias do mundo — CNN (em inglês)",
            url: "https://www.cnn.com/world",
          },
        ],
      },
    },
  },
  {
    slug: "a-law-about-dying",
    datePublished: "2026-07-17",
    draft: true,
    locales: {
      en: {
        title: "A Law About Dying That Says Nothing About Death",
        metaTitle: "A Law About Dying, Not About Death",
        hook: "France spent years debating who may choose the hour. Not one clause of it touches what happens at the hour after.",
        metaDescription:
          "France’s National Assembly approved assisted dying in July 2026 after years of debate. The law governs the hour of death. It says nothing about what follows it.",
        sections: [
          {
            heading: "291 to 241",
            body: "On July 15th, France’s National Assembly gave final approval to an assisted dying law by 291 votes to 241, creating a legal right to assisted dying for adults with incurable illness. It goes now to the Constitutional Council. When it takes effect, France becomes the fourteenth country in the world, and the ninth in Europe, to permit some form of it.\n\nIt took four readings and several years. This piece is not an argument about the vote. It is about the thing the vote never reached.",
          },
          {
            heading: "What the debate was actually about",
            body: "Support narrowed at every reading — four times back to the chamber, four times a thinner majority. That tells you the question was serious, and that nobody found it easy.\n\nAnd every hour of that debate was about one variable. Timing. Who decides it, under what conditions, with what safeguards. The whole apparatus of a modern state was brought to bear on the question of when.",
          },
          {
            heading: "The clause nobody could draft",
            body: "There is no clause about afterwards. There could not be. A parliament can regulate access to a procedure; it has no jurisdiction one inch past the moment it regulates.\n\nEcclesiastes says it more starkly than any objection raised in the chamber: no one has power over the spirit to retain the spirit, and there is no discharge from that war. You can move the hour forward. You cannot move the door.",
            scripture:
              "No one has power over the spirit to retain the spirit, and no one has power in the day of death. There is no release from that war.",
            scriptureRef: "Ecclesiastes 8:8",
          },
          {
            heading: "Why the silence matters",
            body: "Because on the far side of that hour, the Bible does not describe an absence. It describes an appointment — one death, and then judgment — and it makes no distinction based on how the death was arranged.\n\nThat is the part no legislature in the world has ever been in a position to legislate, and the part every one of us walks into personally.",
            scripture: "And as it is appointed for men to die once, but after this the judgment.",
            scriptureRef: "Hebrews 9:27",
          },
          {
            heading: "A different kind of relief",
            body: "The impulse behind the law is not wicked. It is a response to real suffering, by people who watched somebody they loved suffer, and who wanted it to stop. Anyone who dismisses that has not been in the room.\n\nBut Christianity answers that impulse with something bigger than an exit. It says the suffering is real, that death is an enemy and not a mercy, and that the only person who ever went through it and came back out offers to bring others with him. Not relief from the hour. Relief from what the hour leads to.",
            scripture:
              "I am the resurrection and the life. He who believes in Me, though he may die, he shall live. And whoever lives and believes in Me shall never die.",
            scriptureRef: "John 11:25–26",
          },
        ],
        personalTurn: {
          setup:
            "France decided who may choose the hour. Nobody voted on what waits on the other side of it — and there is an exam there that doesn’t wait until you feel ready.",
          question: "If it happened tonight — would you pass?",
        },
        sources: [
          {
            label: "“France’s National Assembly approves assisted-dying bill after years of debate” — CNN",
            url: "https://www.cnn.com/2026/07/15/europe/france-national-assembly-approves-assisted-dying-bill-intl",
          },
          {
            label: "“France’s lower house of parliament adopts final text of landmark right-to-die law” — France 24",
            url: "https://www.france24.com/en/france/20260715-france-expected-to-pass-final-vote-on-assisted-dying-after-years-of-debate",
          },
          {
            label: "“France moves to allow assisted dying. What other countries have legalized it?” — TIME",
            url: "https://time.com/article/2026/07/16/france-assisted-dying-bill-where-legal/",
          },
        ],
      },
      pt: {
        title: "Uma Lei Sobre Morrer Que Nada Diz Sobre a Morte",
        metaTitle: "Uma Lei Sobre Morrer",
        hook: "A França passou anos a debater quem pode escolher a hora. Nenhuma cláusula toca no que acontece na hora seguinte.",
        metaDescription:
          "A Assembleia Nacional francesa aprovou a morte assistida em Julho de 2026. A lei regula a hora da morte. Não diz nada sobre o que vem depois.",
        sections: [
          {
            heading: "291 contra 241",
            body: "A 15 de Julho, a Assembleia Nacional francesa aprovou em votação final uma lei da morte assistida, por 291 votos contra 241, criando um direito legal à morte assistida para adultos com doença incurável. Segue agora para o Conselho Constitucional. Quando entrar em vigor, a França torna-se o décimo quarto país do mundo, e o nono da Europa, a permitir alguma forma disto.\n\nForam precisas quatro leituras e vários anos. Este texto não é um argumento sobre a votação. É sobre aquilo a que a votação nunca chegou.",
          },
          {
            heading: "Sobre o que era realmente o debate",
            body: "O apoio estreitou em cada leitura — quatro vezes o texto voltou ao hemiciclo, quatro vezes a maioria ficou mais magra. Isso diz-nos que a pergunta era séria, e que ninguém a achou fácil.\n\nE cada hora daquele debate foi sobre uma única variável. O momento. Quem o decide, em que condições, com que salvaguardas. Todo o aparelho de um Estado moderno foi mobilizado para a questão do quando.",
          },
          {
            heading: "A cláusula que ninguém conseguia redigir",
            body: "Não há nenhuma cláusula sobre o depois. Não podia haver. Um parlamento pode regular o acesso a um procedimento; não tem jurisdição um centímetro para lá do momento que regula.\n\nO Eclesiastes di-lo de forma mais crua do que qualquer objecção levantada no hemiciclo: nenhum homem tem domínio sobre o espírito para o reter, e não há licença nesta peleja. Podes antecipar a hora. Não podes mudar a porta.",
            scripture:
              "Nenhum homem há que tenha domínio sobre o espírito, para reter o espírito; nem tampouco tem ele poder sobre o dia da morte; nem há licença nesta peleja.",
            scriptureRef: "Eclesiastes 8:8",
          },
          {
            heading: "Porque é que este silêncio importa",
            body: "Porque do outro lado dessa hora a Bíblia não descreve uma ausência. Descreve uma marcação — uma morte, e depois o juízo — e não faz distinção com base na forma como a morte foi organizada.\n\nÉ essa a parte que nenhum parlamento do mundo alguma vez esteve em posição de legislar, e a parte em que cada um de nós entra pessoalmente.",
            scripture: "E, como aos homens está ordenado morrerem uma vez, vindo depois disso o juízo.",
            scriptureRef: "Hebreus 9:27",
          },
          {
            heading: "Outro tipo de alívio",
            body: "O impulso por detrás da lei não é perverso. É uma resposta a sofrimento real, de pessoas que viram alguém que amavam sofrer e queriam que aquilo parasse. Quem despacha isso com desprezo nunca esteve naquele quarto.\n\nMas o cristianismo responde a esse impulso com algo maior do que uma saída. Diz que o sofrimento é real, que a morte é uma inimiga e não uma misericórdia, e que a única pessoa que alguma vez a atravessou e voltou se oferece para levar outros com Ele. Não é alívio da hora. É alívio daquilo a que a hora leva.",
            scripture:
              "Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá; e todo aquele que vive, e crê em mim, nunca irá morrer.",
            scriptureRef: "João 11:25–26",
          },
        ],
        personalTurn: {
          setup:
            "A França decidiu quem pode escolher a hora. Ninguém votou sobre o que espera do outro lado dela — e há ali um exame que não espera até estares pronto.",
          question: "Se acontecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "“France’s National Assembly approves assisted-dying bill” — CNN (em inglês)",
            url: "https://www.cnn.com/2026/07/15/europe/france-national-assembly-approves-assisted-dying-bill-intl",
          },
          {
            label: "“France’s lower house adopts final text of landmark right-to-die law” — France 24 (em inglês)",
            url: "https://www.france24.com/en/france/20260715-france-expected-to-pass-final-vote-on-assisted-dying-after-years-of-debate",
          },
          {
            label: "“France moves to allow assisted dying” — TIME (em inglês)",
            url: "https://time.com/article/2026/07/16/france-assisted-dying-bill-where-legal/",
          },
        ],
      },
    },
  },
  {
    slug: "dont-die-movement",
    datePublished: "2026-07-13",
    dateModified: "2026-07-15",
    locales: {
      en: {
        title: "The “Don’t Die” Movement and the Question It Can’t Answer",
        metaTitle: "What “Don’t Die” Can’t Answer",
        hook: "The man spending millions to never die just announced an incurable diagnosis. His project asks the right question — and still can’t answer it.",
        metaDescription:
          "Bryan Johnson, who spends millions trying not to die, has an incurable autoimmune disease. His project asks the right question. What happens when you die?",
        sections: [
          {
            heading: "“My stomach is eating itself”",
            body: "On June 30th, Bryan Johnson — the man who has spent tens of millions of dollars trying not to die — announced that his own body is attacking itself. “I have an autoimmune disease,” he wrote. “My stomach is eating itself.”\n\nThe diagnosis is autoimmune gastritis: his immune system is destroying the cells of his stomach lining. It is chronic and incurable. And it arrived unannounced, in the middle of the most measured, optimized, carefully guarded body on earth.\n\nJohnson’s response was pure Bryan Johnson: he said it only pushes his team harder to find a cure. But something important just became visible. The protocol did not get a vote.",
          },
          {
            heading: "A war on death",
            body: "Johnson, the tech entrepreneur behind the Blueprint protocol, turned his life into a public experiment with one goal: don’t die. Strict routines, constant measurement, millions of dollars a year — all documented openly and even given a slogan that doubles as a movement.\n\nIt would be easy to mock, and this month most coverage has. But before we smile at the supplements and the sleep scores, we should notice something: he is taking death more seriously than almost anyone else in public life.",
          },
          {
            heading: "He’s right about the problem",
            body: "Most of us live as if death were someone else’s appointment. We keep it off our calendars and out of our conversations, and we call that being well-adjusted.\n\nThe “Don’t Die” movement refuses to do that. It says out loud what everyone quietly knows: death is not natural background noise. It is an enemy. Something in us protests against it — and that protest is data. The Scriptures say God has “put eternity in their hearts.” We were not made to be at peace with dying, and no amount of adjustment ever quite makes us so.",
            scripture:
              "He has made everything beautiful in its time. Also He has put eternity in their hearts, except that no one can find out the work that God does from beginning to end.",
            scriptureRef: "Ecclesiastes 3:11",
          },
          {
            heading: "The question the protocol can’t answer",
            body: "Suppose the project recovers from this and succeeds beyond every expectation. Suppose the measurements, the discipline, and the science buy decades — even a century. Every one of those years arrives at the same door.\n\nThis is what the diagnosis makes plain. A body can be measured every morning and still make a decision without asking. Longevity can change when you die. It cannot change that you die, and it has nothing at all to say about what comes after. That is the question hiding underneath the movement, the one no protocol can touch: not “how long?” but “then what?”",
            scripture: "And as it is appointed for men to die once, but after this the judgment.",
            scriptureRef: "Hebrews 9:27",
          },
          {
            heading: "A better hope than not dying",
            body: "Christianity has never asked anyone to make peace with death. It calls death an enemy too — “the last enemy to be destroyed.” The difference is the strategy. The gospel does not promise an escape from dying; it announces that someone has gone through death and come out the other side, and that he offers to bring us with him.\n\nJesus did not say “you will not die.” He said something far stranger: not death postponed — death defeated.\n\nSo the “Don’t Die” movement is half right. Death is worth fighting. The question is whether you fight it with a protocol that can only delay it, or trust the one who has already beaten it.",
            scripture:
              "I am the resurrection and the life. He who believes in Me, though he may die, he shall live. And whoever lives and believes in Me shall never die.",
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
        metaTitle: "O Movimento “Don’t Die”",
        hook: "O homem que gasta milhões para nunca morrer acabou de anunciar um diagnóstico incurável. O projecto dele faz a pergunta certa — e continua sem lhe saber responder.",
        metaDescription:
          "Bryan Johnson, que gasta milhões para não morrer, tem uma doença autoimune incurável. O projecto dele faz a pergunta certa. O que acontece quando morreres?",
        sections: [
          {
            heading: "“O meu estômago está a comer-se a si próprio”",
            body: "No dia 30 de Junho, Bryan Johnson — o homem que já gastou dezenas de milhões de dólares para não morrer — anunciou que o próprio corpo está a atacar-se a si mesmo. “Tenho uma doença autoimune,” escreveu. “O meu estômago está a comer-se a si próprio.”\n\nO diagnóstico é gastrite autoimune: o sistema imunitário dele está a destruir as células do revestimento do estômago. É crónica e incurável. E chegou sem avisar, no meio do corpo mais medido, mais optimizado e mais vigiado do planeta.\n\nA resposta de Johnson foi tipicamente Bryan Johnson: disse que isto só obriga a equipa dele a trabalhar mais depressa para encontrar uma cura. Mas algo importante acabou de ficar à vista. O protocolo não teve voto na matéria.",
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
            scriptureRef: "Eclesiastes 3:11",
          },
          {
            heading: "A pergunta a que o protocolo não sabe responder",
            body: "Suponhamos que o projecto recupera disto e tem um sucesso além de todas as expectativas. Suponhamos que as medições, a disciplina e a ciência compram décadas — até um século. Cada um desses anos chega à mesma porta.\n\nÉ isto que o diagnóstico torna evidente. Um corpo pode ser medido todas as manhãs e, ainda assim, tomar uma decisão sem pedir licença. A longevidade pode mudar quando morres. Não pode mudar que morres — e não tem absolutamente nada a dizer sobre o que vem depois. Essa é a pergunta escondida debaixo do movimento, aquela em que nenhum protocolo toca: não é “quanto tempo?”, é “e depois?”",
            scripture: "E, como aos homens está ordenado morrerem uma vez, vindo depois disso o juízo.",
            scriptureRef: "Hebreus 9:27",
          },
          {
            heading: "Uma esperança melhor do que não morrer",
            body: "O cristianismo nunca pediu a ninguém que fizesse as pazes com a morte. Também lhe chama inimiga — “o último inimigo a ser destruído”. A diferença está na estratégia. O evangelho não promete uma fuga ao morrer; anuncia que alguém atravessou a morte e saiu do outro lado, e que se oferece para nos levar com Ele.\n\nJesus não disse “não vais morrer”. Disse algo muito mais estranho: não é a morte adiada — é a morte vencida.\n\nPortanto, o movimento “Don’t Die” está meio certo. Vale a pena lutar contra a morte. A questão é se lutas contra ela com um protocolo que só a pode adiar, ou se confias naquele que já a venceu.",
            scripture:
              "Eu sou a ressurreição e a vida; quem crê em mim, ainda que esteja morto, viverá; e todo aquele que vive, e crê em mim, nunca irá morrer.",
            scriptureRef: "João 11:25–26",
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
  {
    slug: "fifty-three-tickets",
    datePublished: "2026-07-12",
    draft: true,
    locales: {
      en: {
        title: "Fifty-Three People Bought a Ticket",
        hook: "The MV Barima went down off the coast of Guyana. Nobody on board was doing anything unusual.",
        metaDescription:
          "The passenger ferry MV Barima sank off Guyana; the toll reached 53 with dozens still missing. Not one passenger had that day marked. What happens when you die?",
        sections: [
          {
            heading: "An ordinary crossing",
            body: "The passenger ferry MV Barima sank off the coast of Guyana. The death toll rose to 53. Seventy-seven people were rescued. At least 49 were still missing when the counting stopped being useful.\n\nEvery one of them bought a ticket for a journey they expected to complete. That is the entire story, and it is the reason it should not be scrolled past.",
          },
          {
            heading: "Nobody was being reckless",
            body: "We protect ourselves from stories like this with a quiet question: what were they doing wrong? Was the boat overloaded, was somebody negligent, would I have got on it?\n\nIt is a defensive reflex and it is understandable. But a ferry crossing is the most ordinary thing in the world. There was no warning in the morning that distinguished that day from every other day any of them had lived through.",
          },
          {
            heading: "The man who had a plan",
            body: "Jesus told a story about a man who had a genuinely good year. Bigger harvest than expected, so he decided to build bigger barns, and then take it easy — eat, drink, be comfortable. Sensible. Most financial advice amounts to the same thing.\n\nThe story has one more line, and it is God speaking: fool, this night your soul will be required of you. Not in old age. Not after the barns. That night. The man’s plan was not immoral. It was simply built on an assumption he had no right to make.",
            scripture:
              "But God said to him, ‘Fool! This night your soul will be required of you; then whose will those things be which you have provided?’",
            scriptureRef: "Luke 12:20",
          },
          {
            heading: "The assumption you are also making",
            body: "You are making it right now. There is a version of your life you are planning around, and it has years in it that nobody has promised you.\n\nJames calls a human life a vapour — visible for a moment, then gone. Not to frighten anybody, but to make people stop budgeting time they do not own.",
            scripture:
              "whereas you do not know what will happen tomorrow. For what is your life? It is even a vapor that appears for a little time and then vanishes away.",
            scriptureRef: "James 4:14",
          },
          {
            heading: "What can be settled today",
            body: "Some things genuinely cannot be sorted out in advance. This one can.\n\nThe gospel is not a plan for the future; it is a transaction that can be settled now — guilt transferred, judgment already served by a substitute, the matter closed before the crossing rather than after. That is the whole reason it gets announced with urgency rather than left as a suggestion.",
            scripture:
              "But God demonstrates His own love toward us, in that while we were still sinners, Christ died for us.",
            scriptureRef: "Romans 5:8",
          },
        ],
        personalTurn: {
          setup:
            "Not one person on that ferry planned for it to be the day. There is an exam on the other side of an ordinary morning, and it doesn’t wait until you feel ready — but you can see how you’d do on it right now.",
          question: "If it happened tonight — would you pass?",
        },
        sources: [
          {
            label: "Portal:Current events, July 2026 — Wikipedia",
            url: "https://en.wikipedia.org/wiki/Portal:Current_events/July_2026",
          },
          {
            label: "World news — CNN",
            url: "https://www.cnn.com/world",
          },
        ],
      },
      pt: {
        title: "Cinquenta e Três Pessoas Compraram Bilhete",
        metaTitle: "Cinquenta e Três Bilhetes",
        hook: "O MV Barima afundou-se ao largo da Guiana. Ninguém a bordo estava a fazer nada fora do normal.",
        metaDescription:
          "O ferry MV Barima afundou-se ao largo da Guiana; 53 mortos e dezenas de desaparecidos. Nenhum passageiro tinha aquele dia marcado.",
        sections: [
          {
            heading: "Uma travessia vulgar",
            body: "O ferry de passageiros MV Barima afundou-se ao largo da costa da Guiana. O número de mortos subiu para 53. Setenta e sete pessoas foram resgatadas. Pelo menos 49 continuavam desaparecidas quando a contagem deixou de servir para alguma coisa.\n\nCada uma delas comprou um bilhete para uma viagem que contava terminar. É essa a história toda, e é por isso que não devia passar despercebida.",
          },
          {
            heading: "Ninguém andava a ser imprudente",
            body: "Protegemo-nos de histórias destas com uma pergunta silenciosa: o que é que eles fizeram de errado? O barco ia sobrelotado, houve negligência, eu teria entrado ali?\n\nÉ um reflexo defensivo e é compreensível. Mas uma travessia de ferry é a coisa mais vulgar do mundo. Não houve aviso nenhum de manhã que distinguisse aquele dia de todos os outros dias que qualquer um deles já tinha vivido.",
          },
          {
            heading: "O homem que tinha um plano",
            body: "Jesus contou a história de um homem que teve um ano genuinamente bom. A colheita foi maior do que esperava, por isso decidiu construir celeiros maiores e depois descansar — comer, beber, viver bem. Sensato. Grande parte dos conselhos financeiros dá exactamente nisto.\n\nA história tem mais uma linha, e é Deus a falar: louco, esta noite te pedirão a tua alma. Não na velhice. Não depois dos celeiros. Naquela noite. O plano do homem não era imoral. Estava simplesmente assente numa suposição que ele não tinha o direito de fazer.",
            scripture:
              "Mas Deus lhe disse: Louco! esta noite te pedirão a tua alma; e o que tens preparado, para quem será?",
            scriptureRef: "Lucas 12:20",
          },
          {
            heading: "A suposição que também estás a fazer",
            body: "Estás a fazê-la neste momento. Há uma versão da tua vida à volta da qual estás a planear, e ela tem lá anos que ninguém te prometeu.\n\nTiago chama a uma vida humana um vapor — visível por um instante, e depois desaparece. Não para assustar ninguém, mas para que as pessoas parem de orçamentar tempo que não lhes pertence.",
            scripture:
              "Digo-vos que não sabeis o que acontecerá amanhã. Porque, que é a vossa vida? É um vapor que aparece por um pouco, e depois se desvanece.",
            scriptureRef: "Tiago 4:14",
          },
          {
            heading: "O que pode ficar resolvido hoje",
            body: "Há coisas que genuinamente não se podem tratar com antecedência. Esta pode.\n\nO evangelho não é um plano para o futuro; é uma transacção que pode ficar fechada agora — culpa transferida, juízo já cumprido por um substituto, o assunto arrumado antes da travessia e não depois. É essa a razão pela qual é anunciado com urgência e não deixado como sugestão.",
            scripture:
              "Mas Deus prova o seu amor para connosco, em que Cristo morreu por nós, sendo nós ainda pecadores.",
            scriptureRef: "Romanos 5:8",
          },
        ],
        personalTurn: {
          setup:
            "Nenhuma daquelas pessoas planeou que fosse aquele o dia. Há um exame do outro lado de uma manhã vulgar, e ele não espera até estares pronto — mas podes ver agora mesmo como te sairias.",
          question: "Se acontecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "Portal de acontecimentos actuais, Julho de 2026 — Wikipédia (em inglês)",
            url: "https://en.wikipedia.org/wiki/Portal:Current_events/July_2026",
          },
          {
            label: "Notícias do mundo — CNN (em inglês)",
            url: "https://www.cnn.com/world",
          },
        ],
      },
    },
  },
  {
    slug: "nobody-is-forecasting-you",
    datePublished: "2026-07-08",
    draft: true,
    locales: {
      en: {
        title: "Everyone Is Forecasting the Economy. Nobody Is Forecasting You.",
        metaTitle: "Nobody Is Forecasting You",
        hook: "“Crosscurrents of war and technology,” says the IMF. Thousands of pages of projection, and not one line about the only certainty in any of our lives.",
        metaDescription:
          "The IMF’s July 2026 outlook models war, technology and growth years ahead. No forecast on earth prices in the one event certain to happen to you.",
        sections: [
          {
            heading: "The most carefully modelled guess in the world",
            body: "On July 8th the IMF published its World Economic Outlook update under the title “Global Economy in Crosscurrents of War and Technology.” Growth revised, risks weighted, scenarios branched. It is one of the most sophisticated forecasting exercises humanity performs.\n\nAnd it is a guess. A very good one, made by serious people, about a future nobody has seen.",
          },
          {
            heading: "What every forecast leaves out",
            body: "Every projection on earth — the IMF’s, your pension’s, your five-year plan — shares one blind spot. They all model a world that keeps having you in it.\n\nThat is the assumption nobody prices. Not because economists are naive, but because it is not the sort of variable a model can hold.",
          },
          {
            heading: "The parable that is really about planning",
            body: "Jesus told a story about a farmer whose forecast came in ahead of expectations. Record harvest, insufficient storage, so he decided to build bigger barns and finally relax. Nothing in the plan was wicked. It is essentially the retirement advice of every century.\n\nThe punchline is not that wealth is evil. It is that the man had modelled everything except the one event that arrived first.",
            scripture:
              "But God said to him, ‘Fool! This night your soul will be required of you; then whose will those things be which you have provided?’",
            scriptureRef: "Luke 12:20",
          },
          {
            heading: "Not a warning against planning",
            body: "James takes the same idea and applies it directly to anyone making a business plan: you say you will go to such a city, spend a year, trade and make a profit — and you do not know what tomorrow holds.\n\nHe is not banning ambition. He is objecting to the confidence, to the way we talk about next year as though it had been issued to us.",
            scripture:
              "Come now, you who say, ‘Today or tomorrow we will go to such and such a city, spend a year there, buy and sell, and make a profit’; whereas you do not know what will happen tomorrow.",
            scriptureRef: "James 4:13–14",
          },
          {
            heading: "The one appointment already on the books",
            body: "Here is the odd thing about the certainty everybody omits. It is not uncertain at all. It is the single most reliable data point available about your life, and it is the one nobody builds a plan around.\n\nAnd unlike a currency risk or a supply shock, this one has already been handled — by someone who took the loss deliberately, on behalf of people who could not cover it themselves.",
            scripture: "And as it is appointed for men to die once, but after this the judgment.",
            scriptureRef: "Hebrews 9:27",
          },
        ],
        personalTurn: {
          setup:
            "Everyone is forecasting the next five years. Nobody is forecasting the one appointment that is actually certain — and there is an exam on the other side of it that doesn’t wait until you feel ready.",
          question: "If it happened tonight — would you pass?",
        },
        sources: [
          {
            label: "“World Economic Outlook Update, July 2026: Global Economy in Crosscurrents of War and Technology” — IMF",
            url: "https://www.imf.org/en/publications/weo/issues/2026/07/08/world-economic-outlook-update-july-2026",
          },
          {
            label: "Press briefing transcript, World Economic Outlook Update, July 8, 2026 — IMF",
            url: "https://www.imf.org/en/news/articles/2026/07/08/tr070826-weo-press-briefing-transcript-july-8-2026",
          },
        ],
      },
      pt: {
        title: "Toda a Gente Faz Previsões Sobre a Economia. Ninguém Faz Previsões Sobre Ti.",
        metaTitle: "Ninguém Faz Previsões Sobre Ti",
        hook: "“Correntes cruzadas de guerra e tecnologia”, diz o FMI. Milhares de páginas de projecção, e nem uma linha sobre a única certeza que qualquer um de nós tem.",
        metaDescription:
          "As perspectivas do FMI modelam guerra, tecnologia e crescimento a anos de distância. Nenhuma previsão contabiliza o único acontecimento certo na tua vida.",
        sections: [
          {
            heading: "O palpite mais bem modelado do mundo",
            body: "A 8 de Julho, o FMI publicou a actualização das suas perspectivas económicas mundiais sob o título “Economia Global nas Correntes Cruzadas da Guerra e da Tecnologia”. Crescimento revisto, riscos ponderados, cenários ramificados. É um dos exercícios de previsão mais sofisticados que a humanidade realiza.\n\nE é um palpite. Um palpite muito bom, feito por gente séria, sobre um futuro que ninguém viu.",
          },
          {
            heading: "O que todas as previsões deixam de fora",
            body: "Todas as projecções do mundo — a do FMI, a da tua pensão, o teu plano a cinco anos — partilham um ponto cego. Todas modelam um mundo que continua a ter-te lá dentro.\n\nÉ essa a suposição que ninguém contabiliza. Não porque os economistas sejam ingénuos, mas porque não é o tipo de variável que um modelo consiga suportar.",
          },
          {
            heading: "A parábola que é mesmo sobre planeamento",
            body: "Jesus contou a história de um lavrador cuja previsão saiu acima das expectativas. Colheita recorde, armazenamento insuficiente, e por isso decidiu construir celeiros maiores e finalmente descansar. Nada naquele plano era perverso. É essencialmente o conselho de reforma de todos os séculos.\n\nO remate não é que a riqueza seja má. É que o homem tinha modelado tudo excepto o acontecimento que chegou primeiro.",
            scripture:
              "Mas Deus lhe disse: Louco! esta noite te pedirão a tua alma; e o que tens preparado, para quem será?",
            scriptureRef: "Lucas 12:20",
          },
          {
            heading: "Não é um aviso contra planear",
            body: "Tiago pega na mesma ideia e aplica-a directamente a quem faz um plano de negócios: dizes que vais a tal cidade, que lá passas um ano, que negoceias e tens lucro — e não sabes o que trará o dia de amanhã.\n\nNão está a proibir ambição. Está a objectar à confiança, à forma como falamos do próximo ano como se nos tivesse sido emitido.",
            scripture:
              "Eia agora vós, que dizeis: Hoje, ou amanhã, iremos a tal cidade, e lá passaremos um ano, e contrataremos, e ganharemos; digo-vos que não sabeis o que acontecerá amanhã.",
            scriptureRef: "Tiago 4:13–14",
          },
          {
            heading: "A única marcação já feita",
            body: "E há aqui uma coisa curiosa sobre a certeza que toda a gente omite. Não tem nada de incerta. É o dado mais fiável que existe sobre a tua vida, e é aquele à volta do qual ninguém constrói um plano.\n\nE, ao contrário de um risco cambial ou de um choque de oferta, este já foi tratado — por alguém que assumiu a perda de propósito, em nome de pessoas que não a conseguiam cobrir sozinhas.",
            scripture: "E, como aos homens está ordenado morrerem uma vez, vindo depois disso o juízo.",
            scriptureRef: "Hebreus 9:27",
          },
        ],
        personalTurn: {
          setup:
            "Toda a gente faz previsões para os próximos cinco anos. Ninguém faz previsões sobre a única marcação que é mesmo certa — e há um exame do outro lado dela que não espera até estares pronto.",
          question: "Se acontecesse esta noite — passavas?",
        },
        sources: [
          {
            label: "“World Economic Outlook Update, July 2026” — FMI (em inglês)",
            url: "https://www.imf.org/en/publications/weo/issues/2026/07/08/world-economic-outlook-update-july-2026",
          },
          {
            label: "Transcrição da conferência de imprensa do WEO, 8 de Julho de 2026 — FMI (em inglês)",
            url: "https://www.imf.org/en/news/articles/2026/07/08/tr070826-weo-press-briefing-transcript-july-8-2026",
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

/**
 * Drafts included. Only the search-budget tests want these: a draft that is
 * written with a 207-character description is the same bug, found on the day
 * it ships instead of the day it was typed.
 */
export function getAllPosts(): BlogPost[] {
  return POSTS;
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

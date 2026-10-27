/*
 * Tem volta? — the copy and Scripture for every card, in PT-PT (tu).
 *
 * The order is the Living Waters order, unchanged by the Volta frame:
 *   curiosity → God named → testimony → the Law (four commandments) →
 *   the reader's own receipt → the reader's verdict → judgment →
 *   parked objections → dawn (Isaiah 44:22) → the debt paid, the cross →
 *   the metaphor breaks on purpose → repent and trust → three exits → ending.
 *
 * The metaphor is a light touch: the hook, the receipt, and one deliberate
 * contrast at the cross. The Law, the Judge and the debt stay in the
 * method's own terms, because a dented bottle is damage and sin is guilt.
 *
 * Scripture: Bíblia Livre (CC BY). BLV placeholders are filled by
 * prototypes/once/scripts/build.mjs; no verse is typed here. `key` is the
 * reference in the source file, `ref` is how a Portuguese reader sees it.
 */
(() => {
	const V = (key, ref, text) => ({ key, ref, text });

	window.TV = {
		brand: "Tem volta?",
		privacy: "As tuas respostas ficam neste telemóvel.",
		footer: "Sem ligação ao sistema Volta de embalagens · Bíblia Livre (CC BY)",

		hook: {
			line: "A máquina só aceita embalagens vazias, intactas e com o símbolo.",
			q: "E tu? Eras aceite?",
			go: "Vamos ver",
		},

		/* God is named on card 2. The answer is testimony, never a shortcut. */
		reveal: {
			eyebrow: "Por Deus, quero dizer.",
			q: "No dia em que Ele te avaliar, eras aceite?",
			options: [
				{ id: "sim", label: "Sim" },
				{ id: "talvez", label: "Talvez" },
				{ id: "nao", label: "Não" },
			],
			reply: {
				sim: "A maioria diz que sim. Vamos ver o padrão d'Ele.",
				talvez: "Talvez é uma resposta honesta. Vamos ver o padrão.",
				nao: "Muitos dizem isso por modéstia. Vamos ver o padrão.",
			},
			quote: { sim: "Sim.", talvez: "Talvez.", nao: "Não." },
		},

		why: {
			q: "Porque é que Deus te aceitaria?",
			options: [
				{ id: "good", label: "Sou boa pessoa" },
				{ id: "believe", label: "Acredito em Deus" },
				{ id: "church", label: "O batismo, a missa, as orações" },
				{ id: "christ", label: "Jesus pagou por mim" },
			],
		},

		examine: {
			line: "Então vamos examinar.",
			verse: V("Lamentations 3:40", "Lamentações 3:40", "{{BLV:Lamentations 3:40}}"),
		},

		/* Results name the act, not the person: Portuguese nouns for people are gendered. */
		law: [
			{
				id: "lie",
				cmd: V("Exodus 20:16", "Êxodo 20:16", "{{BLV:Exodus 20:16}}"),
				q: "Já alguma vez mentiste? Nem que fosse uma mentira pequena?",
				honest: "Sim",
				evade: "Só mentiras inocentes",
				press: "Uma mentira inocente continua a ser uma mentira. Já disseste alguma?",
				reason: "mentira",
				short: "Êx 20:16",
				result: "Mentira.",
				denied: "nunca mentiste",
			},
			{
				id: "steal",
				cmd: V("Exodus 20:15", "Êxodo 20:15", "{{BLV:Exodus 20:15}}"),
				q: "Já alguma vez tiraste algo que não era teu, por pequeno que fosse?",
				honest: "Sim",
				evade: "Nada de importante",
				press: "O valor não é a questão. Um download? Um troco a mais que ficou?",
				reason: "roubo",
				short: "Êx 20:15",
				result: "Roubo.",
				denied: "nunca roubaste",
			},
			{
				id: "name",
				cmd: V("Exodus 20:7", "Êxodo 20:7", "{{BLV:Exodus 20:7|Não tomarás o nome do SENHOR teu Deus em vão}}"),
				q: "Já alguma vez usaste o nome de Deus como palavrão?",
				honest: "Sim",
				evade: "Não a sério",
				press: "Usarias o nome da tua mãe assim?",
				reason: "blasfémia",
				short: "Êx 20:7",
				result: "Blasfémia.",
				denied: "nunca usaste o nome de Deus em vão",
				verse: V("Exodus 20:7", "Êxodo 20:7", "{{BLV:Exodus 20:7|porque não dará por inocente o SENHOR ao que tomar seu nome em vão.}}"),
			},
			{
				id: "lust",
				cmd: V("Exodus 20:14", "Êxodo 20:14", "{{BLV:Exodus 20:14}}"),
				q: "Já alguma vez olhaste para alguém com luxúria?",
				honest: "Sim",
				evade: "Toda a gente faz isso",
				press: "Isso é um sim. Jesus pôs o limite no olhar.",
				reason: "adultério no coração",
				short: "Mt 5:28",
				result: "Adultério no coração.",
				denied: "nunca olhaste com luxúria",
				verse: V(
					"Matthew 5:28",
					"Mateus 5:28",
					"{{BLV:Matthew 5:28|qualquer um que olhar para uma mulher para a cobiçar, em seu coração já adulterou com ela.}}",
				),
			},
		],
		pressYes: "Pronto, sim",
		pressNo: "Continuo a dizer que não",
		yourAnswer: "A tua resposta, não a minha.",
		held: "Fica registado. A resposta é tua.",

		/* The receipt lists what the reader did. The status is left for the reader to fill in. */
		receipt: {
			title: "TALÃO",
			item: "Embalagem",
			itemValue: "tu",
			reasons: "Motivos",
			denied: "Negado",
			none: "nenhum declarado",
			status: "Estado",
			statusValue: "?",
			foot: "Pelas tuas próprias respostas.",
			noneVerse: V("Ecclesiastes 7:20", "Eclesiastes 7:20", "{{BLV:Ecclesiastes 7:20}}"),
		},
		testimony: {
			reveal: "Perguntei se eras aceite. Disseste",
			why: "E que Deus te aceitaria porque",
			law: V("James 2:10", "Tiago 2:10", "{{BLV:James 2:10}}"),
		},

		/* Mortality belongs here, in the Law half, and nowhere after the response. */
		once: V("Hebrews 9:27", "Hebreus 9:27", "{{BLV:Hebrews 9:27}}"),

		verdict: {
			q: "Pelo padrão de Deus: aceite ou rejeitado?",
			guilty: "Rejeitado",
			innocent: "Aceite",
			press: "Com as tuas próprias respostas?",
			pressVerse: V("Romans 3:10", "Romanos 3:10", "{{BLV:Romans 3:10|Não há justo, nem um sequer.}}"),
			stillInnocent: "Continuo a dizer aceite",
			replyGuilty: "São palavras tuas. As tuas respostas dizem o mesmo.",
			replyInnocent: "Então é a tua palavra contra a Lei de Deus.",
		},

		where: {
			q: "Então onde ficarias: céu ou inferno?",
			options: [
				{ id: "hell", label: "Inferno" },
				{ id: "heaven", label: "Céu" },
				{ id: "unsure", label: "Não sei" },
			],
			whyQ: "Porquê o céu?",
			why: [
				{ id: "goodgod", label: "Deus é bom", reply: "Ele é bom. Por isso não pode deixar o culpado sair impune." },
				{ id: "moregood", label: "Fiz mais bem do que mal", reply: "As boas ações não apagam crimes." },
				{ id: "jesus", label: "Jesus pagou por mim", reply: "Guarda isso. Há uma palavra para ti no fim." },
			],
		},
		penalty: {
			lead: { hell: "A Escritura concorda:", heaven: "A Escritura é clara:", unsure: "A Escritura é clara:" },
			verses: [
				V(
					"Revelation 21:8",
					"Apocalipse 21:8",
					"{{BLV:Revelation 21:8|a todos os mentirosos, a parte deles será no lago que queima com fogo e enxofre}}",
				),
				V("Matthew 25:46", "Mateus 25:46", "{{BLV:Matthew 25:46|E estes irão ao tormento eterno}}"),
			],
		},
		concern: {
			q: "Isso preocupa-te?",
			options: [
				{ id: "yes", label: "Sim" },
				{ id: "no", label: "Não" },
				{ id: "unsure", label: "Não sei" },
			],
			reply: {
				yes: "Também me preocupa.",
				no: "Então pensa no que vale a tua alma.",
				unsure: "É uma resposta honesta. Continua.",
			},
			noVerse: V("Mark 8:36", "Marcos 8:36", "{{BLV:Mark 8:36}}"),
		},

		/* Dawn. */
		dawn: {
			eyebrow: "Mas há volta.",
			verse: V("Isaiah 44:22", "Isaías 44:22", "{{BLV:Isaiah 44:22}}"),
		},

		/* The courtroom, in its load-bearing order. "Dívida", as the owner ruled for grace. */
		court: [
			{
				line: "Imagina um tribunal. És culpado, e a dívida é maior do que alguma vez conseguirias pagar.",
				verse: V("Romans 6:23", "Romanos 6:23", "{{BLV:Romans 6:23|porque o salário do pecado é a morte}}"),
			},
			{
				line: "O juiz é bom. Não pode simplesmente deixar-te ir.",
				verse: V("Proverbs 17:15", "Provérbios 17:15", "{{BLV:Proverbs 17:15}}"),
			},
			{
				line: "Então alguém paga a tua dívida por inteiro. Agora podes sair livre, dentro da lei.",
				verse: V(
					"Colossians 2:14",
					"Colossenses 2:14",
					"{{BLV:Colossians 2:14|Ele riscou a certidão de nossa dívida em ordenanças, a qual era contra nós, e a removeu, cravando-a na cruz}}",
				),
			},
		],
		butGod: V("Romans 5:8", "Romanos 5:8", "{{BLV:Romans 5:8}}"),
		jesus: {
			line: "Esse alguém é Jesus, Deus feito homem. Morreu a morte que tu merecias, e ressuscitou.",
			verse: V("1 Corinthians 15:4", "1 Coríntios 15:4", "{{BLV:1 Corinthians 15:4|e que ressuscitou ao terceiro dia, segundo as Escrituras}}"),
		},

		/* The metaphor breaks on purpose: the machine pays you; God paid for you. */
		breaks: {
			eyebrow: "Aqui a comparação falha",
			line: "A máquina paga-te por voltares. Deus não te paga. Ele pagou por ti.",
			verses: [
				V("1 Peter 1:18", "1 Pedro 1:18", "{{BLV:1 Peter 1:18|não foi por coisas destrutíveis, como prata ou ouro, que fostes resgatados}}"),
				V("1 Peter 1:19", "1 Pedro 1:19", "{{BLV:1 Peter 1:19}}"),
			],
		},
		dented: {
			line: "Deus não rejeita os amolgados que voltam.",
			verses: [
				V("Isaiah 42:3", "Isaías 42:3", "{{BLV:Isaiah 42:3|A cana esmagada ele não quebrará}}"),
				V("Psalm 51:17", "Salmo 51:17", "{{BLV:Psalm 51:17|tu não desprezarás um coração quebrado e triste.}}"),
			],
		},

		repent: {
			line: "Voltar é isto: arrepender-te. Deixar o pecado, não só ter pena dele.",
			verse: V("Malachi 3:7", "Malaquias 3:7", "{{BLV:Malachi 3:7|Voltai-vos a mim, e eu me voltarei a vós}}"),
		},
		trust: {
			line: "E confiar só em Jesus. Como um paraquedas: não basta acreditar nele. É preciso vesti-lo.",
			verse: V("Romans 13:14", "Romanos 13:14", "{{BLV:Romans 13:14|revesti-vos do Senhor Jesus Cristo}}"),
		},
		pray: {
			line: "Não há fórmula. Fala com Ele com as tuas palavras. Não te endireitas primeiro: voltas como estás.",
			verse: V("Proverbs 28:13", "Provérbios 28:13", "{{BLV:Proverbs 28:13|aquele que as confessa e as abandona alcançará misericórdia.}}"),
		},

		exits: {
			q: "Onde estás com isto?",
			options: [
				{ id: "now", label: "Volto agora para Ele" },
				{ id: "think", label: "Preciso de pensar" },
				{ id: "no", label: "Não acredito nisto" },
			],
			note: "Todas as respostas são respeitadas.",
		},

		/* After the exits the courtroom stops, and every promise stays conditional. */
		pause: "Então fala com Ele, não comigo. Demora o tempo que precisares.",
		ready: "Continuar",
		answer: {
			now: {
				line: "Se te voltaste do pecado e confiaste em Jesus, esta é a promessa d'Ele:",
				verse: V("John 5:24", "João 5:24", "{{BLV:John 5:24|quem ouve minha palavra, e crê ao que me enviou, tem vida eterna}}"),
			},
			think: {
				line: "É honesto. Pesa isto na fonte:",
				verse: V(
					"John 20:31",
					"João 20:31",
					"{{BLV:John 20:31|estes estão escritos, para que creiais que Jesus é o Cristo, o Filho de Deus}}",
				),
			},
			no: { line: "Obrigado pela franqueza. Eras livre de dizer isso, e continuas a ser." },
		},

		ending: {
			heading: "Se não nos voltarmos a ver",
			good: {
				line: "Disseste que eras boa pessoa. Jesus disse:",
				verse: V("Mark 10:18", "Marcos 10:18", "{{BLV:Mark 10:18|Ninguém é bom, a não ser um: Deus.}}"),
			},
			believe: {
				line: "Acreditar que Deus existe não é confiar n'Ele. Tiago é direto:",
				verse: V("James 2:19", "Tiago 2:19", "{{BLV:James 2:19|os demônios também creem, e estremecem.}}"),
			},
			church: {
				line: "Batismo, missa, oração: são coisas boas. Nenhuma delas é o paraquedas.",
				verse: V("Matthew 7:21", "Mateus 7:21", "{{BLV:Matthew 7:21|Não é qualquer um que me diz: “Senhor, Senhor” que entrará no Reino dos céus}}"),
			},
			christ: {
				line: "É a resposta certa. Confirma que é verdade em ti.",
				verse: V(
					"2 Corinthians 13:5",
					"2 Coríntios 13:5",
					"{{BLV:2 Corinthians 13:5|Examinai-vos a vós mesmos, se estais na fé; provai-vos a vós mesmos.}}",
				),
			},
		},

		/* Only for the reader who chose "Volto agora para Ele". */
		days: {
			heading: "Para os próximos dias",
			lines: [
				{ t: "Lê o evangelho de João, um capítulo por dia.", ref: "João 20:31" },
				{ t: "Fala com Deus todos os dias.", ref: "Filipenses 4:6" },
				{ t: "Procura uma igreja que ensine a Bíblia.", ref: "Hebreus 10:25" },
				{ t: "Quando pecares, confessa-o a Deus.", ref: "1 João 1:9" },
			],
			tell: V(
				"Luke 8:39",
				"Lucas 8:39",
				"{{BLV:Luke 8:39|Volta para tua casa, e conta como foram grandes as coisas que Deus te fez}}",
			),
		},

		/* The take-away card: the Law above the fold, grace below it. Never the reader's answers. */
		card: {
			law: V("Romans 3:23", "Romanos 3:23", "{{BLV:Romans 3:23|todos pecaram, e estão destituídos da glória de Deus}}"),
			lines: ["Todos quebrámos a Lei de Deus.", "Julgados por ela, somos culpados.", "Jesus pagou a dívida por inteiro. Morreu e ressuscitou.", "Volta-te para Ele e confia."],
		},

		/* Se Morresses Hoje carries what comes next. Never /pt/next-steps: it sends strangers home. */
		handoff: {
			readingPlan: "https://www.ifyoudiedtoday.com/pt/reading-plan",
			learn: "https://www.ifyoudiedtoday.com/pt/learn",
			church: "https://www.ifyoudiedtoday.com/pt/find-a-church",
			readings: [
				"João 1:1-18",
				"João 3:1-21",
				"João 4:1-26",
				"João 10:1-18",
				"João 14:1-14",
				"João 15:1-17",
				"João 20:1-31",
			],
		},
	};

	/* "Mas…": parked during the Law, answered in place from dawn on. */
	window.TV_OBJECTIONS = {
		parkLine: "Boa pergunta. Guarda-a. Respondo logo a seguir.",
		parkedHeading: "Perguntaste",
		law: [
			{
				id: "perfect",
				q: "Ninguém é perfeito.",
				a: "É verdade, e é esse o problema. Deus mede-te pela Lei d'Ele, não pelos outros.",
				verse: V("James 2:10", "Tiago 2:10", "{{BLV:James 2:10}}"),
			},
			{
				id: "love",
				q: "Deus é amor. Ele perdoa.",
				a: "Ele é amor. E também é justo. Um juiz que deixa o culpado sair não é bom.",
				verse: V("Proverbs 17:15", "Provérbios 17:15", "{{BLV:Proverbs 17:15}}"),
			},
			{
				id: "balance",
				q: "Fiz mais bem do que mal.",
				a: "As boas ações não apagam crimes. A Lei mostra o que fizeste. Não te torna justo.",
				verse: V("Romans 3:20", "Romanos 3:20", "{{BLV:Romans 3:20|ninguém será justificado diante dele pelas obras da Lei}}"),
			},
			{
				id: "never",
				q: "E quem nunca ouviu falar?",
				a: "Ninguém é julgado pelo que nunca ouviu. A criação e a consciência já falam.",
				verse: V("Romans 1:20", "Romanos 1:20", "{{BLV:Romans 1:20|para que não tenham desculpa}}"),
			},
			{
				id: "fair",
				q: "Inferno por umas mentiras? Não é justo.",
				a: "O peso de um crime depende de contra quem é. Todo o pecado é contra um Deus santo.",
				verse: V("Genesis 18:25", "Génesis 18:25", "{{BLV:Genesis 18:25|O juiz de toda a terra, não há de fazer o que é justo?}}"),
			},
		],
		grace: [
			{
				id: "justforgive",
				q: "Porque é que Deus não perdoa e pronto?",
				a: "Porque é justo. Na cruz a pena foi paga, por isso Ele perdoa e continua justo.",
				verse: V("Romans 3:26", "Romanos 3:26", "{{BLV:Romans 3:26|a fim de que ele seja justo, e justificador daquele que tem fé em Jesus.}}"),
			},
			{
				id: "religions",
				q: "E as outras religiões?",
				a: "Todas dizem: faz o suficiente. O evangelho diz que não consegues, e que Alguém fez por ti.",
				verse: V("John 14:6", "João 14:6", "{{BLV:John 14:6|Ninguém vem ao Pai, a não ser por mim.}}"),
			},
			{
				id: "rose",
				q: "Como sei que Jesus ressuscitou?",
				a: "Mais de quinhentas pessoas viram-n'O vivo ao mesmo tempo. A maioria ainda vivia para ser interrogada.",
				verse: V("1 Corinthians 15:6", "1 Coríntios 15:6", "{{BLV:1 Corinthians 15:6|por mais de quinhentos irmãos, dos quais a maioria ainda vive}}"),
			},
			{
				id: "toomuch",
				q: "O que eu fiz não tem perdão.",
				a: "Paulo perseguiu cristãos e chamou-se o principal dos pecadores. Nenhum pecado é maior do que o preço pago.",
				verse: V(
					"1 Timothy 1:15",
					"1 Timóteo 1:15",
					"{{BLV:1 Timothy 1:15|Cristo Jesus veio ao mundo para salvar os pecadores, dos quais eu sou o principal.}}",
				),
			},
			{
				id: "communion",
				q: "Já fiz a primeira comunhão.",
				a: "Então olha para o que cresceu desde então. Se não tens a certeza, volta e confia n'Ele hoje.",
				verse: V(
					"2 Corinthians 13:5",
					"2 Coríntios 13:5",
					"{{BLV:2 Corinthians 13:5|Examinai-vos a vós mesmos, se estais na fé; provai-vos a vós mesmos.}}",
				),
			},
			{
				id: "religious",
				q: "A religião não é para mim.",
				a: "Religião é o homem a tentar chegar a Deus. O evangelho é Deus a vir ter com o homem.",
				verse: V("Ephesians 2:8", "Efésios 2:8", "{{BLV:Ephesians 2:8|pela graça sois salvos, por meio da fé}}"),
			},
		],
	};
})();

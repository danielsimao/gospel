/*
 * Once — the shared spine. Every variant tells the same story in this order:
 *
 *   good person? → why would God let you in? → the Law → the read-back →
 *   Hebrews 9:27 (left hanging) → innocent or guilty? → heaven or hell? →
 *   does that concern you? → parked objections → dawn: Hebrews 9:28 →
 *   the courtroom → repent and trust → Psalm 51 → three exits → the ending.
 *
 * Verse text is never typed here: BSB placeholders are filled from the
 * Berean Standard Bible by scripts/build.mjs.
 */
(() => {
	const V = (ref, text) => ({ ref, text });

	window.ONCE = {
		good: {
			q: "Would you say you're a good person?",
			options: [
				{ id: "yes", label: "Yes" },
				{ id: "mostly", label: "Mostly" },
				{ id: "no", label: "No" },
			],
			quote: { yes: "Yes, I'm a good person.", mostly: "Mostly.", no: "No." },
			// A "no" is usually modesty. It never shortens the Law.
			reply: {
				yes: "Most people say that. Let's test it against God's standard.",
				mostly: "Compared to whom? God doesn't grade on a curve. Let's look at His standard.",
				no: "Most people say that to be modest. Let's see what God's standard says.",
			},
		},

		why: {
			q: "Say there is a heaven. If God asked why He should let you in, what would you say?",
			options: [
				{ id: "good", label: "I'm a good person" },
				{ id: "believe", label: "I believe in God" },
				{ id: "church", label: "Church, baptism, or a prayer I prayed" },
				{ id: "christ", label: "Jesus paid for my sins" },
			],
			hold: "Hold that answer. We'll come back to it.",
		},

		/*
		 * Stories uses the first four (Comfort's usual four). Conversation and
		 * Letter use all six. Each evasion gets exactly one press; holding after
		 * the press is recorded as the reader's answer, not as an admission.
		 */
		law: [
			{
				id: "lie",
				commandment: V("Exodus 20:16", "You shall not bear false witness against your neighbor."),
				q: "Have you ever told a lie? Even a small one.",
				honest: "Yes",
				evade: "Only white lies",
				press: "A white lie is still a lie. Have you ever told one?",
				pressYes: "Okay, yes",
				pressNo: "Still no",
				name: "a liar",
				denied: "you have never lied",
				named: "Someone who tells lies is called a liar. That's your answer, not my word.",
			},
			{
				id: "steal",
				commandment: V("Exodus 20:15", "You shall not steal."),
				q: "Have you ever taken something that wasn't yours, however small?",
				honest: "Yes",
				evade: "Nothing that mattered",
				press: "Value isn't the question. A download you didn't pay for, change you kept, work time you spent on yourself?",
				pressYes: "Okay, yes",
				pressNo: "Still no",
				name: "a thief",
				denied: "you have never stolen",
				named: "Someone who takes what isn't theirs is a thief, whatever it was worth.",
			},
			{
				id: "name",
				commandment: V("Exodus 20:7", "You shall not take the name of the LORD your God in vain, for the LORD will not leave anyone unpunished who takes His name in vain."),
				q: "Have you ever used God's name as a swear word?",
				honest: "Yes",
				evade: "Not seriously",
				press: "Would you use your mother's name as a swear word? God gave you your life.",
				pressYes: "Okay, yes",
				pressNo: "Still no",
				name: "a blasphemer",
				denied: "you have never misused God's name",
				named: "That's called blasphemy. God says He will not leave it unpunished.",
				standard: V("Exodus 20:7", "You shall not take the name of the LORD your God in vain, for the LORD will not leave anyone unpunished who takes His name in vain."),
			},
			{
				id: "lust",
				commandment: V("Exodus 20:14", "You shall not commit adultery."),
				q: "Have you ever looked at someone with lust?",
				honest: "Yes",
				evade: "Everyone does",
				press: "That's a yes. Jesus put the line at the look, not just the act.",
				pressYes: "Okay, yes",
				pressNo: "Still no",
				name: "an adulterer at heart",
				denied: "you have never looked with lust",
				named: "Jesus said that counts.",
				standard: V("Matthew 5:27-28", "You have heard that it was said, ‘Do not commit adultery.’ But I tell you that anyone who looks at a woman to lust after her has already committed adultery with her in his heart."),
			},
			{
				id: "hate",
				commandment: V("Exodus 20:13", "You shall not murder."),
				q: "Have you ever hated someone?",
				honest: "Yes",
				evade: "Angry, never hate",
				press: "Have you ever wished someone harm, even for a moment?",
				pressYes: "Okay, yes",
				pressNo: "Still no",
				name: "a murderer at heart",
				denied: "you have never hated anyone",
				named: "God sees the heart, and He counts hatred as murder.",
				standard: V("1 John 3:15", "Everyone who hates his brother is a murderer, and you know that eternal life does not reside in a murderer."),
			},
			{
				id: "first",
				commandment: V("Exodus 20:3", "You shall have no other gods before Me."),
				q: "Has God always come first in your life, above family, plans, and yourself?",
				honest: "No, He hasn't",
				evade: "I think so",
				press: "With all your heart, soul, and mind, every day?",
				pressYes: "No, not like that",
				pressNo: "I still think so",
				name: "someone who hasn't put God first",
				denied: "God has always come first",
				named: "Jesus called this the first and greatest commandment.",
				standard: V(
					"Matthew 22:37",
					"Love the Lord your God with all your heart and with all your soul and with all your mind.",
				),
			},
		],

		readBack: {
			admitted: "By your own admission, you are",
			evaded: (list) => `You said ${list}. I've written that down as your answer.`,
			noneAdmitted: "You said no to every one. Scripture says this about all of us:",
			noneVerse: V("Ecclesiastes 7:20", "Surely there is no righteous man on earth who does good and never sins."),
			whyQuote: "You said God should let you in because",
			law: V("James 2:10", "Whoever keeps the whole law but stumbles at just one point is guilty of breaking all of it."),
		},

		/* Mortality belongs here, in the Law half, and nowhere after the response. */
		once: V("Hebrews 9:27", "Just as man is appointed to die once, and after that to face judgment,"),

		verdict: {
			q: "On that day, judged by these commandments: innocent or guilty?",
			innocentPress: "From your own answers?",
			innocentVerse: V("Romans 3:10", "There is no one righteous, not even one."),
			stillInnocent: "Then it's your word against God's Law.",
		},

		where: {
			q: "Then where would that leave you: heaven or hell?",
			options: [
				{ id: "hell", label: "Hell" },
				{ id: "heaven", label: "Heaven" },
				{ id: "unsure", label: "I don't know" },
			],
			whyHeaven: {
				q: "Why heaven?",
				options: [
					{
						id: "goodgod",
						label: "God is good",
						reply: "He is. That's the problem for us. A good judge can't let the guilty go.",
						verse: V("Proverbs 17:15", "Acquitting the guilty and condemning the righteous— both are detestable to the LORD."),
					},
					{
						id: "moregood",
						label: "I've done more good than bad",
						reply: "Good deeds don't erase crimes. The Law shows what you've done wrong. It can't make you right.",
						verse: V("Romans 3:20", "Therefore no one will be justified in His sight by works of the law. For the law merely brings awareness of sin."),
					},
					{
						id: "jesus",
						label: "Jesus paid for me",
						reply: "Hold onto that. There's a word for you at the end.",
					},
				],
			},
			lead: {
				hell: "That's what Scripture says too.",
				heaven: "But this is what Scripture says the Law's penalty is:",
				unsure: "Scripture is plain about it:",
			},
			verses: [
				V("Revelation 21:8", "But to the cowardly and unbelieving and abominable and murderers and sexually immoral and sorcerers and idolaters and all liars, their place will be in the lake that burns with fire and sulfur. This is the second death."),
				V("Matthew 25:46", "And they will go away into eternal punishment, but the righteous into eternal life."),
			],
		},

		concern: {
			q: "Does that concern you?",
			options: [
				{ id: "yes", label: "Yes" },
				{ id: "no", label: "No" },
				{ id: "unsure", label: "Not sure" },
			],
			reply: {
				yes: "It concerns me too.",
				no: "Would you sell your eyes for a million dollars? Then think what your soul is worth.",
				unsure: "That's honest. Keep listening.",
			},
			noVerse: V("Mark 8:36-37", "What does it profit a man to gain the whole world, yet forfeit his soul? Or what can a man give in exchange for his soul?"),
		},

		/* Dawn. Verse 28 finishes the sentence verse 27 left open. */
		dawn: V("Hebrews 9:28", "so also Christ was offered once to bear the sins of many"),
		dawnLine: "The sentence doesn't end at judgment.",

		/* Comfort's courtroom, in its load-bearing order. Step 2 cannot be cut. */
		court: [
			{
				line: "Picture a courtroom. You're guilty, and the fine is more than you could ever pay.",
				verses: [V("Romans 6:23", "For the wages of sin is death")],
			},
			{
				line: "The judge is good, so he can't just let you go. A judge who did that would be corrupt.",
				verses: [V("Proverbs 17:15", "Acquitting the guilty and condemning the righteous— both are detestable to the LORD.")],
			},
			{
				line: "Then someone steps in and pays your fine in full. Now the judge can dismiss your case, legally, because justice has been done.",
				verses: [V("Colossians 2:14", "having canceled the debt ascribed to us in the decrees that stood against us. He took it away, nailing it to the cross!")],
			},
			{
				line: "That someone is Jesus, God in flesh. He lived the life you couldn't, died the death you deserved, and rose on the third day.",
				verses: [
					V("Romans 5:8", "But God proves His love for us in this: While we were still sinners, Christ died for us."),
					V("2 Corinthians 5:21", "God made Him who knew no sin to be sin on our behalf, so that in Him we might become the righteousness of God."),
					V(
						"1 Corinthians 15:3-4",
						"For what I received I passed on to you as of first importance: that Christ died for our sins according to the Scriptures, that He was buried, that He was raised on the third day according to the Scriptures",
					),
				],
			},
		],

		respond: {
			repent: "Repent. That means turning from your sin. Feeling sorry about it isn't the same thing.",
			repentVerses: [
				V("Mark 1:15", "Repent and believe in the gospel!"),
				V("Proverbs 28:13", "He who conceals his sins will not prosper, but whoever confesses and renounces them will find mercy."),
			],
			trust: "And trust Jesus alone. Think of a parachute. Believing it works won't save you. Putting it on will.",
			trustVerse: V("Romans 13:14", "clothe yourselves with the Lord Jesus Christ"),
			psalmLead: "There's no formula. After his adultery, King David prayed like this:",
			psalm: [
				V("Psalm 51:1-2", "Have mercy on me, O God, according to Your loving devotion; according to Your great compassion, blot out my transgressions. Wash me clean of my iniquity and cleanse me from my sin."),
				V("Psalm 51:10", "Create in me a clean heart, O God, and renew a right spirit within me."),
				V("Psalm 51:17", "The sacrifices of God are a broken spirit; a broken and a contrite heart, O God, You will not despise."),
			],
			psalmTail: "Use your own words. He hears them.",
		},

		exits: {
			q: "Where are you with this?",
			options: [
				{ id: "now", label: "I'm turning to Him now" },
				{ id: "think", label: "I need to think" },
				{ id: "no", label: "I don't believe this" },
			],
		},

		/* After the exits the courtroom stops, and every promise stays conditional. */
		after: {
			now: {
				pause: "Then talk to Him, not to me. Use your own words, and take as long as you need.",
				ready: "I'm ready to go on",
				promiseLead: "If you have turned from your sin and trusted Jesus, this is His promise:",
				promise: V("John 5:24", "Truly, truly, I tell you, whoever hears My word and believes Him who sent Me has eternal life and will not come under judgment. Indeed, he has crossed over from death to life."),
			},
			think: {
				line: "That's honest. Think it through with the source. John wrote his account so it could be weighed:",
				verses: [V("John 20:31", "But these are written so that you may believe that Jesus is the Christ, the Son of God, and that by believing you may have life in His name."), V("Jeremiah 29:13", "You will seek Me and find Me when you search for Me with all your heart.")],
			},
			no: {
				line: "Thank you for being straight with me. You were free to say that, and you still are. If you ever want to test it for yourself, the whole Gospel of John is here.",
			},
		},

		/* "If we never meet again": one paragraph chosen by the reader's own answer. */
		ending: {
			examineNowIntro: "This isn't here to unsettle you. It's what to watch for in the months ahead.",
			good: {
				lead: "You said God should let you in because you're a good person. Jesus answered that once:",
				verses: [V("Mark 10:18", "No one is good except God alone.")],
				tail: "The only goodness that will stand on that day is Christ's, given to those who trust Him.",
				tailVerse: V("Philippians 3:9", "and be found in Him, not having my own righteousness from the law, but that which is through faith in Christ, the righteousness from God on the basis of faith."),
			},
			believe: {
				lead: "You said: because I believe in God. Believing that God exists isn't the same as trusting Him. James puts it bluntly:",
				verses: [V("James 2:19", "You believe that God is one. Good for you! Even the demons believe that—and shudder.")],
				tail: "Remember the parachute. It only helps the one wearing it.",
			},
			church: {
				examine: true,
				lead: "You said: church, baptism, or a prayer I prayed. Those are good things. None of them is the parachute.",
				verses: [V("Matthew 7:21-23", "Not everyone who says to Me, ‘Lord, Lord,’ will enter the kingdom of heaven, but only he who does the will of My Father in heaven. Many will say to Me on that day, ‘Lord, Lord, did we not prophesy in Your name, and in Your name drive out demons and perform many miracles?’ Then I will tell them plainly, ‘I never knew you; depart from Me, you workers of lawlessness!’"), V("Mark 4:16-17", "Some are like the seeds sown on rocky ground. They hear the word and at once receive it with joy. But they themselves have no root, and they remain for only a season. When trouble or persecution comes because of the word, they quickly fall away.")],
				tail: "The people Jesus turned away pointed to what they had done. What they lacked was Him. He saves by mercy, and a prayer was never the payment.",
				tailVerse: V(
					"Titus 3:5",
					"He saved us, not by the righteous deeds we had done, but according to His mercy",
				),
			},
			christ: {
				examine: true,
				lead: "You said: because Jesus paid for my sins. That's the right answer. Scripture tells people who give it to check that it's true of them:",
				verses: [V("2 Corinthians 13:5", "Examine yourselves to see whether you are in the faith; test yourselves. Can’t you see for yourselves that Jesus Christ is in you—unless you actually fail the test?")],
				tests: [
					{ t: "You are trusting the Son, not yourself.", v: V("1 John 5:12", "Whoever has the Son has life; whoever does not have the Son of God does not have life.") },
					{
						t: "Obeying Him is the direction of your life.",
						v: V(
							"1 John 2:3",
							"By this we can be sure that we have come to know Him: if we keep His commandments.",
						),
					},
					{
						t: "You love other believers.",
						v: V(
							"1 John 3:14",
							"We know that we have passed from death to life, because we love our brothers.",
						),
					},
					{ t: "The world has lost its grip on you.", v: V("1 John 2:15", "Do not love the world or anything in the world. If anyone loves the world, the love of the Father is not in him.") },
					{
						t: "You fight your sin instead of making peace with it.",
						v: V("1 John 3:9", "Anyone born of God refuses to practice sin"),
					},
				],
				balance: "This isn't a call to be perfect. The same letter says:",
				balanceVerses: [
					V("1 John 1:8-9", "If we say we have no sin, we deceive ourselves, and the truth is not in us. If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness."),
					V(
						"1 John 2:1",
						"But if anyone does sin, we have an advocate before the Father—Jesus Christ, the Righteous One.",
					),
				],
				tail: "Christ is what saves. A changed life is the evidence that He has. If you're unsure, you don't have to stay unsure. Turn and trust Him today.",
				tailVerse: V("John 6:37", "Everyone the Father gives Me will come to Me, and the one who comes to Me I will never drive away."),
			},
			none: {
				lead: "You began by saying nothing happens after death. Test that against one short book.",
				verses: [V("John 20:31", "But these are written so that you may believe that Jesus is the Christ, the Son of God, and that by believing you may have life in His name.")],
			},
		},

		/* Only for the reader who chose "I'm turning to Him now". */
		essentials: [
			{
				t: "Read John, a chapter a day, and do what it says.",
				v: V("James 1:22", "Be doers of the word, and not hearers only."),
			},
			{ t: "Talk to God every day. No special words.", v: V("Philippians 4:6", "Be anxious for nothing, but in everything, by prayer and petition, with thanksgiving, present your requests to God.") },
			{
				t: "Find a church that teaches the Bible, and be baptized.",
				v: V("Matthew 28:19", "baptizing them in the name of the Father, and of the Son, and of the Holy Spirit"),
			},
			{ t: "When you sin, don't hide it. Confess it.", v: V("1 John 1:9", "If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness.") },
			{
				t: "Your assurance rests on what Christ did, not on how you feel.",
				v: V("1 John 5:13", "I have written these things to you who believe in the name of the Son of God, so that you may know that you have eternal life."),
			},
			{
				t: "Expect a fight.",
				v: V("John 16:33", "In the world you will have tribulation. But take courage; I have overcome the world!"),
			},
			{
				t: "Tell someone what happened.",
				v: V(
					"Mark 5:19",
					"tell them how much the Lord has done for you, and what mercy He has shown you.",
				),
			},
		],
	};
})();

/*
 * "But…" — the objections a real street conversation runs into.
 *
 * Phases decide what may be said:
 *   law     During the commandments a "But…" is parked: "Good question.
 *           Hold it." Parked objections are answered after "Does that
 *           concern you?" and before dawn. So these answers stay on the Law
 *           side: nothing about forgiveness, the cross, or Jesus paying.
 *   grace   From dawn on, the grace set is open too, answered in place.
 *
 * The method's discipline is to come back to the Law rather than debate it
 * away. That is why nothing here can be opened mid-question to skip a
 * commandment.
 */
(() => {
	const V = (ref, text) => ({ ref, text });

	window.ONCE_OBJECTIONS = {
		parkLine: "Good question. Hold it. It gets answered right after this.",
		parkedHeading: "You asked",

		law: [
			{
				id: "perfect",
				q: "Nobody's perfect.",
				a: "That's true, and it's the problem, not an excuse. God doesn't measure you against other people. He measures you against His Law, and breaking one part of it breaks the whole.",
				verse: V("James 2:10", "Whoever keeps the whole law but stumbles at just one point is guilty of breaking all of it."),
			},
			{
				id: "love",
				q: "God is love. He'll just forgive.",
				a: "God is love. He is also just. A judge who lets the guilty walk free because he's kind isn't good. Scripture says God hates that.",
				verse: V("Proverbs 17:15", "Acquitting the guilty and condemning the righteous— both are detestable to the LORD."),
			},
			{
				id: "balance",
				q: "I've done more good than bad.",
				a: "Good deeds don't cancel crimes. A man who robs a bank doesn't walk free because he also gives to charity. The Law can show you what you've done. It can't make you right.",
				verse: V("Romans 3:20", "Therefore no one will be justified in His sight by works of the law. For the law merely brings awareness of sin."),
			},
			{
				id: "never",
				q: "What about people who never heard?",
				a: "No one is judged for not hearing about Jesus. People are judged by what they already knew. Creation tells everyone there is a God, and conscience tells everyone right from wrong.",
				verse: V("Romans 1:20", "For since the creation of the world God’s invisible qualities, His eternal power and divine nature, have been clearly seen, being understood from His workmanship, so that men are without excuse."),
			},
			{
				id: "fair",
				q: "Hell, for a few lies? That isn't fair.",
				a: "How serious a crime is depends on who it is against. Lie to a friend and you lose a friend. Lie under oath and you go to prison. Every sin is against a God who is perfectly holy, and He judges rightly.",
				verse: V("Genesis 18:25", "Will not the Judge of all the earth do what is right?"),
			},
		],

		grace: [
			{
				id: "justforgive",
				q: "Why couldn't God just forgive?",
				a: "Because He is just. Forgiving a guilty person for nothing would make Him the corrupt judge. At the cross the penalty was paid, so God can forgive and still be just.",
				verse: V("Romans 3:26", "He did this to demonstrate His righteousness at the present time, so as to be just and to justify the one who has faith in Jesus."),
			},
			{
				id: "religions",
				q: "What about other religions?",
				a: "Every other way says: do enough and you might make it. The gospel says you can't, and that Someone did it for you. Jesus never claimed to be one way among many.",
				verse: V("John 14:6", "I am the way and the truth and the life. No one comes to the Father except through Me."),
			},
			{
				id: "rose",
				q: "How do I know Jesus rose?",
				a: "Paul wrote that the risen Jesus was seen by more than five hundred people at once, most of them still alive when he wrote, so his readers could go and ask them. John wrote his account so you could weigh it yourself.",
				verse: V("1 Corinthians 15:6", "After that, He appeared to more than five hundred brothers at once, most of whom are still living, though some have fallen asleep."),
			},
			{
				id: "toobad",
				q: "I'm too bad to be forgiven.",
				a: "Paul hunted Christians, and he called himself the worst of sinners. The fine was paid in full. No sin is bigger than the payment.",
				verse: V("1 Timothy 1:15", "This is a trustworthy saying, worthy of full acceptance: Christ Jesus came into the world to save sinners, of whom I am the worst."),
			},
			{
				id: "kid",
				q: "I already did this as a kid.",
				a: "Then look at what has grown since. The question is whether you are in the faith now. If you're not sure, you don't have to stay unsure. Turn and trust Him today.",
				verse: V("2 Corinthians 13:5", "Examine yourselves to see whether you are in the faith; test yourselves. Can’t you see for yourselves that Jesus Christ is in you—unless you actually fail the test?"),
			},
			{
				id: "religious",
				q: "I'm just not religious.",
				a: "Religion is people trying to reach God by being good enough. The gospel is God reaching people who aren't.",
				verse: V("Ephesians 2:8-9", "For it is by grace you have been saved through faith, and this not from yourselves; it is the gift of God, not by works, so that no one can boast."),
			},
		],
	};
})();

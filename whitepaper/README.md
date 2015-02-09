<img src="http://i.imgur.com/SsfjVjB.gif" alt="EveryBit.js Logo" width="500">
###EveryBit.js: A client-side library for secure, decentralized publishing
<small>*By Matt Asher and Dann Toliver for EveryBit. Last revised February 9, 2015*</small>
##Summary
Over time, publishing has become significantly more accessible, decentralized, and free (as in liberty). This trend accelerated in the early days of the internet, but is increasingly threatened by the rise of powerful private gatekeepers and government agencies. The JavaScript library EveryBit.js routes users around these intermediaries and reestablishes their privacy. It provides tools for publishing and sharing content in ways that are cryptographically secure, based on open standards, and uses the latest P2P JS tools to implement a decentralized network. 


##Outline
- [A brief history of publishing](#publishinghistory)
- [Introducing EveryBit.js](#introducingeverybit)
- [Case study: HedHelth](#hedhelth)
- [Other applications](#otherapplications)
- [Philosophy of architecture](#philosophyofarchitecture)
- [Bilaterlalism](#bilateralism)
- [Why this time it's different](#thistimeisdifferent)
- [A “Join or Die” moment](#joinordie)
- [Appendix](#appendix)
- [Footnotes](#footnotes)

<a name="publishinghistory"></a>
##A brief history of publishing: past, present and future
The long arc of publishing history shows a strong tendency towards decentralization. In the earliest days of recorded history, publishing was the exclusive right of rulers and gods (or their presumptive agents on earth). The flow of information went in one direction only. In the story of Moses, stone tablets were literally brought down from on high to the people. And, as a New Yorker cartoon observed, they had no "comments section". There’s evidence that ancient citizens created documents in clay tablets, but these were used for accounting and math. Except for graffiti, the official stories carved into stone were of the ruling elite and their deeds.

During the Middle Ages, a select group of scribes copied over manuscripts by hand. Each copy was expensive, and most of the population was illiterate. Published works were tightly controlled and highly limited in distribution. Attempts to circumvent the flow of published information, such as Martin Luther posting his grievances on the church door, were considered so rebellious that they could get the offender killed.

<img src="http://i.imgur.com/AblMzbr.jpg" title="Join, or die." width="400" align="right"/>

The rise of the printing press led to a radical expansion in the ease of publishing and disseminating ideas. The Join or Die cartoon show at right, published by Benjamin Franklin in the 1750s, could be considered the first American meme to go viral. It was copied, tweaked, and redistributed in thousands of newspapers and flyers.<sup>[1](#footnotes)</sup>

With the rise of the internet, the road to accessible, decentralized, and free publishing seemed to have reached its final destination. Anyone with a laptop, tablet or smartphone can now set up a blog for free. Within minutes they can begin posting content, with a potential audience of billions. 

Alongside this strong trend, a countervailing force has been developing, mostly off the radar, but now increasingly noticeable. The very same companies that helped radically expand the ease of personal publishing and disintermediated the process — Facebook, Twitter, Youtube — have begun establishing themselves as intermediaries, accommodating the demands of repressive governments, and building walled gardens around their users' content and relationships. They owe their success to aligning their interests with the interests of users, but their business models depend on their ability to read our private emails (to target us with ads) and manipulate our newsfeeds to benefit paying customers.<sup>[2](#footnotes)</sup> Paradoxically — and toxically, from the point of view of consumers — the more effort a user puts into publishing well-liked content on Facebook and building a social network there, the more that user depends on Facebook, and Facebook knows it.<sup>[3](#footnotes)</sup>

Not only does this situation put *users* in an position of dependence, it also forces *developers* to conform to the desires of these large corporations. Creating applications specifically for corporate ecosystems like Facebook's gives developers access to a large user base, but it also gives the tech companies significant control over the application. Serving as gatekeepers, these companies might decide an application no longer serves their financial interests and remove it. Or, after spending time, money, and effort developing an application and a userbase, it could face an increasing tax in the form of yearly fees or forced revenue sharing.

We are beginning to see the rise of re-intermediation, where tech giants take on the role once played by record labels, book publishers, and creative agencies. It's easy to understand why they would want to do this: as outsiders their growth depended on helping customers eliminate toll booths, but as established players, with control over large two-sided networks, they now see the potential to extract revenue from both sides.

Meanwhile, governments have been using mass surveillance to intercept private communication. And they've been using enhanced regulatory powers to seize domains related to internet gambling or music piracy, converting the force of law into a tool to protect the business models of established intermediaries and gatekeepers.<sup>[4](#footnotes)</sup> 

<a name="daysofdiscontent"></a>
###Days of discontent and fatigue
Signs of discontent with this system have begun to grow. User unease has manifested itself in several waves of "anyone but Facebook" momentum, generating buzz for projects like Join Diaspora and Ello. The desire to communicate and do commerce outside the purview of the state has led to the rise of Bitcoin and several generations of dark markets like Silk Road.

Even if they aren't yet concerned with the increasing power governments and companies have over our communication, users may be suffering from social media fatigue.<sup>[5](#footnotes)</sup> Each new account we sign up for is one more username and password to manage, one more bucket that fills up with messages, notifications, and required actions.  

<a name="whatfuturewants"></a>
###What the future really wants
Many of the technological innovations and social changes that seem to come out of nowhere are in fact presaged by earlier, similar technologies, and intense activity that culminates in many inventors arriving at the same radical idea at the same time.<sup>[6](#footnotes)</sup>

Right now, in various bits and pieces, in small and disconnected ways, we see the beginnings of an alternate vision for the future, growing alongside the tools to make it possible. In this future, control over publishing resides at the most individual level. Access to public content is independent of which social networks a user signed up for, and access to private content is strictly limited to the sender and the recipient. 

In this vision, overlapping micro-social networks have begun to flourish. By sharing a username system and content format, they are able to eliminate many of the network-effect advantages held by the monolithic tech giants. As developers, we participate freely in an ecosystem without an oligarchy of dominant interest, competing on on equal footing based on who can deliver the best services and user experience. 

As users, the relationships and networks we build up have become portable; we store and maintain them ourselves, and can take our content and relationships with us, wherever we go. Our relationship with social networks have become much lighter and more ad-hoc. We no longer think of ourselves as “members” of Facebook or Instagram, instead we are users and clients who take advantage of the tools that fit us best.

The archaic, insecure, and frustrating system of passwords has been replaced with digital keys. We verify our identities by affixing signatures (digital seals that cannot be faked) to content using our private keys, which are never sent out over the network. After a decidedly rough transition period, new tools have made it easy for us to manage our keys in ways that are secure and low hassle, like digital wristbands that unlock with our thumbprint. A multi-tiered system of keys allows users to delegate limited, revocable authority to applications without giving up ultimate control over our identities and content. 

The shift from passwords to keys represents — and makes possible — a broader shift towards decentralization of authority and intelligence. Just as publishing is no longer confined to massive pillars and stone walls, our most powerful computers have evolved from clunky hardware occupying an entire building, to devices that fit in our pockets and around our wrists. Even within the remnants of this centralized computing system, in the immense data centers managed by Facebook and Google, small, densely networked machines have taken the place of big hardware. 

With the rise of key based authentication, peer-to-peer networking over the browser, and shared decentralized ledgers, we are poised to make the final step in decentralization. In this future, all intelligence and authority derives from our individual devices. The client, alongside the rich, full-featured applications that run in our web browsers, does the heavy lifting of computation and gatekeeping. Our client requests the content we want, lets us manage our preferences, and encrypts and signs our private data before sending it out to others. 

A decentralized, shared username system, in combination with a standardized data format, lets us consolidate our dozens of inboxes and alerts under single username, a irrevocable identity we can control for life.

In this vision of the future, people will look back in amazement at the hassles we endured during the era when private messaging systems at Facebook, LinkedIn, Twitter, and G+ were non-interoperable. They’ll be astounded that we trusted our identities to companies whose interests lay in convincing us to build elaborate virtual homes on land we didn’t own, knowing that the more we invest in our homes, the more rent these companies will eventually be able to change us. 

<a name="introducingeverybit"></a>
##Introducing EveryBit.js
With EveryBit.js, we've taken a strong first step in the direction of this future, providing developers with a comprehensive library for secure communication, decentralized publishing, and federated identity management.  

Over the next few sections, we'll outline the main components that make this possible: "[puffs](#whatispuff)", [usernames](#usernamesystem), [signatures](#importanceofsig), [identity files](#identityincloud), and a [protocol for secure communication](#abcincryptoland).

<a name="whatispuff"></a>
###What is a puff?
<img src="http://i.imgur.com/sGDTN2P.png" alt="Puff structure" width="350" align="right">
For historical reasons that aren't entirely clear, the central unit of content in the EveryBit.js system is called a puff. A puff is a signed, static unit of data with a single content type. Let's examine its anatomy:

A puff has six required, top-level properties: `username`, `routes`, `previous`, `version`, `payload`, and `sig`. Another field, `keys`, is optional. No other fields are allowed, and puffs with additional top-level fields will not validate. Puffs are serialized as JSON strings and can contain only JSONifiable values.

The `payload` field is an object. It must contain non-empty values for the `content` and `type` properties. Additional payload properties are allowed. The meaning of these optional payload properties is determined by the client application: relationships between puffs, rankings, evaluations, display properties — all of these are application extensible. Conventions are beginning to form around additional payload fields such as `tags`, `time`, `parents`, `author`, `title`, `geo`, and `copyright`.

The payload's `content` field contains the main content of the puff. This is always a string. For compound content types it is serialized as a JSON string. Images are stored as Base64-encoded data strings.

The payload's `type` field is akin to a MIME type. A single puff can only have one content type. This allows developers to treat each piece of content in the system as an atomic unit, and build a newer, much more powerful generation of RSS-like readers and search engines, ones which facilitate fine-grained aggregation. See the diagram in [Changing the flow](#changingtheflow).

The `version` field corresponds to the version of the specification followed by the puff. 

The `routes` field identifies intended recipients, if any, or indicates that a puff is related to another user. It works like the `@` symbol in twitter. 

The identity of the person who created this puff is stored in the `username` field. 

The `previous` field stores the id (`sig`) of this username's most recent previous puff, creating a chain of content.

The `keys` field is supplied if the content of the puff is encrypted. It provides a way for the intended recipients to decrypt the message. See [Alice, Bob, and Charlie in Cryptoland](#abcincryptoland) for information about how this works.

The `sig` (signature) field provides a unique identifier for the puff, and binds it to the `username`. Signatures are the lynchpins of the EveryBit.js — they tie the content system and username system together, and help us solve the biggest challenges in decentralized publishing.

<a name="problemsofdecentralization"></a>
###The problems of decentralization
When moving from a centralized model of publishing to a decentralized one we face three main difficulties:

1. **Authenticating identity:** How can we be sure the document really came from the person who says they sent it?
2. **Ensuring integrity:** How can we validate the integrity of the document and conversation?
3. **Protecting privacy:** How can we be sure that no one else can view our private data?
 
In the current system of publishing, a central gatekeeper is in charge of all three things. For example, suppose user Bob receives a direct message from his Facebook friend Alice. He relies on Facebook to (1) certify that the message really came from Alice, (2) ensure that the message she sent wasn't altered in transit, nor were past messages in their conversation changed or deleted without notification, and (3) make sure Bob and Alice are the only ones who can view the conversation.
 
In a decentralized context we need alternative ways to solve these problems — solutions that don't rely on a single trusted authority. 

<a name="importanceofsig"></a>
###Sig, the linchpin of decentralization
<img src="http://i.imgur.com/8BzTOwm.gif" alt="Signing scheme" align="right">
The solution that ties everything together in EveryBit.js is the signature, or `sig` field. To generate a `sig`, we start with a puff as a JS object, with all of the fields in their [canonical order](#ordermatters). We convert the object into a string using `JSON.stringify`. Then take the SHA256 hash of the object's string. We pass the hash and the user's private signing key to the [ECDSA](http://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm) routine. Finally, we encode the returned signature in base58 format and add a new field `sig` to the original puff object with this value. All of this happens automatically in EveryBit.js with a single API call. 

Once the procedure is complete, we have created an [immutable signature](#immutability) — any changes to the puff, no matter how small, result in a different value for the `sig`. Because the signature is immutable, content can passed around without worrying about having the most recent version of that piece of content. Each `sig` is (practically) guaranteed to be unique<sup>[7](#footnotes)</sup>, so we can treat signatures as ids.

In addition to their use as a unique id for each puff, signatures allow users to verify the identity of the puff creator. A string encrypted with a private key can only be decoded with the matching public key, and vice versa. So to validate the `sig`, we look up the public key that corresponds to the claimed `username` on the puff. We strip off the signature field and follow the same signing procedure to get hash of the string object, which we run through ECDSA using the the public key. Unless the resulting string matches the `sig`, some other private key was used to sign the content. We reject this puff as invalid, and don't trust the sender. 

<a name="usernamesystem"></a>
###The username system
<img src="http://i.imgur.com/sVmaxqb.png" alt="Username structure" width="350" align="right">
You may have noticed that signatures depend on the existance of username records we can look up. These are maintained in a [Distributed Hash Table](#decentralizingusernames). Once a username is created, it is permanently owned by whoever controls the private keys, subject only to the requirement that the user publish at least one piece of content per year. A field called `updated` stores the date of the most recent update to the username record, and anytime new content is created, the `latest` field is changed to point to their most recent content. Usernames are built up using strings of lowercase letters and numbers, [no other characters are allowed](#displaynames).

The owner of a username controls their sub-user space as well. For example, user `foo` can create sub-users `foo.bar` and `foo.fighters`. There are three keys stored in each username record. New content is signed using the private key related to the `defaultKey`. This is the key used to verify the `sig` of a regular content puff. 

In order to add or modify a sub-user, the owner creates an update request and signs it with the private key related to their `adminKey`. All update requests are performed with puffs of `type` equal to `updateUserRecord`. The only way to change the `adminKey` or `rootKey` is to sign a message with the private key related to the `rootKey`. This is like a master key, and should be stored with the highest level of security. 

Every time a public key is changed, a new entry in the username DHT is created. This way, each username can be traced back to an original "genesis" entry, and the chain of signatures can be used to validate that all changes were authorized. A field called `capa` (Spanish for "level", like stratum in geology) tracks the version number of this user's record. Over time, messages to a user might be encrypted with different public keys as the recipient's username record changes. 

Public keys also let users send private, encrypted messages to one another. By appending the current `capa` to each message, the sender lets the recipient know which key to use to decrypt the message.

<a name="abcincryptoland"></a>
###Alice, Bob & Charlie in Cryptoland
Suppose Alice wants to send an encrypted message to Bob and Charlie. She first creates a puff out of the message she wants to send, with no encryption. We’ll call this the “letter”. It’s the same puff she would create if she intended to post her message publicly.

Alice then converts the letter from a JS object into a JSON string, and encrypts that string using a randomly generated 256-bit AES key. This is the “message key”. AES is a symmetric encryption protocol, so applying this same message key to the letter again will decrypt it.

Alice needs to encrypt this secret message key before sharing it, so Alice uses her private ECC key and Bob's public ECC key to generate a shared secret using ECDH. She then takes a SHA256 hash of this shared secret to generate a new 256-bit AES key. This AES key is used to encrypt the message key, so that Bob can later decrypt the message key and then use it to decrypt the letter.

Alice repeats the message key encryption procedure for Charlie, generating a new key from their shared secret and encrypting the message key with it. Then she packages the letter and the encrypted keys into a new puff which we’ll call the “envelope”. Once the envelope is complete, Alice signs the “envelope” puff, just like she signed the inner “letter” puff. Her signature allows Bob and Charlie to validate her identity, and serves as a unique identifier for her message. See the section on [signatures](#importanceofsig) above.

This procedure analogous to the lock boxes used to provide access to an apartment to several realtors. Each realtor has a separate lock box outside the building containing a key to the front door. In the case of EB, access to Alice's message is controlled by separate “lock boxes” for Bob and Charlie, which their respective private keys can unlock. Inside each box is a key to unlock the message.

<a name="anonymousmodeftw"></a>
###Breaking the chain with Anonymous Mode 
Alice's username is visible on the outer (envelope) puff, and the names of her recipients are visible next to the keys. EveryBit.js uses this information to route messages efficiently, so that users make network requests for just those private messages they can decrypt. The downside is that others can see that Alice has sent Bob and Charlie a message; she might want to keep this information private.

For an additional layer of privacy Alice can create a temporary anonymous user (see section on [special users](#specialusers)), and then have this anonymous user create the outer envelope. The letter inside is unchanged — it still has Alice’s normal username on it, and is still signed with her username’s private key via [ECDSA](http://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm) — so once Bob has decrypted the letter he can still tell it is from Alice. The envelope, however, has no features which point back to her.

Bob may need to reply to the message, and when he does there will be a record of Bob receiving a message from an anonymous user, and then Alice receiving a message from a different anonymous user. If she replies anonymously to Bob’s reply there will be another record of Bob receiving an anonymous message, and so on. Careful analysis may reveal a connection.

To prevent leaking additional information about their conversation, Alice can create a second anonymous user and put that username in the `replyTo` field of the letter. To indicate that she wants her conversation partners to reply anonymously, she sets the `replyAs` field to `anon`. Bob and Charlie then use this same method to reply to Alice’s anonymous address. The only information that leaks out to the network is that an anonymous message has been sent to Bob and Charlie. After that, every message in their conversation is from one-time anonymous users, to other one-time anonymous users. 

For large group conversations, addition precautions might be taken to hide the original list of recipients. More work needs to be done in this area, and to ensure that group anonymous messaging scales properly beyond dozens of users.

Note that nothing in EB prevents a user’s ISP from seeing the envelopes that a user sends, or which username records someone requests. This data could be used to attempt to guess at the participants in a conversation, especially if the recipients use the same ISP (or data is shared). An anonymous router like Tor could be used with EB if desired. Overall, the more encrypted messages a user sends and receives, and the more encrypted traffic in the network in general, the harder it would be to trace the users involved in conversations between anons.  

<a name="identityincloud"></a>
###Identity file in the cloud
If Alice sends a large number of messages in Anonymous Mode, tracking all of her anonymous aliases could be a challenge. To store these alias, and to provide secure storage for her general preferences, EveryBit.js uses an identity file that lives, encrypted, in the cloud. The identity file itself is an encrypted puff that only Alice can decrypt.

All content in the EB system is static, so whenever the identity file is changed, a completely new version is encrypted and published to the network. To ensure Alice always has the most recent version of her identity file, the signature of this puff is stored in her username record. Likewise, before publishing a new identity puff, the client application ensures that Alice isn’t overwriting a file that changed since the application began changing it. More work will need to be done on this front as it becomes more likely for a user to have multiple EB powered websites open and modifying preferences at once. The EveryBit.js roadmap includes developing a special puff of content type `diff` that could be used in a lightweight, low-conflict way to “update” the state of a chain of puffs.<sup>[9](#footnotes)</sup> 

The identity file contains a preferences block. This provides a powerful tool for shielding information from the services they use. In the old paradigm, websites like Facebook are entrusted (regardless of our actual level of trust towards them) with maintaining our settings. With EB, settings like “never share my status updates publicly”, “never open messages from user *badcharlie*”, or “notify me whenever *handsomerob* posts a new jpeg”, could be maintained, client-side, by the user. Note that this reverses the power dynamic and places a shield around a user’s private data. Just as hackers and malicious employees are blocked from Alice’s messages, they are also kept from preference information that might be equally revealing.

<a name="hedhelth"></a>
##Case study: HedHelth  ##
<img src="http://i.imgur.com/WQmkAmm.png" alt="HedHelth logo" height="300" align="right">

How do these pieces come together to help a specific developer build applications of the future? To see that, let’s imagine an entrant into the emerging field of “enlightenment tracking”. HedHelth (HH) is a band you wear on your forehead. It reads your brainwaves and tracks your levels of bliss throughout the day. (By 2020, the username *headhealth* had already been taken, so the company jumped on the next great trend in internet naming conventions and removed the second vowels.)

HedHelth uses EveryBit.js for user and data management. If a user already has an EB username (and by this date most people do), then HedHelth prompts them to create the subuser *.hedhelth*. So, for example, *alice* registers the username *alice.hedhelth* with a single click. As a convenience, the HH web app hides the subuser part under most circumstances, so that the process for Alice is seamless and she doesn't have to take on the burden of remembering another website identity. 

Using EveryBit.js, the stream of data from Alice's HH device is published in a sequence of encrypted puffs with `type` set equal to `EDF`<sup>[10](#footnotes)</sup>. By encrypting these puffs, Alice's private data is hidden from HH itself, a fact that the company uses to promote the security of it's device. Even if their servers get hacked, Alice's brain wave information is safe. Nor can HH be held liable for their failure to detect and report on evidence of criminal intent in Alice's data under the new Preventing Revealed Electroencephalographic Criminal Outlawed Propensities act. 

Some users may *want* to share their data — with friends, or in a public but anonymous way. Using EveryBit.js, HH maintains a Enlightenment Partners<sup>TM</sup> list for Bob in his Identity File. His `EDF` puffs are encrypted with keys for each of his partners. He can also send private messages to the group, and have multi-threaded discussion about their respective progress. For users who are willing to share their data anonymously, HH makes a single API call to create a random subuser like *.xh4532c* on the [shared top level user](#specialusers) *anon*. By sharing data in this way, Bob can get feedback about his brain waves without exposing his real identity. He can view his Enlightenment Rank<sup>TM</sup> and see how it compares to other anonymous users. 

HedHelth credits most of their growth to the community that grew up around this anonymous data. By publishing their data as puffs with a standard content type, any other developer or regular user can access the unencrypted data. Since everyone has access to the full "fire hose" of data, dozens of other tools sprung up around HH's service, like happiness visualizers and global sentiment analysis. 

After a few months, HedHelth began to see the kind of explosive growth all startups dream about. These growth spurts often come with financial and logistical pains, as companies are forced to scale up their servers, or else spend a fortune on outsourcing their infrastructure. If HedHelth had assumed sole responsibility for managing their user’s data, this growth could put them in a particularly vulnerable position, given the large amount of data each user generates. 

Fortunately, though, EB turns HedHelth's users into their cloud. Each additional user means HedHelth has access to more computational power and storage, not less. Even user's preference data, stored in their Identity Files, is managed completely on the client. HedHelth doesn’t have to worry about maintaining state on a multi-server database, nor do HH's servers need to run expensive queries to make sure the client receives the information it needs, filtered according to its wishes. The vast majority of the data flowing through the network is shared directly over the P2P layer. And because all of the content is static, HH can provide a low latency, high-availability backstop by storing a copy of all puffs to a generic CDN.

With the time and money they saved on infrastructure, server-side page-rendering, and database management, HedHealth focused on building a rich, beautiful dashboards for their users, and a fantastic GUI for managing users' Enlightenment Partners<sup>TM</sup>. They also had more money to spend improving the proprietary head band itself, which is a major source of their income.

As a secondary source of income, HH has been experimenting with doing complex, big data computations across their network of users. Using advances in holomorphic encryption, they are able to split huge tasks into slices of code that obscure their own functionality.

<a name="otherapplications"></a>
##Other applications
Going beyond the "HedHelth" example above, the combination of signed, chainable content and built-in cryptographic tools makes EveryBit.js the perfect library for building applications that require privacy, or ones that can be broken into a sequence of discrete publishing events. We've already built the secure messaging service [I.CX](https://i.cx) on EB. Here are a few other services that would be a good match for EB:

<a name="turnbasedgames"></a>
###Turn-based games
Developers could use EveryBit.js to manage the username system and ensure the integrity of multiplayer, turn-based strategy games. Each "move" in the system could be represented by an individual puff, with usernames corresponding to in-game identities. Since sub-users are cheap, easy to create, and hierarchal, players could generate an "army" of characters they control directly, or recruit other players to join their "tribe". By choosing EB, developers automatically get private communication between individual players and among all tribe members. If the moves themselves were conducted with public puffs, players and other developers could create macros and modules to automate moves and analyze the data.

<a name="mentalpoker"></a>
###Mental poker
Another possibility opened up by EveryBit.js is for distributed games that involve randomization and betting. For example, Mental Poker is a protocol that lets people shuffle and deal a virtual deck of cards without relying on a trusted dealer. The key ingredients needed to make Mental Poker work include an auditable chain of events that can't be edited, betting contracts that are indisputably signed by the players, and ways to encrypt information so that players commit to a particular shuffle by revealing a hash of the pattern, without giving away the actual shuffle itself. These can be implemented with EB using chained puffs, the username system, and encrypted inner puffs that induce unique outer signatures, respectively.  

<a name="publicforums"></a>
###Public forums
By using EveryBit.js as the foundation for a public forum, developers can leverage the built-in username system, standardized content formats, and flexible meta-data. They might solve the hard problem of flat-vs-threaded discussions by allowing each post to have multiple parents and multiple children, and use EB's built-in graph database to easily let users focus on and follow the sub-discussions that interest them, or view connections in a richly linked web of though. 

<a name="autonomousagents"></a>
###Autonomous bots, agents, and decentralized applications
Because puffs can be used both for content publishing, and to communicate authenticated commands (as in the user record update puffs), and because they are nestable (as in puff-ception), EveryBit.js is the perfect library  for autonomous bots or agents that publish content on a user's behalf, or perform tasks for them based on new incoming data. Imagine a decentralized version of [If This Then That](https://ifttt.com/) which takes action for you based on the content of new public or private puffs. Or imagine automatically wrapping and republishing certain puffs with additional meta-data, as a means of organizing and archiving data. 


<a name="philosophyofarchitecture"></a>
##Philosophy of architecture
As a platform which provides both the identity system and the data management layer for its host applications, EveryBit.js has to be robust enough to meet the needs those applications have — even novel needs that haven't yet been imagined. This requires exposing as much functionality as possible.

The platform also has to be easy to use. The majority of applications have a core set of basic requirements: create and manage users, post messages, process incoming messages, etc. These features require easy-to-use interfaces, but the features themselves are complex — each one requires several asynchronous network trips, cryptographic work (ideally off the main thread), data and cache management, updates to `localStorage` and so on.

Taken together, these requirements suggest the need for a multi-tiered API, which at every level presents the user with a small, orthogonal set of core primitives that can be composed into broader functionality. At the top-most level, broad features are composable into an application. Underneath that is another layer whose primitives combine to comprise the existing top-level features, but which could also be recombined to provide new top-level features. And so on, like peeling an onion.

A further requirement is for extensibility. Because EB's defaults won't be perfect for everyone's needs, we've built it so developers can augment or even replace portions of the platform. For example, while identity management is a core concern and the functions for it are used extensively both in application code and in the EveryBit platform itself, those functions are powered by a module that is injected as part of the platform bootup process. Plugging in a different identity module (for example, one based on biometric data), can be done with a simple configuration change. 

Another dimension of extensibility lies in the data structures and their interpretation. Adding support for a new type of puff is trivial for types with existing library support like markdown or [PGN](http://en.wikipedia.org/wiki/Portable_Game_Notation). The meaning of a puff's metadata fields are also determined by the application: tags, timestamps, location, language, copyright, and licensing information are just a few of the possibilities. 

This control over the meaning of the metadata becomes even more interesting when it's used to encode relationships, like one puff being a reply to another. Want to create a system for liking or upvoting content? Publish a new puff that points to the liked puff in its metadata. Could you build a system where a single message is related in different ways to multiple parents posts simultaneously? Absolutely. And you can embed those new relationships in our client-side graph database with a single line of code.

<a name="changingtheflow"></a>
##Changing the flow
<img src="http://i.imgur.com/fuoMr4W.gif" alt="Flow of content" width="350" align="right">
By creating an atomic unit of content with a single type, and opening up metadata to any conventions developers want to implement, both individually and by consensus, EveryBit.js represents a move towards a significant shift in relationships, flow, and structure.

In the legacy model, the cloud is both brain and layout engine. Web pages are created on high as fixed bundles of text and assorted multimedia content, then pushed down to the client's browser to be rendered as a static web pages. 

Under this new model, the cloud is a decentralized repository of well-structured content. The client can reach up into this cloud — whether it's a traditional server, a CDN, a JS P2P network, or all three — and request the specific content that matches its criteria. 

All of the "thinking" happens at the client level, protected by the privacy inherent in that device itself. The client decides what content to request, and no private data is ever sent naked over the network. For applications using EB, the relationships between end users are not embedded in, or dependent on, the applications they use. Instead, an application expresses and implements the user's desire to communicate in certain ways with certain people. While this limits a developers ability to lock-in users by walling off their content and connections, it frees them up to focus on creating feature-rich applications and on perfecting client-side interfaces.
 
By including a P2P wrapper around WebRTC, EveryBit.js can be used to turn every regular browser-based user in the system into a maintainer of the system. Instead of copying an existing model for what a social network should be, each application developer can build interfaces and tools intended to meet the needs of a select group of users, industry, or sub-culture.

<a name="thistimeisdifferent"></a>
##Why this time it's different
People have been trying to create decentralized versions of services like Facebook, Twitter, and DNS itself for many years. Here's why we think this time — and this project — really is different:

<a name="timeisright"></a>
###The time is right
All around, there are signs of people working to protect publishing freedoms, increase privacy, maintain access to content, and provide simplicity despite the growing number of logins and messaging buckets. Most of these are piecemeal, stopgap tools that address a single problem, like how to backup data from social networks (SocialSafe), combined inboxes for reading and posting (HootSuite), and provably secure storage (MaidSafe).

###The vision is right
Instead of building more specifics tools to plug individual gaps, EveryBit.js has broad tools to support secure communication and shared identity management, and isn't bound to any particular implementation. 

###The architecture is right
<a name="architectureisright"></a>
By making all content auditable, static, and stateless, by using signatures for content identification and identity validation, and by building a system that is modular, extensible, and content-agnostic, EveryBit.js reduces many of the hassles of building applications: managing users and communication, storing content, achieving scalability, and maintaining a secure database that includes up-to-date preference information for each user.     

###No installation required, for users or developers
<a name="namecoin"></a>
For end users, it just works. Right in the web browser, without having to download, install, or configure anything. All recent versions of common browsers are supported<sup>[11](#footnotes)</sup>. In part, this entire project springs from a developer's failed attempt to run Namecoin and register a username in the system. After many hours of configuring and compiling software, battling errors, looking for online help, downloading a dozen gigabytes of transaction data, and trying on two different computers, the system still didn't work. It just shouldn't be that hard. 

For web developers, the barrier to entry is near the absolute minimum. No database to configure, no unhelpful "500 Internal Server Error" messages to worry about, nothing to install on the server. 

<a name="therightcrypto"></a>
###The crypto is tried, tested, and audited
The Core crypto used by EveryBit.js is the same technology used by Bitcoin. For years now there has been a billion dollar plus incentive to break this encryption scheme. All of the vulnerabilities exposed so far have been related to peripheral issues like transaction malleability, and not the underlying signing routines. In late 2014, EveryBit.js underwent an extensive crypto-audit of its particular implementation by Bitcoinsultants Inc. 

<a name="internalnetworkeffects"></a>
###Internal network effects
As a broad, application agnostic platform, EveryBit.js allows developers to compete based on functionality, instead of how many users they've locked in. It creates an ecosystem where many different applications can fulfill the ecological niches in that system instead of being clumsily ruled by a single monoculture. These different applications share the same pool of potential users — no one application has to individually scale the network-effects hurdle imposed by proprietary systems like Facebook.

<a name="betterbusinessmodel"></a>
###The business model rewards good behavior
There are clear benefits to becoming an intermediary. Once an entity controls the flow of content, they can setup toll-booths, filter and sort the content in ways that maximize their business objectives. To ensure that our incentives depend only on the overall success of the platform, and not interfering with the relationship between app developers and end users, we've based our business model on the value of our initial collection of reserved usernames. This way our financial interests are aligned with the overall success of the ecosystem, and nothing else. Not advertising revenue, not subscriptions, not proprietary content or formats. Our boat rises if and only if the library itself is widely adopted by developers and end users. 


<a name="maintainingthenetwork"></a>
###A network maintenance scheme with a future
As the number of sites using EveryBit.js grows, and as we work on the challenges related to decentralized storage and delivery of content, we face the problem of how to provide incentives for users of the p2p network to continue to share their resources with the network. In some ways we get this for free, as developers who include EveryBit.js turn their clients into temporary nodes on the network. To encourage more persistent connections, we're working on a system that relies on ["Proof of Presence"](#proofofpresence) to reward available nodes and ensure consensus among unranked peers. 


###It's open source and open to your contributions
EveryBit.js is an open source project, written in a language web developers are intimately familiar with. Our repository is on Github, and we love pull requests. Although not everyone loves JavaScript, it seems clear that some evolved version of it will become the [central language of the future](https://www.destroyallsoftware.com/talks/the-birth-and-death-of-javascript). 


<a name="joinordie"><a/>
##A “Join or Die” moment
EveryBit.js embodies a radically different direction from the one currently being pushed by tech giants and governments. We are convinced this direction is not only possible, but inevitable, so long as we work together to make it happen. The bridge to this future lies in working within the existing system, carving out spaces for more user control and privacy inside existing walled gardens, and creating ways for users to easily move their content and relationships in and out of them. Bridge (tunnel?) applications might include a plugin to let users combine the encryption capabilities of EB with the ease of use of Dropbox, an app to let users send truly private messages within Facebook, or a service that converts all of your tweets to puffs, so they can be used by anyone who builds an alternative service.


We may be at a different kind of Join or Die moment than the one alluded to by Benjamin Franklin at the beginning of this paper. The oligarchy of publishing giants are quickly becoming entrenched. Those few independent developers that do succeed on a large scale are generally absorbed by acquisition, further expanding the giant's reach. 

Competition will have to come from a joining of forces to route around tech giants. Beyond this we will also have to work with them. The road to the future we have outlined includes a place for the existing services. EveryBit.js is designed to bridge this gap, but we will have to build the bridges. These could take the form of plugins that automatically wrap content in an encrypted puff before backing up to a cloud drive, so that users can take advantage of the great user interface provided by dropbox without exposing their content to that service's employees. Or it could be a single app that lets you send and receive fully private messages via any of your existing social media accounts.

It’s getting harder and harder for small developers to compete, but working together we can shape the future in a way that favors all of us. 



















<a name="appendix"></a>
#Appendix

<a name="puffstructure"></a>
##Additional Puff Notes
Extra payload properties:
Currently any valid JavaScript key and value will validate, though individual client applications may place restrictions on key length, key characters, value length, or other characteristics of the value. Since puffs are converted to JSON strings during transmission, only JSONifiable values are valid within a puff: strings, numbers, objects, array, booleans and null. 

There are no rules about the other fields which can be included in payload, other than technical limitations to how they are specified (keys must be alphanumeric and less than 128 characters, values must be storable in JSON format).

The version field corresponds to the version of the specification used by the puff. Right now the current version is 0.4.X. Until version 1.0 is reached, there may be changes to the structure of a puff. However, by specifying a version with each puff, it should be easier to deal with backward and forward compatibility issues. 

In order to re-publish someone else's content, the entire puff is bundled up and put into the content field of the new puff, with type specified as "puff". 

<a name="ordermatters"></a>
##The importance of ordering
The JS specifications state that an object is an unordered collection of properties. This means the order of traversal of the keys of an object may vary between browsers. Additionally, two otherwise identical objects may have different property orderings even within the same browser. When those objects are serialized their string forms will not be identical even though the objects are value-wise equivalent. Their signatures won't match and they won't validate properly.

Fortunately, all modern browsers order the keys of freshly created objects the same way (so long as they don't include  numeric keys). By creating a fresh object, EveryBit.js sidesteps these issues, and also prevents any clumsily added decoration properties from blocking validation.

<a name="decentralizingusernames"></a>
###Decentralizing the username system
At present, updates to username records must be performed using a single API access point at https://<span>i</span>.cx/api/users/api.php. 

Although not yet fully distributed, the username system has been built from the beginning with the needs of decentralization and trustless consensus in mind. No private data is stored in username records, so the records can be held in a distributed way by all participants in the system, without worry about who has access to the data. The initial reservation of a username still requires authorization from an initial provider, but because all key update requests need to be signed by the current owner of the username, and because every key change results in a new record, all changes can verified back to the original registration. 

As an intentional side effect, there's no mechanism within the system to deprecate or transfer ownership of a username with access to the appropriate private key. This provides a layer of protection against censorship or attempts for actors to "gang up" and steal a username by faking consensus; so long as the "genesis" registrations is considered valid, all changes thereafter can be independently verified. Any attempts to forcibly compel a user to relinquish their username would to be extrinsic to the EveryBit.js system.

Another side effect of this system is that no central authority can recover lost keys. The benefit of this arrangement is no one can access a username (and, importantly, all private communication sent to that username) without guessing the private key. No back door exists. The downside is that lost keys mean lost usernames. EveryBit.js mitigates against this happening by providing [different levels of keys](#usernamesystem), so that the `rootKey` can be kept as secure as possible and used only in case the others are lost or compromised. The possible loss of keys also motivates the only requirement to maintain ownership of a name: a user must publish content (or update a key) once every 12 months. This way, usernames with lost keys, or no longer in use for any other reason, are deprecated and become available to register again. 

<a name="displaynames"></a>
###Display names
By limiting username characters strictly to lowercase letters and numbers (plus the "." to separate sub-users), EveryBit.js avoids confusion between names that are highly similar. This decision is informed by the experience of forums, where look-alike accounts have been sources of confusion or attempted identity fraud. Sometimes a single popular of famous *username* can spawn a dozen knock-offs like *user-name*, *Username*, *user_name*, and *_username*. The introduction of international characters into domain names has made the situation even worse, as for example a bank domain could faked using Cyrillic characters that look almost identical.<sup>[12](#footnotes) 

To allow users more flexibility in how their usernames display, without reducing security or increasing confusion, we recommend the use of "display names". These are variations on a username that can be converted into a valid username by removing invalid characters and converting all letters to lowercase. So user "johndoe" could set their display name to "John Doe" or johnDoe or "john_DOE!" but not "Johnny Doe", since that display name corresponds to the username "johnnydoe". An example of the use of display names can be seen in how the recipient is show for [I.CX's embeddable contact form](https://i.cx/?icx.screen=formCreator).
 
<a name="specialusers"></a>
###Special users
The EveryBit.js system includes a few special usernames.

Any username that ends with the subuser *.local* is prevented from sending information out over the network. 

The username *anon* has a shared admin key, which allows anyone who wants to create a subuser to do so.

An additional username, *example*, is being created with a set of provably unknowable private keys. By setting the public key for this user to the very first (alphabetical) key to pass the checksum for a valid key, we are in effect demonstrating that don't know the corresponding private key, since guessing it would be as hard as guessing the private key to any public key. Thus *example* can be used to send encrypted test messages that only the sender can see. 

<a name="keysnotpasswords"></a>
###Keys not passwords
Passwords have been decried for years by security researchers as fundamentally flawed, and there's a growing demand for something better. Users, however, have grown comfortable with passwords, despite their flaws. So why take on the extra burden of moving to a public key system?

Passwords require a trusted third party, someone who receives your password over the network and then allows you to perform actions based on its validity. This third party vouches that the messages you send are authentic.

In a decentralized, distributed system there is no central trusted third party, so we need a new method of verifying authenticity. Rather than having to send your identifying information over the network before being allowed to communicate with others, you sign your own messages with an unforgeable signature, right in the browser.

There are many benefits to this approach: no third party can read (and possibly leak) your private data, a reader of a message can tell if it has been altered, messages gain an aspect of non-repudiation, and many others — innovative ways to use public key systems to perform otherwise impossible tasks are being conceived of almost every day.

All public key systems have to strike a balance between keeping keys secure, and allowing them to be used. The EveryBit.js approach of splitting authority among three different keys provides more flexibility in achieving both availability and confidentiality, but at the cost of added complexity. Developers can use EB to manage keys on behalf of users, but there are still limitations on how much these trade-offs can be mitigated.  

Right now there is a large effort to solve the problems of key management, and EB is poised to take advantage of any promising innovations in this space <sup>[8](#footnotes)</sup>.


<a name="immutability"></a>
##How I learned to stop worrying and love immutability
Because of how puffs are constructed and chained, there is no way to edit a single puff without changing its id (signature), and disrupting the chain of content published thereafter. This is an intentional design decision. Here's why we do it this way:

When user replies to content and embeds this parent puff's id in the new puff's parents array, they can be assured that so long as the puff they replied to still exists, it will not change (it's immutable). This creates an official, digitally signed conversation between the parties (that may be public or private). No party can claim to have written something they didn't, or change their words to make another user look bad. Because all discussion is contextual, we intentionally break all incoming connections to that user's more recent puffs as well. 

This is an extreme thing to do, but we believe that the integrity of the system depends on it. We wish to encourage a culture where changing the content of a puff (especially one that has been around for a while and has generated a significant number of replies), is considered an extreme thing to do. 

We wish to extend the cultural norms established by bloggers who pioneered the use of strikethrough to show that they edited a document for accuracy, usually based on feedback from others, and to fostering a culture of honesty and integrity in communication. Everyone makes mistakes, and we've found that there is a generally high level of tolerance to these. To encourage users to amend previous puffs instead of deleting and re-creating them, replies by the original author should be shown first. This way, the original poster can post a reply amending their previous puff and know that this reply won't get buried by a torrent of angry replies that pick up on a mistake or omission. 

Another way to mitigate the need to break your full content history just to correct a "bad" puff is to use different sub-users for different purposes. For example, if you create a EveryBit-enabled toaster that sends out a new puff any time the toaster leavin's are ready for harvesting, you could set up .username.toaster, or even .username.toaster.leavins, to publish these notifications. That way, if your toaster goes rogue and begins broadcasting bad information, you can roll back its chain of content without affecting your other streams of content. 

Once the EveryBit platform is fully implemented, we imagine that developers will create tools to implement some kind of version control system with content merging (so that you could publish a "diff" puff to update a previous one). We encourage such development, so long as it's build upon an understanding of EveryBit's core strengths.




<a name="proofofpresence"></a>
##Proof of presence
Because they lack a single trusted authority, all decentralized networks need to solve the problem of consensus. So far, most of the approaches involve "mining": nodes on the system compete to solve computationally complex problems. The idea is that so long as no single entity controls more than half of the total computing power, there's no way to successfully "fork" the shared ledger. The success of Bitcoin shows that mining can be an effective way to establish consensus, but it also has significant downsides: it consumes vast amounts of energy in doing otherwise pointless computations, the single shared ledger scales poorly, and it requires specific dedicated hardware and pooling, which turns mining into a niche activity and risks centralization. These problems are well known, and newer cryptocurrencies have proposed tweaking mining to address some of these. 

We suggest a different approach, in which the desired behavior (persistence of working nodes on the network) is rewarded directly. We call our system Proof of Presence, and it addresses the problem of creating consensus in a decentralized context by requiring that each participant maintain a chain of partial snapshots of the state of the system, taken at regular intervals. 

The proposed mechanism for achieving consensus with EveryBit.js is **Proof of Presence** (PoP). To see how the username system, puffs, and even an advanced application (like a crypto-currency) can use PoP to transition from a trusted "genesis" condition to trustless consensus, we'll describe how a leaderless group of partiers could agree on a historical account of each party. If you're wondering about the technical implementation, imagine that all of the record keeping is done using [bloom filters](http://billmill.org/bloomfilter-tutorial/) and chained, signed puffs.  

###Crypto at the masquerade ball  
Let's imagine we want to throw an ongoing series of parties. For the first one, we'll start with a list of invited guests that everyone in our group can agree to. In the early stages, no one new will be invited to future parties. We want to encourage everyone to come to every party, so if someone misses a party, they're out and can no longer join in the fun.

Unlike most parties that have an authoritative host who decides who does (and doesn't) belong at each party, we want to find a way for the guests to police each other. Here's how we do it: 

At each party, each guest has to find everyone who shares a birth month with them, and take a photo of that person. Everyone bring their photos to the next party. If someone shows up who was born in May, but none of the other May's have a photo of them, then this person is kicked out of the party. If only one of the May's has a photo of this mystery guest, then the person who took this photo is treated like a cheater who is trying to sneak a friend into the parties, and they themselves are barred from coming to any more parties. 

This is the core idea behind PoP. In this basic form it's not very secure or robust, so let's *enhance*! 

<a name="preventingcollusion"></a>
###Preventing collusion, punishing malfeasants
As you might imagine, over time the group of May's might get chummy and begin to collude with each other to miss parties or sneak in additional guests. To minimize this risk, we change the rules slightly with each new gathering. For one party you might be taking photos of people who were born on the same day of the month as yourself, the next party it might be people with the same number of brothers and sisters. 

In order to mix things up even more, we can begin to generate the groups based on the outcome of an unpredictable function. For example, we could ask every guest to write down a number on a piece of paper and put it into a fish bowl at the beginning of the party. Then we add up all those numbers to get a total. If we have a pre-determined set of 100 rules for forming groups, we divide our sum by 100 and look at the remainder. If our remainder is 25, then we use the 25th (starting our count at 0) rule to split up groups at that particular party. 

Because everyone keeps track of the rules for every past party, before I include someone in my photo, I make sure that everyone who *should* have taken a photo of this person at the previous party really did (ie, I conform that this person really attended the last party). I also look at the photos that this person *took* at the last party, to make sure they didn't take any photos of otherwise unknown guests. 

To make things even more secure, we can come up with a different rule of who to photograph for on a guest-by-guest basis, then randomly shuffle those rules for each new party. At this point we've made colluding to sneak in a new guest, or skipping a party, almost impossible, because everyone is always taking photos of a different group of people, because we don't know in advance who they will be, and because these people might or might not be photographing you back.

<a name="growingtheparty"></a>
###Bringing in anonymity, growing the party
We've now eliminated all easy ways to cheat, but our party has started to feel less fun. Let's make it a masquerade ball! 

We no longer require that the same person show up at every event, now we're only concerned that the same set of masks shows up every night. To do this, we reboot our ongoing parties with a fresh list of invited guests, and give each one a special mask that can only be unlocked if the wearer has the right key. Let's also assume there's a way for guests to prove that they control the key without showing it off, just like I can demonstrate my ability to open a padlock while keeping the key itself hidden under a piece of cloth. 

At this point each guest is taking snapshots of a subset of the masks, based on a randomly chosen rule that is unique to the mask they are wearing. To ensure that the other masks haven't been skipping parties, each guest looks up the photo-taking rules for the previous party, then makes sure that the mask they are about to photograph appears in all of the the records it was supposed to. If not, they flag it as "invalid".

We no longer have to worry about someone sneaking in with a new mask, since everyone has a photo of the original masks (the "genesis" collection). However, we have a different problem to watch out for: duplicate masks. It turns out that copying someone else's mask is easy. Fortunately, only the person with access to the original key can open the lock. So we ask everyone we're photographing to prove they can open the lock (though to keep things interesting, we don't make them actually take off the mask). Anyone who can't open the lock is thrown out of the party, counterfeit mask and all. If both identical masks can be opened, then the owner of the key is the culprit. They are guilty of a "double spend". Both identical masks are flagged as invalid, and are never allowed to show up at the party again. 

At this point our party has gotten so entertaining that some guests are staying straight through from one party to the next. We don't want to be rude and kick people out, but at the same time if the same person always wears the same mask, the masquerade becomes more of a charade. To keep that from happening, we set aside a window of time every day when everyone has to leave, so when they come back we no longer know if the same person is wearing the same mask. 

Turns out that every lock looks different depending on its key (though we can't figure out the shape of the key based on the shape of the lock). So we are able to add one more requirement: during the transition period, every mask has to have the old lock taken off, and a new one put on. Why? We've noticed that masks have become a hot commodity, and people are buying and selling them on a regular basis. Usually, the only time a new lock appears on a mask is when it shows up on a new guest; returning guests aren't bothering to change their locks. This gives us a hint as to which people keep wearing the same mask over and over. By forcing every mask to have a new lock every day, the history of every (valid) mask shows daily changes, and we no longer have a way to tell something about the guest based on when and how often their mask changed locks. 

Suppose we want our party to grow over time, or at least not shrink as guests occasionally lose the keys to their masks, or get buried by a falling chandelier. In that case, we could come up with a lottery system that permits a few randomly chosen masks to duplicate during the transition period between parties. Or we might allow every mask to clone itself once every thousand parties. 

At this point we have everything we need (conceptually) to turn our masks into a fully fledged, secure, completely anonymous digital currency.


<a name="footnotes"></a>
#Footnotes

1. [Join, or Die](http://en.wikipedia.org/wiki/Join,_or_Die) 	
2. [Twitter manipulates newsfeeds to benefit paying customers](https://biz.twitter.com/en-gb/products/promoted-tweets) 
3. [Is Facebook Making You Pay to Show Up in the Newsfeed?](http://www.themoderntog.com/facebook-promote-button-newsfeed-truth)
4. [Feds Seized Hip-Hop Site for a Year, Waiting for Proof of Infringement](http://www.wired.com/2012/05/weak-evidence-seizure/) 
[Verisign seizes .com domain registered via foreign Registrar on behalf of US Authorities](http://blog.easydns.org/2012/02/29/verisign-seizes-com-domain-registered-via-foreign-registrar-on-behalf-of-us-authorities/)
5. [Are You Suffering from Social Media Fatigue Syndrome?](http://technologytherapy.com/social-media-how-tos/suffering-social-media-fatigue-syndrome/)
6. See "What Technology Wants" by Kevin Kelly for an in-depth look a the long history of simultaneous discoveries and inventions. 
7. Signatures are approximately 80 characters long and written in base 58. This gives a total language size on the order of 58^80. Collisions aren't expected until roughly the square root this, or 58^40, a number similar to some estimates for the number of atoms in the universe.
8. EveryBit.js uses the same Elliptic Curve Cryptography (ECC) as Bitcoin. A search for "Bitcoin hardware wallet" will result in a number of devices which support the offline storage of private keys.
9. EveryBit.js developer Matt Asher has proposed the following variation on Zawinski's law: over time, every application will expand to include some form of version control
10. [European Data Format](http://en.wikipedia.org/wiki/European_Data_Format)
11. Full support for all EveryBit.js functionality in Firefox, Chrome, and Android. Internet Explorer and Safari do not yet support WebRTC, so EB gets all content from a server, instead of using P2P. Safari doesn't support downloads of files generated client side, which means these users can't view decrypted files unless they are of a recognized type, like jpeg.  
12. See http://en.wikipedia.org/wiki/IDN_homograph_attack

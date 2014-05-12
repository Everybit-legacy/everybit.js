![logo](https://raw.githubusercontent.com/puffball/puffball/master/graphics.png)

Right now, most individual publishing on the internet happens through a small number of gatekeepers. These institutions control what we can and can't publish, and how this content is filtered and displayed to others. These same gatekeepers maintain our identities and our networks, encouraging us to friend or follow others based on hidden algorithms which align with their own economic incentives. 

There are ways to opt-out of this system, ways to manage our own content and identities directly. So far, though, these systems have been application specific, each tool addressing a specific need. And they are challenging to use, often needing to be configured and compiled from the command line. 

The goal of puffball.io is to create a decentralized publishing platform. One that makes it easy to self-publish, then share content with others on the network or through legacy social media websites. The puffball platform will provide an open system to let users manage their identities without the need for a trusted third party. It will let people encrypt private data for themselves and for others, just as easily as they post messages to a forum. 

### The heart of the system
The core of the puffball platform consists of a **username table** managed using private keys, individual **chains of content** for each user, and a couple **special blocks** of content for user preferences and profile information. 

<a name='usernames'></a>
#### **Usernames** 
Every username has an entry in a Distriburated Hash Table (DHT). Entries contains the following fields:

- **username**
- **rootKey**
- **adminKey**
- **defaultKey**
- **latest**
- **updated**

Usernames are formed with a string of alphanumeric characters. Once a username is created, it is permanently owned by whoever controls the private keys, subject only to the requirement that the user publish at least one piece of content per year. The **updated** field stores the date of the most recent update to the username record. Anytime new content is created, the user updates the **latest** field to point to their most recent content. 

The owner of a username controls their sub-user space as well. For example, user *.foo* can create sub-users *.foo.bar* and *.foo.fighters*. There are several layers of keys in the record. New content is signed using the private key related to the **defaultKey**. The signature of a puff is checked against this same key to make sure it's a valid signature for that user. In order to add or modify a sub-user, the owner creates an update request and signs it with the private key related to their **adminKey**. The only way to change the **adminKey** or **rootKey** is to sign a message with the private key related to the **rootKey**. This is like a master key, and should be stored with the highest level of security. Cold storage is recommended. The default puffball client makes it easy to view QR codes for each of the private keys.

**IMPORTANT**: All signing of content and update messages happens on the client-side. Private keys should *never* be sent to a server. 

For more about usernames, see the [Username rollout](#usernameRollout) section below.

#### **Puff**
The main unit of content in the puffball platform is called a **puff**.  It is structured as follows (required fields are indicated with an asterisk):

- **username**<sup>*</sup> 
- **zones**
- **sig**<sup>*</sup>
- **previous**<sup>*</sup>
- **version**<sup>*</sup>
- **payload**
  - **type**<sup>*</sup>
  - **content**<sup>*</sup>
  - **tags**
  - **time**
  - **parents**
  - **author**
  - **title**
  - **geo**
  - **copyright**


The identity of the person who created this puff is stored in **username**. The **zones** field serves to identify the intended recipients (if any) or to indicate that a puff is related to another user. It works like the @ sign in twitter.

Every piece of content has a unique id stored in the **sig** field. To generate this id, a user combines all of the fields of a puff (except the **sig** itself!) into a string and signs it using their private key. This signature serves as proof that the content really was created by the **username** listed.  Because the chance of a collision (two different puffs containing the same signature) is essentially zero, there's no way for a user to flood the system with multiple copies of the same content with different ids, unless they create a new username for each copy. 

**previous** stores the signature of the most recently published content by this user, prior to this puff. To obtain **previous**, the system checks the **latest** filed of the username table. After reading **latest**, it updates this field to contain the **sig** of the newly generated puff. The **previous** field, along with **latest** in the username table, creates a chain of content with that user's complete, official history of shared content. By default, the puffball client stores every puff created by every username managed by that computer, and makes it easy to export complete chains of content.

Note that uniting the id and signature means that *a puff cannot be edited*, only re-created with modified content and a *new id*. Chaining the users' content together with ids means that in order to edit a previous puff, all of the user's more recent puffs will have to be rebuilt as well. This is either a feature or a bug, depending on your perspective. See the section [How I learned to stop worrying and love immutability](#immutability) for more about this . 

The **version** field corresponds to the version of the specification used by the puff. Right now the current version is 0.1. Until version 1.0 is reached, there may be changes to the structure of a puff. However, by specifying a version with each puff, it should be easier to deal with backward and forward compatibility issues.

The **payload** section of a puff contains the actual content, and meta-data about that content. The only two required fields are **type** and **content**. The others fields may or may not exist, and are subject to *conventions* about what they contain, instead of being specified directly. **type** is the same as the MIME type sent in HTTP headers. A single puff *can only have one content type*. This is vital part of the puffball platform -- it allows developers to treat each piece of content in the system as an atomic unit, and build a newer, much more powerful generation of RSS-like readers and search engines, ones which facilitate fine-grained aggregation (eg. Show me the MP3's posted by *.bach*, any image from *.ansel*, and just the [PGN](http://en.wikipedia.org/wiki/Portable_Game_Notation)'s created by *.fischer* (but none of his annoying text posts!). For information on how to include multimedia elements in a puff, see the section on [Multicontent](#multicontent).

The **content** field, unsurprisingly, contains the main content of the puff. On the back end, this is stored in JSON format as a string. 

There are no rules about the other fields which can be included in payload, other than technical limitations to how they are specified (keys must be alphanumeric and less than 128 characters, values must be storable in JSON format). One optional field of note is **parents**, which used by the [FreeBeer!](http://www.freebeer.com) forum to store an array of the posts being replyed to.

In order to re-publish someone else's content, the entire puff is bundled up and put into into the **content** field of the new puff, with **type** specified as "puff".

#### **Profile and preferences**
Every username has two special blocks of content associated with it. Both of them contain arbitrary key/value pairs related to that user. The **profile** block is for (generally public) information the user wishes to share about themselves. It could contain a field for their avatar or photo, information about where they work or how to contact them. The **preferences** block contains key/value pairs that could be useful for websites in determining how to display content for this user. These may be public or they could be encrypted using the public key of the user (**zone**) they wish to share the information with. For example, you may want to let the *.freecats* forum know that you wish to block user *.ocelot*, without anyone else (including user *.ocelot*) seeing this.

### Design principles
The design of the puffball platform is driven by the following core beliefs:

- Whenever possible, make decisions a convention and not a rule.
- Provide good default values, then allow for customizability.
- The client is king. Everything that can be done client-side, should be done client-side.
- Separate content from interpretation.
- Make it easy, beautiful, intuitive and fun.
- Make it as secure and private as users want it to be.
- Make it seem inevitable (because it is).

<a name='multicontent'></a>
### Multicontent
By convention, external dependencies should *not* be introduced into a puff. So if the **type** is HTML, then all JavaScript and CSS should be included directly in the content. Images can be included inline using the data:image/png specification.

<a name='immutability'></a>
### How I learned to stop worrying and love immutability
Because of how puffs are constructed and chained, there is no way to edit a single puff without changing its id (signature), and disrupting the chain of content published thereafter. This is an intentional design decision. Here's why we do it this way:

When user replies to content, and embeds this parent puff's id in their **parents** array, they can be assured that so long as the puff they replied to still exists, it will not change (it's *immutable*). This creates an official, digitally signed conversation between the parties (that may be public or private). No party can claim to have written something they didn't, or change their words to make another user look bad. Because all discussion is contextual, we intentionally break all incoming connections to that users' more recent puffs as well. 

This is an extreme thing to do, but we believe that the integrity of the system depends on it. We wish to encourage a culture where changing the content of a puff (especially on that has been around for a while and has generated a significant number of replies), is considered an extreme thing to do. 

We wish to extend the cultural norms established by bloggers who pioneered the use of <strike>strikethrough</strike> to show that they edited a document for accuracy, usually based on feedback from others, and to fostering a culture of honesty and integrity in communication. Everyone makes mistakes, and we've found that there is a generally high level of tolerance to these. To encourage users to amend previous puffs instead of deleting and re-creating them, the default client shows all replies by the original author first. This way, the "OP" can post a reply amending their previous puff and know that this reply won't get burried by a torrent of angry replies that pick up on a mistake or omission. 

In order to reduce the need to go back and edit previous puffs, the default puffball client presents users with a "countdown to live", during which time they can rethink, revise or abort publication. The countdown length can be set using their preferences block, and can be overridden at any time to publish immediately. 

Another way to mitigate the need to break your full content history just to correct a "bad" puff, is to use different sub-usernames for different purposes. For example, if you create a puffball-enabled toaster that sends out a new puff any time the toaster leavin's are ready for harvesting, you could setup *.username.toaster*, or even *.username.toaster.leavins*, to publish these notifications. That way, if your toaster goes rogue and begins broadcasting bad information, you can roll back its chain of content without affecting your other streams of content. 

Once the puffball platform is fully implemented, we imagine that developers will create tools to implement some kind of version control system with content merging (so that you could publish a "diff" puff to update a previous one). We encourage such development, so long as it's build upon an understaning of puffball's core strengths. See the section [What isn't puffball?](#whatIsntPuffball) below.

<a name='usernameRollout'></a>
### Username rollout
Creating a stable, reliable, secure, decentralized, authoritative database of usernames is a major challenge. There are several other projects which have attempted to do this. These tend to rely on extensive libraries of C code, compiled to run as stand alone, persistent nodes on the interet. Some schemes require that every node maintain a large (GB size) cryptographic ledger or require mining to maintain the system. 

For the puffball platform, we face the additional challenge of implementing the system in a peer-to-peer way right over the browser. Given the scope of the problem, and the need for a high-level of availability and integrity from the very beginning, we've decided on a controlled rollout with the goal of full decentralization in 12 months. The final details of the rollout have not yet been finalized, and usernames may be tied in to the revenue model and/or embedded currency (see the section on [Mycelium](#mycelium) below). 

At present, any user can instanly create a new username consisting of 32 randomly generated alphanumeric characters. Our next step is to allow users to register their existing usernames from other websites, systems, and domain names. We intend to support twitter, openID, diaspora, facebook, linkedIn, com/net/org domains, and dot bit. The order and length of these "sunrise" periods is yet to be determined. 

Regardless of the final rollout scheme, once a username is registered it belongs irrevocably to that user (subject only to the requirement that the username record is updated once per year). Usernames within the puffball system are not company names, trademarks, or domain names, and there are no mechanisms to forcibly transfer from one party to another, which can only happen by signing the record over to a new public key, using a message signed by the current private key. Any redress of grievances related to the use of a particular username would have to be done extrinsically to puffball.

<a name='whatIsntPuffball'></a>
### What isn't puffball?
puffball is a platform for publishing and distributing static documents of a single content type, along with unrestricted meta-data about that content. Although it has capabilities which overlap other technologies, and while it might be a good foundation for building these other tools, it is not a wiki, blogging software, or a social network. And while it makes sharing content easy, bandwidth and memory limitations inherent in any client-side peer-to-peer application mean that at present puffball is a bad choice for publishing videos or similarly large files. 

### FreeBeer!
What good is a platform without any applications? Not much, which is why we are building a sample application on top of the puffball platform to show off some of its capabilities. FreeBeer! is a multi-threaded forum where every post can have multiple parents, and multiple children. Have you ever been frustrated by the ratio of noise to signal in an online forum, discussion board, or comments section? Have you ever wanted to follow just one sub-discussion instead of wading through dozens of posts that don't interest you? FreeBeer! provides a unique interface to read and reply to posts that allows you to quickly identify threads and sub-threads that interest you, and ignore the rest. 

<a name='mycelium'></a>
### Mycelium 
As a second sample application, and to show off the platform's power for creating innovative structures, we are implementing an embedded crypto-currency, the very first one to rely on **proof of presence**. This currency exists as a special kind of puff. The smallest unit of Mycelium is called a **spore**. As opposed to other digital currencies like Bitcoin, there is no ledger of transactions. Each spore is an atomic unit of the currency. It maintains it's own record of state, as well as capturing information about its fellow spores. In this way, every spore's record gives a partial-snapshot of other valid spores, and enforces the system's rules. 

### How to get involved
Still interested? puffball is an open source project. We welcome your involvement. You can:

- Help code (as a volunteer, or [ask about paid positions](mailto:&#105;&#110;&#102;&#111;&#064;&#112;&#117;&#102;&#102;&#098;&#097;&#108;&#108;&#046;&#105;&#111;?subject=jobs))
- Help us dog-food the platform by using the [test site at FreeBeer!](http://www.freebeer.com)
- [Make suggestions](mailto:&#105;&#110;&#102;&#111;&#064;&#112;&#117;&#102;&#102;&#098;&#097;&#108;&#108;&#046;&#105;&#111;?subject=feedback)
- Port over your username from another system
- Build an application on top of the puffball platform. Have a good idea but need funding? [We can help](mailto:&#105;&#110;&#102;&#111;&#064;&#112;&#117;&#102;&#102;&#098;&#097;&#108;&#108;&#046;&#105;&#111;?subject=developers).


### Contributors' guide
If you want to contribute to the codebase here at gihub, please [check the issues](https://github.com/puffball/freebeer/issues?state=open) and/or post a question here before making any changes. This will help avoid duplicate efforts. Happy coding :-)

Please don't edit files on the Master repository. Create a Branch or a Fork. This will help avoid collisions and prevent defects from being introduced from merges and pull requests.

Feature requests, questions, bugs:
https://github.com/puffball/freebeer/issues

Coding standards and guidelines:
https://github.com/puffball/freebeer/tree/master/non-production

License: [MIT](http://opensource.org/licenses/MIT)

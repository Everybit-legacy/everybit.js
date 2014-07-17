var Translate = {};
Translate.language = {};

Translate.language["en"] = new Polyglot({locale:"en"});
Translate.language["en"].extend({
	dropdownDisplay: 'English'
});
Translate.language["en"].extend({
	alert: {
		noUserSet: "You will need to set your identity first"
	},
	menu: {
		view: {
			title: 'View',
			roots: "Conversation starters",
			faq: "Puffball FAQ",
			latest: "Latest puffs",
			collection: 'Choices collection',
			shortcut: "Keyboard shortcuts",
			showMine: 'Show my puffs',
            showpuffs:"Show puffs for me"
		},
		filters: {
			title: 'Filter',
			tags: 'Tag',
			routes: 'Route',
			users: 'Username'
		},
        preferences: {
            title: "Preferences",
			relationship: "Show relationships",
			animation: "Show animations",
			infobar: "Show information bars",
			language: "Language"
        },
		publish: {
			title: 'Publish',
			newPuff: "New puff"
		},
		identity: {
			title: 'Identity',
			current: 'Current',
			none: 'None',
			username: 'Username',
			private: 'Private Keys',
			public: 'Public Keys',
			default: 'default',
			admin: 'admin',
			root: 'root',
			newIdentity: {
				title: 'New Identity',
				msg: 'Desired username',
				generate: 'Generate',
				or: 'or',
				errorMissing: 'You must set all of your public keys before making a registration request.',
				success: 'Success!',
				submit: 'Submit request',
				importContent: 'Import Content'
			},
			editIdentity: {
				title: 'View Identity',
				msg: 'Stored keys for'
			},
			setIdentity: {
				title: 'Set Identity',
				msg: 'Use this area to store keys with this browser. To publish content, set only your default key.'
			},
            step: {
                title: 'Step %{n}',
                next: 'next',
                back: 'back',
                select:'Select a new username ',
                import:'Or, import from ',
                generate:'Generate keys for %{username}',
                remember:'Remember to save your keys!',
                request:'Requested username '
            }
		},
		about: {
			title: 'ABOUT',
			code: 'Source code'
		},
		tools: {
			title: 'ADVANCED TOOLS',
			builder: "Puff builder"
		},
        tooltip:{
            roots:'View latest conversation starters',
            latest:'View latest published puffs',
            collection:'View the Choices Collection',
            shortcut:'View a list of shortcuts for this website',
            showPuffs:'View puffs that were sent to me',
            showMine: 'View puffs that were sent by me',
            relationship:'Display/hide relationships between puffs',
            animation:'Enable/disable animations',
            infobar:'Display/hide the information bars for each puff',
            setIdentity: 'Store your private keys',
            editIdentity: 'View stored keys for current identity',
            newIdentity: 'Create a new identity',
			generate: 'randomly generate new username',
            newPuff:'Create a new puff',
            code:'View source code on GitHub',
            puffBuilder:'Show the puff builder',
            tagsFilter: 'Show puffs with this tag',
            routesFilter: 'Show puffs for this user',
            routeErase: 'Unselect the route',
            usersFilter: 'Show puffs from this user',
            userErase: 'Unselect the user',
            currentDelete:'To delete this user from the browser',
            flagLink: 'Flag for removal. If you created this puff, this will send out a request to the network to remove it.',
            viewImage: 'View large',
            parent:'Show the parents of this puff',
            children:'Show the children of this puff',
            reply:'Reply to this puff',
            seeMore:'Show more options',
            viewRaw:'Show the raw code of this puff',
            json:'Show the JSON string of this puff',
            permaLink:'Permalink to this puff',
            expand: 'Expand puff to one row',
            compress: 'Compress puff size to default setting'
        }
	},
	replyForm: {
		recipient: 'Recipients',
        sendTo: 'Send to',
		sendToPh: 'Add new user to receive', /*placeholder*/
		textareaPh: 'Add your content here. Click on the reply buttons of other puffs to reply to these.',
		send: 'Send as %{author}',
		preview: 'preview',
		format: {
			text: 'text',
			image: 'image',
			bbcodeMsg: 'You can use BBCode-style tags',
			imageFile: 'Image File',
			imageChosen: 'No file chosen',
		},
        privacyOption: 'Privacy options',
        pOptions: {
            public: 'Public (everyone can see this)',
            private: 'Private (content is encrypted)',
            anon: 'Anonymous (encrypted and anonymous)',
            paranoid: 'Invisible (double anon, experimental!)'
        },
        advanced: {
			title: 'Advanced Options',
			contentLicense: 'Content License',
			replyPrivacy: 'Reply privacy level'
        }
	},
	footer: {
		powered: 'Powered by',
		rest: ' Responsibility for all content lies with the publishing author and not this website.'
	},
    alert:{
        flag: 'WARNING: This will immediately and irreversibly remove this puff from your browser and request that others on the network do the same!'
    }
});
Translate.language["en"].extend({
	puff: {
		default: '381yXZ2FqXvxAtbY3Csh2Q6X9ByNQUj1nbBWUMGWYoTeK8hHHtKwmsvc8gZKeDnCtfr49Ld9yAayWPV6R8mYQ1Aeh6MJtzEf',
		shortcut: '381yXYnCBc9ARmPWSYLH3kUYThksyfntQeFiDvBvZAoLN9bf2LbaG3GLsE6amcuLSKhs5d3qERXnTU3BFA2vP957SY18nRkM'
	}
});


// check if any keys are missing
	// if true, assign the value from english
Translate.checkMissingKey = function() {
	var all_language = Object.keys(Translate.language);
	all_language = all_language.splice(1);

	// get the set of required keys from english
	var english = Translate.language['en'].phrases;
	var requiredKeys = Object.keys(english);

	for (var i=0; i<all_language.length; i++) {
		var name = all_language[i];
		var lang = Translate.language[name];
		// check if dropdownDisplay is set
		if (!lang.phrases['dropdownDisplay']) {
			lang.extend({
				dropdownDisplay: name
			})
		}
		for (var j=0; j<requiredKeys.length; j++) {
			var key = requiredKeys[j];
			if (!lang.phrases[key]) {
				lang.phrases[key] = english[key];
			}
		}
	}
};
window.addEventListener('load', function() {
	Translate.checkMissingKey();	
});

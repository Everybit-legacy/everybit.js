var Translate = {};
Translate.language = {};

Translate.language["en"] = new Polyglot({locale:"en"});
Translate.language["en"].extend({
	drop_down_display: 'English'
});
Translate.language["en"].extend({
	alert: {
		noUserSet: "You will need to set your identity first",
        flag: 'WARNING: This will immediately and irreversibly remove this puff from your browser and request that others on the network do the same!'
	},
	menu: {
		view: {
			title: 'View',
			roots: "Conversation starters",
			latest: "Latest puffs",
			collection: 'Choices collection',
			shortcut: "Keyboard shortcuts",
			show_mine: 'Show my puffs',
            show_puffs:"Show puffs for me"
		},
		filters: {
			title: 'Filter',
			by: 'By',
			tags: 'Tag',
			routes: 'Route',
			users: 'User'
		},
        preferences: {
            title: "Preferences",
			relationship: "Show relationships",
			animation: "Show animations",
			infobar: "Show information bars",
            disable_reporting: "Disable reporting",
			language: "Language",
			bgcolor: "Background"
        },
		publish: {
			title: 'Publish',
			new_puff: "New puff"
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
			new_identity: {
				title: 'Create',
				msg: 'Desired username',
				generate: 'Regenerate',
				or: 'or',
				error_missing: 'You must set all of your public keys before making a registration request.',
				success: 'Success!',
				submit: 'Submit request',
				import_content: 'Import Content'
			},
			view_identity: {
				title: 'View',
				msg: 'Stored keys for'
			},
			set_identity: {
				title: 'Store',
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
		profile: {
			title: 'Profile'
		},
		about: {
			title: 'About',
			introduction: 'Introduction',
			faq: "Puffball FAQ",
			code: 'Source code'
		},
		tools: {
			title: 'ADVANCED TOOLS',
			builder: "Puff builder",
			clear_cache: 'Clear cached puffs'
		},
        tooltip:{
            roots:'View latest conversation starters',
            latest:'View latest published puffs',
            collection:'View the Choices Collection',
            shortcut:'View a list of shortcuts for this website',
            showPuffs:'View puffs that were sent to me',
            show_mine: 'View puffs that were sent by me',
            relationship:'Display/hide relationships between puffs',
            animation:'Enable/disable animations',
            infobar:'Display/hide the information bars for each puff',
            set_identity: 'Store your private keys',
            view_identity: 'View stored keys for current identity',
            new_identity: 'Create a new identity',
			generate: 'randomly generate new username',
            new_puff:'Create a new puff',
            code:'View source code on GitHub',
            puff_builder:'Show the puff builder',
            tags_filter: 'Add a tag to filters',
            types_filter: 'Add a content type to filters',
            routes_filter: 'Add a route to filters',
            users_filter: 'Add a user to filters',
            types_filter: 'Add a type to filters',
            remove_filter: 'Remove this filter',
            current_delete:'To delete this user from the browser',
            flag_link: 'Flag for removal. If you created this puff, this will send out a request to the network to remove it.',
            view_image: 'View large',
            parent:'Show the parents of this puff',
            children:'Show the children of this puff',
            reply:'Reply to this puff',
            see_more:'Show more options',
            view_raw:'Show the raw code of this puff',
            json:'Show the JSON string of this puff',
            permalink:'Permalink to this puff',
            expand: 'Expand puff to one row',
            compress: 'Compress puff size to default setting',
            copy:'Copy the raw content of this puff to the reply box',
            star:'Star this puff',
            disable_reporting: "We track how you use our website. Click to disable.",
            sortDESC: "Sorted by most recent. Click to change.",
            sortASC: "Sorted by least recent. Click to change.",
            show_roots_true: "Showing only puffs with no parents  (topic starters). Click to change.",
            show_roots_false: "Showing topic starters and replies. Click to show only puffs with no parents (topic starters)."
        }
	},
	header: {
		tooltip: {
            publish: 'Publish a new puff',
            identity: 'Open identity popout',
            icon: 'Open/close menu',
            refresh: 'Manually refresh latest data'
		}
	},
	replyForm: {
		recipient: 'Recipients',
        send_to: 'Send to',
		send_to_ph: 'Add new user to receive', /*placeholder*/
		text_area_ph: 'Add your content here. Click on the reply buttons of other puffs to reply to these.',
		send: 'Send',
		preview: 'preview',
		format: {
			text: 'text',
			image: 'image',
			bb_code_msg: 'You can use BBCode-style tags',
			image_file: 'Image File',
			profile_image: 'Profile image*',
			image_chosen: 'No file chosen',
		},
        privacy_option: 'Privacy',
        p_options: {
            public: 'Public (everyone can see this)',
            private: 'Private (content is encrypted)',
            anonymous: 'Anonymous (encrypted and anonymous)',
            paranoid: 'Invisible (double anon, experimental!)'
        },
        advanced: {
			title: 'Advanced Options',
			content_license: 'Content License',
			reply_privacy: 'Reply privacy level'
        }
	},
	wizard: {
		publish: {
			message1: 'Pick the type of message you want to publish. Add your content in the text box.',
			message2: 'Click preview tab to preview your content.',
			message3: 'Enter a username to send your puff to an existing user.',
			message4: 'Select different options.',
			message5: 'Click send to publish your new puff.'
		}
	},
	footer: {
		powered: 'Powered by',
		rest: ' Responsibility for all content lies with the publishing author and not this website.'
	},
	tableview: {
		tooltip: {
            row_expand: "Expand/collapse this row.",
            col_options: "Add/remove columns.",
		}
	}
});
Translate.language["en"].extend({
	puff: {
		default: '381yXZ2FqXvxAtbY3Csh2Q6X9ByNQUj1nbBWUMGWYoTeK8hHHtKwmsvc8gZKeDnCtfr49Ld9yAayWPV6R8mYQ1Aeh6MJtzEf',
		shortcut: 'AN1rKpsWFJXfacgBZG9dVtsuJ2vLH89nwbTTJcoBQXSQQEF2m7XqEXrd1pmd8VZ16p5FPkLtKPt4oY2MytEhFU3MsZEsFZf1A'
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
		// check if drop_down_display is set
		if (!lang.phrases['drop_down_display']) {
			lang.extend({
				drop_down_display: name
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

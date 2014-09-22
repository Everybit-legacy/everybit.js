var Translate = {};
Translate.language = {};

Translate.language["en"] = new Polyglot({locale:"en"});
Translate.language["en"].extend({
	drop_down_display: 'English'
});
Translate.language["en"].extend({
	header: {
		home: "The world’s first 100% secure file storage and messaging system to work right in your web browser.",
		login: "Save your identity on this web browser",
		signup: "Register for a new username",
		learn: "Learn how it works",
		indepth: "Learn about the technology",
		about: "About ICX",
		send: "Send a private message or file",
		send_msg: "Send a private message to ",
		send_msg_conf: "Confirm message send",
		send_msg_fin: "Send of message",
		send_file: "Encrypt and send a file to ",
		send_file_conf: "Confirm file send",
		send_file_fin: "Send of file",
		store: "Encrypt and store files",
		store_fin: "Save your encryped file",
		dashboard: "Dashboard for ",
		filesys: "Encrypt and Decrypt Files"
	},
	signup: {
		username: "Username:",
		pass: "Passphrase:"
	},
	login: {
		username: "Username:",
		pass: "Private passphrase",
		or: "or",
		id_file: "Select an identity file"
	},
	dashboard: {
		tableview: " View your messages and files",
		download_id: " Download your identity file",
		filesys: " Encrypt or decrypt a file",
		logout: " Logout"
	},
	send: {
		msg: "Your Message",
		file: "File: ",
		msg_sent: "Your message has been sent!",
		file_sent: "Your file has been sent!",
		from: "FROM: ",
		to: "TO: ",
	},
	store: {
		select: "Select a file. It will be encrypted in your web browser.",
		backup: "Once encrypted, backup to the net",
		warning: "Warning! The file you have selected may be too large to send after encryption. Try keeping it below 1.5MB."
	},
	learn: {
		more: "To learn more about how I.CX works, watch the video or ",
		link: "read about the technology that makes it work"
	},
	about: {
		built: "I.CX, or “I see X”, is a private messaging and file sending system built on the ",
		platform: "puffball platform",
		devs: "Developers:"
	},
	footer: {
		powered: " Powered by",
		content: " All content is encrypted on the user's device. Only the sender and recipient can decode it."
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

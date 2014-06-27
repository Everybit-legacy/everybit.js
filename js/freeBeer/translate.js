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
			latest: "Latest puffs",
			collection: 'Choices collection',
			shortcut: "Keyboard shortcuts",
            showpuffs:"Show puffs for me"
		},
		filter: {
			title: 'Filter',
			route: 'Route',
			user: 'Username'
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
			storeKey: {
				msg: 'Use this area to store keys with this browser. To publish content, set only your default key.'
			},
			edit: {
				msg: 'Stored keys for'
			},
			newKey: {
				msg: 'Desired username',
				generate: 'Generate',
				or: 'or',
				convert: {
					private: 'Private',
					public: 'Public'
				},
				error: {
					missing: 'You must set all of your public keys before making a registration request.'
				},
				success: 'Success!',
				submit: 'Submit username request'
			}
		},
		about: {
			title: 'ABOUT',
			code: 'Source code'
		},
		tool: {
			title: 'ADVANCED TOOLS',
			builder: "Puff builder"
		},
        tooltip:{
            latest:'View latest published puffs',
            collection:'View the special Choices Collection',
            shortcut:'View a list of shortcuts of FreeBeer',
            showPuffs:'View puffs that were send to me',
            relationship:'Display/hide relationships between puffs',
            animation:'Enable/disable animations',
            infobar:'Display/hide the information bars in each puffs',
            newPuff:'Create a new puff',
            code:'View source code on GitHub',
            puffBuilder:'Show the puff builder',
            routeSearch: 'Show puffs in this route',
            routeErase: 'Unselect the route',
            userSearch: 'Show puffs from this user',
            userErase: 'Unselect the user',
            currentDelete:'To delete this user from the browser',
            parent:'Show the parents of this puff',
            children:'Show the children of this puff',
            reply:'To reply to this puff',
            seeMore:'Show more options',
            viewRaw:'Show the raw code of this puff',
            JSONstring:'Show the JSON string of this puff',
            permaLink:'Click to move this puff to main position'
        }
	},
	replyForm: {
		textarea: 'Add your content here. Click on the reply buttons of other puffs to reply to these.',
		submit: 'GO',
		cancel: 'NO',
		preview: 'preview',
		format: {
			text: 'text',
			image: 'image',
			bbcodeMsg: 'You can use BBCode-style tags',
			imageFile: 'Image File',
			imageChosen: 'No file chosen',
			imageLicense: 'Image License'
		},
        privacyOption: 'Privacy options',
        pOptions: {
            public: 'Public (everyone can see this)',
            private: 'Private (content is encrypted)',
            anon: 'Anonymous (encrypted and anonymous)',
            paranoid: 'Invisible (double anon, experimental!)'
        },
        sendTo: 'Send to user'

	},
	footer: {
		powered: 'Powered by',
		rest: ' Responsibility for all content lies with the publishing author and not this website.'
	}
});
Translate.language["en"].extend({
	puff: {
		default: 'AN1rKooS7u7ZgGs6WG2yfrq77kPCocztNj21Av6wN9dKBYECgVUpU19pFjV33VHkJKv6WJZcAx9sbLcFMUahyV1FUWZfSsgtD',
		shortcut: '381yXYnCBc9ARmPWSYLH3kUYThksyfntQeFiDvBvZAoLN9bf2LbaG3GLsE6amcuLSKhs5d3qERXnTU3BFA2vP957SY18nRkM'
	}
});

Translate.language["zh"] = new Polyglot({locale:"zh"});
Translate.language["zh"].extend({
	dropdownDisplay: '中文'
});
Translate.language["zh"].extend({
	alert: {
		noUserSet: "需要先设置身份!"
	},
	menu: {
		view: {
			title: '查看',
			latest: "最近",
			collection: '特别收藏',
			shortcut: "快捷键",
            showpuffs:"显示给我的puff"
		},
		filter: {
			title: '筛选',
			route: '路径',
			user: '用户名'
		},
		preferences: {
			title: '偏好设置',
			relationship: "显示关联",
			animation: "显示动画",
			infobar: "显示信息栏",
			language: "语言"
		},
		publish: {
			title: '发布',
			newPuff: "新建"
		},
		identity: {
			title: '身份',
			current: '当前身份',
			none: '无',
			username: '用户名',
			private: '密钥',
			public: '公钥',
			default: '默认',
			admin: '管理',
			root: '根',
			storeKey: {
				msg: '将密匙储存在当前浏览器里。若想发布信息只需要设置默认密钥。'
			},
			edit: {
				msg: '已储存的用户密钥'
			},
			newKey: {
				msg: '新用户名',
				generate: '生成',
				or: '或者',
				convert: {
					private: '密钥',
					public: '公钥'
				},
				error: {
					missing: '在提交之前必须设定好所有的公钥。'
				},
				success: '成功!',
				submit: '提交新用户名'
			}
		},
		about: {
			title: '关于',
			code: '源代码'
		},
		tool: {
			title: '高级工具',
			builder: "生成"
		},
        tooltip:{
            latest:'显示最新的puff',
            collection:'显示特别收藏',
            shortcut:'显示描述快捷键功能的puff',
            showPuffs:'显示给我的puff',
            relationship:'显示puff直接的关联',
            animation:'显示动画当显示关联或打开菜单/回复窗口时',
            infobar:'显示信息栏',
            newPuff:'发布一个新的puff',
            code:'在GitHub查看源代码',
            puffBuilder:'显示puff生成器',
            routeSearch: '显示此路径的puff',
            routeErase: '取消选择本路径',
            userSearch: '显示此用户的所有puff',
            userErase: '取消选择本用户名',
            currentDelete:'在本浏览器中删除此用户',
            parent:'显示本puff的上级',
            children:'显示本puff的下级',
            reply:'回复本puff',
            seeMore:'显示更多选项',
            viewRaw:'显示未加工前的代码',
            JSONstring:'显示本puff的JSON代码',
            permaLink:'点击移动本puff到中心'
        }
	},
	replyForm: {
		textarea: '在此处添加内容。 点击其他puff的回复按钮来回复他们。',
		submit: '提交',
		cancel: '取消',
		preview: '预览',
		format: {
			text: '文字',
			image: '图片',
			bbcodeMsg: '你可以使用BBCode格式的标签',
			imageFile: '图片文件',
			imageChosen: '没有选中文件',
			imageLicense: '图片许可'
		},
        privacyOption: '隐私选项',
        pOptions: {
            public: '公开 (所有人可见)',
            private: '隐私 (内容是加密的)',
            anon: '匿名 (加密及匿名的)',
            paranoid: '偏执狂 (每次都会重新生成用户名)'
        },
        sendTo: '发给用户'
	},
	footer: {
		powered: '基于',
		rest: '所有内容责任在于所发布用户。本网站不对任何用户所发布内容负责。'
	}
});
Translate.language["zh"].extend({
	puff: {
		default: 'AN1rKp8pNT4HSMwCW7nnL3YWHDeWbgAEsyrsPkQAorwVSFANkBDxzhTyPHjSEppCeRXsjK87RuEzjrTHyCFkYFTu8dAoY66BC',
		shortcut: 'iKx1CJMRR5t3i8gJDkL6JLM3AEqKSDfLuek3XoD4TupbkPCvRLpnH7gkscU8LGd2yCyKJZEqEGpUao3BJM3wQdwR2bRC992LmC'
	}
})



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
}
Translate.checkMissingKey();
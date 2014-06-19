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
		filter: {
			title: 'Filter',
			route: 'Route',
			user: 'Username'
		},
		view: {
			title: 'View',
			latest: "Latest puffs",
			collection: 'Choices collection',
			shortcut: "Keyboard shortcuts",
			relationship: "Show relationships",
			animation: "Show animations",
            showpuffs:"Show puffs for me",
			route: "Route",
			unfiltered: "Unfiltered",
			language: "Language"
		},
        preferences: {
            title: "Preferences"
        },
		publish: {
			title: 'Publish',
			new: "New puff"
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
		}
	},
	replyForm: {
		textarea: 'Add your content here. Click on the reply buttons of other puffs to reply to these.',
		submit: 'GO',
		cancel: 'NO',
		format: {
			text: 'text',
			image: 'image',
			bbcodeMsg: 'You can use BBCode-style tags',
			imageFile: 'Image File',
			imageChosen: 'No file chosen',
			imageLicense: 'Image License'
		}
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
		filter: {
			title: '筛选',
			route: '路径',
			user: '用户名'
		},
		view: {
			title: '查看',
			latest: "最近",
			collection: '特别收藏',
			shortcut: "快捷键",
			relationship: "显示关联",
			animation: "显示动画",
            showpuffs:"显示我的puff",
			route: "路径",
			unfiltered: "无",
			language: "语言"
		},
		publish: {
			title: '发布',
			new: "新建"
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
		}
	},
	replyForm: {
		textarea: '在此处添加内容。 点击其他puff的回复按钮来回复他们。',
		submit: '提交',
		cancel: '取消',
		format: {
			text: '文字',
			image: '图片',
			bbcodeMsg: '你可以使用BBCode格式的标签',
			imageFile: '图片文件',
			imageChosen: '没有选中文件',
			imageLicense: '图片许可'
		}
	},
	footer: {
		powered: '基于',
		rest: '所有内容责任在于所发布用户。本网站不对任何用户所发布内容负责。'
	}
});
Translate.language["zh"].extend({
	puff: {
		default: 'AN1rKp8pNT4HSMwCW7nnL3YWHDeWbgAEsyrsPkQAorwVSFANkBDxzhTyPHjSEppCeRXsjK87RuEzjrTHyCFkYFTu8dAoY66BC'
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
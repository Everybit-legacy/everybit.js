var translate = {};

translate["en"] = new Polyglot({locale:"en"});
translate["en"].extend({
	menu: {
		view: {
			title: 'VIEW',
			latest: "Latest puffs",
			collection: 'Choices collection',
			shortcut: "Keyboard shortcuts",
			relationship: "Show relationships",
			animation: "Show animations",
			route: "Route",
			unfiltered: "Unfiltered",
			language: "Language"
		},
		publish: {
			title: 'PUBLISH',
			new: "New puff"
		},
		identity: {
			title: 'IDENTITY',
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
		rest: 'Responsibility for all content lies with the publishing author and not this website.'
	}
});

translate["zh"] = new Polyglot({locale:"zh"});
translate["zh"].extend({
	menu: {
		view: {
			title: '查看',
			latest: "最近",
			collection: '特别收藏',
			shortcut: "快捷键",
			relationship: "显示关联",
			animation: "显示动画",
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
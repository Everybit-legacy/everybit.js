
Translate.language["zh"] = new Polyglot({locale:"zh"});
Translate.language["zh"].extend({
	dropdownDisplay: '中文'
});
Translate.language["zh"].extend({
	alert: {
		noUserSet: "需要先设置身份!",
        flag: '警告：这样将会立即将此puff在你的浏览器和网络里移除，一旦操作将不可恢复！'
	},
	menu: {
		view: {
			title: '查看',
			roots: "根puffs",
			latest: "最近",
			collection: '特别收藏',
			shortcut: "快捷键",
			showMine: '我发送的puff',
            showpuffs:"发送给我的puff"
		},
		filters: {
			title: '筛选',
			by: '根据',
			tags: '标签',
			routes: '路径',
			users: '用户名'
		},
		preferences: {
			title: '偏好设置',
			relationship: "显示关联",
			animation: "显示动画",
			infobar: "显示信息栏",
			disable_reporting: "禁止提交報告",
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
			newIdentity: {
				title: '新建身份',
				msg: '新用户名',
				generate: '生成',
				or: '或者',
				errorMissing: '在提交之前必须设定好所有的公钥。',
				success: '成功!',
				submit: '提交新用户名',
				importContent: '导入内容'
			},
			editIdentity: {
				title: '查看身份',
				msg: '已储存的用户密钥'
			},
			setIdentity: {
				title: '设定身份',
				msg: '将密匙储存在当前浏览器里。若想发布信息只需要设置默认密钥。'
			},
            step: {
                title:'第%{n}步',
                next: '下一步',
                back: '上一步',
                select:'选择一个新用户名 ',
                import:'或者，从这里引入 ',
                generate:'为%{username}生成密匙 ',
                remember:'记得保存密匙！',
                request:'申请用户名 '
            }
		},
		about: {
			title: '关于',
			introduction: '介绍',
			faq: "Puffball问与答",
			code: '源代码'
		},
		tools: {
			title: '高级工具',
			builder: "生成",
			clearCache: '清除已缓存的puff'
		},
        tooltip:{
            roots:'显示最新的根puff',
            latest:'显示最新的puff',
            collection:'显示特别收藏',
            shortcut:'查看本站的所有快捷鍵',
            showPuffs:'显示发送给我的puff',
            showMine: '显示我发送的puff',
            relationship:'显示/隐藏puff之间的关联',
            animation:'启用/禁止动画',
            infobar:'显示/隐藏所有puff的信息栏',
            setIdentity: '贮存密钥',
            editIdentity: '查看当前密钥',
            newIdentity: '创建新身份',
            newPuff:'发布一个新的puff',
            generate: '随机生成一个新用户名',
            code:'在GitHub查看源代码',
            puffBuilder:'显示puff生成器',
            tagsFilter: '显示有此标记的puff',
            routesFilter: '显示此路径的puff',
            routeErase: '取消选择本路径',
            usersFilter: '显示此用户的所有puff',
            userErase: '取消选择本用户名',
            currentDelete:'在本浏览器中删除此用户',
            viewImage: '显示大图',
            parent:'显示本puff的上级',
            children:'显示本puff的下级',
            reply:'回复本puff',
            seeMore:'显示更多选项',
            viewRaw:'显示未加工前的代码',
            json:'显示本puff的JSON代码',
            permaLink:'本puff的文本链接',
            flagLink: '标记为移除。如果你生成了这个puff，这将发送移除申请。',
            expand: '扩大puff以单行显示',
            compress: '将puff缩回默认大小',
            copy:'将此puff加工前的内容拷贝到回复框',
            disable_reporting: "我们追踪您对本网站的使用。选中禁止追踪。"
        }
	},
	replyForm: {
		recipient: '收件人',
        sendTo: '发送给',
        sendToPh: '所有人',
		textareaPh: '在此处添加内容。 点击其他puff的回复按钮来回复他们。',
		send: '发送',
		preview: '预览',
		format: {
			text: '文字',
			image: '图片',
			bbcodeMsg: '你可以使用BBCode格式的标签',
			imageFile: '图片文件',
			imageChosen: '没有选中文件',
			contentLicense: '内容许可'
		},
        privacyOption: '隐私',
        pOptions: {
            public: '公开 (所有人可见)',
            private: '私密 (内容是加密的)',
            anonymous: '匿名 (加密及匿名的)',
            paranoid: '偏执狂 (每次都会重新生成用户名)'
        },
        advanced: {
        	title: '高级选项',
			contentLicense: '内容许可',
			replyPrivacy: '回复隐私'
        }
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


/** @jsx React.DOM */

/* ICX MIXINS */
/* Warning - All Mixins must be defined PRIOR to being referenced */
var Tooltip = React.createClass({
    render: function() {
        var className = "menuTooltip"  + " black"
        if (this.props.position)
            className += " " + this.props.position
        else
            className += " right"

        return (
            <div className={className}>{this.props.content}</div>
            )
    }
})

var TooltipMixin = {
    handleShowTooltip: function() {
        var parent = this
        var tooltip = this.getElementsByClassName('menuTooltip')[0]
        tooltip.style.display = "block"
    },
    handleHideTooltip: function() {
        var parent = this
        var tooltip = this.getElementsByClassName('menuTooltip')[0]
        tooltip.style.display = "none"
    },
    componentDidMount: function() {
        var current = this.getDOMNode()
        var tooltips = current.getElementsByClassName('menuTooltip')
        for (var i=0; i<tooltips.length; i++) {
            var parent = tooltips[i].parentNode
            parent.firstChild.onmouseover = TooltipMixin.handleShowTooltip.bind(parent)
            parent.firstChild.onmouseout  = TooltipMixin.handleHideTooltip.bind(parent)
        }
    }
}
/* END ICX MIXINS */

// MAIN COMPONENT, ROUTES TRAFFIC
var ICXWorld = React.createClass({
    render: function () {
        var w = window.innerWidth
        var h = window.innerHeight

        var currScreen = puffworldprops.view.icx.screen

        if(!currScreen) {
            currScreen = 'init'
        }

        //Routing checks, check if you have "permission" to go somewhere, if not send you somehwere safe
        if(!PB.getCurrentUsername()) {
            //lock them out of dashboard if no user is logged in
            if (currScreen == 'dashboard') {
                currScreen = 'home'
                Events.pub('/ui/icx/screen',{"view.icx.screen":'home'})
            }
            if (currScreen == 'store' || currScreen == 'send') {
                currScreen = 'newuser'
                Events.pub('/ui/icx/screen', {'view.icx.screen': 'newuser'})
            }
        } else {
            //prevent them from getting to newuser page if they are logged in
            if ((currScreen == 'newuser' || currScreen == 'login') && !(puffworldprops.ICX.nextStep == "send" || puffworldprops.ICX.nextStep == "store")) {
                currScreen = 'dashboard'
                Events.pub('/ui/icx/screen',{"view.icx.screen":'dashboard'})
            }
        }

        if (currScreen == 'init') {
            if (PB.getCurrentUsername()) {
                currScreen = 'dashboard'
                Events.pub('/ui/icx/screen', {"view.icx.screen": 'dashboard'})

            } else {
                currScreen = 'home'
                Events.pub('/ui/icx/screen', {"view.icx.screen": 'home'})
            }
        }

        if (currScreen == 'send.message' || currScreen == 'send.file') {
            if (!puffworldprops.ICX.toUser) {
                Events.pub('ui/icx/screen', {"view.icx.screen": 'send'})
            }
        }

        var p = w*h

        var l = ICX.config.logo.originalW*ICX.config.logo.originalH
        var logoAdjustRatio = Math.sqrt(p*ICX.config.logo.areaRatio/l)

        var fontSizeMultiplier = Math.sqrt(p * ICX.config.text.areaRatio)
        var baseFontH = keepNumberBetween( Math.floor( fontSizeMultiplier ), ICX.config.text.min, ICX.config.text.max)

        ICX.calculated = {

            sideBorder: keepNumberBetween(w * ICX.config.sideBorder.ratio, ICX.config.sideBorder.min, ICX.config.sideBorder.max),

            logoW: keepNumberBetween(ICX.config.logo.originalW * logoAdjustRatio, ICX.config.logo.minW, ICX.config.logo.maxW),

            fontSizeMultiplier: Math.sqrt(p * ICX.config.text.areaRatio),

            baseFontH: baseFontH,

            pageHeaderTextStyle: {
                fontFamily: "Gudea, helvetica, arial",
                fontSize: (1.1 * baseFontH) + 'px',
                width: '100%',
                textAlign: 'center',
                padding: '5px',
                color: 'white'
            },

            baseTextStyle: {
                fontFamily: "Gudea",
                fontSize: baseFontH+'px'
            }
        }

        var fontSize = Math.floor( h*ICX.config.buttonFontHeightRatio )

        ICX.buttonStyle = {
            fontSize:  fontSize + 'px',
            fontFamily: "Gudea, helvetica, arial",
            lineHeight: Math.floor( fontSize ) + 'px',
            color: 'white',
            padding: Math.floor(fontSize/2.5)+'px',
            paddingBottom: Math.floor((fontSize/2.5)+3)+'px',
            marginTop: Math.floor(fontSize/2.5)+'px',
            marginBottom: Math.floor(fontSize/2.5)+'px',
            zIndex: 100,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
            textTransform: 'uppercase',
            display: 'inline-block'
        }

        var c1, c2, c3, c4, c5, c6, c7, op1, op2, op3, op4


         c1 = '67, 83, 111'
         c2 = '26, 40, 60'
         c3 = '17, 52, 59'
         c4 = '33, 35, 39'
         c5 =  '29, 3, 0'

        c6 = '0, 3, 82'     // Blue border
        c7 = '99,112,133'

        op1 = '0.8'
        op2 = '.08'
        op3 = 1
        op4 = '0.6'

        ICX.screens = [
            {position: 0, name: 'home',  button: false, color: 'rgba('+c6+', '+op1+')', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXHome, backgroundColor: 'rgba(255,255,255,0)'},
            {position: 1, name: 'send',  button: true, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'SEND a private message or file', component: ICXSend, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 2, name: 'store', button: true, color: 'rgba('+c3+', '+op1+')', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately', component: ICXStore, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'login', button: true, color: 'rgba('+c1+', '+op3+')', icon: 'fa fa-fw fa-sign-in', fullText: 'LOG IN', component: ICXLogin, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 4, name: 'learn', button: true, color: 'rgba('+c4+', '+op1+')', icon: 'fa fa-fw fa-file-text-o', fullText: 'LEARN how it works', component: ICXLearn, backgroundColor: 'rgba('+c4+', '+op2+')'},
            {position: 5, name: 'about', button: true, color: 'rgba('+c5+', '+op1+')', icon: 'fa fa-fw fa-info-circle', fullText: 'ABOUT I.CX', component: ICXAbout, backgroundColor: 'rgba('+c5+', '+op2+')'},
            {position: 0, name: 'send.message',  button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a message', component: ICXSendMessage, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'store.encrypt', button: false, color: 'rgba('+c3+', '+op1+')', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately', component: ICXStore, backgroundColor: 'rgba('+c3+', '+op2+')'},
            {position: 0, name: 'home.table',    button: false, color: 'rgba('+c7+', '+op4+')', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXTableView, backgroundColor: 'rgba('+c6+', '+op2+')', styles: {padding: 0}},
            {position: 0, name: 'dashboard',    button: false, color: 'rgba('+c1+', '+op3+')', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXDashboard, backgroundColor: 'rgba('+c1+', '+op2+')'},
            {position: 0, name: 'newuser',    button: false, color: 'rgba('+c1+', '+op1+')', icon: 'fa fa-fw fa-male', fullText: 'Register a new username', component: ICXNewUser, backgroundColor: 'rgba('+c1+', '+op2+')'},
            {position: 0, name: 'send.finish', button: false, color: 'rgba('+c2+', '+op1+')', fullText: "Send of message", component: ICXSendMessageFinish, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'send.file',  button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a file', component: ICXSendFile, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'send.file.finish',  button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a file', component: ICXSendFileFinish, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'encryptdecrypt',    button: false, color: 'rgba('+c4+', '+op1+')', icon: 'fa fa-fw fa-home', fullText: 'Encrypt / Decrypt Page', component: ICXFileConverter, backgroundColor: 'rgba('+c4+', '+op2+')'},
            {position: 0, name: 'store.finish', button:false, color: 'rgba('+c3+', '+op1+')', icon: 'fa fa-fw fa-database', fullText: 'Store encrypted files', component: ICXStoreFinish, backgroundColor: 'rgba('+c3+', '+op2+')'},
            {position: 0, name: 'init',  button: false, color: 'rgba('+c6+', '+op1+')', icon: 'fa fa-fw fa-home', fullText: '', component: ICXInit, backgroundColor: 'rgba(255,  255, 255, .0)'},
            {position: 0, name: 'indepth', button: false, color: 'rgba('+c4+', '+op1+')', icon: 'fa fa-fw fa-file-text-o', fullText: 'LEARN how it works', component: ICXIndepth, backgroundColor: 'rgba('+c4+', '+op2+')'},
            {position: 0, name: 'invite', button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Invite someone to join icx', component: ICXInvite, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'changepassphrase', button: false, color: 'rgba('+c1+', '+op1+')', icon: 'fa fa-fw fa-gear', fullText: 'Change your passphrase', component: ICXChangePassphrase, backgroundColor: 'rgba('+c1+', '+op2+')'},
            {position: 0, name: 'changepassphrase.finish', button: false, color: 'rgba('+c1+', '+op1+')', icon: 'fa fa-fw fa-gear', fullText: 'Change your passphrase', component: ICXChangePassphraseFinish, backgroundColor: 'rgba('+c1+', '+op2+')'}
        ]

        //gracefully deal with invalid screen input
        var screenNames = ICX.screens.map(function(screen) {return screen.name})
        if (screenNames.indexOf(currScreen) < 0) {
            // currScreen = 'home'
            return Events.pub('/ui/icx/screen', {"view.icx.screen": 'home'})
        }

        var borderWidth = Math.floor(ICX.calculated.sideBorder)+'px'

        ICX.screenMap = ICX.screens.reduce(function(acc, screenInfo) {
            acc[screenInfo.name] = screenInfo
            return acc
        },{})

        var screenInfo = ICX.screenMap[currScreen]
        var fun = screenInfo.component
        ICX.currScreenInfo = screenInfo

        var pageComponent = fun( {screenInfo:screenInfo} )

        var contentDivStyles = {
            position: "absolute",
            left: Math.floor( w*ICX.config.content.insets.left ) + Math.floor(ICX.calculated.sideBorder) + "px",
            width: Math.floor( (1-(ICX.config.content.insets.left+ICX.config.content.insets.right))*w ) + 'px',
            // height: Math.floor( (1-(ICX.config.content.insets.top+ICX.config.content.insets.bottom))*h ) + 'px',
            top: Math.floor( (ICX.config.content.insets.top)*h ) + 'px',
            padding: '10px', // Testing...
            fontSize: ICX.calculated.baseFontH + 'px'
        }
        contentDivStyles.backgroundColor = screenInfo.backgroundColor
        // Apply any additional styling
        if(screenInfo.styles) {
            for (var key in screenInfo.styles) {
                contentDivStyles[key] = screenInfo.styles[key]
            }
        }

        var screenStyle = {
            position: "absolute",
            width: w,
            height: h,
            maxWidth: w
        }



        var borderStyle =  {
            width: borderWidth,
            backgroundColor: screenInfo.color,
            position: 'fixed',
            height: '100%'
        }


        return (
            <span>
                <div style={borderStyle} />
                <div style={screenStyle} className="screen">
                    <ICXLogo screenInfo={screenInfo} />
                    <ICXLinks screenInfo={screenInfo} />
                    <div style={contentDivStyles}>
                        <ICXError />
                        {pageComponent}
                    </div>
                    <ICXSpinner />
                </div>
                <i className="icon-gavia" style={{fontSize: '1px', fontFamily: 'icxicon', opacity: 0, position:'fixed'}} />
            </span>
        )
    }
})

var ICXInit = React.createClass({ /* Good */
    render: function () {
        return <span></span>
    }
})

var ICXStore = React.createClass({ /* Good */
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        // CSS for checkboxes
        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-check-square-o': puffworldprops.ICX.backupToCloud,
            'fa-square-o': !puffworldprops.ICX.backupToCloud,
            'green': puffworldprops.ICX.backupToCloud
        })

        ICX.buttonStyle.background = headerStyle.backgroundColor

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.store")}</div><br />
                <div className="contentWindow">
                    <span className="textBox">{polyglot.t("store.select")}</span>
                    <br />
                    <ICXFileUploader styling={headerStyle} />

                    <br />
                    <small>
                        <i className={cbClass} onClick={this.handleToggleBackupToCloud} ></i>
                    {polyglot.t("store.backup")}
                    </small>
                    <br />
                    <ICXNextButton enabled={puffworldprops.ICX.nextStatus} goto='store.finish' key="nextToStore" text='Finish' />
                    <br />
                    <div ref="warning" style={{'display':'none','color':'red'}}>
                        <span>{polyglot.t("store.warning")}</span>
                    </div>

                </div>
            </div>
            )
    },

    handleToggleBackupToCloud: function() {
        return Events.pub('ui/event', {
            'ICX.backupToCloud': !puffworldprops.ICX.backupToCloud
        })

    },

    componentWillMount: function() {
        Events.pub('ui/event', {
            'ICX.wizard.type': 'file',
            'ICX.backupToCloud': true,
            'ICX.nextStatus': false
        })
    },


    handleGetFile: function(event) {
        var element = event.target
        var warning = this.refs.warning.getDOMNode()

        if (element.files[0].size > 1500000) {
            warning.style.display=''
        } else {
            warning.style.display='none'
        }

        ICX.fileprom = PBFiles.openBinaryFile(element)

        ICX.filelist = element.files

        return Events.pub('ui/event', {
            'ICX.nextStatus': true
        })
    }
})

var ICXStoreFinish = React.createClass({ /* Good */
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.store_fin")}</div><br />
                <div className="contentWindow">
                    <span className="textBox">{polyglot.t("store.success")}</span>
                    <br /><br />
                    <a ref="encryptedLink" className="inline" download="no_file_selected" onClick={this.handleDownloadFile}>
                    <i className="fa fa-fw fa-download" /> {polyglot.t("store.save")}</a>
                    <br /><br />
                    <ICXNextButton enabled={puffworldprops.ICX.messageStored} goto={puffworldprops.ICX.nextStep} key="nextToStore" text="Encrypt another file" />
                </div>
            </div>
        )
    },

    handleDownloadFile: function(e) {
        var self = this
        if (getBrowser() == 'IE') {
            e.preventDefault()
            ICX.fileprom.then(function(blob) {
                var puff = PBFiles.createPuff(blob, 'file')

                var filelist = ICX.filelist
                var file     = filelist[0]
                var filename = file.name
                var new_filename = filename + '.puff'

                window.navigator.msSaveBlob(PBFiles.prepBlob(puff), new_filename)
            })
        }      
        self.handleSubmitSuccess()
    },

    handleSubmitSuccess: function () {
        Events.pub('ui/event', {
            'ICX.messageStored':true
        })
        this.cleanUpSubmit()
    },

    handleSubmitError: function (err) {
        ICX.errors = err.message
        Events.pub('/ui/icx/error', {"icx.errorMessage": true})
        this.cleanUpSubmit()
    },

    cleanUpSubmit: function () {
        Events.pub('ui/thinking', { 'ICX.thinking': false })
    },

    componentWillMount: function() {
        Events.pub('ui/event',{
            'ICX.messageStored': false,
            'ICX.nextStep': 'store',
            'ICX.successMessage': ''
        })
        //Events.pub('ui/thinking', { 'ICX.thinking': true })
    },

    componentDidMount: function () {
        var self = this
        var foo = false
        Events.pub('ui/thinking', { 'ICX.thinking': true })
        if(PB.getCurrentUsername()) {
            //backup their file
            if (puffworldprops.ICX.backupToCloud) {
                this.handleBackup()

            } else {
                self.cleanUpSubmit()
                ICX.errors = "WARNING: If you chose not to backup to the network, your encrypted file only exists in this browser window. Save the file before closing this window or going to another page."
                Events.pub('/ui/icx/error', {"icx.errorMessage": true})
            }

            ICX.fileprom.then(function(blob) {
            var puff = PBFiles.createPuff(blob, 'file')

            var filelist = ICX.filelist
            var file     = filelist[0]
            var filename = file.name
            var new_filename = filename + '.puff'

            // Make the link visible to download the file
            var encryptedLink = self.refs.encryptedLink.getDOMNode()
            encryptedLink.href = PBFiles.prepBlob(puff)
            encryptedLink.download = new_filename
            // encryptedLink.click()
        })

        } else {

            self.cleanUpSubmit()
            ICX.errors = "ERROR: Cannot encrypt file as you are not logged in under a valid identity. Please log in or create an identity before trying again."
            return Events.pub('/ui/icx/error', {"icx.errorMessage": true})
        }
    },

    handleBackup: function() {

        // Same as sending the file to yourself
        var me = PB.getCurrentUsername()
        var type = 'file'
        var content = ICX.filelist[0]
        var parents = []
        var metadata = {}
        metadata.routes = [me]
        metadata.filename = content.name
        var privateEnvelopeAlias = ''
        var self = this

        ICXAddPost(me, type, parents, ICX.fileprom, metadata, privateEnvelopeAlias, function(err) {
            if(!err) {
                self.handleSubmitSuccess()
            } else {
                self.handleSubmitError(err)
            }
        })

        return false
    }
})

var ICXInvite = React.createClass({
    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor

        var polyglot = Translate.language[puffworldprops.view.language]
        // Next step is file or message, then final step has warning about NOT DONE
        var username = PB.getCurrentUsername()
        var userURL = 'https://i.cx/u/'+username
        var inviteText = polyglot.t("invite.proposal_1")+"\n"+userURL+"\n"+polyglot.t("invite.proposal_2")+"\n"+username

        // Put Why can't you in warning message?
        return (
            <div className="help-box">
                <span className="bold red">NOTE: In order for your friend to see your  message or file, they will need an I.CX username and passphrase</span>
                <br />
                <div className="bold">Choose one of the options below to get them started:</div>
                <br />

                <div className="contentWindow content-card option" id="optionOne">

                    <div style={headerStyle}>Option 1: Send your friend an invite link</div>
                    <div className="textBox">
                        The link will direct them to create their own account. (You won’t be able to communicate securely until they create their account)
                    </div><br />
                    <textarea value={inviteText} style={{'width':'80%', 'height':'40%'}} readOnly></textarea>
                    <br />

                    <span className="bold">Copy and paste</span> the above message into an email to invite your friend to ICX
                </div>
                <br />

                <div id="optionTwo" className=" contentWindow content-card option">
                    <div style={headerStyle}>Option 2: Create an account for your friend using a shared secret</div>
                    <span className="georgia">Create an account for your friend using the security question and answer below. You will be able to send your file or message to this new account after.</span>
                    <br /><br />
                    <span>Question:</span><br />
                    <input type="text" ref="question" onChange={this.handleVerifyQuestion}/>
                        {' '}<ICXCheckmark show={puffworldprops.ICX.invite.questionStatus} />
                        {' '}<span className="message">{puffworldprops.ICX.invite.questionMessage}</span>
                    <br />
                    Answer:<br />
                    <input type="text" ref="passphrase" onChange={this.handleVerifyAnswer}/>
                        {' '}<ICXCheckmark show={puffworldprops.ICX.invite.answerStatus} />
                        {' '}<span className="message">{puffworldprops.ICX.invite.answerMessage}</span>
                    <br />
                    <span className="shortcut georgia">Note:</span> <span className="georgia">The answer to the question will be your friend’s initial passphrase. They will be able to view your message or file after logging in and changing their passphrase.</span>
                    <br />
                    <a className="icxNextButton icx-fade"style={ICX.buttonStyle} onClick={this.handleSendToEmail}> Continue <i className="fa fa-chevron-right small" /></a>
                </div>
            </div>
        )
    },

    handleVerifyQuestion: function(event) {
        var question = this.refs.question.getDOMNode().value
        if(question.length < 5) {
            Events.pub('ui/event', {
                'ICX.invite.questionStatus': '',
                'ICX.invite.questionMessage': 'Too short'
            })
            return false

        } else {
            Events.pub('ui/event', {
                'ICX.invite.questionStatus': true,
                'ICX.invite.questionMessage': ''

            })
            return true
        }
    },

    handleVerifyAnswer: function() {
        var answer = this.refs.passphrase.getDOMNode().value
        if(answer.length < 5) {
            Events.pub('ui/event', {
                'ICX.invite.answerStatus': '',
                'ICX.invite.answerMessage': 'Too short'
            })
            return false

        } else {
            Events.pub('ui/event', {
                'ICX.invite.answerStatus': true,
                'ICX.invite.answerMessage': ''

            })
            return true
        }
    },

    handleSendToEmail: function() {
        if( !this.handleVerifyQuestion() || !this.handleVerifyAnswer() ) {
            return false
        }

        toggleSpinner()
        var prompt = this.refs.question.getDOMNode().value
        var passphrase = this.refs.passphrase.getDOMNode().value

        try {
            inviteICXUser(passphrase, function(toUser) {
                toggleSpinner()
                return Events.pub('ui/icx/screen', {
                    "view.icx.screen": puffworldprops.ICX.wizard.type,
                    'ICX.wizard.invitedEmail': puffworldprops.ICX.toUser,
                    'ICX.wizard.prompt': prompt,
                    'ICX.toUser': toUser
                })
            })
        }
        catch(err) {
            toggleSpinner()
            ICX.Errors = "ERROR: "+err
            return Events.pub('/ui/icx/error', {"icx.errorMessage": true})


        }

    }

    /*
    handleSendToEmail: function() {
        // Start the spinner, generate a new username,
        // Send them to next step, message or file send page.
        // TODO: Check for blank, or too short values in question and answer

        if( !this.handleVerifyQuestion() || !this.handleVerifyAnswer() ) {
            return false
        }


        Events.pub('ui/thinking', { 'ICX.thinking': true })

        var animalName = PB.Crypto.getRandomItem(ICX.animalNames)
        var adjective = PB.Crypto.getRandomItem(ICX.adjectives)
        var animalColor = PB.Crypto.getRandomItem(ICX.colornames)

        var requestedUsername = adjective+animalColor+animalName

        var prompt = this.refs.question.getDOMNode().value
        var passphrase = this.refs.passphrase.getDOMNode().value

        // Convert passphrase to key
        var privateKey = passphraseToPrivateKeyWif(passphrase)
        var publicKey = PB.Crypto.privateToPublic(privateKey)

        var rootKeyPublic     = publicKey
        var adminKeyPublic    = publicKey
        var defaultKeyPublic  = publicKey

        var self = this

        var payload = {
            requestedUsername: requestedUsername,
            rootKey: rootKeyPublic,
            adminKey: adminKeyPublic,
            defaultKey: defaultKeyPublic
        }
        var routes = []
        var type = 'updateUserRecord'
        var content = 'requestUsername'

        var puff = PB.buildPuff('icx', ICX.adminKey, routes, type, content, payload)

        // SUBMIT REQUEST
        var prom = PB.Net.updateUserRecord(puff)
        prom.then(function(userRecord) {

                // publishProfilePuff()

                Events.pub('ui/thinking', {
                    'ICX.thinking': false
                })

                return Events.pub('ui/icx/screen', {
                        "view.icx.screen": puffworldprops.ICX.wizard.type,
                        'ICX.wizard.invitedEmail': puffworldprops.ICX.toUser,
                        'ICX.wizard.prompt': prompt,
                        'ICX.toUser': requestedUsername
                    }
                )
            },

            function(err) {
                // TODO: Deal with error, show it in box
                Events.pub('ui/thinking', {
                    'ICX.thinking': false
                })

                return Events.pub('ui/event', {})
            })



        // Redirect to the next page in process.

        // On final confirm page, put the email in parenthesis next to the username in To: Same if file
    }*/
})

var ICXSend = React.createClass({ /* Good */
    mixins: [TooltipMixin],

    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.backgroundColor = ICX.currScreenInfo.color

        var inviteClass =React.addons.classSet({
            'hidden':!puffworldprops.ICX.showInvite
        })

        return (
            <div className="icx-screen icx-send">
                <div style={headerStyle}>Send an encrypted message or file</div>
                <div className="contentWindow">
                    <div className="textBox">
                        Enter a username or email address.
                    </div>
                    To: <input type="text" ref="toUser" onChange={this.verifyUsername} onKeyDown={this.handleSubmit} />
                        <span className="relative">
                            <a href="#" onClick={this.handleUsernameLookup.bind(null, false)}><ICXCheckmark show={puffworldprops.ICX.userConfirmed} /></a>
                            <Tooltip position='under' content="Check for a valid ICX username or email address" />
                        </span>
                        <span className="message">{puffworldprops.ICX.toUserStatus}</span>


                    <div className="component">

                        <a className="icxNextButton icx-fade" style={ICX.buttonStyle} onClick={this.handleUsernameLookup.bind(null, 'send.message')}> {polyglot.t("button.msg")} <i className="fa fa-chevron-right small" /></a>
                        {' '}
                        <a className="icxNextButton icx-fade"style={ICX.buttonStyle} onClick={this.handleUsernameLookup.bind(null, 'send.file')}> {polyglot.t("button.file")} <i className="fa fa-chevron-right small" /></a>

                    </div>
                    <div className="textBox">
                    Looking for someone to
                        {' '}send to&#63; Say <a href="#" className="inline" onClick={this.messageUser.bind(null, 'mattasher')} >Hi!</a>
                        {' '}to <a href="#" className="inline" onClick={this.messageUser.bind(null, 'dann')} >one</a> of
                        {' '}<a href="#" className="inline" onClick={this.messageUser.bind(null, 'icx.adamrafeek')} >the developers</a>.
                    </div>
                    <br />
                    <div className={inviteClass}>
                        <ICXInvite />
                    </div>
                </div>
            </div>
            )
    },

    componentWillMount: function() {
        Events.pub('ui/event/send', {
            'ICX.userConfirmed': false,
            'ICX.nextStatus': false
        })
    },

    componentDidMount: function() {
        // Were we sent to user by props?
        //TODO: chose one variable to keep toUser in and apply it everywhere
        var userField = this.refs.toUser.getDOMNode()
        if((typeof(puffworldprops.view.icx.toUser) != "undefined") && (puffworldprops.view.icx.toUser)) {
            userField.value = puffworldprops.view.icx.toUser
        } else if ((typeof(puffworldprops.ICX.toUser) != "undefined") &&puffworldprops.ICX.toUser) {
            userField.value = puffworldprops.ICX.toUser
        }
        this.handleUsernameLookup()
        userField.focus()
    },


    verifyUsername: function() {
        return Events.pub('ui/events', {
            'ICX.userConfirmed': false,
            'ICX.nextStatus': false,
            'ICX.toUserStatus': ""
        })

    },

    handleSubmit: function (e) {
        if (e.which == 13) {
            e.preventDefault()
            this.handleUsernameLookup()
            return false
        }
    },

    handleUsernameLookup: function(nextStep) {

        var toUser = this.refs.toUser.getDOMNode().value
        var self = this

        // Check for zero length
        if(!toUser.length) {

            return Events.pub('ui/event', {
                'ICX.toUserStatus': 'Missing',
                'ICX.userConfirmed': false
            })
        }

        // Does this look like an email? If so, mark it valid and move on
        if(looksLikeEmailAddress(toUser)) {
            // If from button, move along to next page
            Events.pub('ui/events', {
                'ICX.userConfirmed': true,
                'ICX.nextStatus': true,
                'ICX.toUserStatus': '',
                'ICX.toUser': toUser,
                'ICX.wizard.type': nextStep
            })
            if(nextStep) {
                Events.pub('ui/events', {
                    'ICX.showInvite':true
                })
            }
            return false
        } else {
            Events.pub('ui/events', {
                'ICX.showInvite':false
            })
        }

        // remove initial . if it exists
        if (toUser.slice(0, 1) == '.')
            toUser = toUser.slice(1)

        // If username, coerce to correct format
         toUser = StringConversion.reduceUsernameToAlphanumeric(toUser, true) // True to allow a dot
         .toLowerCase()
         this.refs.toUser.getDOMNode().value = toUser

        var prom = PB.getUserRecord(toUser)

        prom.then(function(result) {

            // Was this from a button or the checkmark?

            // If from button, move along to next page
            Events.pub('ui/events', {
                'ICX.userConfirmed': true,
                'ICX.nextStatus': true,
                'ICX.toUserStatus': '',
                'ICX.toUser': toUser,
                'ICX.wizard.type': nextStep
            })

            if(nextStep) {
                Events.pub('ui/icx/screen', {
                    "view.icx.screen": nextStep
                })
            }

            return false

        })
            .catch(function(err) {

                return Events.pub('ui/events', {
                    'ICX.toUserStatus': 'Not found',
                    'ICX.nextStatus': false,
                    'ICX.userConfirmed': 'Not found'

                })
            })

        return false
    },

    messageUser: function(username) {
        this.refs.toUser.getDOMNode().value = username;
        return Events.pub('ui/events', {
            'ICX.userConfirmed': true,
            'ICX.nextStatus': true,
            'ICX.toUser': username,
            'ICX.toUserStatus': ""
        })
    }
})

var ICXFileUploader = React.createClass({ /* Good */
    render: function() {
    var uploadStyle = this.props.styling
    uploadStyle.width = 'auto'
        return (
        <div ref="dropbox" className="dropbox" onDragEnter={this.handleDrag} onDragExit={this.handleDrag} onDragOver={this.handleDrag} onDrop={this.handleDrop}>
            <span className="droplabel" ref="droplabel" style={{fontSize:ICX.calculated.pageHeaderTextStyle.fontSize}}>Drop file here or Choose File below</span>
            <br />
            <div className="icxFileButton icxNextButton icx-fade" style={uploadStyle}>
                <span>Choose File</span>
                <input type="file" className="uploadButton" id="fileToUpload" ref="uploadbutton" onChange={this.handleDisplaySelectedFile}/>
            </div>
        </div>
            )
    },

    componentWillMount: function() {
        //clean out any previous files that may have been already sent
        ICX.eventElement = {}
        ICX.fileprom = false
        ICX.filelist = false

    },

    handleDrag: function(event) {
        event.stopPropagation()
        event.preventDefault()
    },

    handleDrop: function(event) {
        event.stopPropagation()
        event.preventDefault()

        var element = event.dataTransfer
        /*var warning = this.refs.warning.getDOMNode()

        if (element.files[0].size > 1500000) {
            warning.style.display=''
        } else {
            warning.style.display='none'
        }*/
        this.refs.droplabel.getDOMNode().innerHTML = element.files[0].name

        // needs a file field in oreder to store the event properly on drop
        ICX.eventElement.files = element.files
        ICX.fileprom = PBFiles.openBinaryFile(element)
        ICX.filelist = element.files


        return Events.pub('ui/event/', {
            'ICX.nextStatus': true
        })


    },

    handleDisplaySelectedFile: function(event) {
        var element = event.target
        //var warning = this.refs.warning.getDOMNode()

        /*if (element.files[0].size > 1500000) {
            warning.style.display=''
        } else {
            warning.style.display='none'
        }*/
        this.refs.droplabel.getDOMNode().innerHTML = element.files[0].name
        ICX.eventElement = element
        ICX.fileprom = PBFiles.openBinaryFile(element)
        ICX.filelist = element.files

        return Events.pub('ui/event/', {
            'ICX.nextStatus': true
        })
    }
})

var ICXSendFile = React.createClass({ /* Good */

    render: function() {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor
        var invitedNote = ''
        if(!puffworldprops.ICX.wizard.invitedEmail) {
            invitedNote = 'Sending to user ' + puffworldprops.ICX.toUser
        } else {
            invitedNote = 'Sending to new user ' + puffworldprops.ICX.toUser + ' (' +  puffworldprops.ICX.wizard.invitedEmail + ')'
        }

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.send_file")} {puffworldprops.ICX.toUser}</div><br />
                <div className="contentWindow">
                    {invitedNote}
                    <br />
                Your file: <br />
                    <ICXFileUploader styling={headerStyle} />
                    <br />
                    Memo: <br />
                    <input type="text" ref="caption" style={{ 'width': '80%' }} onBlur={this.handleAddCaption} />
                    <br />
                    <ICXNextButton enabled={puffworldprops.ICX.nextStatus} goto={puffworldprops.ICX.nextStep} text={puffworldprops.ICX.nextStepMessage}  key="nextToSendFile" />
                    <br />
                    <div ref="warning" style={{'display':'none','color':'red'}}className="small-margin-bottom">
                        <span>{polyglot.t("store.warning")}</span>
                    </div>
                </div>
            </div>
        )
    },

    handleAddCaption: function() {
        if(!ICX.filelist) return false
        var caption = this.refs.caption.getDOMNode().value
        Events.pub('ui/reply', {
            'reply.caption': caption
        })
    },

    componentWillMount: function() {
        Events.pub('ui/event/', {
            'ICX.nextStep': 'send.file.finish',
            'ICX.nextStepMessage': 'SEND FILE',
            'ICX.wizard.type': 'file',
            'ICX.nextStatus': false
        })
    }
})

var ICXSendFileFinish = React.createClass({ /* Good */

    render: function () {

        var successMessage = '';
        if(puffworldprops.ICX.wizard.invitedEmail) {
            successMessage = <ICXNotifyEmail />
        } else {
            successMessage = puffworldprops.ICX.successMessage
        }

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.send_file_fin")}</div>
                <br />
                <div className="contentWindow">
                    <div>{successMessage}</div>
                    <br />
                    <ICXNextButton enabled={puffworldprops.ICX.messageSent} goto='send' text='Send another' />
                </div>
            </div>
            )
    },

    componentWillMount: function () {
        Events.pub('ui/event/', {
            'ICX.messageSent': false,
            'ICX.successMessage': ''
        })
        //start thinking
        Events.pub('ui/thinking', {
            'ICX.thinking': true
        })
    },

    handleSubmitSuccess: function () {
        Events.pub('ui/event/', {
            'ICX.messageSent': true,
            'ICX.successMessage': 'File sent!',
            'ICX.thinking': false,
            'reply.caption': ''
        })
    },

    handleSubmitError: function (err) {
        ICX.errors = err.message
        Events.pub('ui/event', {
            'icx.errorMessage': true,
            'ICX.thinking': false,
            'reply.caption': ''
        })
    },

    componentDidMount: function () {

        // Set information for this send
        var toUser = puffworldprops.ICX.toUser
        var type = 'file'
        var content = ICX.filelist[0]
        var parents = []
        var metadata = {}
        metadata.routes = [toUser]
        metadata.filename = content.name
        metadata.caption = puffworldprops.reply.caption
        var privateEnvelopeAlias = ''
        var self = this

        ICXAddPost(toUser, type, parents, ICX.fileprom, metadata, privateEnvelopeAlias, function (err) {
            if (!err) {
                self.handleSubmitSuccess()
            } else {
                self.handleSubmitError(err)
            }
        })

        return false
    }
})

var ICXSendMessage = React.createClass({ /* Good */
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        var invitedNote = ''
        if(puffworldprops.ICX.wizard.invitedEmail) {
            invitedNote = polyglot.t("send.msg_new_user") + puffworldprops.ICX.toUser + ' (' +  puffworldprops.ICX.wizard.invitedEmail + ')'
        } else {
            invitedNote = polyglot.t("send.msg") + puffworldprops.ICX.toUser
        }

        return (
            <div className="send-message" style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.send_msg")}</div>
                <div className="contentWindow">
                    <span className="bold">{invitedNote}</span>
                    <br />
                    <textarea autoCorrect="off" autoCapitalize="off" ref="messageText" style={{width: '100%', height: '50%'}} onChange={this.handleMessageText} onKeyDown={this.handleKeyDown}/>
                    <br />
                    <ICXNextButton enabled={puffworldprops.ICX.nextStatus} goto={puffworldprops.ICX.nextStep} text={puffworldprops.ICX.nextStepMessage}  key="nextToMessage" />
                    <br /><br />
                    <span className="shortcut">{polyglot.t("send.tip_label")}</span> The keyboard shortcuts <span className="shortcut">command-enter</span> (on Mac) or <span className="shortcut">control-enter</span> (on PC) will send your message right away.
                </div>

            </div>
            )
    },

    componentWillMount: function() {
        Events.pub('ui/event/', {
            'ICX.nextStep': 'send.finish',
            'ICX.nextStepMessage': 'SEND',
            'ICX.wizard.type': 'message',
            'ICX.nextStatus': false
        })
    },

    componentDidMount: function() {
        this.refs.messageText.getDOMNode().focus()
    },

    handleKeyDown: function(e) {
        if(e.keyCode == 13 && (e.metaKey || e.ctrlKey)) {
            if(puffworldprops.ICX.nextStatus) {
                return Events.pub('/ui/icx/screen',
                    {"view.icx.screen": puffworldprops.ICX.nextStep}
                )
            }
        }
    },

    handleMessageText: function () {
        ICX.messageText = this.refs.messageText.getDOMNode().value
        if(ICX.messageText.length > 1) {
            return Events.pub('ui/event/', {
                'ICX.nextStatus': true
            })
        } else {
            return Events.pub('ui/event/', {
                'ICX.nextStatus': false
            })
        }
    }
})

var ICXSendMessageFinish = React.createClass({ /* Good */

    render: function () {
        var successMessage = ''
        if(puffworldprops.ICX.wizard && puffworldprops.ICX.wizard.invitedEmail) {
            successMessage = <ICXNotifyEmail />
        } else {
            successMessage = puffworldprops.ICX.successMessage
        }

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.send_msg_fin")}</div>
                <br />
                <div className="contentWindow">
                    <div>{successMessage}</div>
                    <br />
                    <ICXNextButton enabled={puffworldprops.ICX.messageSent} goto='send' text='Send another' />
                </div>
            </div>
        )
    },

    componentWillMount: function () {
        Events.pub('ui/event/', {
            'ICX.messageSent': false,
            'ICX.successMessage': ''
        })
    },

    handleSubmitSuccess: function () {
        Events.pub('ui/event/', {
            'ICX.messageSent': true,
            'ICX.successMessage': 'Message sent!'
        })
    },

    handleSubmitError: function (err) {
        ICX.errors = err.message
        Events.pub('ui/event', {
            'ICX.messageSent': false,
            'ICX.successMessage': ICX.messageText,
            'icx.errorMessage': true
        })
    },

    componentDidMount: function () {

        // Set information for this send
        var toUser = puffworldprops.ICX.toUser
        var type = 'text'
        var content = ICX.messageText
        var parents = []
        var metadata = {}
        metadata.routes = [toUser]
        var privateEnvelopeAlias = ''
        var self = this

        ICXAddPost(toUser, type, parents, content, metadata, privateEnvelopeAlias, function(err) {
            if(!err) {
                // No error, proceed with GUI Cleanup
                self.handleSubmitSuccess()
            } else {
                // Error handling
                self.handleSubmitError(err)
            }
        })
        return false
    }
})

var ICXNotifyEmail = React.createClass({


    render: function () {
        var polyglot = Translate.language[puffworldprops.view.language]
        ICX.buttonStyle.backgroundColor = ICX.currScreenInfo.color

        var textAreaContent = polyglot.t("invite.email_1") + puffworldprops.ICX.toUser + polyglot.t("invite.email_2") + puffworldprops.ICX.wizard.prompt
        return (
            <span>
                {polyglot.t("invite.sent_1")}<em>{polyglot.t("invite.sent_2")}</em>{polyglot.t("invite.sent_3")} {puffworldprops.ICX.wizard.invitedEmail}
                <br /><br />
                Your email: <input ref="from" type="text" />
                <br />
                <a style={ICX.buttonStyle} className="icxNextButton" onClick={this.handleSendNotificationEmail}>Send your friend a notification email</a>

            </span>
        )
    },

    handleSendNotificationEmail: function() {
        // To email
        // Shared question
        // Sender email
        var to = puffworldprops.ICX.wizard.invitedEmail
        var sender = this.refs.from.getDOMNode().value
        var question = puffworldprops.ICX.wizard.prompt
        var username = puffworldprops.ICX.toUser

        PB.Net.post('https://i.cx/api/mandrill/', {to: to, sender: sender, question: question, username: username})

    }
})

var ICXNewUser = React.createClass({
    mixins: [TooltipMixin],

    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        ICX.buttonStyle.backgroundColor = ICX.currScreenInfo.color //'rgba(0, 3, 82, 1)'

        //CSS for toggle passphrase masking
        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-eye-slash': puffworldprops.ICX.hidePassphrase,
            'fa-eye': !puffworldprops.ICX.hidePassphrase,
            'green': !puffworldprops.ICX.hidePassphrase
        })
        var textClass = cb({
            'password': puffworldprops.ICX.hidePassphrase,
            'text': !puffworldprops.ICX.hidePassphrase
        })


        if(typeof puffworldprops.ICX.wizard != 'undefined') {
            var wizard = puffworldprops.ICX.wizard
            if(wizard.sequence == 'send' || wizard.sequence == 'store') {
                var extraInfo = 'In order to send a message or store a file, please sign up for an account by choosing a username and password. ' +
                    'You’ll be able to download your password later.'
            }

        } else {
            var extraInfo = 'Please sign up for an account by choosing a username and password. ' +
                'You’ll be able to download your password later.'
        }

        return (
            <div className="icx-screen icx-newuser">
                <div style={headerStyle}>{polyglot.t("header.signup")}</div>
                <div className="contentWindow">
                    <div className="textBox">{extraInfo}</div><br />

                    <div><b>{polyglot.t("signup.username")}</b></div>

                    <form onSubmit={this.handleSubmit}><input type="text" name="username" ref="username" defaultValue="" style={{size: 16, width:'45%'}} onChange={this.handleUsernameFieldChange} onBlur={this.handleUsernameLookup} /></form>
                    <span className="relative">
                        <a href="#" onClick={this.handleUsernameLookup}>{' '}<ICXCheckmark show={puffworldprops.ICX.newUser.usernameStatus} /></a>
                        <Tooltip position='under' content="Check for availability" />
                    </span>
                    <span className="relative">
                        <a href="#" onClick={this.handleGenerateRandomUsername}><i className="fa fa-refresh" /></a>
                        <Tooltip position='under' content="Generate a new username" />
                    </span>
                    {' '}<span className="message">{puffworldprops.ICX.newUser.usernameMessage}</span>
                    <br />
                    <br />
                    <div><b>Password:</b></div>
                    <input spellCheck="false" type={textClass} autoCorrect="off" autoCapitalize="off" ref="passphrase" style={{width: '50%'}} onChange={this.handleRecheckPassphrase}/>{' '}<ICXCheckmark show={puffworldprops.ICX.newUser.passphraseStatus} />
                    <span className="relative">
                        <a href="#" onClick={this.handleGenerateRandomPassphrase}><i className="fa fa-refresh" /></a>
                        <Tooltip position='under' content="Generate a new password" />
                    </span>
                    {' '}<span className="message">{puffworldprops.ICX.newUser.passphraseMessage}</span>
                    <br />
                    <a className="inline" onClick={this.togglePassphraseView}><i className={cbClass}></i><span className="small">Show / Hide password</span></a>
                    <br /><br />
                    <b>Avatar:</b><br />
                    <canvas id="avatarCanvas" width="105" height="105">
                    </canvas>
                    <br />
                    <div> Or Upload your own avatar
                        <input type="file" id="imageLoader" name="imageLoader" ref="imageLoader" onChange={this.handleImageCheck}/>
                    </div>
                    <a style={ICX.buttonStyle} onClick={this.handleRegisterName} className="icxNextButton icx-fade"> {puffworldprops.ICX.nextStepMessage} <i className="fa fa-chevron-right small" /></a>
                </div>
            </div>
            )
    },

    /*
     <br/>
     <b>Avatar:</b>
     <div>
     <input type="file" id="imageLoader" name="imageLoader" ref="imageLoader" onChange={this.handleImageLoad}/>
     </div>
     */
    togglePassphraseView: function() {
        return Events.pub('ui/event', {
            'ICX.hidePassphrase': !puffworldprops.ICX.hidePassphrase
        })
    },

    componentWillMount: function() {
        Events.pub('ui/event', {
            'ICX.hidePassphrase': false
        })
    },

    componentDidMount: function() {
        this.handleResetCheckboxes()
        this.handleAvatarInit()
        var wizard = puffworldprops.ICX.wizard

        if(typeof wizard === 'undefined') {
            // User hasn't clicked SEND or STORE
            return Events.pub('ui/event', {
                'ICX.nextStep': 'dashboard',
                'ICX.nextStepMessage': 'Finish'
            })
        } else {
            // User coming from Send or Store, put them back there after they register
            return Events.pub('ui/event', {
                'ICX.nextStep': wizard.sequence,
                'ICX.nextStepMessage': 'Next'
            })
        }

    },

    handleAvatarInit: function() {
        var color = PB.Crypto.getRandomItem(ICX.colornames)
        var animal = generateRandomAnimal()
        getAvatar(color, animal)
    },

    handleGenerateRandomUsername: function() {
        var adj = PB.Crypto.getRandomItem(ICX.adjectives)
        var color = PB.Crypto.getRandomItem(ICX.colornames)
        var animal = generateRandomAnimal()

        this.refs.username.getDOMNode().value = adj + color + animal
        getAvatar(color, animal)
        this.handleUsernameLookup()

        return false
    },

    handleGenerateRandomPassphrase: function() {
        // Everybody loves the exponential!
        var numb = 4
        while(PB.Crypto.random()>0.2) {
            numb++
        }

        this.refs.passphrase.getDOMNode().value = generatePassphrase(ICX.passphraseWords,numb)

        Events.pub('ui/event', {
            'ICX.newUser.passphraseStatus': true,
            'ICX.newUser.passphraseMessage': ''
        })

        return false
    },

    handleResetCheckboxes: function() {
        Events.pub('ui/event', {
            'ICX.newUser.usernameStatus': false,
            'ICX.newUser.usernameMessage': false,
            'ICX.newUser.passphraseStatus':false
        })
    },

    handleRecheckPassphrase: function() {
        var passphrase = this.refs.passphrase.getDOMNode().value
        if(passphrase.length < 8) {
            Events.pub('ui/event', {
                'ICX.newUser.passphraseStatus': false,
                'ICX.newUser.passphraseMessage': 'Too short'

            })
            return false

        } else {
            Events.pub('ui/event', {
                'ICX.newUser.passphraseStatus': true,
                'ICX.newUser.passphraseMessage': ''

            })
            return true
        }
    },

    handleUsernameFieldChange: function() {
        var username = this.refs.username.getDOMNode().value
        var finalChar = username.charAt(username.length-1)

        username = StringConversion.reduceUsernameToAlphanumeric(username, /*allowDot*/true)
            .toLowerCase()

        // Strip out dots as well
        username = username.replace('.','')

        this.refs.username.getDOMNode().value = username

        if(username.length < 10) {
            Events.pub('ui/event', {
                'ICX.newUser.usernameStatus': 'short',
                'ICX.newUser.usernameMessage': 'Too Short'
            })
        } else {
            Events.pub('ui/event', {
                'ICX.newUser.usernameStatus': false,
                'ICX.newUser.usernameMessage': false
            })
        }


        if(finalChar == ' ') {
            this.handleUsernameLookup()
            return false
        }
    },

    handleSubmit: function(e) {
        e.preventDefault()
        this.handleUsernameLookup()
        return false
    },

    handleUsernameLookup: function() {
        var username = this.refs.username.getDOMNode().value
        var self = this

        // Check for zero length
        if(!username.length) {

            Events.pub('ui/event', {
                'ICX.newUser.usernameStatus': 'missing',
                'ICX.newUser.usernameMessage': 'Missing'
            })
            return false
        } else if(username.length < 10) {
            Events.pub('ui/event', {
                'ICX.newUser.usernameStatus': 'short',
                'ICX.newUser.usernameMessage': 'Too Short'
            })
            return false
        }

        // Cancel if we're already checking another username
        if(puffworldprops.ICX.newUser.checkingUsername) {
            // TODO: show a warning message, or disable the button on 'Busy' state
            Events.pub('ui/username/busy-message', {})
            return false
        }

        if (username.length > CONFIG.standards.usernames.maxLength) {
            Events.pub('ui/event', {
                'ICX.newUser.usernameStatus': 'long',
                'ICX.newUser.usernameMessage': 'Too Long'
            })
            return false
        }
        var prom = PB.getUserRecord(username)

        Events.pub('ui/username/requested', {
            'ICX.newUser.requestedUsername': username,
            'ICX.newUser.checkingUsername': username,
            'ICX.newUser.usernameMessage': 'Checking...',
            'ICX.newUser.usernameStatus': false
        })

        prom.then(function(result) {

            Events.pub('ui/username/taken', {
                'ICX.newUser.usernameStatus': 'red',
                'ICX.newUser.usernameMessage': 'Already registered',
                'ICX.newUser.checkingUsername': ''
            })

        }).catch(function(err) {

            Events.pub('ui/username/taken', {
                'ICX.newUser.usernameStatus':  true,
                'ICX.newUser.usernameMessage': 'Available',
                'ICX.newUser.checkingUsername': false
            })
        })

        return false
    },

    handleImageCheck: function() {
        var self = this
        var reader = new FileReader()
        var file = this.refs.imageLoader.getDOMNode().files[0]
        var validImage = false

        reader.onload = function(event){
            var buffer = reader.result.slice(0,4)
            var int32View = new Int32Array(buffer)
            //var validImage = false
            switch(int32View[0]) {
                case 1196314761:    // "image/png"
                    validImage = true
                    break;
                case 944130375:     // "image/gif"
                    break;
                case 544099650:     // "image/bmp"
                    validImage = true
                    break;
                case -520103681:    // "image/jpg"
                    validImage = true
                    break;
                default:            // "unknown"
                    // TODO: Throw error
                    break;
            }
            if(validImage) self.handleAvatarUpload(file)
        }

        reader.readAsArrayBuffer(file)
    },

    handleAvatarUpload: function(file) {
        var self   = this
        var reader2 = new FileReader()

        reader2.onload = function(event){
            return Events.pub('ui/event', {
                'profile.customAvatar': true,
                'profile.avatarUrl': event.target.result
            })
        }

        reader2.readAsDataURL(file)
        return false
    },

    handleRegisterName: function() {
        if( !this.handleRecheckPassphrase() ) {
            return false
        }

        var requestedUsername = this.refs.username.getDOMNode().value
        var passphrase = this.refs.passphrase.getDOMNode().value

        toggleSpinner()

        try {
            createICXUser(requestedUsername, passphrase, function() {
                toggleSpinner()

                userHasShells(PB.getCurrentUsername(), function(numShells) {
                    Events.pub('ui/event',{
                        'ICX.hasShells': numShells
                    })
                })
            })
        }
        catch(err) {
            toggleSpinner()
            ICX.errors = "ERROR: " + err.message
            return Events.pub('/ui/icx/error', {"icx.errorMessage": true})
        }

    }
})

var ICXLogin = React.createClass({
    mixins: [TooltipMixin],

    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor

        var baseFontH = ICX.calculated.baseFontH

        var polyglot = Translate.language[puffworldprops.view.language]

        var labelStyle = {
            marginRight: baseFontH + 'px'
        }

        var inputStyle = {
            display: 'inline-block'
        }

        // CSS for checkboxes
        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-eye-slash': puffworldprops.ICX.hidePassphrase,
            'fa-eye': !puffworldprops.ICX.hidePassphrase,
            'green': !puffworldprops.ICX.hidePassphrase
        })
        var textClass = cb({
            'password': puffworldprops.ICX.hidePassphrase,
            'text': !puffworldprops.ICX.hidePassphrase
        })

        return (

            <div className="icx-screen icx-login" style={ICX.calculated.baseTextStyle}>
                <div style={headerStyle}>{polyglot.t("header.login")}</div>

                <div className="contentWindow">
                    <div className="relative">
                        Select an identity file:
                        <Tooltip content="Authenticate with this browser using your private identity file" />
                    </div>
                    <ICXFileUploader styling={headerStyle} />
                    <a style={ICX.buttonStyle} onClick={this.handleLoginWithFile} className="icxNextButton icx-fade"> Authenticate <i className="fa fa-chevron-right small" /></a>

                    <br /><br />
                    <i><em>{polyglot.t("login.or")}</em></i>
                    <br /><br />
                    <div style={labelStyle}><b>{polyglot.t("login.username")}</b></div>
                    <input type="text" name="username" ref="username" defaultValue='' style={{size: 16, width:'60%'}} onBlur={this.handleUsernameLookup} onChange={this.verifyUsername} />
                    <span className="relative">
                        <a href="#" onClick={this.handleUsernameLookup}><ICXCheckmark show={puffworldprops.ICX.usernameStatus} /></a>
                        <Tooltip position='under' content="Verify your username" />
                    </span>
                    <span className="message">{puffworldprops.ICX.usernameStatus}</span>

                    <br /><br />
                    <div className="relative">
                        <b>Password:</b>
                        <Tooltip content="This is the password you chose when signing up." />
                    </div>
                    <input type={textClass} spellCheck="false" autoCorrect="off" autoCapitalize="off" name="defaultKey" ref="defaultKey" style={{width: '60%'}} onKeyDown={this.handleKeyDown}/>
                    <span className="message">{puffworldprops.ICX.defaultKey}</span>
                    <br />
                    <a className="inline" onClick={this.togglePassphraseView}><i className={cbClass}></i><span className="small">Show password</span></a>
                    <br /><br />
                    <a style={ICX.buttonStyle} onClick={this.handleLogin} className="icxNextButton icx-fade"> Authenticate <i className="fa fa-chevron-right small" /></a>
                </div>
            </div>
            )
    },

    togglePassphraseView: function() {
        return Events.pub('ui/event', {
         'ICX.hidePassphrase': !puffworldprops.ICX.hidePassphrase
         })
    },

    handleKeyDown: function(e) {
        if(e.keyCode == 13 && (e.metaKey || e.ctrlKey)) {
            this.handleLogin()
        }
    },

    handleUsernameLookup: function () {
        var username = this.refs.username.getDOMNode().value
        var self = this

        // Check for zero length
        if (!username.length) {
            Events.pub('ui/event', {
                'ICX.usernameStatus': 'Missing'
            })
            return false
        }
        var startsWithICX = (username.substring(0,4) == "icx.")

        var prom = PB.getUserRecord(username)

        prom.then(function (result) {
            Events.pub('ui/puff-packer/userlookup',{
                'ICX.usernameStatus': true
            })
        })
            .catch(function (err) {
                if(!startsWithICX) {
                    Events.pub('ui/puff-packer/userlookup/failed', {
                        'ICX.usernameStatus': 'Missing \'icx.\' prefix'
                    })
                } else {
                    Events.pub('ui/puff-packer/userlookup/failed',{
                        'ICX.usernameStatus': 'Invalid Username'
                    })
                }
            })
        return false
    },

    componentDidMount: function() {
      Events.pub('ui/event', {
          'ICX.hidePassphrase':true
      })
    },

    componentWillMount: function () {
        Events.pub('ui/event', {
            'ICX.usernameStatus': false,
            'ICX.defaultKey': false
        })
    },

    verifyUsername: function () {
        var username = this.refs.username.getDOMNode().value
        var finalChar = username.charAt(username.length-1)

        //THINK: IS this really necessary??
        //THINK: Not really, since there is 1 dot at max in usernames anyway
        // username = StringConversion.reduceUsernameToAlphanumeric(username, /*allowDot*/true)
        //     .toLowerCase()
        // this.refs.username.getDOMNode().value = username

        // If the last character is a space, then trigger usernameLookup
        if(finalChar == ' ') {
            this.handleUsernameLookup()
            return false
        } else {
            this.handleResetCheckboxes()
        }
    },

    handleResetCheckboxes: function () {
        Events.pub('ui/event', {
            'ICX.usernameStatus': false,
            'ICX.defaultKey': false
        })
    },

    handleLoginWithFile: function() {
        // TODO: start spinner here
        
        fileprom = PBFiles.openTextFile(ICX.eventElement)
        fileprom.then(function(content) {
            ICXAuthenticateIdFile(content, function (err, status) {
                if(!err) {
                    Events.pub('/ui/icx/screen', {"view.icx.screen": 'dashboard'})
                } else {
                    ICX.errors = err
                    Events.pub('ui/event', { 'ICX.defaultKey':'Incorrect key' })
                    Events.pub('/ui/icx/error', {"icx.errorMessage": true})

                    return false
                }
            })
        })

        return false
    },

    handleLogin: function() {
        // TODO: better erro handling
        
        // First convert to private key, then to public, then verify against DHT
        var self = this

        // Check for zero length of username
        var username = this.refs.username.getDOMNode().value
        if (!username.length) {

            Events.pub('ui/event', {
                'ICX.usernameStatus': 'Missing'
            })
            return false
        }

        // Check for zero length of passphrase
        var passphrase = this.refs['defaultKey'].getDOMNode().value
        if (!passphrase.length) {

            Events.pub('ui/event', {
                'ICX.defaultKey': 'Missing'
            })
            return false
        }

        ICXAuthenticateUser(username, passphrase, function (err, status, returned) {
            if (!returned) {
                return false
            }
            if(!err) {
                Events.pub('ui/event', {
                    'ICX.defaultKey': true,
                    'ICX.usernameStatus': true
                })
                Events.pub('/ui/icx/screen', {"view.icx.screen": "dashboard"})
                if(puffworldprops.view.icx.firstLogin) {
                    return Events.pub('/ui/icx/screen', {"view.icx.screen": "changepassphrase"})
                }
            } else {
                ICX.errors = err
                Events.pub('ui/event', { 'ICX.defaultKey': status})
                Events.pub('/ui/icx/error', {"icx.errorMessage": true})

                return false
            }
        })

        return false
    }
})

var ICXDashboard = React.createClass({ /* Good */
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        var username = PB.getCurrentUsername()

        var filename = username + "Identity.json"

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.dashboard")} {username}</div><br />
                <div className="contentWindow">

                    <a href="#" className="inline" onClick={this.handleGoTo.bind(null, 'home.table')}>
                        <i className="fa fa-fw fa-list" />
                        {polyglot.t("dashboard.tableview")}
                    </a>
                    <br />
                    <span className="textBox small">
                        View the messages and files you've sent and received, as well as the encrypted files you've stored
                        to the cloud.<br /><br />
                    </span>

                    <a href="#" className="inline" onClick={this.handleGoTo.bind(null, 'encryptdecrypt')}>
                        <i className="fa fa-fw fa-file-excel-o" />
                        {polyglot.t("dashboard.filesys")}
                    </a>
                    <br />
                    <span className="textBox small">
                    You can encrypt and decrypt files right in your web browser. Encrypted files can be backed up to the
                    cloud or stored on your computer.
                        <br /><br />
                    </span>

                    <a href="#" className="inline" ref="createFileButton" onClick={this.handleDownloadIdentityFile}>
                        <i className="fa fa-fw fa-download" />
                        Save your identity file
                    </a>
                    <br />
                    <span className="textBox small">
                    Generate a file that can be used to move your identity from one web
                    browser to another, or to log in. This is a plain text file with your username and password, it
                    is <em>not</em> encrypted and should never be stored to the cloud.
                    <br /><br />
                    </span>
                    <a href="#" className="inline" onClick={this.handleGoTo.bind(null, 'changepassphrase')}>
                        <i className="fa fa-fw fa-gears" />
                        {' '}Change your password
                    </a>
                    <br />
                    <span className="textBox small">
                        <span className="shortcut bold">Tech details:</span> Your old password will be used to sign a message
                    requesting a new public key, based on your new password. Neither password will be sent over the net.

                        <br /><br />
                    </span>

                    <a href="#" ref="fileLink" download={filename} ><span style={{display: 'none'}}>{filename}</span></a>

                    <a href="#" className="inline" onClick={this.handleSignOut}>
                        <i className="fa fa-fw fa-sign-out" />
                        {polyglot.t("dashboard.logout")}
                    </a>
                    <br />
                    <span className="textBox small">
                    Remove all traces of your identity from this web browser. If you have not yet stored your password or
                    saved your identity file (see link above), there will be no way to recover your files or messages.
                        <br /><br />
                    </span>
                </div>
            </div>
            )
    },

    componentDidMount: function() {
        // resetting ICX.wizard here
        var browser = getBrowser()
        if (browser == "Safari") {
            ICX.errors = "WARNING: Safari does not support saving files created in the browser itself. " +
                "As a result, you may not be able to download identity files or files you have encrypted."

            Events.pub('/ui/icx/error', {"icx.errorMessage": true})
        }
        Events.pub('ui/event', {
            'ICX.wizard': undefined,
            'ICX.nextStatus': false
        })
    },

    handleGoTo: function(screen) {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
    },

    handleDownloadIdentityFile: function() {
        var content = JSON.stringify(PB.formatIdentityFile(),null,'\n')
        var filename = PB.getCurrentUsername() + "Identity.json"

        if (getBrowser() == "IE") {
            window.navigator.msSaveBlob(PBFiles.prepBlob(content), filename)
        } else {
            fileLink = this.refs.fileLink.getDOMNode()
            fileLink.href = PBFiles.prepBlob(content)
            fileLink.download = filename
            fileLink.click()
        } 
    },

    handleSignOut: function() {
        var userToRemove = PB.getCurrentUsername()

        // Confirm alert first
        var msg = "WARNING: If you have not yet saved your username and password, hit Cancel and click on your username and choose Save your identity file. Are you sure you wish to continue?"

        var r = confirm(msg)
        if (r == false) {
            return false
        }

        PB.removeIdentity(userToRemove)
        Events.pub('user/'+userToRemove+'/remove', {})
        return Events.pub('/ui/icx/screen', {"view.icx.screen": this.props.goto})
    }
})

var ICXChangePassphrase = React.createClass({ /* Good */
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var mustChangeMsg = ''
        if(puffworldprops.view.icx.firstLogin) {
            var mustChangeMsg = <div>This appears to be your first login, using a shared secret. If you have not already done so, please change your passphrase right away.<br /></div>
        }

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor

        var username = PB.getCurrentUsername()

        //CSS for toggle passphrase masking
        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-eye-slash': puffworldprops.ICX.hidePassphrase,
            'fa-eye': !puffworldprops.ICX.hidePassphrase,
            'green': !puffworldprops.ICX.hidePassphrase
        })
        var textClass = cb({
            'masked': puffworldprops.ICX.hidePassphrase,
            'gudea': !puffworldprops.ICX.hidePassphrase
        })

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("pass.change")} {username}</div>
                {mustChangeMsg}
                <div className="contentWindow">

                    NOTE: If you downloaded an identity file, it will no longer work after updating your passphrase.
                    You’ll need to download a new identity file after changing your passphrase.

                    <br /><br />
                    <b>New passphrase:</b>
                    <br />
                    <textarea spellCheck="false" className={textClass} autoCorrect="off" autoCapitalize="off" ref="passphrase" style={{width: '50%', height: '20%'}} onKeyDown={this.handleKeyDown} onChange={this.handleRecheckPassphrase}/>
                    {' '}<ICXCheckmark show={puffworldprops.ICX.newUser.passphraseStatus} />{' '}<i className={cbClass} onClick={this.togglePassphraseView} ></i>
                    <br />
                    <a style={ICX.buttonStyle} onClick={this.handleButtonPress} className="icxNextButton icx-fade"> {polyglot.t("button.change")} <i className="fa fa-chevron-right small" /></a>
                </div>
            </div>
        )
    },

    handleKeyDown: function(e) {
        if(e.keyCode == 13 && (e.metaKey || e.ctrlKey)) {
            if(this.handleRecheckPassphrase()) {
                this.handleChangePassphrase()
            }
        }
    },

    handleButtonPress: function() {
        if(this.handleRecheckPassphrase()) {
            this.handleChangePassphrase()
        }
    },

    togglePassphraseView: function() {
        return Events.pub('ui/event', {
            'ICX.hidePassphrase': !puffworldprops.ICX.hidePassphrase
        })
    },

    handleRecheckPassphrase: function() {
        var passphrase = this.refs.passphrase.getDOMNode().value
        if(passphrase.length < 8) {
            Events.pub('ui/event', {
                'ICX.newUser.passphraseStatus': false,
                'ICX.newUser.passphraseMessage': 'Too short'

            })
            return false

        } else {
            Events.pub('ui/event', {
                'ICX.newUser.passphraseStatus': true,
                'ICX.newUser.passphraseMessage': ''
            })
            return true
        }
    },

    handleChangePassphrase: function() {
        Events.pub('ui/thinking', { 'ICX.thinking': true })

        var newPassphrase = this.refs.passphrase.getDOMNode().value
        var prom = updatePassphrase(newPassphrase)
        prom.then(function(result) {
            Events.pub('ui/thinking', { 'ICX.thinking': false })
            Events.pub('/ui/icx/error', { "ICX.errorMessage": false })
            Events.pub('/ui/icx/screen', {"view.icx.screen": 'changepassphrase.finish'})
        })
        .catch(function (err) {
            ICX.errors = "FAILED " + err
            Events.pub('ui/thinking', { 'ICX.thinking': false })
            Events.pub('/ui/icx/error', {"icx.errorMessage": true})
            PB.onError('Failed to complete passphrase change', err)
        })
    }
})

var ICXChangePassphraseFinish = React.createClass({ /* Good */
    render: function () {
        var polyglot = Translate.language[puffworldprops.view.language]
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        var username = PB.getCurrentUsername()

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("pass.change")} {username}</div><br />
                <div className="contentWindow">
                {polyglot.t("pass.success")}<a href="#" className="inline" onClick={this.handleGoToDashboard}>dashboard page</a>.
                </div>
            </div>
            )
    },

    handleGoToDashboard: function() {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'dashboard'});
    },

    componentDidMount: function() {
        // TODO clear firstLogin from puffworldprops.view.icx
    }
})

var ICXTableView = React.createClass({ /* Good */

    render: function () {

        var viewprops = this.props.view || {}

        return (
            <div className="icx-tableview">
                <TableView view={viewprops} table={viewprops.table}/>
            </div>
            )
    }
})

var ICXLearn = React.createClass({ /* Good */

    render: function () {
        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        var w = window.innerWidth
        var h = window.innerHeight

        var vidW = Math.floor( (1-(ICX.config.content.insets.left+ICX.config.content.insets.right))*w *.98 )
        var vidH = Math.floor(vidW * 720/1280)
        var vidURL = "//www.youtube.com/embed/mzjO8uxZjKQ"

        // Make sure height no more than 50% of our content area
        var maxH = Math.floor((1-(ICX.config.content.insets.top+ICX.config.content.insets.bottom))*h/2)
        if(vidH > maxH) {
            vidH = maxH
            vidW = maxH * 1280/720
        }

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.learn")}</div><br />
                <div className="iframeHolder">
                    <iframe width={vidW} height={vidH} src={vidURL} frameBorder="0" allowFullScreen></iframe>
                </div>
                <div className="contentWindow">
                <br />
                <span className="textBox">{polyglot.t("learn.more")}<a href="#" className="inline" onClick={this.handleGoInDepth}>{polyglot.t("learn.link")}</a>.</span>
                </div>
            </div>
        )
    },

    handleGoInDepth: function() {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'indepth'});
    }
})

var ICXIndepth = React.createClass({ /* Good */

    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        var textStyle = {
            fontSize: '85%'
        }

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.indepth")}</div>
                <br />
                <div className="contentWindow" style={textStyle}>
                    <div className="textBox">
                    To send a message or file, I.CX uses the public key of your recipient to encrypt your content so that only they can open it. All of your content is encrypted client side (right in your web browser), using javascript and trusted cryptographic libraries. There is no master key that opens all messages, no backdoor, no way to reset someone else’s secret code. No passwords are ever sent over the network.

                    <br /><br />

                    We even have a way to load your identity into a web browser without typing in your passphrase, just in case you happen to be in a public location.

                    <br /><br />
                    I.CX uses the <a href="http://www.puffball.io" target="_new">puffball platform</a> to handle distribution of encrypted content in a format known as a "puff". For detailed technical information about puffs visit the <a href="https://github.com/puffball/puffball" target="_new">github repository</a>.

                    </div>
                </div>
            </div>

            )
    }
})

var ICXAbout = React.createClass({ /* Good */

    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        //    <img src={getProfilePuff('mattasher').payload.content} className="iconSized" />{' '}

        // <img src={getProfilePuff('icx.adamrafeek').payload.content} className="iconSized" />{' '}

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.about")}</div>
                <div className="contentWindow">
                <span className="textBox"><span className="shortcut"><b>I.CX</b></span>, or “I see X”, is a private messaging and file sending system built on the open source <a href="http://www.puffball.io" className="inline" target="_blank">{polyglot.t("about.platform")}</a>. Our office is at <a href="http://bentomiso.com" className="inline" target="_new">Bento Miso</a> in Toronto.</span>
                    <br /><br />
                    <img src="img/icx/theCrew.jpg" style={{width: '90%'}}/><br />
                    <br />
                    <b>From left to right:</b><br />
                    <a href="#" className="inline small bold" onClick={this.messageUser.bind(null, 'icx.mike')}>Michael Guo</a>
                    <span className="textBox small"> has several years of experience developing websites and software applications, and helped Rogers redesign their SportsNet.ca news portal. In his spare time he works on an online mafia game engine.</span>
                    <br /><br />

                    <a href="#" className="inline small bold" onClick={this.messageUser.bind(null, 'icx.bsharwood')}>Brian Sharwood</a>
                    <span className="textBox small"> is an experienced start-up executive who scaled 3 ventures up from early days to well established businesses. He was COO of HomeStars where he helped shape the company strategy and refocus to achieve growth, while raising three rounds of funding and building the team from 3 to 45 employees. He has consulted for many Canadian technology and telecom companies. Early in his career Brian started and operated a small bistro in Toronto. An outlet for his passion in wines, it was his first successful entrepreneurial exit. Brian holds an MBA in entrepreneurship from Babson college and a BA from UBC.</span>
                    <br /><br />

                    <a href="#" className="inline small bold" onClick={this.messageUser.bind(null, 'mattasher')}>Matt Asher</a> <span className="textBox small">has a background in journalism, print publishing, and web design. He graduated from University of Toronto with a degree in Statistics and spent several years creating complex biological and financial simulations using <a href="http://www.statisticsblog.com/tag/r/" target="_new" className="inline">R</a>. He blogs at <a href="http://www.mattasher.com" target="_new" className="inline">Mattasher.com</a></span>
                    <br /><br />

                    <a href="#" className="inline small bold" onClick={this.messageUser.bind(null, 'dann')}>Dann Toliver</a> <span className="textBox small">is a senior developer with a degree in Math from the University of Alaska. He runs a regular JavaScript meetup group as well as several other programming gatherings. This past summer Dann gave a talk at Strange Loop on Visualizing Persistent Data Structures.</span>
                    <br /><br />

                    <a href="#" className="inline small bold" onClick={this.messageUser.bind(null, 'icx.adamrafeek')}>Adam Rafeek</a> <span className="textBox small">is a third year student in the Computer Science program at the University of Waterloo. He created a widget to help Waterloo students avoid long lines at popular campus locations. Originally from the twin island republic of Trinidad and Tobago, Adam helped build houses for Habitat for Humanity in rural areas.</span>

                </div>
            </div>
            )
    },

    gotoLearn: function() {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'learn'});
    },

    messageUser: function(username) {
        return Events.pub('/ui/icx/screen', {
            "view.icx.screen": 'send',
            "ICX.toUser": username,
            "view.icx.toUser":username
        })
    }
})

var ICXHome = React.createClass({ /* Good */

    render: function () {
        return (
            <span></span>
            )
    },
    componentDidMount: function() {
        Events.pub('ui/event', {
            'ICX.wizard': undefined,
            'ICX.nextStatus': false
        })
    }
})

var ICXFileConverter = React.createClass({ /* Good */

    render: function () {
        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor
        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.filesys")}</div>
                <div className="contentWindow">
                    <span className="fa fa-stack"><i className="fa fa-square-o fa-stack-2x"></i><i className="fa fa-fw fa-lock fa-stack-1x"></i></span>{polyglot.t("filesys.enc")}
                    <br /><br />

                    <ICXFileUploader styling={headerStyle} />
                    <br />
                    <a className="icxNextButton icx-fade" style={headerStyle} onClick={this.handleEncryptFile}> Encrypt File <i className="fa fa-lock" /></a>
                    <br /><br />
                    <a ref="encryptedLink" download="no_file_selected" style={{display:'none'}} className="inline"><i className="fa fa-fw fa-download" /> {polyglot.t("filesys.save_enc")}</a>
                    <span style={{display:'none'}} ref="encryptError" className="red">Permission Denied: You need to be logged in to encrypt files</span>
                    <br />
                    <b>OR</b>
                    <br /><br />
                    <span className="fa fa-stack"><i className="fa fa-square-o fa-stack-2x"></i><i className="fa fa-fw fa-unlock fa-stack-1x"></i></span>{polyglot.t("filesys.dec")}
                    <br /><br />

                    <ICXFileUploader styling={headerStyle} />
                    <br />
                    <a className="icxNextButton icx-fade" style={headerStyle} onClick={this.handleDecryptFile}> Decrypt File <i className="fa fa-unlock" /></a>
                    <br /> < br />
                    <a ref="decryptedDownload" download="no_file_selected" style={{display:'none'}} className="inline"><i className="fa fa-fw fa-download" /> {polyglot.t("filesys.save_dec")}</a>
                    <span style={{display:'none'}} className="red" ref="decryptError">Decryption Failed: Only files encrypted by this user may be decrypted</span>

                </div>
            </div>
        )
    },

    handleDecryptFile: function() {
        var resultLink = this.refs.decryptedDownload.getDOMNode()
        var errorMsg = this.refs.decryptError.getDOMNode()

        if (!ICX.eventElement) {
            resultLink.style.display = 'none'
            errorMsg.innerHTML = "You need to choose a file first!"
            errorMsg.style.display = ''
            return false
        }

        toggleSpinner()

        //do a better job of refactoring this
        icxDecryptFile(ICX.eventElement, ICX.filelist, function(preppedBlob) {
            if (!preppedBlob) {
                resultLink.style.display='none'
                errorMsg.style.display = ''
                toggleSpinner()
            } else {
                var filename = ICX.filelist[0].name

                if (/\.puff/.test(filename)) {
                    filename = filename.slice(0, -5)
                }
                errorMsg.style.display = 'none'
                resultLink.style.display = ""
                resultLink.href = preppedBlob
                resultLink.download = filename

                toggleSpinner()
            }
        })

    },

    handleEncryptFile: function() {
        var errorMsg = this.refs.encryptError.getDOMNode()
        var encryptedLink = this.refs.encryptedLink.getDOMNode()

        if (!PB.getCurrentUsername()) {
            errorMsg.style.display = ''
            return false
        }

        if (!ICX.fileprom) {
            errorMsg.innerHTML = "You need to choose a file first!"
            errorMsg.style.display = ''
            encryptedLink.style.display = 'none'
            return false
        }

        icxEncryptFile(ICX.fileprom, ICX.filelist, function (preppedBlob) {
            var filelist = ICX.filelist
            var file = filelist[0]
            var filename = file.name
            var new_filename = filename + '.puff'
            errorMsg.style.display = 'none'
            encryptedLink.style.display = ""
            encryptedLink.href = preppedBlob
            encryptedLink.download = new_filename
        })
    },

    componentDidMount: function(){
        var browser = getBrowser()
        if (browser == "Safari") {
            ICX.errors = "WARNING: Safari does not support saving files created in the browser itself. " +
                "As a result, you may not be able to download identity files or files you have encrypted."
            return Events.pub('/ui/icx/error', {"icx.errorMessage": true})
        }


    },

    componentWillMount: function() {
        //ensure there are no left over files in the vars
        ICX.fileprom = false
        ICX.filelist =[]
        ICX.eventElement = false
    }
})

// SUBCOMPONENTS
var ICXSpinner = React.createClass({
    render: function () {
        var spinnerHeight = ICX.calculated.baseFontH*3

        var w= window.innerWidth
        var h = window.innerHeight

        var spinnerTop = Math.floor((h -spinnerHeight)/2)
        var spinnerLeft = Math.floor((w -spinnerHeight)/2)
        /*var warning = function() {
            if(puffworldprops.ICX.thinking) {
               var r = confirm("If you leave now your content may not properly be encrypted. Leave anyway?")
                if (r == false) {
                    return false
                }
            }
        }*/

        if(typeof puffworldprops.ICX.thinking === 'undefined' || !puffworldprops.ICX.thinking) {
            return <span></span>
        } else {
            return (
                <div style={{zIndex: 1000, top: 0, textAlign: 'center', verticalAlign: 'middle', position: 'fixed', fontSize: spinnerHeight+'px', width: w+'px', height: h+'px', backgroundColor: 'rgba(255,255,255,.8)'}}>
                    <div style={{width: '100%', height: '100%', position: 'relative', top: spinnerTop+'px'}}>
                        <i className="fa fa-spinner fa-spin" />
                    </div>
                </div>
                )
        }
    }
})

var ICXError = React.createClass({
    render: function () {
        // Close button needed

        var errorStyle = {
            //position: 'absolute',
            border: '3px solid #880000',
            bottom: '0',
            padding: Math.floor(0.4*ICX.calculated.baseFontH)+'px',
            borderRadius: Math.floor(0.3*ICX.calculated.baseFontH)+'px',
            width: '95%',
            marginBottom: Math.floor(0.5*ICX.calculated.baseFontH)+'px',
            fontSize: Math.floor(0.8*ICX.calculated.baseFontH)+'px',
            position:'relative',
            color:'#ff0000'
        }

        var showThis = false

        // Gotta be a better way to do this!
        if(ICX.errors) {
            if(typeof puffworldprops.icx !== 'undefined') {
                if(typeof puffworldprops.icx.errorMessage !== 'undefined') {
                    if(puffworldprops.icx.errorMessage) {
                        showThis = true
                    }
                }
            }
        }

        if(showThis) {
            return (
                <div style={errorStyle}>
                    {ICX.errors}
                    <div style={{position: 'absolute', float: 'right', right: '3px', top: '3px'}}>
                        <a href="#" onClick={this.handleCloseError}>
                            <i className="fa fa-times-circle" style={{fontSize: Math.floor(0.7*ICX.calculated.baseFontH)+'px'}}></i>
                        </a>
                    </div>
                </div>
                )
        } else {
            return <span></span>
        }

    },

    handleCloseError: function() {
        ICX.errors = ''
        return Events.pub('/ui/icx/errorMessage', {"icx.errorMessage": false})
    }
})

var ICXLogo = React.createClass({ /* Good */
    handleGoHome: function() {
        Events.pub('/ui/icx/error', {"icx.errorMessage": false})
        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'home'})
    },

    handleGoTo: function(screen) {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen})
    },


    render: function() {
        var w = window.innerWidth
        var h = window.innerHeight
        var polyglot = Translate.language[puffworldprops.view.language]

        if(!puffworldprops.view.icx.screen || puffworldprops.view.icx.screen == 'home') {
            var logoW = ICX.calculated.logoW

            var logoX = keepNumberBetween(Math.floor( w*(1-ICX.config.buttonWidthRatio)-ICX.calculated.sideBorder-logoW ),0,10000) + "px"
            var logoY = Math.floor( h*ICX.config.logo.insets.top ) + "px"
            logoW = Math.floor(logoW) + 'px';

            var fontH = keepNumberBetween( Math.floor( ICX.calculated.fontSizeMultiplier ), ICX.config.text.min, ICX.config.text.max)  + 'px'

            return (
                <div key="mainLogo" style={{width: '100%'}}>
                    <div>
                        <img src="img/icx/icxLogo.png" style={{position: 'relative', marginTop: logoY, marginBottom: ICX.calculated.baseFontH+'px', left: logoX, width: logoW, display: 'block'}} alt='I.CX Logo' />
                    </div>
                    <div style={{width: '60%', zIndex: 1000, fontFamily: 'Minion pro, Times, "Times New Roman", serif', fontSize: fontH, left: logoX, position: 'absolute'}}>
                        The world’s first 100% secure file storage and messaging system to work right in your web browser.
                        Find out <a href="#" className="inline" onClick={this.handleGoTo.bind(null, 'learn')}>what makes us different</a>.
                    </div>
                </div>
                )
        } else {

            var logoW = w*ICX.config.logoSmallRatio
            var logoY = Math.floor( h*ICX.config.logo.insetsSmall.top ) + "px"
            var logoX = Math.floor( h*ICX.config.logo.insetsSmall.left + ICX.calculated.sideBorder) + "px"
            logoW = logoW + "px"
            var divW = w*ICX.config.buttonSmallWidthRatio

            return (
                <div style={{position: 'fixed', top: logoY, width: divW, left: logoX}}>
                    <a href="#" onClick={this.handleGoHome}>
                        <img src="img/icx/icxLogo.png" style={{width: logoW}} alt={ICX.currScreenInfo.fullText} />
                    </a>
                </div>
            )
        }
    }
})

var ICXLinks = React.createClass({ /* Good */

    render: function () {
        var w = window.innerWidth
        var h = window.innerHeight

        var self = this
        var buttonLinks = ICX.screens.map(function(data) {

            if(!data.button) {
                return // <span key={self.props.screenInfo + '_' + data.name}></span>
            } else {
                return <ICXButtonLink key={self.props.screenInfo + '_' + data.name} currScreen={self.props.screenInfo.name} screenInfo={data} />
            }

        })

        return <span>{buttonLinks}</span>
    }
})

var ICXButtonLink = React.createClass({  /* Good */
    handleGoTo: function(screen) {
        if(!PB.getCurrentUsername()) {
            if (screen == 'store' || screen == 'send') {
                Events.pub('ui/wizard', {
                    'ICX.wizard.inProcess': true,
                    'ICX.wizard.sequence': screen
                })
            }
        }
        Events.pub('/ui/icx/error', {"icx.errorMessage": false})
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen})

    },

    render: function () {
        var w = window.innerWidth
        var h = window.innerHeight
        var screenInfo = this.props.screenInfo

        var fontSize = Math.floor( h*ICX.config.buttonFontHeightRatio )

        var buttonStyle = {
            backgroundColor: screenInfo.color,
            height: Math.floor( h*ICX.config.buttonHeightRatio ) + 'px',
            position: 'fixed',
            fontSize:  fontSize + 'px',
            top: Math.floor( (h*.3) + screenInfo.position*Math.floor( ICX.config.buttonHeightRatio*h )) + 'px',
            lineHeight: Math.floor( h*ICX.config.buttonHeightRatio ) + 'px',
            color: 'white',
            paddingLeft: Math.floor(fontSize/2.5)+'px',
            zIndex: 100,
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden'
        }

        // Login always on right!
        if(ICX.config.borderSide == 'right' || this.props.screenInfo.name == 'login') {
            buttonStyle.right = 0
        } else {
            buttonStyle.left = Math.floor(ICX.calculated.sideBorder)+'px'
        }


        if(this.props.currScreen == 'home' || this.props.currScreen == 'init') {
            buttonStyle.width = Math.floor( w*ICX.config.buttonWidthRatio ) + 'px'
        } else  {
            buttonStyle.width = Math.floor( w*ICX.config.buttonSmallWidthRatio ) + 'px'
        }


        if(this.props.currScreen == 'home' || this.props.currScreen == 'init') {
            var linkText = this.props.screenInfo.fullText
        } else {
            var linkText = this.props.screenInfo.name.toUpperCase()
        }

        // Special case login
        if(this.props.screenInfo.name == 'login') {
            buttonStyle.position = 'fixed'
            buttonStyle.top = 0
            buttonStyle.width = (Math.floor(w*(1-ICX.config.content.insets.left)) - ICX.calculated.sideBorder) + 'px'
            buttonStyle.right = 0
            buttonStyle.height = Math.floor( h*ICX.config.buttonHeightRatio/2 ) + 'px'
            buttonStyle.lineHeight = Math.floor( h*ICX.config.buttonHeightRatio/2 ) + 'px'
            // two styles below are needed to make tooltip display properly
            buttonStyle.overflow = 'visible'
            buttonStyle.whiteSpace = 'nowrap'
            return (
                <div style={buttonStyle}>
                    <ICXUserButton />
                </div>
            )
        }


        return (
            <a href="#" onClick={this.handleGoTo.bind(null, this.props.screenInfo.name)} style ={{color: '#ffffff'}}>
                <div className="navBtn" style={buttonStyle}>
                    <i className={this.props.screenInfo.icon}></i>
                        <span className="icxButtonlinkText">
                            {' '}
                            {linkText}
                        </span>
                </div>
            </a>
            )
    }
})

var ICXFooter = React.createClass({  /* Good */

    render: function () {
        var polyglot = Translate.language[puffworldprops.view.language]

        var w = window.innerWidth

        var fontSize = Math.floor(ICX.calculated.baseFontH/1.7)
        var puffballH = Math.floor(fontSize*1.1)
        var puffballW = Math.floor(puffballH * 41/48)

        // Same as logoX
        if(ICX.config.borderSide == 'right') {
            var footerX = keepNumberBetween(Math.floor( w*(1-ICX.config.buttonWidthRatio)-ICX.calculated.sideBorder-ICX.calculated.logoW ),0,10000) + "px"
        } else {
            var footerX = Math.floor(window.innerHeight * 0.015)
        }

        var footerY = Math.floor(window.innerHeight * 0.015)


        return (
            <div style={{position: 'absolute', verticalAlign: 'text-top', fontSize: fontSize+'px', left: footerX, bottom: footerY+'px' }}>
                <img style={{display: 'inline', width: puffballW+'px', height: puffballH+'px'}} src="img/blueAnimated.gif" />
            {polyglot.t("footer.powered")}<a href="http://www.puffball.io" target="_new">puffball.</a>{polyglot.t("footer.content")}
            <i className="icon-gavia" style={{fontSize: '1px', fontFamily: 'icxicon', opacity: 0}} />
            </div>
        )
    }
})

var ICXUserButton = React.createClass({  /* Good */
    mixins: [TooltipMixin],

    render: function() {

        var polyglot = Translate.language[puffworldprops.view.language]

        var username = PB.getCurrentUsername()
        if (!username) {
            return(
                <span>
                    <div className="navBtn user">
                        <a href="#"  onClick={this.handleGoTo.bind(null, 'login')} style={{color: '#ffffff'}}>
                            <i className="fa fa-fw fa-sign-in"></i>
                            {polyglot.t("button.login")}
                        </a>
                    </div>
                    <div style={{display: 'inline-block', marginLeft: '10px', marginRight: '10px'}}>or</div>
                    <div className="navBtn user">
                        <a href="#" onClick={this.handleGoTo.bind(null, 'newuser')} style={{color: "#ffffff"}}>
                            <i className="fa fa-fw fa-user"></i>
                            {polyglot.t("button.signup")}
                        </a>
                    </div>

                </span>
                )
        } else {
            return(
                <span>
                    <span className="relative">
                        <a href="#"  onClick={this.handleGoTo.bind(null, 'home.table')} style={{color: '#ffffff'}}>
                            <i className="fa fa-w fa-list" />
                        </a>
                        <Tooltip position="under" content="View your messages and files" />
                    </span>
                    {' '}
                    <span className="relative">
                        <a href="#"  onClick={this.handleGoTo.bind(null, 'dashboard')} style={{color: '#ffffff'}}>
                            <i className="fa fa-fw fa-user" />{username}
                        </a>
                        <Tooltip position="under" content="Go to your dashboard" />
                    </span>
                    {' '}
                    <span className="relative">
                        <a href="#"  onClick={this.handleSignOut} style={{color: '#ffffff'}} goto="home">
                            <i className="fa fa-fw fa-sign-out" />
                        </a>
                        <Tooltip position="under" content="Remove identity from this device" color="black" />
                    </span>
                </span>
                )

        }
    },

    handleClearFilters: function() {
        return Events.pub( 'filter/show/by-user',
            {
                'view.filters': {}
            }
        )
    },

    handleGoTo: function(screen) {
        if(screen == 'home.table') this.handleClearFilters()
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen})
    },

    handleSignOut: function() {
        var userToRemove = PB.getCurrentUsername()

        // Confirm alert first
        var msg = "WARNING: If you have not yet saved your passphrase, hit Cancel and click on your username to access your passphrase. Are you sure you wish to continue?"

        var r = confirm(msg)
        if (r == false) {
            return false
        }

        PB.removeIdentity(userToRemove)
    }
})

var ICXNextButton = React.createClass({  /* good */
    handleNext: function () {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": this.props.goto});
    },

    render: function () {
        var polyglot = Translate.language[puffworldprops.view.language]

        if (this.props.text) {
            var buttonText = this.props.text
        } else {
            var buttonText = polyglot.t("button.next")
        }

        if (this.props.enabled) {
            ICX.buttonStyle.backgroundColor = ICX.currScreenInfo.color

            return <a style={ICX.buttonStyle} onClick={this.handleNext} className="icxNextButton icx-fade"> {buttonText} <i className="fa fa-chevron-right small" /></a>

        } else {
            ICX.buttonStyle.backgroundColor = 'rgba(0, 3, 82, .1)' //
            ICX.buttonStyle.cursor = 'default' //

            return <a style={ICX.buttonStyle} className="icxNextButton" disabled> {buttonText} <i className="fa fa-chevron-right small" /></a>

        }
    }
})

// Not yet implemented
var ICXLangSelect = React.createClass({ /* good */
    handlePickLanguage: function() {
        var language = this.refs.picklanguage.getDOMNode().value
        return Events.pub('ui/view/language/set', {'view.language': language})
    },

    render: function() {
        var language = puffworldprops.view.language || "en"
        var all_languages = Object.keys(Translate.language)

        return (
            <div className="menuItem">
                Language: <select ref="picklanguage" onChange={this.handlePickLanguage} defaultValue={language}>
                    {all_languages.map(function(lang) {
                        return <option key={lang} value={lang}>{Translate.language[lang].t("drop_down_display")}</option>
                    })}
                </select>
            </div>
        )
    }
})

var ICXCheckmark = React.createClass({ /* good */
    render: function() {
        if(this.props.show === false) {
            return <i className="fa fa-check-circle fa-fw gray"></i>
        } else if(this.props.show === true) {
            return <i className="fa fa-check-circle fa-fw green"></i>
        } else {
            return <span><i className="fa fa-check-circle fa-fw red"></i></span>
        }

    }
})






/*******************************************************************************************




            Only unused components below here? Let's remove them from this file!




/*******************************************************************************************/

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

        // Detect a screen change, remove error in that case
        if(currScreen != ICX.currScreen) {
            ICX.errors = ''
            if(currScreen != 'send') { //Remove toUser if user navigates away from SEND
                Events.pub('ui/event', {
                    "view.icx.toUser": ""
                })
            }
        }

        if(PB.M.Wardrobe.currentKeys) {
            ICX.username = PB.M.Wardrobe.getCurrentUsername()
        } else {
            ICX.username = false
        }

        if (currScreen == 'init') {
            if (ICX.username) {
                currScreen = 'dashboard'
                Events.pub('/ui/icx/screen', {"view.icx.screen": 'dashboard'})

            } else {
                currScreen = 'home'
                Events.pub('/ui/icx/screen', {"view.icx.screen": 'home'})
            }
        }

        ICX.currScreen = currScreen

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
            zIndex: 100,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            cursor: 'pointer',
            textTransform: 'uppercase',
            paddingBottom: Math.floor((fontSize/2.5)+3)+'px'
        }

        var c1, c2, c3, c4, c5, c6, op1, op2

        c1 = '145, 142, 93'
        c2 = '86, 116, 62'
        c3 = '20, 57, 62'
        c4 = '54, 26, 26'
        c5 =  '68, 0, 0'
        c6 = '0, 3, 82'     // Blue border

        op1 = '0.8'
        op2 = '.08'

        ICX.screens = [
            {position: 0, name: 'home',  button: false, color: 'rgba('+c6+', '+op1+')', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXHome, backgroundColor: 'rgba(255,255,255,0)'},
            {position: 1, name: 'send',  button: true, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'SEND a private message or file', component: ICXSend, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 2, name: 'store', button: true, color: 'rgba('+c3+', '+op1+')', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately', component: ICXStore, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'login', button: true, color: 'rgba('+c1+', '+op1+')', icon: 'fa fa-fw fa-sign-in', fullText: 'LOG IN', component: ICXLogin, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 4, name: 'learn', button: true, color: 'rgba('+c4+', '+op1+')', icon: 'fa fa-fw fa-file-text-o', fullText: 'LEARN how it works', component: ICXLearn, backgroundColor: 'rgba('+c4+', '+op2+')'},
            {position: 5, name: 'about', button: true, color: 'rgba('+c5+', '+op1+')', icon: 'fa fa-fw fa-info-circle', fullText: 'ABOUT I.CX', component: ICXAbout, backgroundColor: 'rgba('+c5+', '+op2+')'},
            {position: 0, name: 'send.message',  button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a message', component: ICXSendMessage, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'store.encrypt', button: false, color: 'rgba('+c3+', '+op1+')', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately', component: ICXStore, backgroundColor: 'rgba('+c3+', '+op2+')'},
            {position: 0, name: 'home.table',    button: false, color: 'rgba('+c6+', '+op1+')', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXTableView, backgroundColor: 'rgba('+c6+', '+op2+')', styles: {padding: 0, border: '1px solid #000'}},
            {position: 0, name: 'dashboard',    button: false, color: 'rgba('+c1+', '+op1+')', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXDashboard, backgroundColor: 'rgba('+c1+', '+op2+')'},
            {position: 0, name: 'newuser',    button: false, color: 'rgba('+c1+', '+op1+')', icon: 'fa fa-fw fa-male', fullText: 'Register a new username', component: ICXNewUser, backgroundColor: 'rgba('+c1+', '+op2+')'},
            {position: 0, name: 'send.finish', button: false, color: 'rgba('+c2+', '+op1+')', fullText: "Send of message", component: ICXSendMessageFinish, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'send.confirm', button: false, color: 'rgba('+c2+', '+op1+')', fullText: "Send of message", component: ICXSendMessageConfirm, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'send.file',  button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a file', component: ICXSendFile, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'send.file.confirm',  button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a file', component: ICXSendFileConfirm, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'send.file.finish',  button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a file', component: ICXSendFileFinish, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'encryptdecrypt',    button: false, color: 'rgba('+c4+', '+op1+')', icon: 'fa fa-fw fa-home', fullText: 'Encrypt / Decrypt Page', component: ICXFileConverter, backgroundColor: 'rgba('+c4+', '+op2+')'},
            {position: 0, name: 'store.finish', button:false, color: 'rgba('+c3+', '+op1+')', icon: 'fa fa-fw fa-database', fullText: 'Store encrypted files', component: ICXStoreFinish, backgroundColor: 'rgba('+c3+', '+op2+')'},
            {position: 0, name: 'init',  button: false, color: 'rgba('+c6+', '+op1+')', icon: 'fa fa-fw fa-home', fullText: '', component: ICXInit, backgroundColor: 'rgba(255,  255, 255, .0)'},
            {position: 0, name: 'indepth', button: false, color: 'rgba('+c4+', '+op1+')', icon: 'fa fa-fw fa-file-text-o', fullText: 'LEARN how it works', component: ICXIndepth, backgroundColor: 'rgba('+c4+', '+op2+')'},
            {position: 0, name: 'invite', button: false, color: 'rgba('+c2+', '+op1+')', icon: 'fa fa-fw fa-paper-plane', fullText: 'Invite someone to join icx', component: ICXInvite, backgroundColor: 'rgba('+c2+', '+op2+')'},
            {position: 0, name: 'changepassphrase', button: false, color: 'rgba('+c1+', '+op1+')', icon: 'fa fa-fw fa-gear', fullText: 'Change your passphrase', component: ICXChangePassphrase, backgroundColor: 'rgba('+c1+', '+op2+')'},
            {position: 0, name: 'changepassphrase.finish', button: false, color: 'rgba('+c1+', '+op1+')', icon: 'fa fa-fw fa-gear', fullText: 'Change your passphrase', component: ICXChangePassphraseFinish, backgroundColor: 'rgba('+c1+', '+op2+')'}
        ]

        var borderWidth = Math.floor(ICX.calculated.sideBorder)+'px'

        var thisScreen = ICX.screens.filter(function( obj ) {
            return (obj.name == currScreen);
        })[0]

        if(ICX.config.borderSide == 'right') {
            var screenStyle = {
                position: "absolute",
                width: w,
                height: h,
                borderRightWidth: borderWidth,
                borderRightColor: thisScreen.color,
                borderRightStyle: 'solid'
            }
        } else {
            var screenStyle = {
                position: "absolute",
                width: w,
                height: h,
                borderLeftWidth: borderWidth,
                borderLeftColor: thisScreen.color,
                borderLeftStyle: 'solid',
                maxWidth: w,
                maxHeight: h
            }
        }


        var contentDivStyles = {
                position: "absolute",
                left: Math.floor( w*ICX.config.content.insets.left ) + "px",
                width: Math.floor( (1-(ICX.config.content.insets.left+ICX.config.content.insets.right))*w ) + 'px',
                height: Math.floor( (1-(ICX.config.content.insets.top+ICX.config.content.insets.bottom))*h ) + 'px',
                top: Math.floor( (ICX.config.content.insets.top)*h ) + 'px',
                padding: '10px', // Testing...
                fontSize: ICX.calculated.baseFontH + 'px',
                overflow: 'scroll'
        }


        contentDivStyles.backgroundColor = thisScreen.backgroundColor

        ICX.screenMap = ICX.screens.reduce(function(acc, screenInfo) {
            acc[screenInfo.name] = screenInfo
            return acc
        },{})

        var screenInfo = ICX.screenMap[currScreen]
        var fun = screenInfo.component
        ICX.currScreenInfo = screenInfo

        var pageComponent = fun( {screenInfo:screenInfo} )

        // Apply any additional styling
        if(screenInfo.styles) {
            for (var key in screenInfo.styles) {
                contentDivStyles[key] = screenInfo.styles[key]
            }
        }
        /*

        if(thisScreen.name=='home.table') {
            contentDivStyles.padding = '0'
        }
        */

        updateUI()
        return (
            <div style={screenStyle} className="screen">
                <ICXLogo screenInfo={thisScreen} />
                <ICXLinks screenInfo={thisScreen} />
                <div style={contentDivStyles}>
                    {pageComponent}
                    <ICXError />
                </div>
                <ICXSpinner />
                <ICXFooter />
            </div>
        )
    }
})


var ICXInit = React.createClass({
    render: function () {
        return <span></span>
    }
})


var ICXStore = React.createClass({
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
                    {polyglot.t("store.select")}
                    <br /><br />
                    <span style={ICX.buttonStyle} className="buttonSpan">
                        <input type="file" className="fileSelect" id="fileToUpload" ref="uploadbutton" onChange={this.handleGetFile}/>
                    </span>
                    <br /><br />
                    <small>
                        <i className={cbClass} onClick={this.handleToggleBackupToCloud} ></i>
                    {polyglot.t("store.backup")}
                    </small>
                    <br /><br />
                    <div ref="warning" style={{'display':'none','color':'red'}}>
                        <span>{polyglot.t("store.warning")}</span>
                    </div>
                    <ICXNextButton enabled={puffworldprops.ICX.nextStatus} goto={puffworldprops.ICX.nextStep} key="nextToStore" text={puffworldprops.ICX.nextStepMessage} />
                </div>
            </div>
            )
    },

    handleToggleBackupToCloud: function() {
        return Events.pub('ui/event', {
            'ICX.backupToCloud': !puffworldprops.ICX.backupToCloud
        })

    },

    componentDidMount: function() {
        Events.pub('ui/event', {
            'ICX.wizard.inProcess': true,
            'ICX.wizard.sequence': 'store',
            'ICX.wizard.type': 'file',
            'ICX.backupToCloud': true,
            'ICX.nextStatus': false
        })

        var username = ICX.username

        if(username) {
            Events.pub('ui/event', {
                'ICX.nextStep': 'store.finish',
                'ICX.nextStepMessage': 'Finish'
            })
        } else {
            Events.pub('ui/event', {
                'ICX.nextStep': 'newuser',
                'ICX.nextStepMessage': 'Next'
            })
        }
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

var ICXStoreFinish = React.createClass({
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.store_fin")}</div><br />
                <div className="contentWindow">
                Success! Your file has been encrypted.
                    <br /><br />
                    <a ref="encryptedLink" download="no_file_selected" onClick ={this.handleSubmitSuccess}>Save encrypted file</a>
                    <br /><br />
                    <ICXNextButton enabled={puffworldprops.ICX.messageStored} goto={puffworldprops.ICX.nextStep} key="nextToStore" text="Encrypt another file" />
                </div>
            </div>
        )


    },
    handleSubmitSuccess: function () {
        Events.pub('ui/event', {
            'ICX.messageStored':true
        })
    },

    cleanUpSubmit: function () {

    },

    componentWillMount: function() {
        Events.pub('ui/event',{
            'ICX.messageStored': false,
            'ICX.nextStep': 'store',
            'ICX.successMessage': ''
        })
    },

    componentDidMount: function () {
        if(PB.M.Wardrobe.getCurrentUsername()) {
            //backup their file
            if (puffworldprops.ICX.backupToCloud) {
                this.handleBackup();
            }
            var encrypedLink = this.refs.encryptedLink.getDOMNode()

            ICX.fileprom.then(function(blob) {
                var puff = PBFiles.createPuff(blob, 'file')

                var filelist = ICX.filelist
                var file     = filelist[0]
                var filename = file.name
                var new_filename = filename + '.puff'

                // Make the link visible to download the file
                encrypedLink.href = PBFiles.prepBlob(puff)
                encrypedLink.download = new_filename
                Events.pub('ui/thinking', { 'ICX.thinking': false })
            })

        } else {

            Events.pub('ui/thinking', { 'ICX.thinking': false })
            ICX.errors = "ERROR: Cannot encrypt file as you are not logged in under a valid identity. Please log in or create an identity before trying again."
            return Events.pub('/ui/icx/error', {"icx.errorMessage": true})
        }

        // TODO: Only show warning if they DONT choose backup to network
        ICX.errors = "WARNING: If you chose not to backup to the network, your encrypted file only exists in this browser window. Save the file before closing this window or going to another page."
        return Events.pub('/ui/icx/error', {"icx.errorMessage": true})
    },

    handleBackup: function() {

        // Same as sending the file to yourself
        var me = PB.M.Wardrobe.getCurrentUsername()
        var type = 'file'
        var content = ICX.filelist[0]   // error: dont have content of the file here
        var parents = []
        var metadata = {}
        metadata.routes = [me]
        metadata.filename = content.name
        var envelopeUserKeys = ''
        var self = this


        // Bundle into puff and send this bad boy off
        var prom = Promise.resolve() // a promise we use to string everything along

        var usernames = [me]

        var userRecords = usernames.map(PB.Data.getCachedUserRecord).filter(Boolean)
        var userRecordUsernames = userRecords.map(function (userRecord) {
            return userRecord.username
        })

        // if we haven't cached all the users, we'll need to grab them first
        // THINK: maybe convert this to using PB.getUserRecords instead
        if (userRecords.length < usernames.length) {
            usernames.forEach(function (username) {
                if (!~userRecordUsernames.indexOf(username)) {
                    prom = prom.then(function () {
                        return PB.getUserRecordNoCache(username).then(function (userRecord) {
                            userRecords.push(userRecord)
                        })
                    })
                }
            })
        }

        prom = prom.then(function () {
            if (envelopeUserKeys) {      // add our secret identity to the list of available keys
                userRecords.push(PB.Data.getCachedUserRecord(envelopeUserKeys.username))
            } else {                    // add our regular old boring identity to the list of available keys
                userRecords.push(PB.M.Wardrobe.getCurrentUserRecord())
            }

            // blob is the encoded base64 dataURI that holds file content
            ICX.fileprom.then(function (blob) {
                var post_prom = PB.M.Forum.addPost(type, blob, parents, metadata, userRecords, envelopeUserKeys)
                post_prom = post_prom.then(self.handleSubmitSuccess.bind(self))
                return post_prom

            })
        }).catch(function (err) {

            // TODO: Show user the error
            // self.cleanUpSubmit()
            Events.pub('ui/event/', {
                'ICX.messageSent': true,
                'ICX.successMessage': err.message
            })
            Events.pub('ui/thinking', {
                'ICX.thinking': false
            })

        })
        return false
    }
})


var ICXInvite = React.createClass({
    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor

        // Next step is file or message, then final step has warning about NOT DONE
        var userURL = 'https://i.cx/u/'+ICX.username

        // Put Why can't you in warning message?
        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Invite someone to join ICX</div>
                <div className="contentWindow">
                    You&#8217;ve chosen to send to a new ICX user. You have two options:
                    <br />
                    <br />
                    <em>Option 1:</em><br />
                    Send someone a link where they can message you: <input type="text" value={userURL} /> <a href={userURL} className="inline" target="_new">Test link</a>
                    <br /><br />
                    <em>Option 2:</em><br />
                    Create an account for your friend using the security question and answer below. The answer to your
                    question will be your friend's initial passphrase. Because this method is lower security,
                    your friend will be asked to change their passphrase right away.<br /><br />
                    Question:<br />
                    <input type="text" ref="question" />
                    <br />
                    Answer:<br />
                    <input type="text" ref="passphrase" /><br />
                    <span className="shortcut">Note:</span> Your recipient will have to enter the answer <em>exactly</em> how you type it.
                    <br /><br />
                    <button style={ICX.buttonStyle} onClick={this.handleSendToEmail}>Next <i className="fa fa-chevron-right" /></button>
                    <br /><br />

                    <small>Wondering why you can&#8217;t send your message directly to someone without an ICX account?
                    When you send someone a private message or a file, it has to be encrypted on your own device before
                    it gets sent over the network. But in order to encrypt it, your web browser needs the public key of
                    the person you are sending to. That public key has to be created and associated with a username record
                    before the message can be sent. You can get this process started by choosing a shared secret for your
                    friend's initial passphrase.</small>

                </div>
            </div>
        )
    },

    handleSendToEmail: function() {
        // Start the spinner, generate a new username,
        // Send them to next step, message or file send page.
        // TODO: Check for blank, or too short values in question and answer

        Events.pub('ui/thinking', { 'ICX.thinking': true })
        updateUI();

        var animalName = PB.Crypto.getRandomItem(ICX.animalNames)
        var adjective = PB.Crypto.getRandomItem(ICX.adjectives)
        var animalColor = PB.Crypto.getRandomItem(ICX.colornames)

        var requestedUsername = "icx." + adjective+animalColor+animalName

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
    }
})

// Reply to a single puff
var ICXReplyPuff = React.createClass({
    handleParents: function() {
        var sig = this.props.sig

        var parents = puffworldprops.reply.parents          // OPT: global props hits prevent early bailout
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []

        var index = parents.indexOf(sig)
        if(index == -1) {
            if (parents.length == 0)
            parents.push(sig)
        } else {
            parents.splice(index, 1)
        }

        return Events.pub('ui/reply/add-parent',
            {
               'reply.parents': parents,
               'reply.isReply': true
            }
        )
    },

    handleReply: function() {

        var username = this.props.user
        this.handleParents()

        return Events.pub('/ui/icx/screen', {
            "view.icx.screen": 'send',
            "view.icx.toUser": username
        })
    },
    render: function() {
        return (
            <span className="icon">
                <a onClick={this.handleReply}>
                    <i className="fa fa-reply fa-fw"></i>
                </a>
            </span>
            )
    }
})


var ICXSend = React.createClass({
    mixins: [TooltipMixin],

    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div className="icx-screen icx-send">
                <div style={headerStyle}>{polyglot.t("header.send")}</div><br />

                    To: <input type="text" ref="toUser" onChange={this.verifyUsername} onKeyDown={this.handleSubmit} />
                    <span className="relative">
                        <a href="#" onClick={this.handleUsernameLookup.bind(null, false)}><ICXCheckmark show={puffworldprops.ICX.userConfirmed} /></a>
                        <Tooltip position='under' content="Check for a valid ICX username or email address" />
                    </span>
                    <span className="message">{puffworldprops.ICX.toUserStatus}</span>


                <div className="component">

                    <button style={ICX.buttonStyle} onClick={this.handleUsernameLookup.bind(null, 'send.message')}>{polyglot.t("button.msg")} <i className="fa fa-chevron-right" /></button>
                    {' '}
                    <button style={ICX.buttonStyle} onClick={this.handleUsernameLookup.bind(null, 'send.file')}>{polyglot.t("button.file")} <i className="fa fa-chevron-right" /></button>

                </div>
                Enter an ICX username or email address above to send an encrypted message or file. Looking for someone to
                {' '}send to&#63; Say <a href="#" className="inline" onClick={this.messageUser.bind(null, 'mattasher')} >Hi!</a>
                {' '}to <a href="#" className="inline" onClick={this.messageUser.bind(null, 'dann')} >one</a> of
                {' '}<a href="#" className="inline" onClick={this.messageUser.bind(null, 'icx.adam')} >the developers</a>, or
                {' '}enter your email address to send yourself an encrypted message.
            </div>
            )
    },

    componentWillMount: function() {

        if(!ICX.username) {
            return Events.pub('ui/event/newuser', {
                "view.icx.screen": 'newuser',
                'ICX.wizard.inProcess': true,
                'ICX.wizard.sequence': 'send'
            })
        }

        Events.pub('ui/event/send', {
            'ICX.userConfirmed': false,
            'ICX.nextStatus': false,
            'ICX.wizard.inProcess': true,
            'ICX.wizard.sequence': 'send'
        })
    },

    componentDidMount: function() {
        // Were we sent to user by props?
        if(puffworldprops.view.icx.toUser) {
            this.refs.toUser.getDOMNode().value = puffworldprops.view.icx.toUser
            this.handleUsernameLookup()
        }

        var browser = getBrowser()
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
                Events.pub('ui/icx/screen', {
                    "view.icx.screen": 'invite'
                })
            }

            return false
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
            'ICX.toUser': username
        })
    }
});

var ICXSendFile = React.createClass({
    fileElement: {},

    render: function() {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor

        var invitedNote = ''
        if(puffworldprops.ICX.wizard.invitedEmail) {
            invitedNote = 'Sending to new user ' + puffworldprops.ICX.toUser + ' (' +  puffworldprops.ICX.wizard.invitedEmail + ')'
        } else {
            invitedNote = 'Sending to user ' + puffworldprops.ICX.toUser
        }

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.send_file")} {puffworldprops.ICX.toUser}</div><br />
                <div className="contentWindow">
                    {invitedNote}
                    <br />
                Your file: <br /><br />
                    <span style={ICX.buttonStyle} className="buttonSpan">
                        <input type="file" className="fileSelect" id="fileToUpload" ref="uploadbutton" onChange={this.handleDisplaySelectedFile}/>
                    </span>
                    <br /><br />
                    <div ref="warning" style={{'display':'none','color':'red'}}>
                        <span>Warning! The file you have selected may be too large to send after encryption. Try keeping it below 1.5MB.</span>
                    </div>
                    <ICXNextButton enabled={puffworldprops.ICX.nextStatus} goto={puffworldprops.ICX.nextStep} text={puffworldprops.ICX.nextStepMessage}  key="nextToSendFile" />
                </div>
            </div>
        )
    },

    componentWillMount: function() {
        if(ICX.username) {
            Events.pub('ui/event/', {
                'ICX.nextStep': 'send.file.finish',
                'ICX.nextStepMessage': 'SEND FILE'
            })
        } else {
            Events.pub('ui/event/', {
                'ICX.nextStep': 'newuser',
                'ICX.nextStepMessage': 'NEXT'
            })
        }

        Events.pub('ui/event/', {
            'ICX.wizard.type': 'file',
            'ICX.nextStatus': false
        })
    },

    handleDisplaySelectedFile: function(event) {
        var element = event.target
        var warning = this.refs.warning.getDOMNode()

        if (element.files[0].size > 1500000) {
            warning.style.display=''
        } else {
            warning.style.display='none'
        }

        ICX.fileprom = PBFiles.openBinaryFile(element)
        ICX.filelist = element.files

        return Events.pub('ui/event/', {
            'ICX.nextStatus': true
        })
    }
})


var ICXSendFileConfirm = React.createClass({
    render: function () {
        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        var filelist = ICX.filelist
        var file     = filelist[0]
        var filename = file.name

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.send_file_conf")}</div>
                <br />
                <div className="contentWindow">
                    <b>{polyglot.t("send.to")}</b> {puffworldprops.ICX.toUser}<br />
                    <b>{polyglot.t("send.file")}</b> {filename}
                    <br /><br />
                    <ICXNextButton enabled={true} goto='send.file.finish' text='SEND NOW' />
                </div>
            </div>
        )
    }
})


var ICXSendFileFinish = React.createClass({

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
        updateUI();
    },

    handleSubmitSuccess: function () {
        Events.pub('ui/event/', {
            'ICX.messageSent': true,
            'ICX.successMessage': 'File sent!'
        })
        Events.pub('ui/thinking', {
            'ICX.thinking': false
        })

    },

    cleanUpSubmit: function () {
        // TODO: do something fancy, clear out global vars
        return Events.pub('ui/reply/add-parent',
        {
           'reply.parents': [],
           'reply.isReply': false
        })
    },

    componentDidMount: function () {
        // Set information for this send
        var type = 'file'
        var content = ICX.filelist[0]   // error: dont have content of the file here
        var parents = []
        var metadata = {}
        metadata.routes = [puffworldprops.ICX.toUser]
        metadata.filename = content.name
        var envelopeUserKeys = ''
        var self = this


        // Bundle into puff and send this bad boy off
        var prom = Promise.resolve() // a promise we use to string everything along

        var usernames = [puffworldprops.ICX.toUser]

        var userRecords = usernames.map(PB.Data.getCachedUserRecord).filter(Boolean)
        var userRecordUsernames = userRecords.map(function (userRecord) {
            return userRecord.username
        })


        // if we haven't cached all the users, we'll need to grab them first
        // THINK: maybe convert this to using PB.getUserRecords instead
        if (userRecords.length < usernames.length) {
            usernames.forEach(function (username) {
                if (!~userRecordUsernames.indexOf(username)) {
                    prom = prom.then(function () {
                        return PB.getUserRecordNoCache(username).then(function (userRecord) {
                            userRecords.push(userRecord)
                        })
                    })
                }
            })
        }

        prom = prom.then(function () {
            if (envelopeUserKeys) {      // add our secret identity to the list of available keys
                userRecords.push(PB.Data.getCachedUserRecord(envelopeUserKeys.username))
            } else {                    // add our regular old boring identity to the list of available keys
                userRecords.push(PB.M.Wardrobe.getCurrentUserRecord())
            }

            // blob is the encoded base64 dataURI that holds file content
            ICX.fileprom.then(function(blob) {
                var post_prom = PB.M.Forum.addPost(type, blob, parents, metadata, userRecords, envelopeUserKeys)
                post_prom = post_prom.then(self.handleSubmitSuccess.bind(self))
                return post_prom

            })
        }).catch(function (err) {
            // self.cleanUpSubmit()
            Events.pub('ui/event/', {
                'ICX.messageSent': true,
                'ICX.successMessage': err.message
            })
            Events.pub('ui/thinking', {
                'ICX.thinking': false
            })

        })
        return false
    }
})

var ICXSendMessage = React.createClass({
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        var invitedNote = ''
        if(puffworldprops.ICX.wizard.invitedEmail) {
            invitedNote = 'Sending to new user ' + puffworldprops.ICX.toUser + ' (' +  puffworldprops.ICX.wizard.invitedEmail + ')'
        } else {
            invitedNote = 'Sending to user ' + puffworldprops.ICX.toUser
        }

        return (
            <div className="send-message" style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Send a private message</div>
                <div className="contentWindow">
                    {invitedNote}
                    <br />
                    <div>{polyglot.t("send.msg")}:</div>
                    <textarea ref="messageText" style={{width: '100%', height: '50%'}} onChange={this.handleMessageText} onKeyDown={this.handleKeyDown}/>
                    <br />
                    <ICXNextButton enabled={puffworldprops.ICX.nextStatus} goto={puffworldprops.ICX.nextStep} text={puffworldprops.ICX.nextStepMessage}  key="nextToMessage" />
                    <br /><br />
                    TIP: The keyboard shortcut <span className="shortcut">command-enter</span> will send your message right away.
                </div>

            </div>
            )
    },

    componentWillMount: function() {
        if(ICX.username) {
            Events.pub('ui/event/', {
                'ICX.nextStep': 'send.finish',
                'ICX.nextStepMessage': 'SEND'
            })


        } else {
            Events.pub('ui/event/', {
                'ICX.nextStep': 'newuser',
                'ICX.nextStepMessage': 'NEXT'
            })
        }

        Events.pub('ui/event/', {
            'ICX.wizard.type': 'message',
            'ICX.nextStatus': false
        })
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
});

var ICXSendMessageConfirm = React.createClass({
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        var username = PB.M.Wardrobe.getCurrentUsername()

        var sendToEmail = ''
        if(puffworldprops.ICX.wizard.invitedEmail) {
            sendToEmail = '(' + puffworldprops.ICX.wizard.invitedEmail + ')'
        }

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.send_msg_conf")}</div>
                <br />
                <div className="contentWindow">
                    <b>{polyglot.t("send.from")}</b> {username}<br/>
                    <b>{polyglot.t("send.to")}</b> {puffworldprops.ICX.toUser} {sendToEmail}<br />
                    <b>MESSAGE:</b><br />
                    {ICX.messageText}
                    <br /><br />
                    <ICXNextButton enabled={true} goto='send.finish' text='SEND NOW' />
                </div>
            </div>
        )
    }
})


var ICXSendMessageFinish = React.createClass({

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
                <div style={headerStyle}>{polyglot.t("header.send_msg_fin")}</div>
                <br />
                <div className="contentWindow">
                    <div>{successMessage}</div>
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

    cleanUpSubmit: function () {
        // TODO: do something fancy, clear out global vars
        return Events.pub('ui/reply/add-parent',
        {
           'reply.parents': [],
           'reply.isReply': false
        })
    },

    componentDidMount: function () {
        // Set information for this send
        var type = 'text'
        var content = ICX.messageText
        if(puffworldprops.reply.isReply) {
            var parents = puffworldprops.reply.parents
        } else {
            var parents = []
        }
        var metadata = {}
        metadata.routes = [puffworldprops.ICX.toUser]
        var envelopeUserKeys = ''
        var self = this


        // Bundle into puff and send this bad boy off
        var prom = Promise.resolve() // a promise we use to string everything along

        var usernames = [puffworldprops.ICX.toUser]

        var userRecords = usernames.map(PB.Data.getCachedUserRecord).filter(Boolean)
        var userRecordUsernames = userRecords.map(function (userRecord) {
            return userRecord.username
        })

        if (userRecords.length < usernames.length) {
            usernames.forEach(function (username) {
                if (!~userRecordUsernames.indexOf(username)) {
                    prom = prom.then(function () {
                        return PB.getUserRecordNoCache(username).then(function (userRecord) {
                            userRecords.push(userRecord)
                        })
                    })
                }
            })
        }

        prom = prom.then(function () {
            if (envelopeUserKeys) {      // add our secret identity to the list of available keys
                userRecords.push(PB.Data.getCachedUserRecord(envelopeUserKeys.username))
            } else {                    // add our regular old boring identity to the list of available keys
                userRecords.push(PB.M.Wardrobe.getCurrentUserRecord())
            }

            var post_prom = PB.M.Forum.addPost(type, content, parents, metadata, userRecords, envelopeUserKeys)
            post_prom = post_prom.then(self.handleSubmitSuccess.bind(self))
            return post_prom
        }).catch(function (err) {
            // self.cleanUpSubmit()
            Events.pub('ui/event/', {
                'ICX.messageSent': true,
                'ICX.successMessage': err.message
            })
        })

        this.cleanUpSubmit()

        return false
    }
})

var ICXNotifyEmail = React.createClass({
    render: function () {
        var textAreaContent = "I've sent you a private message. To view it, go to https://i.cx?icx.screen=login&icx.firstLogin=true and log in with username " + puffworldprops.ICX.toUser + ". Your private passpharse is the answer to the question: "+puffworldprops.ICX.wizard.prompt
        return (
            <span>Your message has been sent. However, <em>in order for your friend to read it, you need to let them know
            their username and prompt question</em>. We suggest sending the following email to {puffworldprops.ICX.wizard.invitedEmail}:
            <textarea value={textAreaContent} style={{width: '80%', height: '50%'}}/>
            </span>
        )
    }
})


var ICXNewUser = React.createClass({
    mixins: [TooltipMixin],

    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        ICX.buttonStyle.backgroundColor = ICX.currScreenInfo.color //'rgba(0, 3, 82, 1)'

        return (
            <div className="icx-screen icx-newuser">
                <div style={headerStyle}>{polyglot.t("header.signup")}</div>
                <div className="contentWindow">

                    <div><b>{polyglot.t("signup.username")}</b></div>

                .icx.<form onSubmit={this.handleSubmit}><input type="text" name="username" ref="username" defaultValue="" style={{size: 16}} onChange={this.handleUsernameFieldChange}/></form>
                    <span className="relative">
                        <a href="#" onClick={this.handleUsernameLookup}><ICXCheckmark show={puffworldprops.ICX.newUser.usernameStatus} /></a>
                        <Tooltip position='under' content="Check for availability" />
                    </span>
                    <span className="relative">
                        <a href="#" onClick={this.handleGenerateRandomUsername}><i className="fa fa-refresh" /></a>
                        <Tooltip position='under' content="Generate a new username" />
                    </span>
                    {' '}<span className="message">{puffworldprops.ICX.newUser.usernameMessage}</span>
                    <br /><br />
                    <div><b>{polyglot.t("signup.pass")}</b></div>
                    <textarea ref="passphrase" style={{width: '50%', height: '20%'}} onChange={this.handleRecheckPassphrase}/>{' '}<ICXCheckmark show={puffworldprops.ICX.newUser.passphraseStatus} />
                    <span className="relative">
                        <a href="#" onClick={this.handleGenerateRandomPassphrase}><i className="fa fa-refresh" /></a>
                        <Tooltip position='under' content="Generate a new passphrase" />
                    </span>
                    {' '}<span className="message">{puffworldprops.ICX.newUser.passphraseMessage}</span>
                    <br /><br />
                    <canvas id="avatarCanvas" width="120" height="60" style={{border: '1px solid #d3d3d3'}}>
                    </canvas>
                    <br />

                    <button style={ICX.buttonStyle} onClick={this.handleRegisterName}>{puffworldprops.ICX.nextStepMessage} <i className="fa fa-chevron-right" /></button>
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

    componentWillMount: function() { // on page load, generate a random username

        return false
    },

    componentDidMount: function() {
        this.handleGenerateRandomUsername()
        this.handleUsernameLookup()
        this.handleGenerateRandomPassphrase()

        var wizard = puffworldprops.ICX.wizard


        if(typeof wizard === 'undefined') {
            // User hasn't clicked SEND or STORE
            // User coming from Send but has not chosen a username to send to
            // User coming from Send, has toUser, but does not have message or file
            // User coming from Store but does not have a file uploaded
            return Events.pub('ui/event', {
                'ICX.nextStep': 'dashboard',
                'ICX.nextStepMessage': 'Finish'
            })
        } else if(wizard.sequence == 'send') {
            // User coming from Send, put them back there after they register
            return Events.pub('ui/event', {
                'ICX.nextStep': 'send',
                'ICX.nextStepMessage': 'Next'
            })

            /*
            // This will go elsewhere

            if(wizard.type == 'message') {
                return Events.pub('ui/event', {
                    'ICX.nextStep': 'send.confirm',
                    'ICX.nextStepMessage': 'Continue'
                })
            } else {
                return Events.pub('ui/event', {
                    'ICX.nextStep': 'send.file.confirm',
                    'ICX.nextStepMessage': 'Continue'
                })
            }
             */
        } else if(wizard.sequence == 'store') {

            // User coming from Store, and has uploaded a file
            return Events.pub('ui/event', {
                'ICX.nextStep': 'store.finish',
                'ICX.nextStepMessage': 'Create user and store file'
            })
        }

    },


    handleGenerateRandomUsername: function() {
        var adj = PB.Crypto.getRandomItem(ICX.adjectives)
        var color = PB.Crypto.getRandomItem(ICX.colornames)
        var animal = ICX.newUser.animalName = PB.Crypto.getRandomItem(ICX.animalNames)

        this.refs.username.getDOMNode().value = adj + color + animal
        getAvatar(color, animal)
        this.handleUsernameLookup()

        return false
    },

    handleGenerateRandomPassphrase: function() {
        // Everybody loves the exponential!
        var numb = 3
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
            'ICX.newUser.usernameMessage': false
        })
    },

    handleRecheckPassphrase: function() {
        var passphrase = this.refs.passphrase.getDOMNode().value
        if(passphrase.length < 8) {
            Events.pub('ui/event', {
                'ICX.newUser.passphraseStatus': false,
                'ICX.newUser.passphraseMessage': 'Too short'

            })

        } else {
            Events.pub('ui/event', {
                'ICX.newUser.passphraseStatus': true,
                'ICX.newUser.passphraseMessage': ''

            })
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

        Events.pub('ui/event', {
            'ICX.newUser.usernameStatus': false,
            'ICX.newUser.usernameMessage': false
        })

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
                'ICX.newUser.usernameStatus': false,
                'ICX.newUser.usernameMessage': 'Missing'
            })
            return false
        }

        // Cancel if we're already checking another username
        if(puffworldprops.ICX.newUser.checkingUsername) {
            // TODO: show a warning message, or disable the button on 'Busy' state
            Events.pub('ui/username/busy-message', {})
            return false
        }

        username = 'icx.' + username

        var prom = PB.getUserRecord(username)

        Events.pub('ui/username/requested', {
            'ICX.newUser.requestedUsername': username,
            'ICX.newUser.checkingUsername': username,
            'ICX.newUser.usernameMessage': 'Checking...',
            'ICX.newUser.usernameStatus': false
        })

        prom.then(function(result) {

            Events.pub('ui/username/taken', {
                'ICX.newUser.usernameStatus': false,
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

    handleImageLoad: function() {
        var self   = this
        var reader = new FileReader()

        reader.onload = function(event){
            return Events.pub('ui/reply/image-upload', {
                'profile.avatarUrl': event.target.result
            })
        }

        reader.readAsDataURL(this.refs.imageLoader.getDOMNode().files[0])
        return false
    },

    handleRegisterName: function() {

        this.handleUsernameLookup()
        if(!puffworldprops.ICX.newUser.usernameStatus) {
            return false
        }
        this.handleRecheckPassphrase()
        if(!puffworldprops.ICX.newUser.passphraseStatus) {
            return false
        }

        // START THINKING
        Events.pub('ui/thinking', {
            'ICX.thinking': true
        })

        updateUI();


        // Register the name
        // Error if there's an error
        // Disable register button until ready
        // When done, redirect to next location.

        var requestedUsername = "icx." + this.refs.username.getDOMNode().value
        var passphrase = this.refs.passphrase.getDOMNode().value

        // Convert passphrase to key
        var privateKey = passphraseToPrivateKeyWif(passphrase)
        var publicKey = PB.Crypto.privateToPublic(privateKey)

        var rootKeyPublic     = publicKey
        var adminKeyPublic    = publicKey
        var defaultKeyPublic  = publicKey

        var rootKeyPrivate    = privateKey
        var adminKeyPrivate   = privateKey
        var defaultKeyPrivate = privateKey

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

                // store directly because we know they're valid
                PB.M.Wardrobe.storePrivateKeys(requestedUsername, rootKeyPrivate, adminKeyPrivate, defaultKeyPrivate, {passphrase: passphrase})

                // Set this person as the current user
                PB.M.Wardrobe.switchCurrent(requestedUsername)

                // Create identity file
                ICX.identityForFile = {
                    comment: "This file contains your private passphrase. It was generated at i.cx. The information here can be used to login to websites on the puffball.io platform. Keep this file safe and secure!",
                    username: requestedUsername,
                    rootKeyPrivate: privateKey,
                    adminKeyPrivate: privateKey,
                    defaultKeyPrivate: privateKey,
                    passphrase: passphrase,
                    version: "1.0"
                }

                publishProfilePuff()

                Events.pub('ui/thinking', {
                    'ICX.thinking': false
                })
                return Events.pub('ui/icx/screen', {"view.icx.screen": puffworldprops.ICX.nextStep})

            },

            function(err) {
                // TODO: Deal with error, show it in box
                Events.pub('ui/thinking', {
                    'ICX.thinking': false
                })

                return Events.pub('ui/event', {})
            })
    }
});


var ICXNewUserFinish = React.createClass({
    render: function() {
        return <span>User created</span>
    }
})


var ICXLogin = React.createClass({
    mixins: [TooltipMixin],

    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor

        var baseFontH = ICX.calculated.baseFontH

        var currUser = PB.M.Wardrobe.getCurrentUsername()
        if (currUser)
            currUser = '.' + currUser

        var polyglot = Translate.language[puffworldprops.view.language]

        var thisScreen = ICX.screens.filter(function (obj) {
            return obj.name == puffworldprops.view.icx.screen;
        })[0] // NOTE RETURNS ARRAY


        var labelStyle = {
            marginRight: baseFontH + 'px'
        }

        var inputStyle = {
            display: 'inline-block'
        }


        return (

            <div className="icx-screen icx-login" style={ICX.calculated.baseTextStyle}>
                <div style={headerStyle}>{polyglot.t("header.login")}</div>

                <div className="component">

                    <div style={labelStyle}><b>{polyglot.t("login.username")}</b></div>
                .icx.
                    <form onSubmit={this.handleSubmit}><input type="text" name="username" ref="username" defaultValue={currUser} style={{size: 16}} onChange={this.verifyUsername} /></form>
                    <span className="relative">
                        <a href="#" onClick={this.handleUsernameLookup}><ICXCheckmark show={puffworldprops.ICX.usernameStatus} /></a>
                        <Tooltip position='under' content="Verify your username" />
                    </span>
                    <span className="message">{puffworldprops.ICX.usernameStatus}</span>

                    <br /><br />
                    <div className="relative">
                        <b>{polyglot.t("login.pass")}<sup>&#63;</sup></b>
                        <Tooltip content="This is the secret phrase you chose when signing up." />
                    </div>


                    <textarea type="text" name="defaultKey" ref="defaultKey" style={{width: '60%', height: '15%'}} onChange={this.handleResetCheckboxes} />
                    <span className="relative">
                        <a href="#" onClick={this.handlePassphraseCheck}>
                            <ICXCheckmark show={puffworldprops.ICX.defaultKey} />
                        </a>
                        <Tooltip position='under' content="Verify your passphrase" />
                    </span>

                    <span className="message">{puffworldprops.ICX.defaultKey}</span>
                    <br /><br />
                    <i><em>{polyglot.t("login.or")}</em></i>
                    <br /><br />
                    <div className="relative">
                        {polyglot.t("login.id_file")}<sup>&#63;</sup>
                        <Tooltip content="Authenticate with this browser using your private identity file" />
                    </div>

                    <br />
                    <span style={ICX.buttonStyle} className="buttonSpan">
                        <input type="file" className ="fileSelect" id="fileToUpload" ref="textFile" onChange={this.handleLoginWithFile}/>
                    </span>

                </div>
            </div>
            )
    },

    handleSubmit: function (e) {
        e.preventDefault()
        this.handleUsernameLookup()
        return false
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

        username = 'icx.' + username

        var prom = PB.getUserRecord(username)

        prom.then(function (result) {
            Events.pub('ui/puff-packer/userlookup',{
                'ICX.usernameStatus': true
            })
        })
            .catch(function (err) {
                Events.pub('ui/puff-packer/userlookup/failed',{
                    'ICX.usernameStatus': 'Not found'
                })
            })
        return false
    },

    componentWillMount: function () {
        Events.pub('ui/event', {
            'ICX.usernameStatus': false,
            'ICX.defaultKey': false
        })
    },

    handlePassphraseCheck: function () {
        // First convert to private key, then to public, then verify against DHT

        var self = this

        var username = this.refs.username.getDOMNode().value

        // Check for zero length
        if (!username.length) {

            Events.pub('ui/event', {
                'ICX.usernameStatus': 'Missing'
            })
            return false
        }

        username = 'icx.' + username

        var passphrase = this.refs['defaultKey'].getDOMNode().value

        // Check for zero length
        if (!passphrase.length) {

            Events.pub('ui/event', {
                'ICX.defaultKey': 'Missing'
            })
            return false
        }

        // Convert to private key
        var privateKey = passphraseToPrivateKeyWif(passphrase)

        // Convert to public key
        var publicKey = PB.Crypto.privateToPublic(privateKey)
        if (!publicKey) {
            Events.pub('ui/event', {
                'ICX.defaultKey': 'Bad Key'
            })
            return false
        }

        var prom = PB.getUserRecord(username)

        prom
            .then(function (userInfo) {
                var didSomething = false
            
                if (publicKey == userInfo['defaultKey']) {
                    PB.M.Wardrobe.storeDefaultKey(username, privateKey)
                    didSomething = true
                }
            
                if (publicKey == userInfo['adminKey']) {
                    PB.M.Wardrobe.storeAdminKey(username, privateKey)
                    didSomething = true
                }
            
                if (publicKey == userInfo['rootKey']) {
                    PB.M.Wardrobe.storeRootKey(username, privateKey)
                    didSomething = true
                }
            
                if(!didSomething) {
                    Events.pub('ui/event', {
                        'ICX.defaultKey': 'Incorrect key'
                    })
                    return false
                } 
                
                Events.pub('ui/event', {
                    'ICX.defaultKey': true,
                    'ICX.usernameStatus': true
                })

                // At least one good key: make current user and add passphrase to wardrobe
                PB.M.Wardrobe.switchCurrent(username)
                PB.M.Wardrobe.storePrivateBonus(username, {passphrase: passphrase})


                if(puffworldprops.view.icx.firstLogin) {
                    return Events.pub('/ui/icx/screen', {"view.icx.screen": "changepassphrase"})
                }

                Events.pub('/ui/icx/screen', {"view.icx.screen": "dashboard"})
                return false
            })
            .catch(function (err) {
                Events.pub('ui/event', {
                    'ICX.defaultKey': 'Not found'
                })
                return false
            })
            
        return false
    },

    verifyUsername: function () {
        var username = this.refs.username.getDOMNode().value
        var finalChar = username.charAt(username.length-1)
        username = StringConversion.reduceUsernameToAlphanumeric(username, /*allowDot*/true)
            .toLowerCase()
        this.refs.username.getDOMNode().value = username
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

    handleLoginWithFile: function(event) {

        var fileprom = PBFiles.openTextFile(event.target)
        fileprom.then(function(content) {

            // Try and parse, if can't return error
            try {
                var identityObj = JSON.parse(content);
            } catch (e) {
                console.log('failed')
                // TODO: return an error here
                return false
            }

            var username = identityObj.username
            if(!username)
                return false

            // Do login, return error as needed
            if(identityObj.passphrase) {
                var privateKey = passphraseToPrivateKeyWif(identityObj.passphrase)
            } else if(identityObj.defaultKeyPrivate) {
                 var privateKey = identityObj.defaultKeyPrivate;
            } else {
                // TODO: Send to error box
                // console.log("Missing info");
                /// console.log(identityObj)
                return PB.onError("Missing info");
            }


            // Convert to public key
            var publicKey = PB.Crypto.privateToPublic(privateKey)
            if (!publicKey) {
                console.log('bad key')
                Events.pub('ui/event', {
                    'ICX.defaultKey':'Bad key'
                })
                return false
            }

            var prom = PB.getUserRecord(username)

            prom.then(function (userInfo) {

                if (publicKey != userInfo.defaultKey) {
                    console.log('incorrect key')
                    Events.pub('ui/event', {
                        'ICX.defaultKey':'Incorrect key'
                    })
                    return false
                } else {

                    // Add this to wardrobe, set username to current
                    PB.M.Wardrobe.storeDefaultKey(username, privateKey)

                    // At least one good key, set this to current user
                    PB.M.Wardrobe.switchCurrent(username)


                    ICX.username = username
                    return Events.pub('/ui/icx/screen', {"view.icx.screen": 'dashboard'})

                }
            })
                .catch(function (err) {
                    console.log('fail')
                    Events.pub('ui/event', {
                        'ICX.defaultKey':'Not found'
                    })

                    return false
                })
            return false
        })
    }
})


var ICXDashboard = React.createClass({
    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        var username = ICX.username

        var filename = username + "Identity.json"

        /*
        <a href="#" >
         <i className="fa fa-fw fa-file-image-o" />
         Change your avatar
         </a>
         <br />
         <div>
         <input type="file" id="imageLoader" name="imageLoader" ref="imageLoader" onChange={this.handleUploadAvatar}/>
         </div>
         */

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.dashboard")} {username}</div><br />
                <div className="contentWindow">
                    Want a better username&#63; Try <a href="#" onClick={this.handleAskForUsername}>asking for one</a> nicely.
                    <br /><br />

                    <a href="#" className="inline" onClick={this.handleGoTo.bind(null, 'home.table')}>
                        <i className="fa fa-fw fa-list" />
                        {polyglot.t("dashboard.tableview")}
                    </a>
                    <br /><br />
                    <a href="#" className="inline" ref="createFileButton" onClick={this.handleDownloadIdentityFile}>
                        <i className="fa fa-fw fa-download" />
                        {polyglot.t("dashboard.download_id")}
                    </a>
                    <br /><br />
                    <a href="#" className="inline" onClick={this.handleGoTo.bind(null, 'changepassphrase')}>
                        <i className="fa fa-fw fa-gears" />
                        {' '}Change your passphrase
                    </a>

                    <br /><br />

                    <a href="#" ref="fileLink" download={filename} ><span style={{display: 'none'}}>{filename}</span></a>

                    <a href="#" className="inline" onClick={this.handleGoTo.bind(null, 'encryptdecrypt')}>
                        <i className="fa fa-fw fa-file-excel-o" />
                        {polyglot.t("dashboard.filesys")}
                    </a>
                    <br /><br />




                    <a href="#" className="inline" onClick={this.handleSignOut}>
                        <i className="fa fa-fw fa-sign-out" />
                        {polyglot.t("dashboard.logout")}
                    </a>
                </div>
            </div>
            )
    },
    componentDidMount: function() {
        // resetting ICX.wizard here
        var browser = getBrowser()
        if (browser == "Safari") {
            ICX.errors = "WARNING: You web browser does not support saving files created in the browser itself. " +
                "As a result, you may not be able to download passphrase files or files you have encrypted."

            Events.pub('/ui/icx/error', {"icx.errorMessage": true})
        }
        Events.pub('ui/event', {
            'ICX.wizard': undefined,
            'ICX.nextStatus': false
        })



    },

    handleUploadAvatar: function() {
        var self   = this
        var reader = new FileReader()

        reader.onload = function(event){
            return Events.pub('ui/event', {
                'profile.avatarUrl': event.target.result
            })
        }

        reader.readAsDataURL(this.refs.imageLoader.getDOMNode().files[0])
        publishProfilePuff()

        return false
    },

    // Generate download link of file
    handleGenerateIdentityFile: function() {

        // Bail if no username,
        var username = PB.M.Wardrobe.getCurrentUsername()
        if(!username)
            return false

        // Only generate if it doesn't already exist
        // if(isEmpty(ICX.identityForFile)) {

            ICX.identityForFile.comment = "This file contains your private passphrase. It was generated at i.cx. The information here can be used to login to websites on the puffball.io platform. Keep this file safe and secure!"
            ICX.identityForFile.username = username
            ICX.identityForFile.version = "1.0"

            if(typeof PB.M.Wardrobe.currentKeys.root !== 'undefined')
                ICX.identityForFile.rootKeyPrivate =  PB.M.Wardrobe.currentKeys.root

            if(typeof PB.M.Wardrobe.currentKeys.admin !== 'undefined')
                ICX.identityForFile.adminKeyPrivate =  PB.M.Wardrobe.currentKeys.admin

            if(typeof PB.M.Wardrobe.currentKeys.default !== 'undefined')
                ICX.identityForFile.defaultKeyPrivate =  PB.M.Wardrobe.currentKeys.default

            if(typeof PB.M.Wardrobe.currentKeys.bonus !== 'undefined')
                if(typeof PB.M.Wardrobe.currentKeys.bonus.passphrase !== 'undefined')
                    ICX.identityForFile.passphrase =  PB.M.Wardrobe.currentKeys.bonus.passphrase

        //}

        // Identity file for a freshly registered user does not have the username field filled in
        // if(isEmpty(ICX.identityForFile.username) || typeof ICX.identityForFile.username === 'undefined') {
        //     ICX.identityForFile.username = username
        // }

        return ICX.identityForFile
    },

    handleAskForUsername: function() {
        return Events.pub('/ui/icx/screen', {
            "view.icx.screen": 'send',
            "view.icx.toUser": 'mattasher'
        });
    },


    handleGoTo: function(screen) {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
    },

    handleDownloadIdentityFile: function() {
        var content = JSON.stringify(this.handleGenerateIdentityFile())

        var filename = PB.M.Wardrobe.getCurrentUsername() + "Identity.json"

        fileLink = this.refs.fileLink.getDOMNode()

        fileLink.href = PBFiles.prepBlob(content)
        fileLink.download = filename
        fileLink.click()
    },

    handleSignOut: function() {
        var userToRemove = PB.M.Wardrobe.getCurrentUsername()

        // Confirm alert first
        var msg = "WARNING: If you have not yet saved your passphrase, hit Cancel and click on your username to access your passphrase. Are you sure you wish to continue?"

        var r = confirm(msg)
        if (r == false) {
            return false
        }

        PB.M.Wardrobe.removeKeys(userToRemove)
        ICX.username = ''
        ICX.identityForFile = {}
        Events.pub('user/'+userToRemove+'/remove', {})
        return Events.pub('/ui/icx/screen', {"view.icx.screen": this.props.goto});
    }
})


var ICXChangePassphrase = React.createClass({


    render: function () {

        var mustChangeMsg = ''
        if(puffworldprops.view.icx.firstLogin) {
            var mustChangeMsg = <div>This appears to be your first login, using a shared secret. If you have not already done so, please change your passphrase right away</div>
        }

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor

        var username = ICX.username

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Change passphrase for {username}</div><br />
                {mustChangeMsg}
                <div className="contentWindow">
                    New passphrase: <input type="text" ref="passphrase" />
                    <br /><br />
                    <button style={ICX.buttonStyle} onClick={this.handleChangePassphrase}>Make change <i className="fa fa-chevron-right" /></button>

                </div>
            </div>
        )
    },

    handleChangePassphrase: function() {
        var payload = {}
        var rootKeyPrivate = PB.M.Wardrobe.getCurrentKeys().root
        var adminKeyPrivate = PB.M.Wardrobe.getCurrentKeys().admin
        var routes = []
        var type = 'updateUserRecord'
        var content = 'modifyUserKey'


        Events.pub('ui/thinking', {
            'ICX.thinking': true
        })
        updateUI();


        var newKeyRaw = this.refs.passphrase.getDOMNode().value

        var newPrivateKey = passphraseToPrivateKeyWif(newKeyRaw)
        var newPublicKey = PB.Crypto.privateToPublic(newPrivateKey)

        var keysToModify = ['rootKey', 'adminKey', 'defaultKey']

        updateKeyHelper(keysToModify)

        function updateKeyHelper(keys) {
            if(keys.length == 0) {

                Events.pub('ui/thinking', {
                    'ICX.thinking': false
                })
                //clear any error messages
                Events.pub('/ui/icx/error', {
                    "ICX.errorMessage": false
                })

                return Events.pub('/ui/icx/screen', {"view.icx.screen": 'changepassphrase.finish'});
            }

            var keyToModify = keys.pop()

            if (keyToModify == 'rootKey' || keyToModify == 'adminKey') {
                if (!rootKeyPrivate) {
                    ICX.errors = "WARNING: You do not have the proper keys set to change this key."
                    Events.pub('ui/thinking', {
                        'ICX.thinking': false
                    })
                    Events.pub('/ui/icx/error', {"icx.errorMessage": true})
                } else {
                    var signingUserKey = rootKeyPrivate
                    // console.log("request will be signed with root key")
                }
            } else if (keyToModify == 'defaultKey') {
                if (!adminKeyPrivate) {
                    Events.pub('ui/thinking', {
                        'ICX.thinking': false
                    })
                    ICX.errors = "WARNING: You do not have the proper keys set to change your default key."
                    Events.pub('/ui/icx/error', {"icx.errorMessage": true})

                } else {
                    var signingUserKey = adminKeyPrivate
                    // console.log("request will be signed with admin key")
                }
            }

            payload.keyToModify = keyToModify
            payload.newKey = newPublicKey
            payload.time = Date.now()

            var puff = PB.buildPuff(ICX.username, signingUserKey, routes, type, content, payload)

            var prom = PB.Net.updateUserRecord(puff)

            prom.then(function (result) {

                if(keyToModify == 'defaultKey') {
                    PB.M.Wardrobe.storeDefaultKey(ICX.username, newPrivateKey)
                    PB.M.Wardrobe.storePrivateBonus(ICX.username, {passphrase: newKeyRaw})
                }

                if(keyToModify == 'adminKey') {
                    PB.M.Wardrobe.storeAdminKey(ICX.username, newPrivateKey)
                }

                if(keyToModify == 'rootKey') {
                    PB.M.Wardrobe.storeRootKey(ICX.username, newPrivateKey)
                }

                updateKeyHelper(keys)

            })
                .catch(function (err) {
                    Events.pub('ui/thinking', {
                        'ICX.thinking': false
                    })
                    // console.log(puff)
                    ICX.errors = "FAILED " + err
                    return Events.pub('/ui/icx/error', {"icx.errorMessage": true})
                })
        }
    }

})


var ICXChangePassphraseFinish = React.createClass({
    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        var username = ICX.username

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Change passphrase for {username}</div><br />
                <div className="contentWindow">
                Success! Make sure to save your new passphrase. You can download your passphrase in an identity file and
                make other changes on your <a href="#" className="inline" onClick={this.handleGoToDashboard}>dashboard page</a>.
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

var ICXTableView = React.createClass({

    render: function () {

        var viewprops = this.props.view || {}
        var view = <TableView view={viewprops} table={viewprops.table}/>
        document.body.style.overflowY = "auto"

        return (
            <div className="icx-screen">{view}</div>
            )
    }
})

var ICXLearn = React.createClass({

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
                <br /><br />
                {polyglot.t("learn.more")}<a href="#" className="inline" onClick={this.handleGoInDepth}>{polyglot.t("learn.link")}</a>.
                </div>
            </div>
        )
    },

    handleGoInDepth: function() {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'indepth'});
    }
})

var ICXIndepth = React.createClass({

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
                To send a message or file, I.CX uses the public key of your recipient to encrypt your content so that only they can open it. All of your content is encrypted client side (right in your web browser), using javascript and trusted cryptographic libraries. There is no master key that opens all messages, no backdoor, no way to reset someone else’s secret code. No passwords are ever sent over the network.

                <br /><br />

                We even have a way to load your identity into a web browser without typing in your passphrase, just in case you happen to be in a public location.

                <br /><br />
                I.CX uses the <a href="http://www.puffball.io" target="_new">puffball platform</a> to handle distribution of encrypted content in a format known as a "puff". For detailed technical information about puffs visit the <a href="https://github.com/puffball/puffball" target="_new">github repository</a>.
                </div>
            </div>

            )
    }
})


var ICXAbout = React.createClass({

    render: function () {

        var polyglot = Translate.language[puffworldprops.view.language]

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{polyglot.t("header.about")}</div><br />
                <div className="contentWindow">
                {polyglot.t("about.built")}<a href="http://www.puffball.io" className="inline" target="_blank">{polyglot.t("about.platform")}</a>.
                    <br />
                    <br />
                    <b>{polyglot.t("about.devs")}</b>
                    <br />
                • <a href="#" className="inline" onClick={this.messageUser.bind(null, 'mattasher')}>Matt Asher</a><br />
                • <a href="#" className="inline" onClick={this.messageUser.bind(null, 'dann')}>Dann Toliver</a><br />
                • <a href="#" className="inline" onClick={this.messageUser.bind(null, 'icx.adam')}>Adam Rafeek</a><br />
                • <a href="#" className="inline" onClick={this.messageUser.bind(null, 'icx.mike')}>Michael Guo</a>
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
            "view.icx.toUser": username
        });
    }

})

var ICXHome = React.createClass({

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

var ICXFileConverter = React.createClass({

    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color
        ICX.buttonStyle.background = headerStyle.backgroundColor
        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Encrypt and Decrypt Files</div>
                <div className="contentWindow">
                    <i className="fa fa-fw fa-lock"></i>Select a file. It will be encrypted in your web browser.
                    <br /><br />

                    <span style={ICX.buttonStyle} className="buttonSpan">
                        <input type="file" className="fileSelect" id="fileToUpload" ref="uploadbutton" onChange={this.handleGetFile}/>
                    </span>

                    <br /><br />
                    <a ref="encryptedLink" download="no_file_selected" style={{display:'none'}}>Save Encrypted File</a>
                    <br />
                    <b>OR</b>
                    <br /><br />
                    <i className="fa fa-fw fa-unlock"></i>Select a .puff file to decrypt.
                    <br /><br />

                    <span style={ICX.buttonStyle} className="buttonSpan">
                        <input type="file" className="fileSelect" id="fileToUpload" ref="decryptbutton" onChange={this.handleDecryptFile}/>
                    </span>
                    <br /> < br />
                    <a ref="decryptedDownload" download="no_file_selected" style={{display:'none'}}>Save Decrypted File</a>

                </div>
            </div>
        )
    },

    handleDecryptFile: function(event) {
        //start thinking
        Events.pub('ui/thinking', {
            'ICX.thinking': true
        })
        updateUI();

        var decryptFile = this.refs.decryptbutton.getDOMNode()
        var resultLink = this.refs.decryptedDownload.getDOMNode()
        var element = event.target
        var fileprom = PBFiles.openPuffFile(element)
        fileprom.then(function(fileguts) {
            var letterPuff = PBFiles.extractLetterPuffForReals(fileguts)

            if (!letterPuff ||typeof letterPuff === 'undefined') { //check if something went wrong
                Events.pub('ui/thinking', {
                    'ICX.thinking': false
                })
                ICX.errors = "ERROR: File decryption failed. This file may already be unencrypted or you may not have permission to decrypt this file."
                return Events.pub('/ui/icx/error', {"icx.errorMessage": true})
            }
            else {
                var content = (letterPuff.payload || {}).content
                var type = (letterPuff.payload || {}).type
                var filelist = decryptFile.files
                var file = filelist[0]
                var filename = file.name

                if (/\.puff/.test(filename)) {
                    filename = filename.slice(0, -5)
                }
                resultLink.style.display = ""
                resultLink.href = PBFiles.prepBlob(content, type)
                resultLink.download = filename

                //stop thinking
                Events.pub('ui/thinking', {
                    'ICX.thinking': false
                })
                //clear any error messages
                Events.pub('/ui/icx/error', {
                    "icx.errorMessage": false
                })
            }
        })

    },

    handleGetFile: function(event) {
        //start thinking
        Events.pub('ui/thinking', {
            'ICX.thinking': true
        })
        updateUI();
        //Encrypt the file in a puff
        var element = event.target

        ICX.fileprom = PBFiles.openBinaryFile(element)

        ICX.filelist = element.files

        var encrypedLink = this.refs.encryptedLink.getDOMNode()

        ICX.fileprom.then(function(blob) {
            var puff = PBFiles.createPuff(blob, 'file')

            var filelist = ICX.filelist
            var file     = filelist[0]
            var filename = file.name
            var new_filename = filename + '.puff'

            // Make the link visible to download the file
            // stop thinking
            Events.pub('ui/thinking', {
                'ICX.thinking': false
            })
            encrypedLink.style.display=""
            encrypedLink.href = PBFiles.prepBlob(puff)
            encrypedLink.download = new_filename
        })

    },

    componentDidMount: function(event){
        var browser = getBrowser()
        if (browser == "Safari") {
            ICX.errors = "WARNING: You may not be able to download files because Safari dose not support the download attribute."
            return Events.pub('/ui/icx/error', {"icx.errorMessage": true})
        }


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
            position: 'absolute',
            border: '3px solid #880000',
            bottom: '0',
            padding: Math.floor(0.4*ICX.calculated.baseFontH)+'px',
            borderRadius: Math.floor(0.3*ICX.calculated.baseFontH)+'px',
            width: '95%',
            marginBottom: Math.floor(0.5*ICX.calculated.baseFontH)+'px',
            fontSize: Math.floor(0.8*ICX.calculated.baseFontH)+'px'
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
        return Events.pub('/ui/icx/errorMessage', {"icx.errorMessage": false});
    }
})

var ICXLogo = React.createClass({
    handleGoHome: function() {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'home'});
    },

    handleGoTo: function(screen) {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
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
                        {polyglot.t("header.home")}
                    </div>
                </div>
                )
        } else {

            var thisScreen = ICX.screens.filter(function( obj ) {
                return obj.name == puffworldprops.view.icx.screen;
            })[0];

            var logoW = w*ICX.config.logoSmallRatio
            var logoY = Math.floor( h*ICX.config.logo.insetsSmall.top ) + "px"
            var logoX = Math.floor( h*ICX.config.logo.insetsSmall.left ) + "px"
            logoW = logoW + "px"
            var divW = w*ICX.config.buttonSmallWidthRatio

            return (
                <div style={{position: 'absolute', top: logoY, width: divW, left: logoX}}>
                    <a href="#" onClick={this.handleGoHome}>
                        <img src="img/icx/icxLogo.png" style={{width: logoW}} alt={thisScreen.fullText} />
                    </a>
                </div>
            )
        }
    }

});

var ICXLinks = React.createClass({

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

var ICXButtonLink = React.createClass({
    handleGoTo: function(screen) {
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
            position: 'absolute',
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
            buttonStyle.left = 0
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
            buttonStyle.width = Math.floor( w*ICX.config.buttonWidthRatio ) + 'px'
            buttonStyle.position = 'absolute'
            buttonStyle.top = 0
            buttonStyle.height = Math.floor( h*ICX.config.buttonHeightRatio/2 ) + 'px'
            buttonStyle.lineHeight = Math.floor( h*ICX.config.buttonHeightRatio/2 ) + 'px'
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
});

var ICXFooter = React.createClass({

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
});


var ICXUserButton = React.createClass({
    mixins: [TooltipMixin],

    render: function() {

        var polyglot = Translate.language[puffworldprops.view.language]

        var username = ICX.username
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
                    <a href="#"  onClick={this.handleGoTo.bind(null, 'home.table')} style={{color: '#ffffff'}}>
                        <i className="fa fa-w fa-list" />
                    </a>
                    {' '}
                    <a href="#"  onClick={this.handleGoTo.bind(null, 'dashboard')} style={{color: '#ffffff'}}>
                        <i className="fa fa-fw fa-user" />{username}
                    </a>
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
                'view.filters': {},
                'view.filters.users': []
            }
        )
    },

    handleGoTo: function(screen) {
        if(screen == 'home.table') this.handleClearFilters()
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen})
    },

    handleSignOut: function() {
        var userToRemove = PB.M.Wardrobe.getCurrentUsername()

        // Confirm alert first
        var msg = "WARNING: If you have not yet saved your passphrase, hit Cancel and click on your username to access your passphrase. Are you sure you wish to continue?"

        var r = confirm(msg)
        if (r == false) {
            return false
        }

        PB.M.Wardrobe.removeKeys(userToRemove)
        ICX.username = ''
        ICX.identityForFile = {}
        ICX.currScreen = 'home'
    }

})

var ICXNextButton = React.createClass({
    handleNext: function() {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": this.props.goto});
    },

    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language]
        
        if(this.props.text) {
            var buttonText = this.props.text
        } else {
            var buttonText = polyglot.t("button.next")
        }

        if(this.props.enabled) {
            ICX.buttonStyle.backgroundColor = ICX.currScreenInfo.color

            return <button style={ICX.buttonStyle} onClick={this.handleNext}>{buttonText} <i className="fa fa-chevron-right" /></button>

        } else {
            ICX.buttonStyle.backgroundColor = 'rgba(0, 3, 82, .1)' //
            ICX.buttonStyle.cursor = 'default' //

            return <button style={ICX.buttonStyle} onClick={this.handleNext} disabled>{buttonText} <i className="fa fa-chevron-right" /></button>
        }
    }
})


// Not yet implemented
var ICXLangSelect = React.createClass({
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

var ICXCheckmark = React.createClass({
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


























var PuffBarShortcutMixin = {
    // call methods from PuffBar of cursor puff directly for shortcuts
    componentDidMount: function() {
        // shift+f bomb the cursor puff
        Mousetrap.bind(['shift+f'], function(){
            var cursor = puffworldprops.view.cursor
            var bar = this.refs[cursor].refs['bar']
            if (bar.refs.flag)
                bar.refs.flag.handleFlagRequest()
        }.bind(this))

        // shift+i toggle the infobar for the cursored puff only
        Mousetrap.bind(['shift+i'], function(){
            var cursor = puffworldprops.view.cursor
            var bar = this.refs[cursor].refs['bar']
            var author = this.refs[cursor].refs['author']
            var className = ' ' + bar.getDOMNode().className + ' '
            if (className.indexOf(' hidden ') == -1) {
                bar.getDOMNode().className += ' hidden'
                author.getDOMNode().className += ' hidden'
            } else {
                bar.getDOMNode().className = className.replace(' hidden ', '')
                var authorClassName = ' ' + author.getDOMNode().className + ' '
                author.getDOMNode().className = authorClassName.replace(' hidden ', '')
            }
        }.bind(this))

        // r replies to the cursored puff
        Mousetrap.bind('r', function() {
            // if (puffworldprops.reply.preview) return false

            var cursor = puffworldprops.view.cursor
            var bar = this.refs[cursor].refs['bar']
            if (bar.refs.reply) {
                bar.refs.reply.handleClick()
            }
            return false
        }.bind(this))
    }
}

var ViewKeybindingsMixin = {
    componentDidMount: function() {

        // n shows new puff form
        Mousetrap.bind('n', function() {
            // if (puffworldprops.reply.preview) return false

            var menu = Boron.shallow_copy(puffworlddefaults.menu)
            menu.show = true
            menu.section = 'publish'

            return Events.pub('ui/reply/open', { 'clusters.publish': true
                , 'menu': menu
            })
        }.bind(this))

        // a toggles animation
        Mousetrap.bind('a', function() {
            return Events.pub( 'ui/animation/toggle',
                { 'view.animation': !this.props.view.animation })
        }.bind(this))

        // i toggles info boxes
        Mousetrap.bind('i', function() {
            return Events.pub( 'ui/view/showinfo/toggle',
                { 'view.showinfo': !this.props.view.showinfo })
        }.bind(this))

        // m toggles menu show
        Mousetrap.bind('m', function() {
            return Events.pub('ui/menu/toggle',
                {'menu.show': !puffworldprops.menu.show})
        }.bind(this))

        // k go to keyboard shortcut
        Mousetrap.bind('k', function() {
            var polyglot = Translate.language[puffworldprops.view.language]
            Events.pub('ui/view/rows/1', {'view.rows': 1})
            showPuff(polyglot.t("puff.shortcut"))
            return false
        }.bind(this))


        // l shows latest puffs
        Mousetrap.bind('l', function() {
            if(puffworldprops.view.rows < 2)
                var showRows = puffworlddefaults.view.rows
            else
                var showRows = puffworldprops.view.rows

            return Events.pub('ui/show/latest', { 'view.mode': 'list'
                , 'view.rows': showRows
                , 'view.filters': {}
                , 'view.query': puffworlddefaults.view.query
                , 'menu': puffworlddefaults.menu})
        }.bind(this))

        // 1-9 controls number of rows
        Mousetrap.bind(['1','2','3','4','5','6','7','8','9'], function(e) {
            return Events.pub('ui/view/rows/set', {'view.rows': 1*String.fromCharCode(e.which)})
        }.bind(this))

        // Go with wide aspect ratio
        Mousetrap.bind('w', function(e) {
            return Events.pub('ui/view/boxRatio/set', {'view.boxRatio': 1.618})
        }.bind(this))

        // Go with tall aspect ratio
        Mousetrap.bind('t', function(e) {
            return Events.pub('ui/view/boxRatio/set', {'view.boxRatio': 0.618})
        }.bind(this))

        // Go square
        Mousetrap.bind('s', function(e) {
            return Events.pub('ui/view/boxRatio/set', {'view.boxRatio': 1})
        }.bind(this))

        // spacebar toggles arrow display
        Mousetrap.bind('space', function(e) {
            return Events.pub( 'ui/relationships/toggle',
                { 'view.arrows': !this.props.view.arrows })
        }.bind(this))

        // escape closes expand, else closes menu, else set cursor back to default (topleft for list mode, or focused puff for focus mode)
        //// NOT removes cursor, else pops up 'nothing to close' alert since we are setting the cursor to a default position when it is false
        Mousetrap.bind('esc', function(e) {
            if(puffworldprops.menu.popout) {
                var section = puffworldprops.menu.popout
                return Events.pub('ui/close-popout', {'menu.popout': false,
                    'menu.show': true,
                    'menu.section': section})

            }

            if(puffworldprops.slider.show)
                return Events.pub('ui/slider/close', {'slider.show': false})

            if(puffworldprops.menu.show)
                return Events.pub('ui/menu/close', {'menu.show': false})

            /*if(puffworldprops.reply.expand)
             return Events.pub('ui/expand/close', {'reply': {expand: false, parents: []}})*/

            if(puffworldprops.view.cursor) {
                var cursor = document.getElementById(puffworldprops.view.cursor)
                cursor.className = cursor.className.replace(' cursor', '')
                return Events.pub('ui/menu/close', {'view.cursor': false})
            }

            // alert("I'm afraid there's nothing left to close!")
        }.bind(this))

        // cmd-enter submits the reply box
        Mousetrap.bind(['command+enter','ctrl+enter'], function(e) {
            if(!(puffworldprops.menu.popout == 'publish' ||
                (puffworldprops.menu.show && puffworldprops.menu.section == 'publish'))) {
                return true
            }

            if(typeof globalReplyFormSubmitArg == 'function')
                globalReplyFormSubmitArg()
        }.bind(this))


        // we have to customize stopCallback to make cmd-enter work inside reply boxes
        Mousetrap.stopCallback = function(e, element, combo) {

            // if the element has the class "mousetrap" AND the combo is command+enter or esc, then no need to stop
            if(~['command+enter', 'esc','ctrl+enter'].indexOf(combo) && (' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
                return false
            }

            // stop for input, select, and textarea
            return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || (element.contentEditable && element.contentEditable == 'true')
        }
    },
    componentWillUnmount: function() {
        Mousetrap.reset()
    }
}

var CursorBindingsMixin = {
    gotoNext: function(current, dir) {
        var next = Gridbox.findNeighbor(globalGridBox.get(), PB.M.Forum.getPuffBySig(current), dir)
        if (next) {
            Events.pub('ui/view/cursor/set', {'view.cursor': next.sig})
            return true
        }
        return false
    },
    componentDidMount: function() {

        var arrowToDir = { 37: 'left'
            , 38: 'up'
            , 39: 'right'
            , 40: 'down' }

        // arrows move the selection cursor
        // THINK: wasd?
        Mousetrap.bind(['left', 'up', 'right', 'down'], function(e) {
            var current = this.props.view.cursor
            var dir = arrowToDir[e.which]

            if (!current)                              // default cursors handled elsewhere (there should always
                return false                           // be an active cursor, if we are in a cursorable mode)

            var nextFn = this.gotoNext.bind(this, current, dir)
            var success = nextFn()
            if (!success){
                if (e.which == 38 && this.refs.scrollup) {
                    this.refs.scrollup.handleScroll()
                    var success = false
                    var readyStateCheckInterval = setInterval(function() {
                        success = nextFn()
                        if (success) {
                            clearInterval(readyStateCheckInterval)
                        }
                    }, 25)
                }
                if (e.which == 40 && this.refs.scrolldown) {
                    this.refs.scrolldown.handleScroll()
                    // may need a limit on this
                    var limit = 40
                    var success = false
                    var readyStateCheckInterval = setInterval(function() {
                        success = nextFn()
                        limit--
                        if (success || limit < 0) {
                            clearInterval(readyStateCheckInterval)
                        }
                    }, 25)
                }
            }

            return false
        }.bind(this))

        // enter focuses the selected puff
        Mousetrap.bind('enter', function(e) {
            // don't refocus if there's nothing selected
            if (!this.props.view.cursor)
                return false

            // don't refocus if we're selecting the focused puff
            if (this.props.view.cursor == this.props.view.query.focus)
                return false

            showPuff(this.props.view.cursor)
            return false
        }.bind(this))


    },
    componentWillUnmount: function() {
        Mousetrap.reset()
    },
    cursorPower: function(puffs, defaultPuff) {
        // set the cursor to default when cursor puff is outside the view or cursor is set to false
        var cursor = this.props.view.cursor

        if(cursor) {
            var oneOfThesePuffsIsSelected = puffs.filter(function(puff) {return puff.sig == cursor}).length
            if(oneOfThesePuffsIsSelected) {
                return false
            }
        }

        var newCursor = (defaultPuff||puffs[0]||{}).sig

        if(newCursor) {  // do this manually so auto-cursoring doesn't gum up history
            update_puffworldprops({'view.cursor': newCursor})
            updateUI()
        }
    }
}

var GridLayoutMixin = {
    getScreenCoords: function() {
        if(CONFIG.menuRight) {
            var margin = CONFIG.rightMargin
        } else {
            var margin = CONFIG.leftMargin
        }

        return { width:  window.innerWidth - margin
            , height: window.innerHeight - CONFIG.verticalPadding
        }
    },
    getDimensions: function() {
        var rows = ~~this.props.view.rows || 4
        var cols = this.getCols(rows)
        return { rows: rows
            , cols: cols
        }
    },
    getCols: function(rows) {
        var screencoords = this.getScreenCoords()
        var boxHeight = (screencoords.height / rows)


        var boxWidth = this.props.view.boxRatio * boxHeight
        // Make sure this is not too big for page!
        if (boxWidth > screencoords.width) {
            boxWidth = screencoords.width
        }

        var nCol = Math.floor(screencoords.width/boxWidth)

        return nCol

    },
    getGridBox: function(rows) {
        var screencoords = this.getScreenCoords()
        var boxHeight = screencoords.height / rows

        // How many cols fit in this page
        var nCol = this.getCols(rows)
        var w = nCol * this.props.view.boxRatio* boxHeight
        if(w > screencoords.width) {
            w = screencoords.width
        }

        var myGridbox = Gridbox.getGridCoordBox(rows, nCol, w, screencoords.height)

        // this.setState({gridBox: myGridbox}) // ugh state but whaddyagonnado
        globalGridBox = myGridbox // ugh globals but whaddyagonnado
        return myGridbox
    },
    getStandardBox: function(rows, cols) {
        var gridbox = this.getGridBox(rows)
        var arrows  = this.props.view.arrows
        return this.applySizes(1, 1, gridbox.add, {arrows: arrows})
    },
    applySizes: function(width, height, gridCoords, bonus, miny, minx, maxy, maxx) {
        return function(className) {
            return function(puff) {
                return Boron.extend((bonus || {}), gridCoords(width, height, miny, minx, maxy, maxx, puff), // THINK: puff gc ok?
                    {puff: puff, className: className}) } }
    },
    getPuffBoxList: function(puffs) {
        var dimensions  = this.getDimensions()
        var standardBox = this.getStandardBox(dimensions.rows)
        return puffs.map(standardBox('child'))
            .filter(function(pbox) {return pbox.height})
    },
    makeArrowPairs: function(puffBoxen) {
        var screencoords = this.getScreenCoords()

        var arrows = puffBoxen.reduce(function(acc, puffbox) {
            return acc.concat(
                (puffbox.puff.payload.parents||[]).map(
                    function(parent) {
                        return [puffBoxen.filter(
                            function(pb) {
                                return pb.puff.sig == parent})[0], puffbox]}))}, [])
            .filter(function(pair) {return pair[0]})

        return (
            <svg width={screencoords.width} height={screencoords.height} style={{position:'absolute', top:'0px', left:CONFIG.leftMargin}}>
                <defs dangerouslySetInnerHTML={{__html: '<marker id="triangle" viewBox="0 0 20 20" refX="10" refY="10" fill="blue" markerUnits="strokeWidth" markerWidth="18" markerHeight="12" orient="auto"><path d="M 0 5 L 10 10 L 0 15 z" /><circle cx="15" cy="10" r="5" fill="white" /></marker>'}} ></defs>
                {arrows.map(function(arrow) {
                    return <PuffArrow key={'arrow-' + arrow[0].puff.sig + '-' + arrow[1].puff.sig} arrow={arrow} />
                })}
            </svg>
            )
    },
    standardGridify: function(puffs) {
        var puffBoxList = this.getPuffBoxList(puffs)
        return this.manualGridify(puffBoxList)
    },
    manualGridify: function(puffBoxList) {
        var arrowList = this.props.view.arrows ? this.makeArrowPairs(puffBoxList) : ''
        var viewprops = this.props.view

        var fancyWrapper = (function() {
            return function(puffplus) {     // this is getting really messy -- maybe just transfer props
                var className = puffplus.className
                var stats = puffplus
                var puff  = puffplus.puff
                var view  = viewprops
                return <PuffFancyBox puff={puff} key={puff.sig} extraClassy={className} stats={stats} view={view} ref={puff.sig} />
            }
        })()


        return (
            <div>
                <div id="talltree">
                    {puffBoxList.map(fancyWrapper)}
                </div>

                {arrowList}
            </div>
            )
    }
}


// MAIN VIEWS
var PuffWorld = React.createClass({
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language]

        var view
        var viewprops = this.props.view || {}

        if( viewprops.mode == 'focus' ) {
            view = <PuffTallTree view={viewprops} reply={this.props.reply} />
            document.body.style.overflowY = "hidden"
        }

        else if( viewprops.mode == 'list' ) {
            view = <PuffList view={viewprops} reply={this.props.reply} />
            document.body.style.overflowY = "hidden"
        }

        else { // ( viewprops.mode == 'tableView' ) {
            view = <TableView view={viewprops} table={this.props.view.table}/>
            document.body.style.overflowY = "auto"
        }

        var animateClass = this.props.view.animation ? "animation" : ''

        return (
            <div className={animateClass}>
                {view}
            </div>
            )
    }
})

var PuffList = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin, PuffBarShortcutMixin],

    render: function() {
        // if(!PB.Data.stupidHorribleGlobalThing) return <div></div>

        globalSillyPropsClone = Boron.shallow_copy(puffworldprops)

        var dimensions = this.getDimensions()
        var limit = dimensions.cols * dimensions.rows

        var query   = this.props.view.query
        var filters = this.props.view.filters
        var puffs   = PB.M.Forum.getPuffList(query, filters, limit)

        this.cursorPower(puffs)

        var showScrollUp = this.props.view.mode == 'list' && this.props.view.query.offset
        var showScrollDown = this.props.view.mode == 'list' && puffs.length == limit
        return (
            <div>
                {this.standardGridify(puffs)}
                <PuffScroller ref="scrollup" position="up" view={this.props.view} show={showScrollUp} />
                <PuffScroller ref="scrolldown" position="down" view={this.props.view} show={showScrollDown} />
            </div>
            )
    }
})


var PuffArrow =  React.createClass({
    render: function() {
        var arrow = this.props.arrow

        var p = arrow[0]
        var c = arrow[1]

        var offset = 30
        // Move over if menu open
        var yoffset = 0
        var baseShift = 12

        var x1 = p.x + p.width/2
        var y1 = p.y + p.height/2
        var x2 = c.x + c.width/2
        var y2 = c.y + c.height/2

        /*
         var leftEdge = x2 - (c.height/2) - offset/2
         var rightEdge = x2 + (c.height/2) + offset/2
         var topEdge = y2 -(c.height/2) - offset/2
         var bottomEdge = y2 + (c.height/2) + offset/2
         */

        var boxSlope = Math.abs(c.height/c.width)

        var dx = x2-x1
        var dy = y2-y1
        var lineSlope = Math.abs(dy/dx)
        var theta = Math.atan(lineSlope)

        // Child is below parent or sideways
        if(y2 >= y1) {
            // arrow is top to down
            // Which does it hit first, top edge or left edge?
            if (x2 > x1) {
                // Arrow is left to right
                if (boxSlope < lineSlope) {

                    // Limited by top edge
                    x2 -= ((c.height / 2) - offset / 2) / lineSlope
                    y2 -= ((c.height / 2) - offset / 2)

                    y2 -= Math.abs(Math.sin(theta)) * 5
                } else {

                    // Limited by right edge
                    x2 -= ((c.width / 2) - offset / 2)
                    y2 -= ((c.width / 2) - offset / 2) * lineSlope

                    x2 -= Math.abs(Math.cos(theta)) * 5

                }
            } else {
                // arrow is right to left
                if (boxSlope < lineSlope) {

                    // Limited by top edge
                    x2 += ((c.height / 2) - offset / 2) / lineSlope
                    y2 -= ((c.height / 2) - offset / 2)

                    y2 -= Math.abs(Math.sin(theta)) * 5
                } else {

                    // Limited by left edge
                    x2 += ((c.width / 2) - offset / 2)
                    y2 -= ((c.width / 2) - offset / 2) * lineSlope

                    x2 += Math.abs(Math.cos(theta)) * 5
                }
            }
        } else {
            // Which does it hit first, top edge or left edge?
            if (x2 < x1) {
                // Arrow is right to left
                if (boxSlope < lineSlope) {

                    // Limited by bottom edge
                    x2 += ((c.height / 2) - offset / 2) / lineSlope
                    y2 += ((c.height / 2) - offset / 2)

                    y2 += Math.abs(Math.sin(theta)) * 5
                } else {

                    // Limited by right edge
                    x2 += ((c.width / 2) - offset / 2)
                    y2 += ((c.width / 2) - offset / 2) * lineSlope

                    x2 += Math.abs(Math.cos(theta)) * 5

                }
            } else {
                // Arrow is left to right
                if (boxSlope < lineSlope) {

                    // Limited by bottom edge
                    x2 -= ((c.height / 2) - offset / 2) / lineSlope
                    y2 += ((c.height / 2) - offset / 2)

                    y2 += Math.abs(Math.sin(theta)) * 5
                } else {

                    // Limited by left edge
                    x2 -= ((c.width / 2) - offset / 2)
                    y2 += ((c.width / 2) - offset / 2) * lineSlope

                    x2 -= Math.abs(Math.cos(theta)) * 5
                }
            }
        }

        // WORKING: All downward arrows
        // WORKING: Straight up
        // ?: Up and left limited by bottom
        // ?: Up and right limited by bottom
        // ?: Up and left limited by edge
        // WORKING: Up and right limited by edge


        // Use mod of sig, so we can do same for arrowheads!
        // TODO: Make mini-helper function
        var colNumber = parseInt(Bitcoin.Crypto.MD5(this.props.key.slice(-32)),16)
        colNumber = colNumber % CONFIG.arrowColors.length

        var stroke = CONFIG.arrowColors[colNumber]
        return <Arrow x1={x1} y1={y1} x2={x2} y2={y2} stroke={stroke} fill={stroke} />
    }
})

var Arrow = React.createClass({
    componentDidMount: function() {
        this.getDOMNode().setAttribute('marker-end', 'url(#triangle)')
    },
    render: function() {

        // dangerouslySetInnerHTML={{__html: '<animate attributeName="x2" from='+PB.Crypto.random()+' to='+this.props.x2+' dur="1s" /><animate attributeName="y2" from='+PB.Crypto.random()+' to='+this.props.y2+'  dur="1s" />'}}

        // save this!
        // <path d={'M ' + this.props.x1 + ' ' + this.props.y1 + ' Q ' + (this.props.x2  + (this.props.x2 - this.props.x1)/2 - 10) + ' ' + (this.props.y2 + (this.props.y2 - this.props.y1)/2 - 20) + ' ' + this.props.x2 + ' ' + this.props.y2} fillOpacity="0" stroke={this.props.stroke} strokeWidth="2" />

        //

        return (
            <line x1={this.props.x1} y1={this.props.y1} x2={this.props.x2} y2={this.props.y2} stroke={this.props.stroke} strokeWidth="2" fill={this.props.fill} ></line>
            )
    }
})


var PuffFooter = React.createClass({
    render: function() {
        var width = (window.innerHeight-66)+'px'
        var polyglot = Translate.language[puffworldprops.view.language]

        return (

            <div className="footer" style={{maxWidth: width}}>
                <div className="footerText">
                {polyglot.t("footer.powered")} <a href={CONFIG.url} className="footerText">puffball</a>.
                {polyglot.t("footer.rest")}
                </div>
            </div>
            )
    }
})



var Logo = React.createClass({
    render: function() {
        return (
            <div>
                <a href={CONFIG.url}>
                    <img src={CONFIG.logo} alt="Logo" className="logo" />
                </a>
            </div>
            )
    }
})


var PuffScroller = React.createClass({
    mixins: [GridLayoutMixin],

    handleScroll: function() {
        if (!this.props.show) return false

        var col   = this.getDimensions().cols
        var offset = parseInt(this.props.view.query.offset) || 0
        offset = this.props.position == "up" ? offset - col : offset + col
        offset = Math.max(offset, 0)
        return Events.pub("ui/scroll/down", {'view.query.offset': offset})
    },

    render: function() {
        if (!this.props.show) {
            return (<span></span>)
        }

        var left = CONFIG.leftMargin

        var col   = this.getDimensions().cols
        var screencoords = this.getScreenCoords()
        var boxHeight = screencoords.height / this.getDimensions().rows
        var w = col * this.props.view.boxRatio* boxHeight
        if(w > screencoords.width) {
            w = screencoords.width
        }

        var style = {left: left, width: w}
        var className = "scroller gray " + this.props.position
        var iconClass = "fa fa-fw fa-chevron-"+this.props.position
        return (
            <div className={className} style={style}>
                <a href="#" onClick={this.handleScroll}>
                    <i className={iconClass}></i><br/>
                    <i className={iconClass}></i><br/>
                    <i className={iconClass}></i><br/>
                </a>
            </div>
            )
    }
})
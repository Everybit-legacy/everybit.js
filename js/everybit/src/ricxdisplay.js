/** @jsx React.DOM */


/*

 ICX: {
 wizard: {
 inProcess: true | false
 sequence: 'send' | 'store'
 type:  file' | 'message'
 content:
 saveToNet: true | false
 }
 username:
 }

 // COMPONENT NAMES
 <ICX
 +Store
 +Select
 (+NewUser)
 +Finish

 +Send
 +(File | Message)
 (+NewUser)
 +Finish

 +NewUser
 +Finish

 +Login

 +Dashboard

 +TableView


 +/>

 */


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

        var currScreen = puffworldprops.view.icx.screen
        if(!currScreen) {
            currScreen = 'init'
        }


        ICX.username = PB.M.Wardrobe.getCurrentUsername()
        ICX.identitySet = true


        if(ICX.identitySet) {
            if (currScreen == 'init') {
                if (ICX.username.length) {
                    return Events.pub('/ui/icx/screen', {"view.icx.screen": 'dashboard'});
                } else {
                    return Events.pub('/ui/icx/screen', {"view.icx.screen": 'home'});
                }
            }
        } else {
            if (currScreen == 'init') {
                return Events.pub('/ui/icx/screen', {"view.icx.screen": 'home'});
            }
        }

        var w = window.innerWidth
        var h = window.innerHeight
        var p = w*h

        var l = ICX.config.logo.originalW*ICX.config.logo.originalH
        var logoAdjustRatio = Math.sqrt(p*ICX.config.logo.areaRatio/l)

        var fontSizeMultiplier = Math.sqrt(p * ICX.config.text.areaRatio)

        var baseFontH = keepNumberBetween( Math.floor( fontSizeMultiplier ), ICX.config.text.min, ICX.config.text.max)


        ICX.calculated = {

            rightBorder: keepNumberBetween(w * ICX.config.rightBorder.ratio, ICX.config.rightBorder.min, ICX.config.rightBorder.max),

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

        ICX.screens = [
            {position: 0, name: 'home',  button: false, color: 'rgba(46,  48, 146, .8)', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXHome, backgroundColor: 'rgba(255,  255, 255, .0)'},
            {position: 1, name: 'send',  button: true, color: 'rgba(226, 160, 79, .8)', icon: 'fa fa-fw fa-paper-plane', fullText: 'SEND a private message or file', component: ICXSend, backgroundColor: 'rgba(226, 160, 79, .08)'},
            {position: 2, name: 'store', button: true, color: 'rgba(93,  128, 90, .8)', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately', component: ICXStore, backgroundColor: 'rgba(93,  128, 90, .08)'},
            {position: 0, name: 'login', button: true, color: 'rgba(114, 113, 86, .8)', icon: 'fa fa-fw fa-sign-in', fullText: 'LOG IN', component: ICXLogin, backgroundColor: 'rgba(114, 113, 86, .08)'},
            {position: 4, name: 'learn', button: true, color: 'rgba(49,  68,  92, .8)', icon: 'fa fa-fw fa-file-text-o', fullText: 'LEARN how it works', component: ICXLearn, backgroundColor: 'rgba(49,  68,  92, .08)'},
            {position: 5, name: 'about', button: true, color: 'rgba(85,  65,  94, .8)', icon: 'fa fa-fw fa-info-circle', fullText: 'ABOUT I.CX', component: ICXAbout, backgroundColor: 'rgba(85,  65,  94, .08)'},
            {position: 0, name: 'send.message',  button: false, color: 'rgba(226, 160, 79, .8)', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a message', component: ICXSendMessage, backgroundColor: 'rgba(226, 160, 79, .08)'},
            {position: 0, name: 'store.encrypt', button: false, color: 'rgba(93,  128, 90, .8)', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately', component: ICXStore, backgroundColor: 'rgba(93,  128, 90, .08)'},
            {position: 0, name: 'home.table',    button: false, color: 'rgba(46,  48, 146, .8)', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXTableView, backgroundColor: 'rgba(46,  48, 146, .08)'},
            {position: 0, name: 'dashboard',    button: false, color: 'rgba(114, 113, 86, .8)', icon: 'fa fa-fw fa-home', fullText: 'HOME page', component: ICXDashboard, backgroundColor: 'rgba(114, 113, 86, .08)'},
            {position: 0, name: 'newuser',    button: false, color: 'rgba(114, 113, 86, .8)', icon: 'fa fa-fw fa-male', fullText: 'Register a new username', component: ICXNewUser, backgroundColor: 'rgba(114, 113, 86, .08)'},
            {position: 0, name: 'send.finish', button: false, color: 'rgba(226, 160, 79, .8)', fullText: "Send of message", component: ICXSendMessageFinish, backgroundColor: 'rgba(226, 160, 79, .08)'},
            {position: 0, name: 'send.confirm', button: false, color: 'rgba(226, 160, 79, .8)', fullText: "Send of message", component: ICXSendMessageConfirm, backgroundColor: 'rgba(226, 160, 79, .08)'},
            {position: 0, name: 'send.file',  button: false, color: 'rgba(226, 160, 79, .8)', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a file', component: ICXSendFile, backgroundColor: 'rgba(226, 160, 79, .08)'},
            {position: 0, name: 'send.file.confirm',  button: false, color: 'rgba(226, 160, 79, .8)', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a file', component: ICXSendFileConfirm, backgroundColor: 'rgba(226, 160, 79, .08)'},
            {position: 0, name: 'send.file.finish',  button: false, color: 'rgba(226, 160, 79, .8)', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a file', component: ICXSendFileFinish, backgroundColor: 'rgba(226, 160, 79, .08)'},
            {position: 0, name: 'encryptdecrypt',    button: false, color: 'rgba(114, 113, 86, .8)', icon: 'fa fa-fw fa-home', fullText: 'Encrypt / Decrypt Page', component: ICXFileConverter, backgroundColor: 'rgba(114, 113, 86, .08)'},



            {position: 0, name: 'store.finish', button:false, color: 'rgba(93,  128, 90, .8)', icon: 'fa fa-fw fa-database', fullText: 'Store encrypted files', component: ICXStoreFinish, backgroundColor: 'rgba(93,  128, 90, .08)'},
            {position: 0, name: 'init',  button: false, color: 'rgba(46,  48, 146, .8)', icon: 'fa fa-fw fa-home', fullText: '', component: ICXInit, backgroundColor: 'rgba(255,  255, 255, .0)'}

        ]


        var borderWidth = Math.floor(ICX.calculated.rightBorder)+'px';

        var thisScreen = ICX.screens.filter(function( obj ) {
            return (obj.name == currScreen);
        })[0];

        var screenStyle = {
            position: "absolute",
            width: w,
            height: h,
            borderRightWidth: borderWidth,
            borderRightColor: thisScreen.color,
            borderRightStyle: 'solid'
        }

        var contentDivStyles = {
            position: "absolute",
            left: Math.floor( w*ICX.config.content.insets.left ) + "px",
            width: Math.floor( (1-(ICX.config.content.insets.left+ICX.config.content.insets.right))*w ) + 'px',
            height: Math.floor( (1-(ICX.config.content.insets.top+ICX.config.content.insets.bottom))*h ) + 'px',
            top: Math.floor( (ICX.config.content.insets.top)*h ) + 'px',
            padding: '10px', // Testing...
            fontSize: ICX.calculated.baseFontH + 'px'

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

        return (
            <div style={screenStyle}>
                <ICXLogo screenInfo={thisScreen} />
                <ICXLinks screenInfo={thisScreen} />
                <div style={contentDivStyles}>
                    {pageComponent}
                </div>
                <ICXSpinner />
                <ICXError />
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


// Each component asks of external props, What are my colors, etc? All components rendered all the time




var ICXStore = React.createClass({
    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color


        // Link to previously encrypted/stored files

        // CSS for checkboxes
        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-check-square-o': puffworldprops.ICX.backupToCloud,
            'fa-square-o': !puffworldprops.ICX.backupToCloud,
            'green': puffworldprops.ICX.backupToCloud
        })


        /*return (
         <div style={{width: '100%', height: '100%'}}>
         <div style={headerStyle}>Encrypt and store files</div>
         <div>Select a file. It will be encrypted right in your web browser.</div>
         <p style={{display: 'inline','font-size':'90%'}}>
         <input id="showFileName" type="text" disabled="disabled" placeholder="No File Selected" />
         </p>
         <div className="fileUpload btn btn-primary">
         <span>Choose File</span>
         <br />
         <input type="file" id="fileToUplaod" />
         </div>
         <br />
         <small>
         <i className={cbClass}  onClick={this.handleToggleBackupToCloud} ></i>
         Once encrypted, backup to the net
         </small>
         <br />
         <ICXNextButton enabled={this.state.nextStatus} goto={nextStep} key="nextToStore" buttonText={buttonText} />
         </div>
         )

         <div className="fileUpload btn btn-primary">
         <span>Choose File</span>
         <br />
         <input type="file" id="fileToUplaod" ref="uploadbutton" onChange={this.handleGetFile} />
         </div>

         */
        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Encrypt and store files</div>
                <div className="contentWindow">
                Select a file. It will be encrypted in your web browser.
                    <br /><br />
                    <input type="file" id="fileToUplaod" ref="uploadbutton" onChange={this.handleGetFile} />

                    <div style={{display: 'inline','font-size':'90%'}}>
                        <input id="showFileName" type="text" disabled="disabled" ref="filename"
                        defaultValue="No file Selected"/>
                    </div>
                    <br />
                    <small>
                        <i className={cbClass} onClick={this.handleToggleBackupToCloud} ></i>
                    Once encrypted, backup to the net
                    </small>
                    <br /><br />
                    <ICXNextButton enabled={puffworldprops.ICX.nextStatus} goto={puffworldprops.ICX.nextStep} key="nextToStore" text={puffworldprops.ICX.nextStepMessage} />
                </div>
            </div>
            )
    },

    handleToggleBackupToCloud: function() {
        return Events.pub('ui/event', {'ICX.backupToCloud': !puffworldprops.ICX.backupToCloud})

    },

    componentDidMount: function() {
        // avatar depands on puffworldprops variables
        Events.pub('ui/event', {
            'ICX.wizard.inProcess': true,
            'ICX.wizard.sequence': 'store',
            'ICX.wizard.type': 'file',
            'ICX.backupToCloud': true
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
        //Display the name of the selected file
        this.refs.filename.getDOMNode().value = this.refs.uploadbutton.getDOMNode().value


        //Encrypt the file in a puff
        var element = event.target

        ICX.fileprom = PBFiles.openBinaryFile(element)

        ICX.filelist = element.files

        return Events.pub('ui/event', {
            'ICX.nextStatus': true
        })

    }


})

var ICXStoreFinish = React.createClass({
    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Save Your Encryped File</div>
                <div className="contentWindow">
                Success! Your file has been encrypted.
                    <br /><br />
                    <a ref="encryptedLink" download="no_file_selected" onClick ={this.handleSubmitSuccess}>Save encrypted file</a>
                    <br /><br />
                    <ICXNextButton enabled={this.state.messageStored} goto={this.state.nextStep} key="nextToStore" text="Encrypt Another File" />
                </div>
            </div>
            )


    },

    getInitialState: function () {
        return {
            nextStep: 'store',
            messageStored: false,
            successMessage: ''

        }
    },

    handleSubmitSuccess: function () {
        this.setState({messageStored: true})
    },

    cleanUpSubmit: function () {
        // do something fancy
    },

    componentWillMount: function() {
        // START THINKING
        Events.pub('ui/thinking', { 'ICX.thinking': true })
        updateUI()
    },

    componentDidMount: function () {



        if(PB.M.Wardrobe.getCurrentUsername()) {



            var encrypedLink = this.refs.encryptedLink.getDOMNode()

            ICX.fileprom.then(function(blob) {
                var puff = PBFiles.createPuff(blob, 'file')

                var filelist = ICX.filelist
                var file     = filelist[0]
                var filename = file.name
                var new_filename = filename + '.puff'

                //Make the link visisble to download the file (Temporary)
                encrypedLink.href = PBFiles.prepBlob(puff)
                encrypedLink.download = new_filename
            })

        } else {
            // TODO: FAIL!
        }

        Events.pub('ui/thinking', { 'ICX.thinking': false })
        updateUI()
    }


})




var ICXReplyPuff = React.createClass({
    handleClick: function() {
        this.handleSetParent()
        this.handleRedirect()
    },
    handleSetParent: function() {
        var sig = this.props.sig
        var username = this.props.user
        var parents = puffworldprops.reply.parents          // OPT: global props hits prevent early bailout
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []

        var index = parents.indexOf(sig)

        // var recipient = puffworldprops.reply.replyTo
        // recipient.push(sig)

        // This checks if the recipient is already in the list
        // If not, add it to the array
        // If found, remove it from the array
        if(index == -1) {
            parents.push(sig)
        } else {
            parents.splice(index, 1)
        }

        return Events.pub('ui/reply/add-parent', { 'reply.parents': parents, 'reply.replyTo': username})
    },
    handleRedirect: function() {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'send'})
    },
    render: function() {
        var parents = puffworldprops.reply.parents          // OPT: global props hits prevent early bailout
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []
        var cx1 = React.addons.classSet
        var index   = parents.indexOf(this.props.sig)

        if(index == -1) {
            var isGreen = false
        } else {
            var isGreen = true
        }

        var newClass = cx1({
            'fa fa-reply fa-fw': true,
            'green': isGreen
        })

        return (
            <span className="icon">
                <a onClick={this.handleClick}>
                    <i className={newClass}></i>
                </a>
            </span>
            )
    }
})


var ICXSend = React.createClass({
    mixins: [TooltipMixin],

    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color



        // TODO put this back
        // this.refs.toUser.getDOMNode().value = puffworldprops.reply.replyTo

        return (
            <div className="icx-screen icx-send">
                <div style={headerStyle}>Send a private message or file</div>
                <div className="component">
                    <span>To: <form onSubmit={this.handleSubmit}><input type="text" ref="toUser" onChange={this.verifyUsername} /></form></span>
                    <span className="relative">
                        <a href="#" onClick={this.handleUsernameLookup}><Checkmark show={puffworldprops.ICX.userConfirmed} /></a>
                        <Tooltip position='under' content="Confirm username" />
                    </span>
                    <span className="message">{puffworldprops.ICX.toUserStatus}</span>
                </div>

                <div className="component">
                    <ICXNextButton key="sendMessageButton" enabled={puffworldprops.ICX.nextStatus} text="MESSAGE" goto="send.message" />
                    {' '}
                    <ICXNextButton key="sendFileButton" enabled={puffworldprops.ICX.nextStatus} text="FILE" goto="send.file" />
                </div>
            </div>
            )
    },

    componentWillMount: function() {
        Events.pub('ui/event/send', {
            'ICX.userConfirmed': false,
            'ICX.nextStatus': false,
            'ICX.wizard.inProcess': true,
            'ICX.wizard.sequence': 'send'
        })
    },

    verifyUsername: function() {
        var toUser = this.refs.toUser.getDOMNode().value
        var finalChar = toUser.charAt(toUser.length-1)

        toUser = StringConversion.reduceUsernameToAlphanumeric(toUser, /*allowDot*/true)
            .toLowerCase()
        this.refs.toUser.getDOMNode().value = toUser
        //this.setState({toUserStatus: false})
        //this.setState({nextStatus: false})

        return Events.pub('ui/events', {
            'ICX.userConfirmed': false,
            'ICX.nextStatus': false,
            'ICX.toUserStatus': ""
        })

        // If the last character is a space, then trigger usernameLookup
        if(finalChar == ' ') {
            this.handleUsernameLookup()
            return false
        }

    },
//Trying to get this to work on "Enter" keypress
    handleSubmit: function (e) {
        e.preventDefault()
        this.handleUsernameLookup()
        return false
    },

    handleUsernameLookup: function() {
        // remove initial . if it exists

        var toUser = this.refs.toUser.getDOMNode().value
        var self = this

        // Check for zero length
        if(!toUser.length) {
            //this.state.toUserStatus = 'Missing'
            console.log('u heer')
            return Events.pub('ui/event', {
                'ICX.toUserStatus': 'Missing',
                'ICX.userConfirmed': false
            })
            //return false
        }

        if (toUser.slice(0, 1) == '.')
            toUser = toUser.slice(1)

        var prom = PB.getUserRecord(toUser)

        prom.then(function(result) {
            //self.state.toUserStatus = true
            //self.state.nextStatus = true

            return Events.pub('ui/events', {
                'ICX.userConfirmed': true,
                'ICX.nextStatus': true,
                'ICX.toUserStatus': '',
                'ICX.toUser': toUser
            })
        })
            .catch(function(err) {
                //self.state.toUserStatus = 'Not found'
                //self.state.nextStatus = false
                return Events.pub('ui/events', {
                    'ICX.toUserStatus': 'Not found',
                    'ICX.nextStatus': false,
                    'ICX.userConfirmed': 'Not found'

                })
            })
        return false

    }


});

var ICXSendFile = React.createClass({
    fileElement: {},

    render: function() {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color


        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Encrypt and send a file to {puffworldprops.ICX.toUser} </div>
                <div className="contentWindow">
                Your file: <br />
                    <div className="fileUpload btn btn-primary">
                        <span>Choose File</span>
                        <br />
                        <input type="file" id="fileToUplaod" ref="uploadbutton" onChange={this.handleDisplaySelectedFile} />
                    </div>
                    <div style={{display: 'inline','font-size':'90%'}}>
                        <input id="showFileName" type="text" disabled="disabled" ref="filename"
                        defaultValue="No file Selected"/>
                    </div><br />

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

        this.refs.filename.getDOMNode().value = this.refs.uploadbutton.getDOMNode().value

        var element = event.target
        ICX.fileprom = PBFiles.openBinaryFile(element)
        ICX.filelist = element.files

        return Events.pub('ui/event/', {
            'ICX.nextStatus': true
        })
    }



})


var ICXSendFileConfirm = React.createClass({
    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color


        var filelist = ICX.filelist
        var file     = filelist[0]
        var filename = file.name

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Confirm file send</div>
                <br />
                <b>TO</b> {puffworldprops.ICX.toUser}<br />
                <b>File</b><br />
                {filename}
                <hr />
                <ICXNextButton enabled={true} goto='send.file.finish' text='SEND NOW' />
            </div>
            )
    }





})

var ICXSendFileFinish = React.createClass({


    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Send of file</div>
                <br />
                <div>{puffworldprops.ICX.successMessage}</div>
                <ICXNextButton enabled={puffworldprops.ICX.messageSent} goto='send' text='Send another message or file' />
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
            'ICX.successMessage': 'File sent!'
        })

    },

    cleanUpSubmit: function () {
        // TODO: do something fancy, clear out global vars
    },

    componentDidMount: function () {
        // Set information for this send
        var type = 'file'
        var content = ICX.filelist[0]
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

            var post_prom = PB.M.Forum.addPost(type, content, parents, metadata, userRecords, envelopeUserKeys)
            post_prom = post_prom.then(self.handleSubmitSuccess.bind(self))
            return post_prom
        }).catch(function (err) {
            // self.cleanUpSubmit()
            Events.pub('ui/event/', {
                'ICX.messageSent': true,
                'ICX.successMessage': err.message
            })

            console.log(err)
        })

        return false
    }
})

var ICXSendMessage = React.createClass({
    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div className="send-message" style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Send private message to {puffworldprops.ICX.toUser} </div>
                <div>Your message:</div>
                <textarea ref="messageText" style={{width: '70%', height: '50%'}} onChange={this.handleMessageText} />
                <br />
                <ICXNextButton enabled={puffworldprops.ICX.nextStatus} goto={puffworldprops.ICX.nextStep} text={puffworldprops.ICX.nextStepMessage}  key="nextToMessage" />

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

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Confirm message send</div>
                <br />
                <b>TO</b> {puffworldprops.ICX.toUser}<br />
                <b>Message</b><br />
                {ICX.messageText}
                <hr />
                <ICXNextButton enabled={true} goto='send.finish' text='SEND NOW' />
            </div>
            )
    }
})

var ICXSendMessageFinish = React.createClass({

    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Send of message</div>
                <br />
                <div>{puffworldprops.ICX.successMessage}</div>
                <ICXNextButton enabled={puffworldprops.ICX.messageSent} goto='send' text='Send another message or file' />
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
    },

    componentDidMount: function () {
        // Set information for this send
        var type = 'text'
        var content = ICX.messageText
        var parents = []
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

            var post_prom = PB.M.Forum.addPost(type, content, parents, metadata, userRecords, envelopeUserKeys)
            post_prom = post_prom.then(self.handleSubmitSuccess.bind(self))
            return post_prom
        }).catch(function (err) {
            // self.cleanUpSubmit()
            Events.pub('ui/event/', {
                'ICX.messageSent': true,
                'ICX.successMessage': err.message
            })

            console.log(err)
        })

        return false
    }


})

/* This is an unhappy function
 var ICXAvatar = React.createClass({
 componentDidMount: function {
 var context = this.getDOMNode().getContext('2d')
 this.paint(context)
 },

 componentDidUpdate: function() {
 var context = this.getDOMNode().getContext('2d')
 context.clearRect(0, 0, this.props.width, this.props.height)
 this.paint(context)
 },

 paint: function(context) {
 context.save()
 context.fillStyle = this.props.animalColour
 context.fill
 },

 render: function() {
 return <canvas width={this.props.width} height={this.props.height} />
 }
 })
 */

var ICXNewUser = React.createClass({
    mixins: [TooltipMixin],

    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div className="icx-screen icx-newuser">
                <div style={headerStyle}>Register for a new username</div>
                <div className="contentWindow">

                    <div><b>Username:</b></div>

                .icx.<form onSubmit={this.handleSubmit}><input type="text" name="username" ref="username" defaultValue="" style={{size: 16}} onChange={this.handleUsernameFieldChange}/></form>
                    <span className="relative">
                        <a href="#" onClick={this.handleUsernameLookup}><Checkmark show={puffworldprops.ICX.newUser.usernameStatus} /></a>
                        <Tooltip position='under' content="Check for availability" />
                    </span>
                    <span className="relative">
                        <a href="#" onClick={this.handleGenerateRandomUsername}><i className="fa fa-refresh" /></a>
                        <Tooltip position='under' content="Generate a new username" />
                    </span>
                    {' '}<span className="message">{puffworldprops.ICX.newUser.usernameMessage}</span>
                    <br /><br />
                    <div><b>Passphrase:</b></div>
                    <textarea ref="passphrase" style={{width: '50%', height: '20%'}} onChange={this.handleRecheckPassphrase}/>{' '}<Checkmark show={puffworldprops.ICX.newUser.passphraseStatus} />
                    <span className="relative">
                        <a href="#" onClick={this.handleGenerateRandomPassphrase}><i className="fa fa-refresh" /></a>
                        <Tooltip position='under' content="Generate a new passphrase" />
                    </span>
                    {' '}<span className="message">{puffworldprops.ICX.newUser.passphraseMessage}</span>




                    <br /><br />
                    <span style={{border: '1px solid #000000', color: puffworldprops.ICX.avatarColor, fontSize: 2.5*ICX.calculated.baseFontH+'px'}}><i className={'icon-'+puffworldprops.ICX.avatarAnimal+' shadow'} /></span>
                    <br />
                Avatar (can be changed later)

                    <br /><br />
                <a className="register" onClick={this.handleRegisterName}>{puffworldprops.ICX.nextStepMessage} <i className="fa fa-chevron" /></a>
            </div>
                </div>
            )
    },

    componentWillMount: function() { // on page load, generate a random username
        var animal = generateRandomAnimal()

        ICX.newUser.adjective = ICX.adjectives[Math.floor(Math.random() * ICX.adjectives.length)]
        ICX.newUser.animalName = animal;
        ICX.newUser.animalColor = ICX.colornames[Math.floor(Math.random() * ICX.colornames.length)]

        // avatar depands on puffworldprops variables
        return Events.pub('ui/event', {
            'ICX.avatarColor': ICX.newUser.animalColor,
            'ICX.avatarAnimal': ICX.newUser.animalName
        })
    },

    componentDidMount: function() {
        this.refs.username.getDOMNode().value = ICX.newUser.adjective + ICX.newUser.animalColor + ICX.newUser.animalName
        this.handleUsernameLookup()
        this.handleGenerateRandomPassphrase()


        if(typeof puffworldprops.ICX.wizard === 'undefined') {
            return Events.pub('ui/event', {
                'ICX.nextStep': 'dashboard',
                'ICX.nextStepMessage': 'Finish'
            })
        } else if(puffworldprops.ICX.wizard.sequence == 'send') {


            if(puffworldprops.ICX.wizard.type == 'message') {
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


            //this.setState({nextStep: 'send.confirm'})
            // this.setState({nextStepMessage: 'Continue'})
            // return Events.pub('ui/icx/screen',{"view.icx.screen": 'send.confirm'})
        } else if(puffworldprops.ICX.wizard.sequence == 'store') {
                return Events.pub('ui/event', {
                    'ICX.nextStep': 'store.finish',
                    'ICX.nextStepMessage': 'Create user and store file'
                })


                // this.setState({nextStep: 'store.finish'})
                // this.setState({nextStepMessage: 'Create user and store file'})
                // return Events.pub('ui/icx/screen', {"view.icx.screen": 'store.finish'})
        }

    },



    // These need to be moved out of this function, to helpers, and called as needed.
    handleGenerateRandomUsername: function() {


        var adj = ICX.adjectives[Math.floor(Math.random() * ICX.adjectives.length)]
        var color = ICX.colornames[Math.floor(Math.random() * ICX.colornames.length)]
        //this.setState({avatarColor: color})

        var animal = generateRandomAnimal();
       // ICX.userColor = color;

        //this.setState({avatarAnimal: animal})

        this.refs.username.getDOMNode().value = adj + color + animal
        this.handleUsernameLookup()

        return Events.pub('ui/event', {
            'ICX.avatarColor': color,
            'ICX.avatarAnimal': animal
        })

        //return false
       /* var animal = generateRandomAnimal()

        ICX.newUser.adjective = ICX.adjectives[Math.floor(Math.random() * ICX.adjectives.length)]
        ICX.newUser.animalName = animal;
        ICX.newUser.animalColor = ICX.colornames[Math.floor(Math.random() * ICX.colornames.length)];
        this.refs.username.getDOMNode().value = ICX.newUser.adjective + ICX.newUser.animalColor + ICX.newUser.animalName

        this.handleUsernameLookup()
        return false
        */
    },

    handleGenerateRandomPassphrase: function() {
        // Everybody loves the exponential!
        var numb = 2
        while(Math.random()>0.2) {
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

        this.setState({defaultKey: false})
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

    handleSubmit: function (e) {
        e.preventDefault()
        this.handleUsernameLookup()
        return false
    },

    handleUsernameLookup: function() {
        var username = this.refs.username.getDOMNode().value
        var self = this

        // Check for zero length
        if(!username.length) {

            // this.state.usernameStatus = 'Missing'
            Events.pub('ui/event', {
                'ICX.newUser.usernameStatus': 'Missing'
            })
            return false
        }

        // cancel if we're already checking another username
        if(puffworldprops.ICX.newUser.checkingUsername) {
            // TODO: show a warning message, or disable the button on 'Busy' state
            Events.pub('ui/username/busy-message', {})
            return false
        }

        username = 'icx.' + username

        var prom = PB.getUserRecord(username)

        // this.setState({usernameMessage: 'Checking...'})
        Events.pub('ui/username/requested', {
            'ICX.newUser.requestedUsername': username,
            'ICX.newUser.checkingUsername': username,
            'ICX.newUser.usernameMessage': 'Checking...',
            'ICX.newUser.usernameStatus': 'Busy'
        })

        prom.then(function(result) {

            Events.pub('ui/username/taken', {
                'ICX.newUser.usernameStatus': 'Taken',
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

    handleRegisterName: function() {
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

                // Function below fails, so set above this
                // PB.M.Wardrobe.storePrivateBonus({passphrase: passphrase})

                // Create identity file
                ICX.identityForFile = {
                    comment: "This file contains your private passphrase. It was generated at i.cx. The information here can be used to login to websites on the puffball.io platform. Keep this file safe and secure!",
                    rootKeyPrivate: privateKey,
                    adminKeyPrivate: privateKey,
                    defaultKeyPrivate: privateKey,
                    passphrase: passphrase,
                    version: "1.0"
                }

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
                console.log("ERR")
                self.setState({step: 3,
                    errorMessage: err.toString()})
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
                <div style={headerStyle}>Save your identity on this web browser</div>

                <div className="component">

                    <div style={labelStyle}><b>Username:</b></div>
                .icx.
                    <form onSubmit={this.handleSubmit}><input type="text" name="username" ref="username" defaultValue={currUser} style={{size: 16}} onChange={this.verifyUsername} /></form>
                    <span className="relative">
                        <a href="#" onClick={this.handleUsernameLookup}><Checkmark show={puffworldprops.ICX.usernameStatus} /></a>
                        <Tooltip position='under' content="Verify your username" />
                    </span>
                    <span className="message">{puffworldprops.ICX.usernameStatus}</span>

                    <br /><br />
                    <div className="relative">
                        <b>Private passphrase<sup>&#63;</sup></b>
                        <Tooltip content="(Placehold text for private passphrase)" />
                    </div>


                    <textarea type="text" name="defaultKey" ref="defaultKey" style={{width: '60%', height: '15%'}} onChange={this.handleResetCheckboxes} />
                    <span className="relative">
                        <a href="#" onClick={this.handlePassphraseCheck.bind(this, 'defaultKey')}>
                            <Checkmark show={puffworldprops.ICX.defaultKey} />
                        </a>
                        <Tooltip position='under' content="Verify your passphrase" />
                    </span>

                    <span className="message">{puffworldprops.ICX.defaultKey}</span>
                    <br /><br />
                    <i><em>or</em></i>
                    <br /><br />
                    <div className="relative">
                    Select an identity file<sup>&#63;</sup>
                        <Tooltip content="Login by uploading your passphrase file" />
                    </div>



                    <br />
                    <input type="file" ref="textFile" onChange={this.handleLoginWithFile} />

                </div>
            </div>
            )
    },

    getInitialState: function () {
        return {
            rootKeyStatus: false,
            adminKeyStatus: false,
            defaultKeyStatus: false,

            usernameStatus: false,
            rootKey: false,
            adminKey: false,
            defaultKey: false

        }
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

    handlePassphraseCheck: function (keyType) {
        // Will check against default key
        // First convert to private key, then to public, then verify against DHT

        var self = this

        var username = this.refs.username.getDOMNode().value

        // Check for zero length
        if (!username.length) {

            //this.state.usernameStatus = 'Missing'
            Events.pub('ui/event', {
                'ICX.usernameStatus': 'Missing'
            })
            return false
        }

        username = 'icx.' + username

        var passphrase = this.refs[keyType].getDOMNode().value

        // Check for zero length
        if (!passphrase.length) {
            //this.state[keyType] = 'Missing'
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
            //this.state[keyType] = 'Bad key'
            Events.pub('ui/event', {
                'ICX.defaultKey': 'Bad Key'
            })
            return false
        }

        var prom = PB.getUserRecord(username)

        prom.then(function (userInfo) {

            if (publicKey != userInfo[keyType]) {
                Events.pub('ui/event', {
                    'ICX.defaultKey': 'Incorrect key'
                })
                return false
            } else {
                Events.pub('ui/event', {
                    'ICX.defaultKey': true,
                    'ICX.usernameStatus': true
                })

                // Add this to wardrobe, set username to current
                if (keyType == 'defaultKey') {
                    PB.M.Wardrobe.storeDefaultKey(username, privateKey)
                }

                // At least one good key, set this to current user
                PB.M.Wardrobe.switchCurrent(username)

                Events.pub('/ui/icx/screen', {"view.icx.screen": "dashboard"})
                return false
            }
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

    handleIdentityFileLoad: function () {
        var self = this
        var reader = new FileReader()

        reader.onload = function (event) {
            self.state.imageSrc = event.target.result
        }

        reader.readAsDataURL(this.refs.imageLoader.getDOMNode().files[0])
        return false
    },


    handleLoginWithFile: function(event) {

        var fileprom = PBFiles.openTextFile(event.target)
        fileprom.then(function(content) {

            // textFileContent.value = content

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
                        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'dashboard'});


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



            }

        })

        /*

         var encrypedLink = this.refs.encryptedLink.getDOMNode()
         //Display the name of the selected file
         this.refs.filename.getDOMNode().value = this.refs.uploadbutton.getDOMNode().value
         this.setState({nextStatus: true})

         //Encrypt the file in a puff
         var element = event.target
         //var fileprom = PBFiles.openBinaryFile(element)

         ICX.fileprom = PBFiles.openBinaryFile(element)

         ICX.filelist = element.files
         ICX.encryptedLink = this.refs.encryptedLink.getDOMNode()
         */

    }



})

var ICXDashboard = React.createClass({
    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        var username = ICX.username

        var filename = username + "Identity.json"

        //TODO: Need to show their avatar if available in profile puff

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Dashboard for {username}</div><br />
                <div className="contentWindow">
                    <div className="dashboard avatarHolder">
                        <span style={{color: ICX.userColor, fontSize: 2.5*ICX.calculated.baseFontH+'px'}}><i className={'icon-'+ICX.animalName+' shadow'} /></span>
                        <br />
                    </div>

                    <a href="#"  onClick={this.handleGoTo.bind(null, 'home.table')}>
                        <i className="fa fa-fw fa-list" />
                        {' '}View your messages
                    </a>
                    <br /><br />
                    <a href="#"  ref="createFileButton" onClick={this.handleDownloadIdentityFile}>
                        <i className="fa fa-fw fa-download" />
                        {' '}Save passphrase as file
                    </a>
                    <br /><br />
                    <a href="#" ref="fileLink" download={filename} ><span style={{display: 'none'}}>{filename}</span></a>

                    <a href="#"  onClick={this.handleGoTo.bind(null, 'encryptdecrypt')}>
                        <i className="fa fa-fw fa-file-excel-o" />
                        {' '}Encrypt or decrypt a file
                    </a>
                    <br /><br />


                    <a href="#" onClick={this.handleSignOut}>
                        <i className="fa fa-fw fa-sign-out" />
                        {' '}Logout
                    </a>
                </div>
            </div>
            )
    },

    // Generate download link of file
    handleGenerateIdentityFile: function() {
        // Bail if no username,
        // TODO handle this error better
        var username = PB.M.Wardrobe.getCurrentUsername()
        if(!username)
            return false

        // Only generate if it doesn't already exist
        if(isEmpty(ICX.identityForFile)) {

            ICX.identityForFile.comment = "This file contains your private passphrase. It was generated at i.cx. The information here can be used to login to websites on the puffball.io platform. Keep this file safe and secure!"
            ICX.identityForFile.username = PB.M.Wardrobe.getCurrentUsername()
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

        }


        return ICX.identityForFile
    },


    handleGoTo: function(screen) {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
    },

    handleDownloadIdentityFile: function() {
        var content = JSON.stringify(this.handleGenerateIdentityFile())

        var filename = PB.M.Wardrobe.getCurrentUsername() + "Identity.json"

        // var el = document.getElementById.bind(document)

        // var fileLink = el('fileLink')
        fileLink = this.refs.fileLink.getDOMNode()

        // this.refs.username.getDOMNode()

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

        PB.M.Wardrobe.removeIdentity(userToRemove)
        ICX.username = ''
        ICX.identityForFile = {}
        Events.pub('user/'+userToRemove+'/remove', {})
        return Events.pub('/ui/icx/screen', {"view.icx.screen": this.props.goto});
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
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{ICX.currScreenInfo.fullText}</div><br />
            ((VIDEO ON FRIST SCREEN, TEXT ON NEXT ONES))
                <ul>
                    <li>No passwords sent over network</li>
                    <li>Encrypt files right on your own computer</li>
                    <li>Is there a catch. (yes, we don&#39;t store your passpharse, but we are willing to split it into 3 and send to emails. And you can download it</li>
                    <li>Tech details of p2p network</li>
                    <li>Basic encryption visual, aligator and badger, coyote tries to intercept.</li>
                    <li>Nothing to install, open source</li>
                </ul>



            </div>
            )
    }

})

var ICXAbout = React.createClass({

    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{ICX.currScreenInfo.fullText}</div><br />
                <div className="contentWindow">
                I.CX, or “I see X”, is a private messaging and file sending system build on the <a href="http://www.puffball.io">puffball platform</a>.
                    <br />
                    <br />
                    <b>Developers:</b>
                    <br />
                • <a href="http://www.mattasher.com">Matt Asher</a><br />
                • <a href="https://twitter.com/dann">Dann Toliver</a><br />
                • <a href="https://twitter.com/AdamRafeek">Adam Rafeek</a><br />
                • <a href="https://www.linkedin.com/profile/view?id=228890394">Michael Guo</a>
                </div>

            </div>
            )
    },

    gotoLearn: function() {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": 'learn'});

    }

})

var ICXHome = React.createClass({

    render: function () {
        return (
            <span></span>
            )
    }
})

var ICXFileConverter = React.createClass({


    render: function () {

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = ICX.currScreenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Encrypt and Decrypt Files</div>
                <div className="contentWindow">
                Select a file. It will be encrypted in your web browser.
                    <br /><br />
                    <input type="file" id="fileToUplaod" ref="uploadbutton" onChange={this.handleGetFile} />

                    <div style={{display: 'inline','font-size':'90%'}}>
                        <input id="showFileName" type="text" disabled="disabled" ref="filename"
                        defaultValue="No file Selected"/>
                    </div>
                    <br /><br />
                    <a ref="encryptedLink" download="no_file_selected" style={{display:'none'}}>Save Encrypted File</a>
                    <br /><br />

                OR<br />

                    Select a .puff file to decrypt.
                    <br /><br />
                    <input type="file" id="fileToDecrypt" ref="decryptbutton" onChange={this.handleDecryptFile} />

                    <div style={{display: 'inline','font-size':'90%'}}>
                        <input id="showDecryptFile" type="text" disabled="disabled" ref="filenameDecrypt"
                        defaultValue="No file Selected"/>
                    </div>
                    <br /> < br />
                    <textarea ref="resultbox">Results</textarea>
                    <br />
                    <a ref="decryptedDownload" download="no_file_selected" style={{display:'none'}}>Save Decrypted File</a>

                </div>
            </div>
            )
    },

    handleDecryptFile: function(event) {

        this.refs.filenameDecrypt.getDOMNode().value = this.refs.decryptbutton.getDOMNode().value

        var decryptFile = this.refs.decryptbutton.getDOMNode()
        var resultLink = this.refs.decryptedDownload.getDOMNode()


        var element = event.target
        var fileprom = PBFiles.openPuffFile(element)
        fileprom.then(function(fileguts) {
            console.log(fileguts)

            var letterPuff = PBFiles.extractLetterPuff(fileguts)
            var content = (letterPuff.payload || {}).content
            var type = (letterPuff.payload || {}).type

            console.log(letterPuff)
            //var resultbox = this.refs.resultbox.getDOMNode()
            //resultbox.value = content

            var filelist = decryptFile.files
            var file = filelist[0]
            var filename = file.name
            if (/\.puff/.test(filename)) {
                filename = filename.slice(0, -5)
            }
            else {
                //TODO: ERROR!!!!
            }
            resultLink.style.display = ""
            resultLink.href = PBFiles.prepBlob(content, type)
            resultLink.download = filename
        })

    },

    handleGetFile: function(event) {
        //Display the name of the selected file
        this.refs.filename.getDOMNode().value = this.refs.uploadbutton.getDOMNode().value


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

            //Make the link visisble to download the file (Temporary)
            encrypedLink.style.display=""
            encrypedLink.href = PBFiles.prepBlob(puff)
            encrypedLink.download = new_filename
        })

    }

})

// SUBCOMPONENTS
var ICXSpinner = React.createClass({
    render: function () {
        var spinnerHeight = ICX.calculated.baseFontH*3

        var w = window.innerWidth
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
        if(ICX.errors.length) {
            return (
                <div>{ICX.errors}</div>
                )
        } else {
            return <span></span>
        }

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


        if(!puffworldprops.view.icx.screen || puffworldprops.view.icx.screen == 'home') {
            var logoW = ICX.calculated.logoW

            var logoX = keepNumberBetween(Math.floor( w*(1-ICX.config.buttonWidthRatio)-ICX.calculated.rightBorder-logoW ),0,10000) + "px"
            var logoY = Math.floor( h*ICX.config.logo.insets.top ) + "px"
            logoW = Math.floor(logoW) + 'px';

            var fontH = keepNumberBetween( Math.floor( ICX.calculated.fontSizeMultiplier ), ICX.config.text.min, ICX.config.text.max)  + 'px'

            return (
                <div key="mainLogo" style={{width: '100%'}}>
                    <div>
                        <img src="img/icx/icxLogo.png" style={{position: 'relative', marginTop: logoY, left: logoX, width: logoW, display: 'block'}} alt='I.CX Logo' />
                    </div>
                    <br />
                    <div style={{width: '60%', fontFamily: 'Minion pro, Times, "Times New Roman", serif', fontSize: fontH, left: logoX, position: 'absolute'}}>The world’s first 100% secure, open source messaging system that works right in your web browser.
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

        });

        return <span>{buttonLinks}</span>

    }
});

var ICXButtonLink = React.createClass({
    handleGoTo: function(screen) {
        // return Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen});

    },


    render: function () {
        var w = window.innerWidth
        var h = window.innerHeight
        var screenInfo = this.props.screenInfo

        var fontSize = Math.floor( h*ICX.config.buttonFontHeightRatio );

        var buttonStyle = {
            backgroundColor: screenInfo.color,
            height: Math.floor( h*ICX.config.buttonHeightRatio ) + 'px',
            position: 'absolute',
            right: 0,
            fontSize:  fontSize + 'px',
            top: Math.floor( (h*.3) + screenInfo.position*Math.floor( ICX.config.buttonHeightRatio*h )) + 'px',
            lineHeight: Math.floor( h*ICX.config.buttonHeightRatio ) + 'px',
            color: 'white',
            paddingLeft: Math.floor(fontSize/2.5)+'px',
            zIndex: 100,
            whiteSpace: 'nowrap'
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

        /*return (
         <div style={buttonStyle}>
         <a href="#"  onClick={this.handleGoTo.bind(null, this.props.screenInfo.name)} style={{color: '#ffffff'}}>
         <i className={this.props.screenInfo.icon}></i>{' '}
         {linkText} <i className="fa fa-chevron-right" />
         </a>
         </div>
         )*/
        return (
            <a href="#" onClick={this.handleGoTo.bind(null, this.props.screenInfo.name)} style ={{color: '#ffffff'}}>
                <div className="navBtn" style={buttonStyle}>
                    <i className={this.props.screenInfo.icon}></i>{' '}
                        {linkText} <i className="fa fa-chevron-right" />
                </div>
            </a>
            )
    }
});

var ICXFooter = React.createClass({

    render: function () {
        var w = window.innerWidth

        // Same as logoX
        var footerX = keepNumberBetween(Math.floor( w*(1-ICX.config.buttonWidthRatio)-ICX.calculated.rightBorder-ICX.calculated.logoW ),0,10000) + "px"

        return (
            <div style={{position: 'absolute', bottom: '10px', left: footerX }}>
                <img className="puffballIconFooter" src="img/blueAnimated.gif" />
            Powered by <a href="http://www.puffball.io" target="_new">puffball</a>. All content is encrypted on the user&#39;s device. Only the sender and recipient can decode it.
            </div>
            )
    }
});


var ICXUserButton = React.createClass({
    mixins: [TooltipMixin],

    render: function() {

        var username = ICX.username
        if (!username) {
            return(
                <span>
                    <div className="navBtn user">
                        <a href="#"  onClick={this.handleGoTo.bind(null, 'login')} style={{color: '#ffffff'}}>
                            <i className="fa fa-fw fa-sign-in"></i>{' '}
                        LOG IN
                        </a>
                    </div>
                    <div style={{display: 'inline-block', marginLeft: '10px', marginRight: '10px'}}>or</div>
                    <div className="navBtn user">
                        <a href="#" onClick={this.handleGoTo.bind(null, 'newuser')} style={{color: "#ffffff"}}>
                            <i className="fa fa-fw fa-user"></i>  SIGN UP
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

    handleGoTo: function(screen) {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
    },

    handleSignOut: function() {
        var userToRemove = PB.M.Wardrobe.getCurrentUsername()

        // Confirm alert first
        var msg = "WARNING: If you have not yet saved your passphrase, hit Cancel and click on your username to access your passphrase. Are you sure you wish to continue?"

        var r = confirm(msg)
        if (r == false) {
            return false
        }

        PB.M.Wardrobe.removeIdentity(userToRemove)
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
        if(this.props.text) {
            var buttonText = this.props.text
        } else {
            var buttonText = "NEXT"
        }

        if(this.props.enabled) {
            return <button style={{fontSize: '90%'}} className ="btn btn-primary" onClick={this.handleNext}>{buttonText} <i className="fa fa-chevron-right" /></button>

        } else {
            return <button style={{fontSize: '90%'}} className="btn btn-primary" onClick={this.handleNext} disabled>{buttonText} <i className="fa fa-chevron-right" /></button>
        }
    }
});


var ICXFileSelector = React.createClass({
    handleDisplaySelectedFile: function() {
        this.refs.filename.getDOMNode().value = this.refs.uploadbutton.getDOMNode().value
        this.setState({nextStatus: true})
    },
    render: function() {
        return (
            <div style={{width:'100%'}}>
                <div className="fileUpload btn btn-primary">
                    <span>Choose File</span>
                    <br />
                    <input type="file" id="fileToUplaod" ref="uploadbutton" onChange={this.handleDisplaySelectedFile} />
                </div>
                <div style={{display: 'inline','font-size':'90%'}}>
                    <input id="showFileName" type="text" disabled="disabled" ref="filename"
                    defaultValue="No file Selected"/>
                </div>
            </div>
            )
    }
});

// TODO: Make ICXCheckmark
var Checkmark = React.createClass({
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
    /*
     shouldComponentUpdate: function(nextProps, nextState) {
     // TODO: todo this
     return true
     return JSON.stringify(puffworldprops) !== JSON.stringify(globalSillyPropsClone)
     return JSON.stringify(nextProps) !== JSON.stringify(this.props) // THINK: why aren't the pointers the same?
     return nextProps !== this.props // TODO: this won't update when new items arrive
     },
     */
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


var PuffTallTree = React.createClass({
    mixins: [ViewKeybindingsMixin, CursorBindingsMixin, GridLayoutMixin, PuffBarShortcutMixin],
    render: function() {

        var sig    = this.props.view.query.focus
        var puff   = PB.M.Forum.getPuffBySig(sig)

        if(!puff) return <div></div>

        // sundry miscellany
        var arrows = this.props.view.arrows
        var username = PB.M.Wardrobe.getCurrentUsername()
        var filters = this.props.view.filters
        var query = this.props.view.query
        var queryfilter = Boron.extend({}, query, filters)

        // gridCoord params
        var screencoords = this.getScreenCoords()
        var dimensions   = this.getDimensions()
        var cols    = dimensions.cols
        var rows    = dimensions.rows
        var gridbox = this.getGridBox(rows, cols)

        // big box
        var bigrows = +this.props.view.bigrows || 2
        var bigcols = +this.props.view.bigcols || 2

        if(bigrows < 0) bigrows = Math.max(rows + bigrows, 1)
        if(bigcols < 0) bigcols = Math.max(cols + bigcols, 1)

        if(rows < bigrows) bigrows = rows
        if(cols < bigcols) bigcols = cols

        // determine start row for big box, and totals for relatives
        // THINK: should we allow columnar offset also?
        var bigBoxStartRow = Math.floor((rows - bigrows) / 2)
        var childrenStartRow = bigBoxStartRow + bigrows
        var ancestorTotal = bigBoxStartRow * cols
        var childrenTotal = (rows - childrenStartRow) * cols
        var siblingTotal  = (cols - bigcols) * bigrows

        // box building
        // TODO: partial application
        var ancestorBox  = this.applySizes(1, 1, gridbox.add, {arrows: arrows})
        var siblingBox   = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, bigBoxStartRow)
        var childrenBox  = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow)
        var stuckBigBox  = this.applySizes(bigcols, bigrows, gridbox.add, {arrows: arrows}, bigBoxStartRow, 0, bigBoxStartRow, 0)

        // filters
        var graphize    = function(f) { return function(x) { return x.shell&&f(x.shell) } } // TODO: pipe(prop('shell'), f)
        var propsfilter = graphize(PB.M.Forum.filterByFilters(queryfilter))
        var difffilter  = function(set) { return function(item) { return !~set.indexOf(item) } }


        ///// new focus mode stuff here /////

        // TODO: this can only currently handle 9 rows with a 2x2 bigbox: 3 ancestors and 4 descendants

        var ancestorRows = Math.min(3, bigBoxStartRow)
        var ancestorBoxes = []
        var parents = [], grandparents = [], greatgrandparents = []

        if(ancestorRows >= 1) {
            parents = PB.Data.graph.v(sig).out('parent')
                .unique().filter(propsfilter).take(cols)
                .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            parentBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, bigBoxStartRow-1, 0, bigBoxStartRow-1, cols)
            ancestorBoxes = ancestorBoxes.concat(parents.map(parentBox('parent')))
        }

        var notParent = graphize(difffilter([puff].concat(parents)))

        if(ancestorRows >= 2) {
            grandparents = PB.Data.graph.v(sig).out('parent').out('parent')
                .unique().filter(propsfilter).filter(notParent).take(cols)
                .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            gpBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, bigBoxStartRow-2, 0, bigBoxStartRow-2, cols)
            ancestorBoxes = ancestorBoxes.concat(grandparents.map(gpBox('parent')))
        }

        var notGrandParent = graphize(difffilter([puff].concat(parents, grandparents)))

        if(ancestorRows >= 2) {
            greatgrandparents = PB.Data.graph.v(sig).out('parent').out('parent').out('parent')
                .unique().filter(propsfilter).filter(notGrandParent).take(cols)
                .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            ggpBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, bigBoxStartRow-3, 0, bigBoxStartRow-3, cols)
            ancestorBoxes = ancestorBoxes.concat(greatgrandparents.map(ggpBox('parent')))
        }

        var ancestorPuffs = [].concat(parents, grandparents, greatgrandparents)



        /////// descendants ////////

        var descendantRows = Math.min(4, rows - childrenStartRow)
        var descendantBoxes = []
        var kids = [], gkids = [], ggkids = [], gggkids = []

        if(descendantRows >= 1) {
            kids = PB.Data.graph.v(sig).out('child')
                .unique().filter(propsfilter).take(cols)
                .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            kidsBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow, 0, childrenStartRow, cols)
            descendantBoxes = descendantBoxes.concat(kids.map(kidsBox('child')))
        }

        var notKid = graphize(difffilter([puff].concat(kids)))

        if(descendantRows >= 2) {
            gkids = PB.Data.graph.v(sig).out('child').out('child')
                .unique().filter(propsfilter).filter(notKid).take(cols)
                .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            gkidsBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow+1, 0, childrenStartRow+1, cols)
            descendantBoxes = descendantBoxes.concat(gkids.map(gkidsBox('child')))
        }

        var notGKid = graphize(difffilter([puff].concat(kids, gkids)))

        if(descendantRows >= 3) {
            ggkids = PB.Data.graph.v(sig).out('child').out('child').out('child')
                .unique().filter(propsfilter).filter(notGKid).take(cols)
                .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            ggkidsBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow+2, 0, childrenStartRow+2, cols)
            descendantBoxes = descendantBoxes.concat(ggkids.map(ggkidsBox('child')))
        }

        var notGGKid = graphize(difffilter([puff].concat(kids, gkids, ggkids)))

        if(descendantRows >= 4) {
            gggkids = PB.Data.graph.v(sig).out('child').out('child').out('child').out('child')
                .unique().filter(propsfilter).filter(notGGKid).take(cols)
                .property('shell').run().map(PB.M.Forum.getPuffBySig).filter(Boolean)

            gggkidsBox = this.applySizes(1, 1, gridbox.add, {arrows: arrows}, childrenStartRow+3, 0, childrenStartRow+3, cols)
            descendantBoxes = descendantBoxes.concat(gggkids.map(gggkidsBox('child')))
        }

        childrenPuffs = [].concat(kids, gkids, ggkids, gggkids)


        ///// end new focus mode stuff /////




        // gather puffs, graph style
        // THINK: can we parametrize this query structure? f(outAllIn, notSelf, ancestorTotal)...
        // var genLimit = 10
        // var notSelf  = graphize(difffilter([puff]))
        // var ancestorPuffs = PB.Data.graph.v(sig).outAllN('parent', genLimit)
        //                             .unique().filter(propsfilter).filter(notSelf)
        //                             .take(ancestorTotal).property('shell').run()
        //                             .map(PB.M.Forum.getPuffBySig).filter(Boolean)
        //
        // var notAncestor = graphize(difffilter([puff].concat(ancestorPuffs)))
        //
        // var childrenPuffs = PB.Data.graph.v(sig).inAllN('parent', genLimit)
        //                             .unique().filter(propsfilter).filter(notAncestor)
        //                             .take(childrenTotal).property('shell').run()
        //                             .map(PB.M.Forum.getPuffBySig).filter(Boolean)

        var notRelated = graphize(difffilter([puff].concat(ancestorPuffs, childrenPuffs)))

        var siblingPuffs  = PB.Data.graph.v(sig).out('parent').out('child')  // THINK: second cousins?
            .unique().filter(propsfilter).filter(notRelated)
            .take(siblingTotal).property('shell').run()
            .map(PB.M.Forum.getPuffBySig).filter(Boolean)

        // fill remaining slots
        // TODO: this isn't right with the new stuff
        PB.Data.fillSomeSlotsPlease(ancestorTotal, ancestorPuffs.length, Boron.extend({}, query, {mode: 'ancestors'}), filters)
        PB.Data.fillSomeSlotsPlease(childrenTotal, childrenPuffs.length, Boron.extend({}, query, {mode: 'descendants'}), filters)
        PB.Data.fillSomeSlotsPlease(siblingTotal, siblingPuffs.length, Boron.extend({}, query, {mode: 'siblings'}), filters)

        // special sorting for children puffs
        // TODO: bring this back for the new stuff
        // var childrenPuffs =
        //     childrenPuffs.sort(function(a, b) {
        //                         return a.username == username ? -1 : 0       // fancy sorting for current user puffs
        //                             || b.username == username ?  1 : 0
        //                             || a.username == puff.username ? -1 : 0  // fancy sorting for author puffs
        //                             || b.username == puff.username ?  1 : 0
        //                             || PB.M.Forum.sortByPayload(b, a) * -1    // regular temporal sort
        //                             })

        // box the puffs
        var puffBoxes = [].concat( [puff].map(stuckBigBox('focused'))
            // , ancestorPuffs.map(ancestorBox('parent'))
            , ancestorBoxes
            , siblingPuffs.map(siblingBox('sibling'))
            // , childrenPuffs.map(childrenBox('child'))
            , descendantBoxes
        )
            .filter(function(x) {return x.width})               // remove nodes that don't fit in the grid
            .sort(function(a, b) {                              // sort required so React doesn't have
                if(a.puff.sig+'' < b.puff.sig+'') return -1    //   to remove and re-add DOM nodes
                if(a.puff.sig+'' > b.puff.sig+'') return 1     //   in order to order them properly
                return 0 })

        // ensure cursor is set
        this.cursorPower(puffBoxes.map(function(pbox) {return pbox.puff}), puff)

        // lay out the boxes
        return this.manualGridify(puffBoxes)
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

        // dangerouslySetInnerHTML={{__html: '<animate attributeName="x2" from='+Math.random()+' to='+this.props.x2+' dur="1s" /><animate attributeName="y2" from='+Math.random()+' to='+this.props.y2+'  dur="1s" />'}}

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
        // TODO: Is this a very bad idea?

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
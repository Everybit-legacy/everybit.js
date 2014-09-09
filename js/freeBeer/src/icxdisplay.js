/** @jsx React.DOM */

// TODO: Add hover effect for buttons
// TODO: Make whole button clickable
// TODO: when entering username, if no network give different error
// TODO: Add "thinking" state for checkboxes, when verifying stuff on network
// (P) Create a "dashboard" page for users, where they can view profile, view messages sent/received, encrypt/decrypt files
// TODO: make sure usernames are autoconverted to lowercase, strip out bad chars on the fly
// TODO: Store passphrase in wardrobe
// TODO: Full tooltip review, put everywhere
// TODO: Lock some screens from direct access
// TODO: Focus To field in send message first step, message itself in second
// TODO: Space bar invokes check of valid username, Enter invokes NEXT if available.
// TODO: Make adding recipients nice, like it's done at everybit
// APPROACH: Store state of process in ICX.send or ICX.store, with vars. After complete send, set back to defaults
/*
 ICX: {
    wizard: 'store' | 'send'

    store: {
        type: 'file' | 'message'
        content:
        saveToNet: true | false
        step: 'first' | 'newuser' | 'finishnewuser' | 'final'

    send: {
        type: 'message' | 'file'
        sendTo: []
        content:
        file:
        step: 'first' | 'newuser' | 'finishnewuser' | 'final'


    username:
 }

  */

var ICSWorldMixins = {
    handleGoTo: function(screen) {
        return Events.pub('/ui/icx/screen', {"view.icx.screen": screen});
    },

    getScreenDims: function() {
        return (
            {
                w: window.innerWidth,
                h: window.innerHeight
            }
        )
    }
}

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

// MAIN COMPONENT, ROUTES TRAFFIC
var ICXWorld = React.createClass({
    render: function () {

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
            {position: 0, name: 'home',  button: false, color: 'rgba(46,  48, 146, .8)', icon: 'fa fa-fw fa-home', fullText: 'HOME page'},
            {position: 1, name: 'send',  button: true, color: 'rgba(226, 160, 79, .8)', icon: 'fa fa-fw fa-paper-plane', fullText: 'SEND a private message or file'},
            {position: 2, name: 'store', button: true, color: 'rgba(93,  128, 90, .8)', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately'},
            {position: 0, name: 'login', button: true, color: 'rgba(114, 113, 86, .8)', icon: 'fa fa-fw fa-sign-in', fullText: 'LOG IN'},
            {position: 4, name: 'learn', button: true, color: 'rgba(49,  68,  92, .8)', icon: 'fa fa-fw fa-file-text-o', fullText: 'LEARN how it works'},
            {position: 5, name: 'about', button: true, color: 'rgba(85,  65,  94, .8)', icon: 'fa fa-fw fa-info-circle', fullText: 'ABOUT I.CX'},
            {position: 0, name: 'send.message',  button: false, color: 'rgba(226, 160, 79, .8)', icon: 'fa fa-fw fa-paper-plane', fullText: 'Send a message'},
            {position: 0, name: 'store.encrypt', button: false, color: 'rgba(93,  128, 90, .8)', icon: 'fa fa-fw fa-database', fullText: 'STORE your content privately'},
            {position: 0, name: 'home.table',    button: false, color: 'rgba(46,  48, 146, .8)', icon: 'fa fa-fw fa-home', fullText: 'HOME page'},
            {position: 0, name: 'dashboard',    button: false, color: 'rgba(114, 113, 86, .8)', icon: 'fa fa-fw fa-home', fullText: 'HOME page'},
            {position: 0, name: 'newuser',    button: false, color: 'rgba(114, 113, 86, .8)', icon: 'fa fa-fw fa-male', fullText: 'Register a new username'},
            {position: 0, name: 'send.finish', button: false, color: 'rgba(226, 160, 79, .8)', fullText: "Send of message"}
        ]

        
        var currScreen = puffworldprops.view.icx.screen

        var borderWidth = Math.floor(ICX.calculated.rightBorder)+'px';

        var username = PB.M.Wardrobe.getCurrentUsername()
        ICX.username = username
        
        
        if (currScreen == 'init') {
            if(username) {
                currScreen = 'dashboard'
            } else {
                currScreen = 'home'
            }
        }
        
        
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



        switch(currScreen) {
            case('send'):
                var pageComponent = <ICXSendContent screenInfo={ICX.screens[1]} />
                contentDivStyles.backgroundColor = 'rgba(226, 160, 79, .08)'
                break;

            case('send.message'):
                var pageComponent = <ICXSendMessage screenInfo={ICX.screens[1]} />
                contentDivStyles.backgroundColor = 'rgba(226, 160, 79, .08)'
                break;

            case('send.finish'):
                var pageComponent = <ICXFinishSendMessage screenInfo={ICX.screens[11]} />
                contentDivStyles.backgroundColor = 'rgba(226, 160, 79, .08)'
                break;

            case('home.table'):
                var pageComponent = <ICXTableView screenInfo={thisScreen} />
                break;

            case 'store':
                var pageComponent = <ICXStoreContent screenInfo={ICX.screens[2]} />
                contentDivStyles.backgroundColor = 'rgba(93,  128, 90, .08)'
                break;

            case 'login':
                var pageComponent = <ICXLoginContent screenInfo={ICX.screens[3]} />
                contentDivStyles.backgroundColor = 'rgba(114, 113, 86, .08)'
                break;

            case 'learn':
                var pageComponent = <ICXLearnContent screenInfo={ICX.screens[4]} />
                contentDivStyles.backgroundColor = 'rgba(49,  68,  92, .08)'
                break;

            case 'dashboard':
                var pageComponent = <ICXDashboard  screenInfo={ICX.screens[9]} />
                contentDivStyles.backgroundColor = 'rgba(114, 113, 86, .08)'
                break;

            case 'about':
                var pageComponent = <ICXAboutContent screenInfo={ICX.screens[5]} />
                contentDivStyles.backgroundColor = 'rgba(85,  65,  94, .08)'
                break;

            case 'newuser':
                var pageComponent = <ICXNewUser screenInfo={ICX.screens[10]} />
                contentDivStyles.backgroundColor = 'rgba(114, 113, 86, .08)'
                break;

            default:
                // Home page
                // Force no styling on div
                contentDivStyles = {}
                var pageComponent = <ICXHomeContent />


        }

        return (
            <div style={screenStyle}>
                <ICXLogo screenInfo={thisScreen} />
                <ICXLinks screenInfo={thisScreen} />
                <div style={contentDivStyles}>
                    {pageComponent}
                </div>
                <ICXFooter />
            </div>
        )
    }
});

var ICXLogo = React.createClass({
    render: function() {
        var w = window.innerWidth
        var h = window.innerHeight


        if(this.props.screenInfo.name == 'home' || this.props.screenInfo.name == 'init') {
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
                    <div style={{width: '60%', fontFamily: 'Minion pro, Times, "Times New Roman", serif', fontSize: fontH, left: logoX, position: 'absolute'}}>The world’s first <a href="#" onClick={this.handleGoHow}><i>100% secure</i></a>, open source messaging system that works right in your web browser.
                    </div>
                </div>
                )
        } else {

            var thisScreen = ICX.screens.filter(function( obj ) {
                return obj.name == puffworldprops.view.icx.screen;
            });

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
            paddingLeft: Math.floor(fontSize/2.5)+'px'
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
                        <ICXLoginButton />
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
                <div style={buttonStyle}>
                    <i className={this.props.screenInfo.icon}></i>{' '}
                        {linkText} <i className="fa fa-chevron-right" />
                </div>
            </a>
            )
    }
});

// TODO: Way for people to save their passphrase on dashboard page. Way to view puffs too
var ICXLoginButton = React.createClass({
    mixins: [TooltipMixin],

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

        PB.M.Wardrobe.removeKeys(userToRemove)
        ICX.username = ''
        Events.pub('user/'+userToRemove+'/remove', {})
        return false
    },

    render: function() {
        var thisScreen = ICX.screens.filter(function( obj ) {
            return obj.name == 'login';
        })[0] // NOTE RETURNS ARRAY

        var username = ICX.username
        if (!username) {
            return(
                <a href="#"  onClick={this.handleGoTo.bind(null, thisScreen.name)} style={{color: '#ffffff'}}>
                    <i className={thisScreen.icon}></i>{' '}
                    {thisScreen.fullText} <i className="fa fa-chevron-right" />
                </a>
            )
        } else {
            return(
                <span>
                    <a href="#"  onClick={this.handleSignOut} style={{color: '#ffffff'}}>
                        <i className="fa fa-fw fa-sign-out"></i>
                    </a>
                    <Tooltip position="under" content="Remove identity from this device" color="black" />
                    {' '}
                    <a href="#"  onClick={this.handleGoTo.bind(null, thisScreen.name)} style={{color: '#ffffff'}}>

                        {username} <i className="fa fa-chevron-right" />
                    </a>
                </span>
            )


        }
    }

})

var ICXDashboard = React.createClass({


    render: function () {
        var username = ICX.username

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = this.props.screenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Dashboard for {username}</div><br />
                • View your messages<br />
                • ((YOU AVATAR)) change this at everybit<br />
                • Download your passpharse<br />
                • Logout
            </div>
        )
    }
});

var ICXTableView = React.createClass({

    render: function () {
        var viewprops = this.props.view || {}
        var view = <TableView view={viewprops} table={viewprops.table}/>
        document.body.style.overflowY = "auto"
        
        return view
    }

});

var ICXHomeContent = React.createClass({

    render: function () {
        return (
            <span></span>
            )
    }

});


var ICXSendContent = React.createClass({

    getInitialState: function() {
        return {
            toUserStatus: false,
            nextStatus: false
        }
    },

    verifyUsername: function() {
        var toUser = this.refs.toUser.getDOMNode().value
        var finalChar = toUser.charAt(toUser.length-1)

        toUser = StringConversion.reduceUsernameToAlphanumeric(toUser, /*allowDot*/true)
            .toLowerCase()
        this.refs.toUser.getDOMNode().value = toUser
        this.setState({toUserStatus: false})
        this.setState({nextStatus: false})

        // If the last character is a space, then trigger usernameLookup
        if(finalChar == ' ') {
            this.handleUsernameLookup()
            return false
        }

    },

    handleUsernameLookup: function() {
      // remove initial . if it exists

        var toUser = this.refs.toUser.getDOMNode().value
        var self = this

        // Check for zero length
        if(!toUser.length) {
            this.state.toUserStatus = 'Missing'
            Events.pub('ui/event', {})
            return false
        }

        if (toUser.slice(0, 1) == '.')
            toUser = toUser.slice(1)

        var prom = PB.getUserRecord(toUser)

        prom.then(function(result) {
            self.state.toUserStatus = true
            self.state.nextStatus = true
            ICX.message = {}
            ICX.message.toUser = toUser
            Events.pub('ui/puff-packer/userlookup', {})
        })
            .catch(function(err) {
                self.state.toUserStatus = 'Not found'
                self.state.nextStatus = false
                Events.pub('ui/puff-packer/userlookup/failed', {})
            })
        return false

    },


    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = this.props.screenInfo.color


        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Send a private message or file</div>
            To: <input type="text" ref="toUser" onChange={this.verifyUsername} /> <a href="#" onClick={this.handleUsernameLookup}><Checkmark show={this.state.toUserStatus} /></a>{' '}<span className="message">{this.state.toUserStatus}</span><br />


                <input type="radio" name="type" ref="message" defaultChecked />message
                or <input type="radio" name="type" ref="file" />file
                <br />
                <ICXNextButton enabled={this.state.nextStatus} goto="send.message" key="nextToSend" buttonText="NEXT" />

            </div>
            )
    }

});

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
            return <button onClick={this.handleNext}>{buttonText}<i className="fa fa-chevron-right" /></button>
        } else {
            return <button onClick={this.handleNext} disabled>{buttonText}<i className="fa fa-chevron-right" /></button>
        }
    }
});

// After this, see if user is new
// TODO: If registered user, then "SEND", otherwise "NEXT"
var ICXSendMessage = React.createClass({
    getInitialState: function() {
        return {
            nextStatus: false
        }
    },

    handleMessageText: function () {
        ICX.messageText = this.refs.messageText.getDOMNode().value
        if(ICX.messageText.length > 1) {
            this.setState({nextStatus: true})
        } else {
            this.setState({nextStatus: false})
        }
    },

    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = this.props.screenInfo.color

        if(ICX.username) {
            var buttonText = 'SEND'
            var nextStep = 'send.finish'

        } else {
            var buttonText = 'NEXT'
            var nextStep = 'newuser'
        }

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Send a private message to {ICX.message.toUser} </div>
                Your message: <br />
                <textarea ref="messageText" style={{rows: 10, cols: 30}} onChange={this.handleMessageText} />
                <br />
                <ICXNextButton  enabled={this.state.nextStatus} goto={nextStep} text={buttonText}  key="nextToMessage" />

            </div>
            )
    }

});

var ICXFinishSendMessage = React.createClass({
    getInitialState: function() {
        return {
            messageSent: false,
            successMessage: ''
        }
    },

    handleSubmitSuccess: function() {
        this.setState({messageSent: true})
        this.setState({successMessage: 'Message sent!'})
    },

    componentDidMount: function() {
        // Set information for this send
        var type='text'
        var content=ICX.messageText
        var parents=[]
        var metadata = {}
        metadata.routes = [ICX.message.toUser]
        var envelopeUserKeys = ''


        // Bundle into puff and send this bad boy off
        var prom = Promise.resolve() // a promise we use to string everything along

        var usernames = [ICX.message.toUser]

        var userRecords = usernames.map(PB.Data.getCachedUserRecord).filter(Boolean)
        var userRecordUsernames = userRecords.map(function(userRecord) {return userRecord.username})

        // if we haven't cached all the users, we'll need to grab them first
        // THINK: maybe convert this to using PB.getUserRecords instead
        if(userRecords.length < usernames.length) {
            usernames.forEach(function(username) {
                if(!~userRecordUsernames.indexOf(username)) {
                    prom = prom.then(function() {
                        return PB.getUserRecordNoCache(username).then(function(userRecord) {
                            userRecords.push(userRecord)
                        })
                    })
                }
            })
        }

        prom = prom.then(function() {
            if(envelopeUserKeys) {      // add our secret identity to the list of available keys
                userRecords.push(PB.Data.getCachedUserRecord(envelopeUserKeys.username))
            } else {                    // add our regular old boring identity to the list of available keys
                userRecords.push(PB.M.Wardrobe.getCurrentUserRecord())
            }

            var post_prom = PB.M.Forum.addPost( type, content, parents, metadata, userRecords, envelopeUserKeys )
            post_prom = post_prom.then(self.handleSubmitSuccess.bind(self))
            return post_prom
        }) .catch(function(err) {
            self.cleanUpSubmit()
            self.setState({err: err.message})
            console.log(err)
        })

        return false
    },

    render: function () {
        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = this.props.screenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Send of message</div><br />
                <div>{this.state.successMessage}</div>
            </div>
            )


    }

});

var ICXStoreContent = React.createClass({
    getInitialState: function() {
        return {
            backupToCloud: true
        }
    },

    handleToggleBackupToCloud: function() {
        this.setState({backupToCloud: !this.state.backupToCloud})
    },

    componentDidMount: function() {

    },

    render: function () {
        // Link to previously encrypted/stored files

        // CSS for checkboxes
        var cb = React.addons.classSet
        var cbClass = cb({
            'fa': true,
            'fa-fw': true,
            'fa-check-square-o': this.state.backupToCloud,
            'fa-square-o': !this.state.backupToCloud,
            'green': this.state.backupToCloud
        })


        if(ICX.username) {
            var buttonText = 'SEND'
            var nextStep = 'store.finish'

        } else {
            var buttonText = 'NEXT'
            var nextStep = 'newuser'
        }

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = this.props.screenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>Encrypt and store files</div>
                <div>Select a file. It will be encrypted right in your web browser.</div>
                <input type="file" id="fileToUplaod" />
                <br />
                <small>
                    <i className={cbClass}  onClick={this.handleToggleBackupToCloud} ></i>
                    Once encrypted, backup to the net
                </small>
                <br />
                <ICXNextButton enabled={this.state.nextStatus} goto={nextStep} key="nextToStore" buttonText={buttonText} />





            </div>
            )
    }

});

var ICXNewUser = React.createClass({

    getInitialState: function() {
        return {
            usernameStatus: false
        }
    },

    componentDidMount: function() {
        this.handleGenerateRandomUsername()
    },

    handleGenerateRandomUsername: function() {
        var color = ICX.colornames[Math.floor(Math.random() * ICX.colornames.length)]
        var adj = ICX.adjectives[Math.floor(Math.random() * ICX.adjectives.length)]
        this.refs.username.getDOMNode().value = adj + color
        return false
    },

    handleResetCheckboxes: function() {
        this.setState({usernameStatus: false})
        this.setState({defaultKey: false})
    },

    handleUsernameLookup: function() {
        var username = this.refs.username.getDOMNode().value
        var self = this

        // Check for zero length
        if(!username.length) {
            this.state.usernameStatus = 'Missing'
            Events.pub('ui/event', {})
            return false
        }

        username = 'icx.' + username

        var prom = PB.getUserRecord(username)

        prom.then(function(result) {
            self.state.usernameStatus = false
            Events.pub('ui/puff-packer/userlookup', {})
        })
            .catch(function(err) {
                self.state.usernameStatus = 'Not Available'
                Events.pub('ui/puff-packer/userlookup/failed', {})
            })
        return false
    },

    render: function () {
        return (
            <div>
            <div>Reigster for a new username</div>
            <br />
            <div>Username:</div>
            <div>
                .icx.<input type="text" name="username" ref="username" defaultValue={this.handleGenerateRandomUsername} size="12" onChange={this.handleResetCheckboxes}/>
                {' '}<a href="#" onClick={this.handleUsernameLookup}><Checkmark show={this.state.usernameStatus} /></a>
                {' '}<a href="#" onClick={this.handleGenerateRandomUsername}>Refresh</a>


                <span className="message">{this.state.usernameStatus}</span>

            </div>
            </div>
        )
    }

});

var ICXLoginContent = React.createClass({
    // TODO: Deal with bad key
    // TODO: Allow upload of passphrase
    // TODO: Mention that if created at everybit need to modify there

    handleLogin: function() {

    },


    render: function () {
        return (
            <div style={{width: '100%', height: '100%'}}>
            <ICXSetIdentity />
            </div>
            )
    }

});


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



// TODO: Merge with todo's from login
// TODO: use passphraseToPrivateKeyWif to gen key for later download
var ICXSetIdentity = React.createClass({

    getInitialState: function() {
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

    handleUsernameLookup: function() {
        var username = this.refs.username.getDOMNode().value
        var self = this

        // Check for zero length
        if(!username.length) {
            this.state.usernameStatus = 'Missing'
            Events.pub('ui/event', {})
            return false
        }

        username = 'icx.' + username

        var prom = PB.getUserRecord(username)

        prom.then(function(result) {
            self.state.usernameStatus = true
            Events.pub('ui/puff-packer/userlookup', {})
        })
            .catch(function(err) {
                self.state.usernameStatus = 'Not found'
                Events.pub('ui/puff-packer/userlookup/failed', {})
            })
        return false
    },

    // TODO: Once successfully logged in, take them to their dashboard
    // TODO: WHen you change text of pive passpahas, set button to gray.
    handlePassphraseCheck: function(keyType) {
        // Will check against default key
        // First convert to private key, then to public, then verify against DHT

        var self = this

        var username = this.refs.username.getDOMNode().value

        // Check for zero length
        if(!username.length) {
            this.state.usernameStatus = 'Missing'
            Events.pub('ui/event', {})
            return false
        }

        username = 'icx.' + username

        var passphrase = this.refs[keyType].getDOMNode().value

        // Check for zero length
        if(!passphrase.length) {
            this.state[keyType] = 'Missing'
            Events.pub('ui/event', {})
            return false
        }


        // Convert to private key
        var privateKey = passphraseToPrivateKeyWif(passphrase)
        console.log(privateKey)

        // Convert to public key
        var publicKey = PB.Crypto.privateToPublic(privateKey)
        if(!publicKey) {
            this.state[keyType] = 'Bad key'
            Events.pub('ui/event', {})
            return false
        }

        var prom = PB.getUserRecord(username)

        prom.then(function(userInfo) {

            if(publicKey != userInfo[keyType]) {
                self.state[keyType] = 'Incorrect key'
                Events.pub('ui/event', {})
                return false
            } else {
                self.state[keyType] = true
                self.state.usernameStatus = true

                // Add this to wardrobe, set username to current
                if(keyType == 'defaultKey') {
                    PB.M.Wardrobe.storeDefaultKey(username, privateKey)
                }

                /*
                if(keyType == 'adminKey') {
                    PB.M.Wardrobe.storeAdminKey(username, privateKey)
                }

                if(keyType == 'rootKey') {
                    PB.M.Wardrobe.storeRootKey(username, privateKey)
                }
                */

                // At least one good key, set this to current user
                PB.M.Wardrobe.switchCurrent(username)

                Events.pub('ui/event', {})
                return false
            }
        })
            .catch(function(err) {
                self.state[keyType] = 'Not found'
                Events.pub('ui/event', {})
                return false
            })
        return false

    },

    verifyUsername: function() {
        var username = this.refs.username.getDOMNode().value
        username = StringConversion.reduceUsernameToAlphanumeric(username, /*allowDot*/true)
            .toLowerCase()
        this.refs.username.getDOMNode().value = username
    },

    handleResetCheckboxes: function() {
        this.setState({usernameStatus: false})
        this.setState({defaultKey: false})
    },

    handleIdentityFileLoad: function() {
        var self   = this
        var reader = new FileReader()

        reader.onload = function(event){
            self.state.imageSrc = event.target.result
        }

        reader.readAsDataURL(this.refs.imageLoader.getDOMNode().files[0])
        return false
    },

    render: function() {
        var baseFontH = ICX.calculated.baseFontH

        var currUser = PB.M.Wardrobe.getCurrentUsername()
        if (currUser)
            currUser = '.' + currUser

        var polyglot = Translate.language[puffworldprops.view.language]

        var thisScreen = ICX.screens.filter(function( obj ) {
            return obj.name == puffworldprops.view.icx.screen;
        })[0] // NOTE RETURNS ARRAY


        var labelStyle = {
            display: 'inline-block',
            marginRight: baseFontH+'px'
        }

        var  inputStyle = {
            display: 'inline-block'
        }

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = thisScreen.color


        return (

            <div style={ICX.calculated.baseTextStyle}>
                <div style={headerStyle}>Save your identity on this web browser</div>
                <br />
                <div style={labelStyle}>Username:</div><br />
                <div style={inputStyle}>


                    .icx.<input type="text" name="username" ref="username" defaultValue={currUser} onBlur={this.verifyUsername} size="12" onChange={this.handleResetCheckboxes} />
                    {' '}<a href="#" onClick={this.handleUsernameLookup}><Checkmark show={this.state.usernameStatus} /></a>
                </div>

                    <span className="message">{this.state.usernameStatus}</span>


                <br /><br />
                <div>
                    Private passphrase<sup>&#63;</sup>
                </div>

                <div style={inputStyle}>
                    <textarea type="text" name="defaultKey" ref="defaultKey" size="15" onChange={this.handleResetCheckboxes} />
                    {' '}<a href="#" onClick={this.handlePassphraseCheck.bind(this,'defaultKey')}>
                    <Checkmark show={this.state.defaultKey} /></a>
                    <span className="message">{this.state.defaultKey}</span>
                </div>
                <br /><br /><i><em>or</em></i><br /><br />

                    Select an identity file<sup>&#63;</sup>
                <br />
                
                <input type="file" className="fileUpload btn btn-primary" />

            </div>
        )
        //}
    }
})



var ICXLearnContent = React.createClass({

    render: function () {
        // Link to previously encrypted/stored files

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = this.props.screenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{this.props.screenInfo.fullText}</div><br />
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

});

var ICXAboutContent = React.createClass({

    render: function () {
        // Link to previously encrypted/stored files

        var headerStyle = ICX.calculated.pageHeaderTextStyle
        headerStyle.backgroundColor = this.props.screenInfo.color

        return (
            <div style={{width: '100%', height: '100%'}}>
                <div style={headerStyle}>{this.props.screenInfo.fullText}</div><br />
                <ul>
                    <li>I.CX (Pronounced "I see X")</li>
                    <li>Built on the puffball.io platform</li>
                    <li>Help us grow! If you like the service, share a link to our site...</li>
                    <li>Contribute to our codebase</li>
                </ul>
            </div>
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
                Powered by <a href="http://www.puffball.io" target="_new">puffball</a>. All content is encrypted on the user's device. Only the sender and recipient can decode it.
            </div>
        )
    }
});














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
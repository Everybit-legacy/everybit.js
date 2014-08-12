/** @jsx React.DOM */

var SliderMixin = {
    handleGotoSlide: function(goTo) {
        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': goTo});
    }/*,
    handleCheckAvailability: function(username) {
        if (!this.state.enableCheck) return false;
        var self = this;
        var prom = Puffball.getUserRecord(username);
        prom.then(function(){
            self.setState({msg: "Not available.", enableCheck: false})
        })  .catch(function(err){
            self.setState({msg: "Available.", nameAvailable: true, username: username, enableCheck: false})
        })
        return false;
    }*/
}

var Slider = React.createClass({
    /*getInitialState: function() {
        return {wizard: false};
    },*/
    componentWillUnmount:function() {
        var sliderDefault = PB.shallow_copy(puffworlddefaults.slider);
        return events.pub("ui/wizard/close", {'slider':sliderDefault});
    },

    handleChangeSlide: function() {
        var curr = puffworldprops.slider.currentSlide + 1;
        var wizard = puffworldprops.slider.wizard;
        var totalSlides = wizard ? puffworldprops.slider.totalWizardSlides : puffworldprops.slider.totalSlides;
        if (curr == totalSlides && !wizard) {
            return events.pu('ui/wizard/show', {'slider.currentSlide': 1, 'slider.wizard': true});
        }

        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': curr});
    },

    handleHideSlider: function() {
        return events.pub( 'ui/slider/close',{ 'slider.show': false});
    },

    handleGetStarted: function() {
        // Live version goes right to publish until the wizard is done
        this.setState({wizard: true});
        events.pub('ui/slider/get-start', {'slider.currentSlide': 1, 'slider.wizard': true});
        return false;

    },

    render: function() {
        var wizard = puffworldprops.slider.wizard;
        var slidesArr = new Array();
        var totalSlides = wizard ? puffworldprops.slider.totalWizardSlides : puffworldprops.slider.totalSlides;
        for (var i=1;i<=totalSlides;i++) {
            slidesArr.push(i)
        }

        // var cn = "slider";

        var w = window.innerWidth;
        var h = window.innerHeight;

        if( (w/h) < 3/2) {
            // Width drives it
            var slideW = Math.round(w *.75);
            var slideH = Math.round(slideW/1.5);

        } else {
            // Height drives it
            var slideH = Math.round(h *.75);
            var slideW = Math.round(slideH*1.5);
        }

        var sliderStyle = {width: slideW+'px',height: slideH+'px'};
        var self = this;

        var slideName;
        var currentSlide = puffworldprops.slider.currentSlide;
        if (wizard) {
            switch (puffworldprops.slider.currentSlide) {
                case 1:
                    slideName = <PickStepWizard />
                    break;
                case 2:
                    slideName = <RegisterSubuserWizard/>
                    break;
                case 3: 
                    slideName = <ImportWizard />
                    break;
                case 4:
                    slideName = <PasswordWizard />
                    break;
                case 5:
                    slideName = <importContentWizard />
                    break;
                case 6:
                    slideName = <PublishWizard />
                    break;

                default: 
                    break;
            }
        } else {
            switch (puffworldprops.slider.currentSlide) {
                case 1:
                    slideName = <WelcomeSlide />
                    break;
                case 2:
                    slideName = <ShortcutsSlide />
                    break;
                case 3:
                    slideName = <SecureSlide />
                    break;
                case 4:
                    slideName = <MultiThreadedSlide />
                    break;
                case 5:
                    slideName = <FilteringSlide />
                    break;
                case 6:
                    slideName = <IdentitySlide />
                    break;
                case 7:
                    slideName = <DecentralizedSlide />
                    break;
                default:
                    break;
            }

        }

        return (
            <div className="slider" style={sliderStyle}>
                <img src="img/EveryBitLogo.svg" className="sliderLogo" />
                <a href="#" onClick={this.handleHideSlider}>
                    <i className="fa fa-times-circle-o fa-fw closeBox"></i>
                </a>

                <div className="slide">
                    {slideName}
                </div>

                <div className={wizard ? "hidden" : "sliderDots"}>
                        <span>{slidesArr.map(function(i) {
                            return <SliderBullet key={i} active={i == puffworldprops.slider.currentSlide} numb={i} />
                        })}</span><a href="#" onClick={this.handleGetStarted}><em>Get started!</em></a>
                </div>


            </div>
            );
    }
});

// , position: 'absolute', bottom: '0'

var SliderBullet = React.createClass({
    mixins: [SliderMixin],
    render: function() {
        if(this.props.active) {
            return <a href="#" onClick={this.handleGotoSlide.bind(this, this.props.numb)}><i className="fa fa-fw fa-circle blue"></i></a>
        } else {
            return <a href="#" onClick={this.handleGotoSlide.bind(this, this.props.numb)}><i className="fa fa-fw fa-circle-thin"></i></a>
        }
    }

});

var WelcomeSlide = React.createClass({
    mixins: [SliderMixin],

    render: function() {
        return (
                <div className="slideContent">
                	<a href="#" onClick={this.handleGotoSlide.bind(this,2)} className="black"><i className="blue fa fa-fw fa-plane"></i> Keyboard <em className="blue">shortcuts</em> for everything.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,3)} className="black"><i className="blue fa fa-fw fa-lock"></i> Fully <em className="blue">secure</em> communications</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,4)} className="black"><i className="blue fa fa-fw fa-sitemap"></i> <em className="blue">Multi-threaded</em> conversations.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,5)} className="black"><i className="blue fa fa-fw fa-search-plus"></i> Advanced <em className="blue">filtering</em> tools.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,6)} className="black"><i className="blue fa fa-fw fa-user"></i> Full <em className="blue">identity</em> management.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,7)} className="black"><i className="blue fa fa-fw fa-beer"></i> Open source. <em className="blue">Decentralized</em>. Interoperable.</a><br />
                    </div>

            )

    }
})

var ShortcutsSlide = React.createClass({
    handleShowShortcuts: function() {

        var polyglot = Translate.language[puffworldprops.view.language];
        events.pub('ui/view/rows/1', {'view.rows': 1})
        showPuff(polyglot.t("puff.shortcut"));
        return events.pub( 'ui/slider/close',{ 'slider.show': false});
    },

    render: function() {

        return (
            <div className="slideContent">
                <i className="fa fa-plane slideBackground"></i>

                <div className="slideHeader blue">Keyboard shortcuts</div>

                <span className="blue bold">N</span>: Begin a new post<br />

                <span className="blue" bold>CMD-ENTER</span>: Publish your post<br />

                <span className="blue" bold>←↑↓→</span>: Navigate between posts<br />

                <span className="blue" bold>I</span>: Toggle show information about posts<br />

                <span className="blue" bold>SPACE</span>: Toggle show relationships<br />

                <span className="blue" bold>ESC</span>: Close a dialogue box (including this one!)<br />

                <a href="#" onClick={this.handleShowShortcuts}><em>See full list</em></a>
            </div>

            )

    }
})

var SecureSlide = React.createClass({
    mixins: [SliderMixin],
    render: function() {
        return (
            <div className="slideContent">
                <i className="fa fa-lock slideBackground"></i>

                <div className="slideHeader blue">Secure communications</div>
                <i className="gray fa fa-fw fa-arrow-right"></i>Fully encrypted private messages<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>All encryption happens <em>client side</em><br />
                    (passwords are never sent over the network)<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>No single point of failure <br />
                    (posts are stored on a server and <a href="#" onClick={this.handleGotoSlide.bind(this,7)}>distributed over a P2P network</a>)<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Complete control over privacy level <br />
                    (Public, Private, Anonymous, and Invisible)<br />
            </div>

            )

    }
})

var MultiThreadedSlide = React.createClass({
    render: function() {
        return (
            <div className="slideContent">
                <div className="slideHeader blue">Multi-threaded conversations</div>

                <div style={{float: 'left', width: '50%', display: 'inline-block'}}>
                <i className="gray fa fa-fw fa-arrow-right"></i>Reply to multiple posts at once.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Follow just those branches of the conversation that interest you, ignore the rest.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Send and view private messages right in the main thread view.<br />
                </div>
                <div style={{float: 'right', width: '50%', display: 'inline-block'}}>
                  <img src="img/slides/GEB.gif" style={{width: '100%'}} />
                </div>

            </div>

            )

    }
})

var FilteringSlide = React.createClass({
    render: function() {
        return (
            <div className="slideContent">
                <i className="fa fa-search-plus slideBackground"></i>

                <div className="slideHeader blue">Advanced filtering</div>

                <i className="gray fa fa-fw fa-arrow-right"></i>Filter by username, tag, or score.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Sort by most recent or oldest.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Choose how many rows of results you want at a time.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Apply boolean logic to your filters (coming soon).<br />

            </div>

            )

    }
})

var IdentitySlide = React.createClass({
    render: function() {
        return (
            <div className="slideContent">
                <i className="fa fa-user slideBackground"></i>

                <div className="slideHeader blue">Identity management</div>

                <i className="gray fa fa-fw fa-arrow-right"></i>Users own and control their own identities.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Identities are portable across all websites using the same framework.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Three built-in levels of access control.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Users can create and manage sub-usernames as needed.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Create ad-hoc connections with other users that are website-independent.<br />

            </div>

            )
    }
})


var DecentralizedSlide = React.createClass({
    handleShowFaq: function() {
        events.pub( 'ui/slider/close',{ 'slider.show': false});
        showPuff('AN1rKvtN7zq6EBhuU8EzBmnaHnb3CgvHa9q2B5LJEzeXs5FakhrArCQRtyBoKrywsupwQKZm5KzDd3yVZWJy4hVhwwdSp12di');
        return false;
    },


    render: function() {
        return (
            <div className="slideContent">
                <i className="fa fa-beer slideBackground"></i>

                <div className="slideHeader blue">Open source. Decentralized. Interoperable.</div>

                <i className="gray fa fa-fw fa-arrow-right"></i>Open source: <a href="https://github.com/puffball/freebeer" target="_new">fork us on github</a>.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Decentralized using JavaScript P2P libraries.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Open standard for publishing content.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Goals: zero lock in, full portability, <a href="#" onClick={this.handleShowFaq}>solve the gatekeeper problem</a>.<br />

            </div>

            )

    }
})


/* wizard slides */
var PickStepWizard = React.createClass({
    handleJumpPost: function() {
        return events.pub("ui/wizard/post", {"slider.currentSlide": 6})
    },
    handleJumpCreate: function() {
        return events.pub("ui/wizard/create", {"slider.currentSlide": 2})
    },
    render: function() {
        return (
            <div className="slideContent">
                <div>
                    <a href="#" onClick={this.handleJumpPost}> Post anonymously </a>
                </div>
                or
                <div>
                    <a href="#" onClick={this.handleJumpCreate}> Create a new Identity </a>
                </div>
            </div>
        )
    }
})

var RegisterSubuserWizard = React.createClass({
    mixins: [SliderMixin],
    getInitialState: function(){
        return {
            msg: '', 
            enableCheck: true, 
            nameAvailable: false, 
            username: ''};
    },
    handleTestUsername: function() {
        this.setState({nameAvailable: false});
        var msg = '';
        var subusername = this.refs.newUsername.getDOMNode().value;
        if (subusername.length < 5) {
            msg = "Subusername must be at least 5 characters long.";
        } else if (/[^A-Za-z0-9]/.test(subusername)) {
            msg= 'Username must be alphanumberic.';
        }
        if (msg) {
            this.setState({msg: msg, enableCheck: false});
        } else {
            this.setState({msg: msg, enableCheck: true});
        }
    },
    handleCheck: function() {
        if (!this.state.enableCheck) return false;
        var prefix = this.refs.prefix.getDOMNode().value;
        var subusername = this.refs.newUsername.getDOMNode().value.toLowerCase();
        this.refs.newUsername.getDOMNode().value = subusername;
        var username = prefix + '.' + subusername;

        if (!this.state.enableCheck) return false;
        var self = this;
        var prom = Puffball.getUserRecord(username);
        prom.then(function(){
            self.setState({msg: "Not available."})
        })  .catch(function(err){
            self.setState({msg: "Available.", nameAvailable: true, username: username})
        })
        return false;

    },
    handleRegisterSubuser: function() {
        var username = this.state.username;
        return events.pub('ui/wizard/password', {"slider.currentSlide":4, "slider.username":username})
    },
    handleImport: function() {
        var network = this.refs.import.getDOMNode().value;
        UsernameImport[network].requestAuthentication();
    },
    render: function() {
        var generatedName = PuffWardrobe.generateRandomUsername();
        var getUsername = <a href="#" onClick={this.handleRegisterSubuser}>Get it now!</a>;
        if (!this.state.nameAvailable)
            getUsername = "";
        return (
            <div className="slideContent">
                Register a subuser <br/>

                <select ref="prefix">
                {CONFIG.users.map(function(u) {
                    return <option key={u.username} value={u.username}>.{u.username}</option>
                })}
                </select> <em>.</em>{' '}
                <input type="text" name="newUsername" ref="newUsername"  defaultValue={generatedName} size="12" onChange={this.handleTestUsername}/> <br/>

                <a href="#" className={this.state.enableCheck? '' : "gray"} onClick={this.handleCheck}>Check Availability</a>
                {' '}<em>{this.state.msg}</em> <br/>
                {getUsername}

                <hr/>
                Or import from{' '}<select className="import" ref="import" onChange={this.handleImport}>
                    <option value=""></option>
                    <option value="instagram">Instagram</option>
                    <option value="reddit">Reddit</option>
                </select>
            </div>
        )
    }
})

var ImportWizard = React.createClass({
    mixins: [SliderMixin],
    getInitialState: function() {
        return {
            importInfo: {},
            requestedUsername: '',
            enableCheck: false,
            enableContentImport: false,
            nameAvailable: false,
            msg: ""
        }
    },
    handleRegisterSubuser: function() {
        var username = this.state.username;
        return events.pub('ui/wizard/password', {"slider.currentSlide":4, "slider.username":username, 'slider.importInfo': this.state.importInfo})
    },
    handleImportContent: function() {
        return events.pub("ui/wizard/import", {"slider.currentSlide": 5, "slider.importInfo": this.state.importInfo})
    },
    handleCheck: function() {
        // var username = this.state.importInfo.username;
        var username = this.state.requestedUsername;
        if (!this.state.enableCheck) return false;

        var self = this;
        var prom = Puffball.getUserRecord(username);
        prom.then(function(){
            self.setState({msg: "Not available.", enableCheck: false})
        })  .catch(function(err){
            self.setState({msg: "Available.", nameAvailable: true, username: username, enableCheck: false})
        })
        return false;
    },
    render: function() {
        if (Object.keys(this.state.importInfo).length==0) {
            var params = getStashedKeysFromURL();
            if (!params['requestedUsername'])
                return <span>No import information</span>
            var importInfo = {
                username: reduceUsernameToAlphanumeric(params['requestedUsername']).toLowerCase(),
                token  : params['token'],
                id     : params['requestedUserId'],
                network: params['network']
            };

            if (importInfo.username.length < 5) {
                return (
                    <div className="slideContent">
                        Username: {importInfo.username}<br/>
                        Username must be at least 5 characters long.
                        <a href="#" onClick={handleGoBack}>Go back.</a>
                    </div>
                )
            };

            // var requestedUsername = importInfo.network + '.' + importInfo.username;
            var requestedUsername = importInfo.username;
            this.setState({importInfo: importInfo, enableCheck: true, requestedUsername: requestedUsername})
        }

        var getUsername = <a href="#" onClick={this.handleRegisterSubuser}>Get it now!</a>;
        var importContent = <a href="#" onClick={this.handleImportContent}>Import Content</a>;
        if ((!this.state.importInfo.network) || (this.state.importInfo.network != "instagram") || this.state.enableCheck) {
            importContent = "";
        }
        return (
            <div className="slideContent">
                username: .{this.state.requestedUsername}<br/>
                <a href="#" onClick={this.handleCheck}>Check Availability</a><br/>
                {this.state.msg}<br/>
                {this.state.nameAvailable ? getUsername : importContent}
            </div>
        )
    }
})

var PasswordWizard = React.createClass({
    getInitialState: function() {
        return {errMsg: '', registerSuccess: false, enableImport: false};
    },
    populateKeys: function() {
        var keys = {};
        keys.rootKeyPrivate    = Puffball.Crypto.generatePrivateKey();
        keys.adminKeyPrivate   = Puffball.Crypto.generatePrivateKey();
        keys.defaultKeyPrivate = Puffball.Crypto.generatePrivateKey();

        keys.rootKeyPublic    = Puffball.Crypto.privateToPublic(keys.rootKeyPrivate);
        keys.adminKeyPublic   = Puffball.Crypto.privateToPublic(keys.adminKeyPrivate);
        keys.defaultKeyPublic = Puffball.Crypto.privateToPublic(keys.defaultKeyPrivate);  
        for (var field in keys) {
            if (keys[field])
                this.refs[field].getDOMNode().value = keys[field];
        }
        this.setState({errMsg: ''});
        return false;
    },
    handleConvert: function() {
        var keys = {};
        keys.rootKeyPrivate    = this.refs.rootKeyPrivate.getDOMNode().value;
        keys.adminKeyPrivate   = this.refs.adminKeyPrivate.getDOMNode().value;
        keys.defaultKeyPrivate = this.refs.defaultKeyPrivate.getDOMNode().value;

        keys.rootKeyPublic    = Puffball.Crypto.privateToPublic(keys.rootKeyPrivate);
        keys.adminKeyPublic   = Puffball.Crypto.privateToPublic(keys.adminKeyPrivate);
        keys.defaultKeyPublic = Puffball.Crypto.privateToPublic(keys.defaultKeyPrivate); 

        for (var field in keys) {
            if (keys[field])
                this.refs[field].getDOMNode().value = keys[field];
        }

        if (!(keys.rootKeyPublic && keys.adminKeyPublic && keys.defaultKeyPublic))
            this.setState({'errMsg': 'Invalid private keys'})
        else
            this.setState({'errMsg': ''})
        return false;
    },
    handleClearPublic: function(type) {
        type = type + 'Public';
        if (this.refs[type]) {
            this.refs[type].getDOMNode().value = "";
        }
        return false;
    },
    handleRegisterUser: function() {
        var username = puffworldprops.slider.username;

        var keys = {};
        keys.rootKeyPrivate    = this.refs.rootKeyPrivate.getDOMNode().value;
        keys.adminKeyPrivate   = this.refs.adminKeyPrivate.getDOMNode().value;
        keys.defaultKeyPrivate = this.refs.defaultKeyPrivate.getDOMNode().value;
        
        keys.rootKeyPublic     = this.refs.rootKeyPublic.getDOMNode().value;
        keys.adminKeyPublic    = this.refs.adminKeyPublic.getDOMNode().value;
        keys.defaultKeyPublic  = this.refs.defaultKeyPublic.getDOMNode().value;  

        var payload = {
            requestedUsername: username,
            rootKey: keys.rootKeyPublic,
            adminKey: keys.adminKeyPublic,
            defaultKey: keys.defaultKeyPublic
        };
        var importInfo = puffworldprops.slider.importInfo;
        if (importInfo && importInfo.username && 
            /*importInfo.network + '.' +*/importInfo.username == username) {
            payload.importNetwork = importInfo.network;
            payload.importToken = importInfo.token;
            payload.importId = importInfo.id;          
        }

        var routes = [];
        var type = 'updateUserRecord';
        var content = 'requestUsername';

        var self = this;
        var prefix = username.split('.')[0];  
        var prefixKey;
        if (CONFIG.users[prefix]) {
            prefixKey = CONFIG.users[prefix].adminKey;
        } else {
            prefixKey = CONFIG.users["anon"].adminKey;
            prefix = "anon";
        }
       var puff = Puffball.buildPuff(prefix, prefixKey, routes, type, content, payload);
        // SUBMIT REQUEST
        var prom = PuffNet.updateUserRecord(puff);
        prom.then(function(userRecord) { 
                PuffWardrobe.storePrivateKeys(username, keys.rootKeyPrivate, keys.adminKeyPrivate, keys.defaultKeyPrivate);
                PuffWardrobe.switchCurrent(username);
                updateUI();
                var enableImport = (payload.importNetwork && payload.importNetwork == 'instagram');
                self.setState({errMsg: "","registerSuccess": true, enableImport: enableImport})
            })
            .catch(
                function(err) {
                    self.setState({errMsg: "Registration failed. Error message: " + err.message});
                });
        return false;
    },
    handlePublish: function() {
        events.pub("ui/wizard/publish", {"slider.currentSlide": 6})
        return false;
    },
    handleGotoMain: function() {
        return events.pub("ui/wizard/exit", {"slider.show": false});
    },
    handleImportContent: function() {
        return events.pub("ui/wizard/import", {"slider.currentSlide": 5})
    },
    componentDidMount: function() {
        this.populateKeys();
    },
    render: function() {
        var keyColumnStyle = {
            display: 'inline-block',
            float: 'left',
            width: '40%',
            marginRight: '10%'
        };
        var labelStyle = {
            display: 'inline-block',
            width: '100px'
        };
        var registerLink = (<a href="#" onClick={this.handleRegisterUser}>Register</a>);
        var publishLink = (<a href="#" onClick={this.handlePublish}>Publish a new puff.</a>);
        var gotoMainLink = (<a href="#" onClick={this.handleGotoMain}>Go to main site.</a>)
        var importContentLink = (<a href="#" onClick={this.handleImportContent}>Import Content, </a>)
        return (
            <div className="slideContent">
                Username: .{puffworldprops.slider.username} <br/>
                <div ref="keyFields" className={this.state.registerSuccess ? "hidden" : ""}>
                    <a href="#" onClick={this.populateKeys}>Regenerate keys</a> or <a href="#" onClick={this.handleConvert}>Convert your private keys</a><br/>
                    <em>Remeber to save your keys!</em><br/>
                    <div style={keyColumnStyle}>
                        Private Keys: <br/>
                        <span style={labelStyle}>admin:</span><input type="text" ref="adminKeyPrivate" size="10" onChange={this.handleClearPublic.bind(this, 'adminKey')}/><br/>
                        <span style={labelStyle}>root:</span><input type="text" ref="rootKeyPrivate" size="10" onChange={this.handleClearPublic.bind(this, 'rootKey')} /><br/>
                        <span style={labelStyle}>default:</span><input type="text" ref="defaultKeyPrivate" size="10" onChange={this.handleClearPublic.bind(this, 'defaultKey')} />
                    </div>
                    <div style={keyColumnStyle}>
                        Public Keys: <br/>
                        <span style={labelStyle}>admin:</span><input type="text" ref="adminKeyPublic" readOnly size="10"  /><br/>
                        <span style={labelStyle}>root:</span><input type="text" ref="rootKeyPublic" size="10" readOnly /><br/>
                        <span style={labelStyle}>default:</span><input type="text" ref="defaultKeyPublic" size="10" readOnly />
                    </div>
                    {registerLink}
                </div>
                <div className={this.state.registerSuccess ? "" : "hidden"}>
                    Success!{' '}
                    You may want to {this.state.enableImport ? importContentLink : ""} {publishLink} or {gotoMainLink}
                </div>
                <div ref="errFields">
                    <em>{this.state.errMsg}</em>
                </div>
            </div>
        );
    }
})

var importContentWizard = React.createClass({
    getInitialState: function() {
        return {message: ""};
    },
    handleContentImport: function() {
        this.setState({errorMessage: ""});
        var importInfo = puffworldprops.slider.importInfo;
        var network = importInfo.network;
        try {
            UsernameImport[network].contentURL(importInfo.username, importInfo.id, importInfo.token);
        } catch (err) {
            this.setState({message: err.message});
        }
        return false;
    },
    componentDidMount: function() {
        this.handleContentImport();
    },
    render: function() {
        return (
            <div>
                <div id="importContent">
                </div>
                {this.state.message}
            </div>
        )
    }
})

var PublishWizard = React.createClass({
    getInitialState: function() {
        return {
            current: 0
        }
    },
    handleNext: function() {
        var total = 5;
        var current = this.state.current;
        current = current + 1;
        if (current >= total) {
            var sliderProp = PB.shallow_copy(puffworlddefaults.slider);
            return events.pub("ui/wizard/close", {'slider':sliderProp});
        }
        this.setState({current: current});
        if (current >= 2) {
            var leftColDiv = this.refs.leftCol.getDOMNode();
            leftColDiv.scrollTop = leftColDiv.scrollHeight;
        }
        if (current == total-1) {
            var leftColDiv = this.refs.leftCol.getDOMNode();
            leftColDiv.scrollTop = 0;
        }
        return false;
    },
    render: function() {
        var current = this.state.current;
        var polyglot = Translate.language[puffworldprops.view.language];
        var message = polyglot.t("wizard.publish.message"+(current+1));
        var nextMsg = "Next";
        if (current == 5) {
            nextMsg == "Enter site"
        }
        return (
            <div className="slideContent">
                <div ref="leftCol" className="slideLeftCol">
                    <PuffPublishFormEmbed reply={puffworldprops.reply} showAdvanced={true} />
                </div>
                <div className="slideRightCol">
                    {message}<br/>
                    <a href="#" onClick={this.handleNext}>{nextMsg}</a>
                </div>
            </div>
        )
    }
})

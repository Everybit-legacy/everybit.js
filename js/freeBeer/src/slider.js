/** @jsx React.DOM */

var Slider = React.createClass({
    getInitialState: function() {
        return {wizard: false};
    },
    handleChangeSlide: function() {
        var curr = puffworldprops.slider.currentSlide + 1;
        var totalSlides = this.state.wizard ? puffworldprops.slider.totalWizardSlides : puffworldprops.slider.totalSlides;
        if (curr > totalSlides && !this.state.wizard) {
            curr = 1;
            this.setState({wizard: true});
        }

        console.log(curr);

        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': curr});

    },

    handleHideSlider: function() {
        return events.pub( 'ui/slider/close',{ 'slider.show': false});
    },

    handleGetStarted: function() {
        this.setState({wizard: true});
        events.pub('ui/slider/get-start', {'slider.currentSlide': 1});
        return false;
    },

    render: function() {
        var slidesArr = new Array();
        var totalSlides = this.state.wizard ? puffworldprops.slider.totalWizardSlides : puffworldprops.slider.totalSlides;
        for(i=1;i<=totalSlides;i++) {
            slidesArr.push(i)
        }


        if(puffworldprops.slider.show) {
            var cn = "slider"
        } else {
            var cn = "invisible";
        }

        // TODO: if invisible, short-circuit all the rest

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

        if (this.state.wizard) {
            switch (puffworldprops.slider.currentSlide) {
                case 1:
                    slideName = <PickStepWizard />
                    break;
                case 2:
                    slideName = <RegisterSubuserWizard />
                    break;
                case 3:
                    slideName = <ImportWizard />
                    break;
                case 4:
                    slideName = <PasswordWizard />
                    break;
                case 4:
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

        var getStartedBtn = (<a href="#" onClick={this.handleGetStarted}><em>Get started!</em></a>);
        return (
            <div className={cn} style={sliderStyle}>
                <img src="img/EveryBitLogo.svg" className="sliderLogo" />
                <a href="#" onClick={this.handleHideSlider}>
                    <i className="fa fa-times-circle-o fa-fw closeBox"></i>
                </a>

                <div className="slide">
                    {slideName}
                </div>

                <div className="sliderDots">
                        {slidesArr.map(function(i) {
                            return <SliderBullet active={i == puffworldprops.slider.currentSlide} numb={i} />
                        })} {this.state.wizard ? "" : getStartedBtn}
                </div>


            </div>
            );
    }
});

// , position: 'absolute', bottom: '0'

var SliderBullet = React.createClass({
    handleGotoSlide: function() {

        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': this.props.numb});


    },


    render: function() {
        if(this.props.active) {
            return <a href="#" onClick={this.handleGotoSlide}><i className="fa fa-fw fa-circle blue"></i></a>
        } else {
            return <a href="#" onClick={this.handleGotoSlide}><i className="fa fa-fw fa-circle-thin"></i></a>
        }
    }

});

var WelcomeSlide = React.createClass({

    handleGotoSlide: function(goTo) {
        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': goTo});
    },

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
    handleGotoSlide: function(goTo) {
        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': goTo});
    },

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
        return events.pub("ui/wizard/post", {"slider.currentSlide": 5})
    },
    handleJumpCreate: function() {
        return events.pub("ui/wizard/post", {"slider.currentSlide": 2})
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
    getInitialState: function(){
        return {msg: '', enableCheck: true, nameAvailable: false, username: ''};
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
    handleCheckAvailability: function() {
        if (!this.state.enableCheck) return false;
        var prefix = this.refs.prefix.getDOMNode().value;
        var subusername = this.refs.newUsername.getDOMNode().value.toLowerCase();
        this.refs.newUsername.getDOMNode().value = subusername;
        var username = prefix + '.' + subusername;

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
                    return <option key={u.username} value={u.username}>{u.username}</option>
                })}
                </select> <em>.</em>{' '}
                <input type="text" name="newUsername" ref="newUsername"  defaultValue={generatedName} size="12" onChange={this.handleTestUsername}/> <br/>

                <a href="#" className={this.state.enableCheck? '' : "gray"} onClick={this.handleCheckAvailability}>Check Availability</a>
                {' '}<em>{this.state.msg}</em> <br/>
                {getUsername}
            </div>
        )
    }
})

var ImportWizard = React.createClass({
    render: function() {
        return (
            <div className="slideContent">
                Import Username
            </div>
        )
    }
})

var PasswordWizard = React.createClass({
    getInitialState: function() {
        return {errMsg: ''};
    },
    handleRegisterUser: function() {
        var username = puffworldprops.slider.username;
        this.setState({errMsg: ''});

        var keys = {};
        keys.rootKeyPrivate    = Puffball.Crypto.generatePrivateKey();
        keys.adminKeyPrivate   = Puffball.Crypto.generatePrivateKey();
        keys.defaultKeyPrivate = Puffball.Crypto.generatePrivateKey();

        keys.rootKeyPublic    = Puffball.Crypto.privateToPublic(keys.rootKeyPrivate);
        keys.adminKeyPublic   = Puffball.Crypto.privateToPublic(keys.adminKeyPrivate);
        keys.defaultKeyPublic = Puffball.Crypto.privateToPublic(keys.defaultKeyPrivate);  

        var payload = {
            requestedUsername: username,
            rootKey: keys.rootKeyPublic,
            adminKey: keys.adminKeyPublic,
            defaultKey: keys.defaultKeyPublic
        };
        var routes = [];
        var type = 'updateUserRecord';
        var content = 'requestUsername';

        var self = this;
        var prefix = username.split('.')[0]; 
                
        var puff = Puffball.buildPuff(prefix, CONFIG.users[prefix].adminKey, routes, type, content, payload);
        // SUBMIT REQUEST
        var prom = PuffNet.updateUserRecord(puff);
        prom.then(function(userRecord) { 
                self.refs.keyFields.getDOMNode().style.display = "block";
                for (var field in keys) {
                    if (keys[field])
                        self.refs[field].getDOMNode().value = keys[field];
                }
                PuffWardrobe.switchCurrent(username);
            },
            function(err) {
                self.refs.keyFields.getDOMNode().style.display = "none";
                self.setState({errMsg: "Registration failed. Error message: " + err.msg});
            });
    },
    componentDidMount: function() {
        this.handleRegisterUser();
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
        return (
            <div className="slideContent">
                Username: {puffworldprops.slider.username} <br/>
                <div ref="keyFields">
                    <em>Remeber to save your keys!</em><br/>
                    <div style={keyColumnStyle}>
                        Private Keys: <br/>
                        <span style={labelStyle}>admin:</span><input type="text" ref="adminKeyPrivate" size="8" readOnly /><br/>
                        <span style={labelStyle}>root:</span><input type="text" ref="rootKeyPrivate" size="8" readOnly /><br/>
                        <span style={labelStyle}>default:</span><input type="text" ref="defaultKeyPrivate" size="8" readOnly />
                    </div>
                    <div style={keyColumnStyle}>
                    Public Keys: <br/>
                    <span style={labelStyle}>admin:</span><input type="text" ref="adminKeyPublic" readOnly size="8"  /><br/>
                    <span style={labelStyle}>root:</span><input type="text" ref="rootKeyPublic" size="8" readOnly /><br/>
                    <span style={labelStyle}>default:</span><input type="text" ref="defaultKeyPublic" size="8" readOnly />
                    </div>
                    <a href="#" onClick={handlePublish}>Publish a new puff.</a>
                </div>
                <div ref="errFields">
                    <em>{this.state.errMsg}</em>
                </div>
            </div>
        );
    }
})

var PublishWizard = React.createClass({
    render: function() {
        return (
            <div className="slideContent">
                Publish Content
            </div>
        )
    }
})
/** @jsx React.DOM */

    
var PuffPublishFormEmbed = React.createClass({
    getInitialState: function() {
        return {imageSrc    : '', 
                state: false,
                usernames   : [],
                parentUsernames: [],
                usernameErr : '',
                showPreview : false, 
                err         : false,
                showAdvanced: false,
                advancedOpt : {}};
    },
    preventDragText: function() {
        if (this.refs.content) {
            var content = this.refs.content.getDOMNode();
            content.addEventListener("mousedown", function(e){e.stopPropagation()}, false);
        }
    },
    componentDidMount: function() {
        // set silly global this is very very dumb
        globalReplyFormSubmitArg = this.handleSubmit.bind(this);

        if(this.refs.content) {
            var content = this.refs.content.getDOMNode();
            if (puffworldprops.menu.section == "publish" || puffworldprops.reply.expand) content.focus();
        }

        if (puffworldprops.reply.state)
            this.setState(puffworldprops.reply.state);
        this.getUsernames();
        this.preventDragText();

        var privacyNode = this.refs.privacy.getDOMNode();
        var buttons = privacyNode.getElementsByTagName('button');
        for (var i=0; i<buttons.length; i++) {
            var button = buttons[i];
            button.onclick = this.handlePickPrivacy.bind(this, button.value);
        }

        /*var replyPrivacyNode = this.refs.replyPrivacy.getDOMNode();
        buttons = privacyNode.getElementsByTagName('button');
        for (var i=0; i<buttons.length; i++) {
            var button = buttons[i];
            button.onclick = this.handlePickReplyPrivacy.bind(this, button.value);
        }*/
    },
    componentDidUpdate: function() {
        this.preventDragText();
        this.getUsernames();
    },
    componentWillUnmount: function() {
        // remove silly global
        globalReplyFormSubmitArg = null;
        return events.pub("", {'reply.content': ""})
    },
    cleanUpSubmit: function(){
        var className = this.refs.send.getDOMNode().className;
        className = className.replace(' deactive', '');
        this.refs.send.getDOMNode().className = className
    },
    handleSubmitSuccess: function(puff) {
        this.cleanUpSubmit();
        // clear the content
        update_puffworldprops({'reply.content': ''})
        
        // console.log(this);
        if (this.refs.content) this.refs.content.getDOMNode().value = '';

        // go to the puff
        var sig = puff.sig;
        if (typeof puff.payload.parents == 'undefined') {
            var decrypted = PuffForum.extractLetterFromEnvelopeByVirtueOfDecryption(puff);
            sig = decrypted.sig;
        }
        showPuff(sig);
        events.pub('ui/flash', {'reply.parents': [],
                                'reply.privacy': false,
                                'view.cursor': sig, 
                                'view.flash': true})
        // set back to initial state
        this.setState(this.getInitialState());
    },
    handleSubmit: function() {
        if (this.refs.send.getDOMNode().className.indexOf('deactive') != -1)
            return false;
        this.refs.send.getDOMNode().className += " deactive";

        var self = this;
        var content = '';
        var metadata = {};
        var parents = this.props.reply.parents;
        
        var type = this.props.reply.type || this.refs.type.getDOMNode().value;
        if(!type) return false

        if (type != 'image') this.setState({'showPreview': false});
        // TODO: allow the content type handler to dictate this part (pass all refs and props and state?)
        if(type == 'image') {
            content = this.state.imageSrc;
        } else {
            content = this.refs.content ? this.refs.content.getDOMNode().value.trim() : puffworldprops.reply.content;
        }
        metadata.license = this.state.advancedOpt.contentLicense;
        metadata.replyPrivacy = this.state.advancedOpt.replyPrivacy;
        
        if(type == 'PGN') {
            metadata.quote = true;
        }

        metadata.routes = this.state.usernames;
        
        /*var replyPrivacy = this.refs.replyPrivacy.getDOMNode().value;
        if(replyPrivacy) {
            metadata.replyPrivacy = replyPrivacy;
        }*/
        
        var privacy = this.refs.privacy.getDOMNode().querySelector("button.green").value;
        
        if(privacy == 'public') {
            var self=this;
            var post_prom = PuffForum.addPost( type, content, parents, metadata );

            post_prom
                .then(self.handleSubmitSuccess.bind(self))
                .catch(function(err) {
                    self.cleanUpSubmit();
                    self.setState({err: err.message});
                })
            return false;
        } 
        
        
        // we're definitely private at this point.
        
        
        var prom = Promise.resolve() // a promise we use to string everything along 
        
        // are we currently anonymous? make a new user and switch.
        if(!PuffWardrobe.getCurrentUsername()) {
            prom = prom.then(function() {
                return PuffWardrobe.addNewAnonUser().then(function(userRecord) {
                    PuffWardrobe.switchCurrent(userRecord.username)
                })
            })
        }
        
        // would we like to be anonymous? make a new user.
        var envelopeUserKeys = ''
        if(privacy == 'anonymous' || privacy == 'paranoid') {
            prom = prom.then(function() {
                return PuffWardrobe.addNewAnonUser().then(function(userRecord) {
                    envelopeUserKeys = PuffWardrobe.keychain[userRecord.username]
                })
            })
        }
        
        // are we paranoid? make another new user
        if(privacy == 'paranoid') {
            prom = prom.then(function() {
                return PuffWardrobe.addNewAnonUser(function(userRecord) {
                    metadata.replyTo = userRecord.username
                })
            })
        }
                
        var usernames = this.state.usernames;
        
        var userRecords = usernames.map(PuffData.getCachedUserRecord).filter(Boolean)
        var userRecordUsernames = userRecords.map(function(userRecord) {return userRecord.username})
        
        // if we haven't cached all the users, we'll need to grab them first
        // THINK: maybe convert this to using Puffball.getUserRecords instead
        if(userRecords.length < usernames.length) {
            usernames.forEach(function(username) {
                if(!~userRecordUsernames.indexOf(username)) {
                    prom = prom.then(function() {
                        return Puffball.getUserRecordNoCache(username).then(function(userRecord) {
                            userRecords.push(userRecord);
                        })
                    })
                }
            })
        }

        prom = prom.then(function() {
            if(envelopeUserKeys) {      // add our secret identity to the list of available keys
                userRecords.push(PuffData.getCachedUserRecord(envelopeUserKeys.username))
            } else {                    // add our regular old boring identity to the list of available keys
                userRecords.push(PuffWardrobe.getCurrentUserRecord())
            }

            var post_prom = PuffForum.addPost( type, content, parents, metadata, userRecords, envelopeUserKeys );
            post_prom = post_prom.then(self.handleSubmitSuccess.bind(self))
            return post_prom;
        }) .catch(function(err) {
            self.cleanUpSubmit();
            self.setState({err: err.message});
            console.log(err);
        })

        return false;
    },

    handleImageLoad: function() {
        var self   = this;
        var reader = new FileReader();

        reader.onload = function(event){
            self.state.imageSrc = event.target.result;
            return events.pub('ui/reply/image-upload');
        }

        reader.readAsDataURL(this.refs.imageLoader.getDOMNode().files[0]);

        return false;
    },
    addUsername: function() {
        var self = this;
        var usernameNode = this.refs.username.getDOMNode();
        var newUsername = usernameNode.value.toLowerCase();
        newUsername = newUsername.replace(/\s+/g, '');
        if (newUsername.length == 0) return false;
        var usernames = this.state.usernames;
        var prom = Puffball.getUserRecord(newUsername);
        prom.then(function(){
            self.setState({usernameError: ''});
            if (usernames.indexOf(newUsername) == -1 && newUsername != CONFIG.zone) {
                usernames.push(newUsername);
                self.setState({username: usernames});
            }
            usernameNode.value = '';
        })  .catch(function(err){
            self.setState({usernameError: 'Username invalid'});
        })
        return false;
    },
    removeUsername: function(value) {
        var currentUsernames = this.state.usernames;
        currentUsernames = currentUsernames.filter(function(u){return u != value});
        this.setState({usernames: currentUsernames});
        return false;
    },
    handleSendtoInput: function() {
        if (event.keyCode == 13) {
            this.addUsername();
        } else {
            this.setState({usernameError: ''});
        }
    },
    handlePickType: function() {
        var type = this.refs.type.getDOMNode().value;
        var content = this.refs.content ? this.refs.content.getDOMNode().value : puffworldprops.reply.content;
        return events.pub('ui/reply/set-type', {'reply.type': type, 'reply.content': content});
    },
    handlePickPrivacy: function(privacy) {
        return events.pub('ui/reply/set-privacy', {'reply.privacy': privacy});
    },
    handlePickReplyPrivacy: function(privacy) {
        var advancedOpt = this.state.advancedOpt;
        advancedOpt.replyPrivacy = privacy
        return this.setState({advancedOpt: advancedOpt});
    },
    handlePickAdvancedOpt: function(e) {
        var key = e.target.name;
        var advancedOpt = this.state.advancedOpt;
        advancedOpt[key] = e.target.value;
        this.setState({advancedOpt: advancedOpt});
    },
    handleTogglePreview: function() {
        this.setState({showPreview: !this.state.showPreview});
    },
    handleChangeUsernames: function() {
        var usernames = this.refs.usernames.getDOMNode().value;
        return events.pub('ui/reply/set-usernames', {'reply.usernames': usernames});
    },
    handleExpand: function() {
        // save current content and state
        var content = this.refs.content ? this.refs.content.getDOMNode().value.trim() : puffworldprops.reply.content;
        // DON'T MUTATE PROPS!
        // puffworldprops.reply.content = content;
        // puffworldprops.reply.state = this.state;
        update_puffworldprops({'reply.content': content, 'reply.state': this.state})
        
        
        // publish events
        var expanded = this.props.reply.expand;
        if (expanded) {
            return events.pub('ui/publish-menu', {'reply.expand': false,
                                                  'menu.section': 'publish',
                                                  'menu.show': true,
                                                  'clusters.publish': true});
        } else {
            return events.pub('ui/publish-expand', {'reply.expand': true,
                                                    'menu.section': false,
                                                    'menu.show': false});
        }
    },
    handleShowAdvanced: function() {
        this.setState({showAdvanced: !this.state.showAdvanced});
        return false;
    },
    getUsernames: function() {
        var parents = [];
        if (typeof this.props.reply.parents != 'undefined') {
            parents = this.props.reply.parents;
        };
        var parentUsernames = [];
        if (parents.length) {
            parentUsernames = parents.map(function(id) { return PuffForum.getPuffBySig(id) })
                                     .map(function(puff) { return puff.payload.replyTo || puff.username })
                                     .filter(function(item, index, array) { return array.indexOf(item) == index })
                                     .filter(Boolean)
                                     .filter(function(value){return value!=CONFIG.zone});
        }
        var currentParentUsernames = this.state.parentUsernames;
        if (currentParentUsernames.length != parentUsernames.length) {
            // look for the usernames that are added/removed by reply
            var usernameAdded = parentUsernames.filter(function(u){
                return currentParentUsernames.indexOf(u) == -1;
            })
            var usernameDeleted = currentParentUsernames.filter(function(u){
                return parentUsernames.indexOf(u) == -1;
            })

            // add/remove those username from this.state.usernames
            var usernames = PB.shallow_copy(this.state.usernames);
            for (var i=0; i<usernameAdded.length; i++) {
                if (usernames.indexOf(usernameAdded[i]) == -1)
                    usernames.push(usernameAdded[i])
            }
            for (var i=0; i<usernameDeleted.length; i++) {
                var index = usernames.indexOf(usernameDeleted[i]);
                if (index != -1)
                    usernames.splice(index, 1);
            }

            // set the state
            this.setState({parentUsernames: parentUsernames, 
                           usernames: usernames});
        }
        return false;
    },
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var contentTypeNames = Object.keys(PuffForum.contentTypes);
        var privacyDefault = "public";
        var author = PuffWardrobe.getCurrentUsername();
        author = humanizeUsernames(author) || "anonymous";

        var defaultContent = this.props.reply.content || '';
        var parents = [];
        if (typeof this.props.reply.parents != 'undefined') {
            parents = this.props.reply.parents;
        }
        var parentType = CONFIG.defaultContentType;
        if(parents.length) {
            var parent = PuffForum.getPuffBySig(parents[0]);
            parentType = parent.payload.type;

            // figure out reply privacy
            var envelope = PuffData.getBonus(parent, 'envelope');
            if(envelope && envelope.keys)
                privacyDefault = "private";
                
            if(parent.payload.replyPrivacy)
                privacyDefault = parent.payload.replyPrivacy;

            // by default we include all parent users in the reply
            /*var parentUsernames = parents.map(function(id) { return PuffForum.getPuffBySig(id) })
                                         .map(function(puff) { return puff.payload.replyTo || puff.username })
                                         .filter(function(item, index, array) { return array.indexOf(item) == index })
                                         .filter(Boolean)
                                         // .join(', ')*/

            // Should we quote the parent
            if (typeof PuffForum.getPuffBySig(parents[0]).payload.quote != 'undefined') {
                if(PuffForum.getPuffBySig(parents[0]).payload.quote) {
                    if (!defaultContent)
                        defaultContent = PuffForum.getPuffBySig(parents[0]).payload.content;
                }
            }
        }
        var type = this.props.reply.type || parentType;
        var privacy = this.props.reply.privacy || privacyDefault;

        /* styles */
        var leftColStyle = {
            minWidth: '28%',
            marginRight: '2%',
            textAlign: 'left',
            display: 'inline-block'
        }
        var rightColStyle = {
            display: 'inline-block',
            textAlign: 'left',
            marginBottom: '5px',
            width: '70%'
        }
        var typeStyle = {
            width: '28%',
            marginRight: '2%',
            textAlign: 'left',
            display: 'inline-block'
        }
        var contentStyle = {
            width: (puffworldprops.reply.expand ? "400px" : '100%'),
            height: (type=="PGN" && this.state.showPreview) ? 'auto' : '200px',
            overflowY: this.state.showPreview ? "scroll" : "hidden",
            cursor: this.state.showPreview ? "default" : "auto", 
            marginTop: '10px',
            marginBottom: '10px',
            border: '1px solid #333',
            display: 'block',
            background: '#FFFFFF'
        }
        var sendStyle = {
            minWidth: '60%',
            marginRight: '2%',
            display: 'inline-block'
        };
        var sendButton = (
            <a href="#" style={sendStyle} ref="send" onClick={this.handleSubmit}><i className="fa fa-paper-plane fa-fw"></i> {polyglot.t("replyForm.send", {author: author})}</a>
        );
        var expandStyle = {
            position: 'relative',
            top: '-2em',
            float: 'right'
        };
        var expandButton = (
            <a href="#" style={expandStyle} onClick={this.handleExpand}><i className="fa fa-fw fa-expand"></i></a>
        );
        var relativeStyle = {
            position: 'relative'
        }

        /* Recipient: username bubbles
         * Send to: newusername input + 
         */
        var sendtoInputStyle = {
            width: '60%',
            display: 'inline-block'
        }
        var sendtoInput = (
            <span>
                <input type="text" className="btn" style={sendtoInputStyle} name="username" ref="username" placeholder={polyglot.t("replyForm.sendToPh")} onKeyDown={this.handleSendtoInput} onBlur={this.addUsername}></input>
            </span>
        );
        var self = this;
        var sendToField = (
            <div>
                <span style={leftColStyle}>{polyglot.t("replyForm.recipient")}: </span>
                {self.state.usernames.map(function(value){
                    return (
                        <span key={value} className='bubbleNode'>
                            {value}
                            <a href="#" onClick={self.removeUsername.bind(self, value)}>
                                <i className="fa fa-times-circle-o fa-fw"></i>
                            </a>
                        </span>
                    )
                })}<br/>
                <span style={leftColStyle}>{polyglot.t("replyForm.sendTo")}: </span>
                {sendtoInput}
                <a href="#" onClick={this.addUsername}><i className="fa fa-fw fa-plus-circle"></i></a>
                <div className="message red">{this.state.usernameError}</div>
            </div>
        );


        /* type | privacy */
        var typeOption = (
            <select className="btn" style={typeStyle} ref="type" value={type} disabled={this.state.showPreview} onChange={this.handlePickType} >
                {contentTypeNames.map(function(type) {
                    return <option key={type} value={type}>{type}</option>
                })}
            </select>
        );
        var privacyToIcon = {
            'public': 'fa-bullhorn',
            'private': 'fa-lock',
            'anonymous': 'fa-barcode',
            'paranoid': 'fa-circle-thin'
        }
        var privacyOption = (
            <span ref="privacy" id="privacyDiv" className="icon">
                {polyglot.t("replyForm.privacyOption")}: <span className="relative" style={{width: '150px', display: 'inline-block'}}>
                {Object.keys(privacyToIcon).map(function(p){
                    var color = privacy == p ? 'green' : 'black';
                    return (
                        <span key={p}>
                            <button className={'btn ' + color} value={p}><i className={"fa fa-fw "+privacyToIcon[p]}></i></button>
                            <Tooltip position="above" content={polyglot.t("replyForm.pOptions."+p)} />
                        </span>)
                })}</span>
            </span>
        );

        
        var contentField = (
            <textarea id="content" ref="content" name="content" className="mousetrap" placeholder={polyglot.t('replyForm.textareaPh')} defaultValue={defaultContent} style={contentStyle} onChange={this.updateContent}></textarea>
        );
        if (this.state.showPreview) {
            var currentType = this.props.reply.type || this.refs.type.getDOMNode().value;
            var currentContent = puffworldprops.reply.content;
            if (this.refs.content) {
                currentContent = this.refs.content.getDOMNode().value.trim();
                update_puffworldprops({'reply.content': currentContent})
            };

            currentContent = PuffForum.processContent(currentType, currentContent, {});
            contentField = (
                <div>
                    <div style={contentStyle} id="preview" ref="preview" name="preview" dangerouslySetInnerHTML={{__html: currentContent}}></div>
                </div>
            )
        }
        // TODO: Did I hear someone say switch?
        // TODO: move this in to the content type handlers
        if(type == 'image') {
            // emply src will show no image icon in firefox
            var imageField = (<img id="preview_image" />);
            if (this.state.imageSrc) {
                imageField = (<img src={this.state.imageSrc} id="preview_image" />);
            }
            contentField = (
                <div>
                    <div className="menuItem">
                        {polyglot.t("replyForm.format.imageFile")}:
                        <input type="file" id="imageLoader" name="imageLoader" ref="imageLoader" onChange={this.handleImageLoad} />
                    </div>
                    <br /><br />
                    {imageField}
                </div>
            );
        } 
        /*else if(type == 'bbcode') {
            contentField = (
                <div>
                    {contentField}
                    <p>{polyglot.t("replyForm.format.bbcodeMsg")}</p>
                </div>
            )
        }*/

        // preview toggle
        // CSS for checkbox
        var cbClass = React.addons.classSet({
            'fa': true,
            'fa-fw': true,
            'fa-check-square-o': this.state.showPreview,
            'fa-square-o': !this.state.showPreview,
            'green': this.state.showPreview
        });
        var toggleStyle = {
            minWidth: '28%',
            marginRight: '2%',
            display: 'inline-block'
        }
        var previewToggle = (
            <span className="replyPreview" style={toggleStyle}>
                <i className={cbClass} onClick={this.handleTogglePreview} ></i>
                <a onClick={this.handleTogglePreview}>{polyglot.t("replyForm.preview")}</a>
            </span>
        );
        if (type == 'image') {
            previewToggle = (<span></span>); // no preview toggle for image
        }

        var errorField = "";
        if (this.state.err) errorField =  <span><em>{this.state.err}</em><br /></span>;

        var replyPrivacy = this.state.advancedOpt.replyPrivacy; 
        var replyPrivacyOption = (
            <span ref="replyPrivacy" className="icon" style={{display: 'block'}}>
                {polyglot.t("replyForm.advanced.replyPrivacy")}: 
                <span className="relative" style={{display: 'inline-block'}}>
                {Object.keys(privacyToIcon).map(function(p){
                    var color = replyPrivacy == p ? 'green' : 'black';
                    var handleClick = self.handlePickReplyPrivacy.bind(self, p);
                    return (
                        <span>
                            <button className={'btn ' + color} value={p} onClick={handleClick}><i className={"fa fa-fw "+privacyToIcon[p]}></i></button>
                            <Tooltip position="above" content={polyglot.t("replyForm.pOptions."+p)} />
                        </span>)
                })}
                </span>
            </span>
            );
        var licenseDefault = this.state.advancedOpt.contentLicense || "";
        var licenseOption = (
            <div>
                <span style={leftColStyle}>{polyglot.t("replyForm.advanced.contentLicense")}</span>
                <select style={rightColStyle} ref="contentLicense" className="btn" name="contentLicense" defaultValue={licenseDefault} onChange={this.handlePickAdvancedOpt}>
                    <option value=""></option>
                    <option value="CreativeCommonsAttribution">Creative Commons Attribution</option>
                    <option value="GNUPublicLicense">GNU Public License</option>
                    <option value="Publicdomain">Public domain</option>
                    <option value="Rights-managed">Rights-managed</option>
                    <option value="Royalty-free">Royalty-free</option>
                </select>
            </div>
            );
        var advancedStyle = {
            display: this.state.showAdvanced ? 'block' : 'none'
        }
        var chevronIcon = this.state.showAdvanced ? 'fa-chevron-circle-down' : 'fa-chevron-circle-left';
        var advancedField = (
            <div>
                <span>{polyglot.t("replyForm.advanced.title")}<a href="#" onClick={this.handleShowAdvanced}><i className={"fa fa-fw "+chevronIcon}></i></a></span><br/>
                <div style={advancedStyle}>
                    {replyPrivacyOption}
                    {licenseOption}
                </div>
            </div>
        );

        var className = privacy == 'public' ? "" : "encrypted"
        return (
            <div id="replyFormEmbed" className={className}>
                <div id="replyFormBox" style={relativeStyle}>
                    {sendToField}
                    {typeOption}
                    {privacyOption}
                    {contentField}
                    {expandButton}
                    {type == "bbcode" ? (<span>{polyglot.t("replyForm.format.bbcodeMsg")}<br/></span>) : ""}
                    {errorField}
                    {previewToggle}
                    {sendButton}
                    {advancedField}
                </div>
            </div>
        )
    }
});
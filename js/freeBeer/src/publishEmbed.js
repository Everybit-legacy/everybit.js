/** @jsx React.DOM */

    
var PuffPublishFormEmbed = React.createClass({
    getInitialState: function() {
        return {imageSrc    : '', 
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

        this.setState(puffworldprops.reply.state);
        this.preventDragText();
    },
    componentDidUpdate: function() {
        this.preventDragText();
    },
    componentWillUnmount: function() {
        // remove silly global
        globalReplyFormSubmitArg = null;
        return events.pub("", {'reply.content': ""})
    },
    handleSubmitSuccess: function(puff) {
        // clear the content
        // puffworldprops.reply.content = ''; // DON'T DO THIS
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
        events.pub('ui/flash', {'view.cursor': sig, 
                                'view.flash': true})
        // set back to initial state
        this.setState(this.getInitialState());
    },
    handleSubmit: function() {
        var self = this;
        var content = '';
        var metadata = {};
        
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

        var parents = this.props.reply.parents;
        if (content.length<CONFIG.minimumPuffLength) {
            alert("Not enough content");
            return false;
        }
        var routes = this.refs.usernames.getDOMNode().value;
        routes = routes.split(', ');
        metadata.routes = routes.filter(function(r){return r.length > 0});
        // TODO validate each routes
        
        events.pub('ui/reply/submit', {'reply': {parents: []}}); // get this out of the way early

        /*var replyPrivacy = this.refs.replyPrivacy.getDOMNode().value;
        if(replyPrivacy) {
            metadata.replyPrivacy = replyPrivacy;
        }*/
        
        var privacy = this.refs.privacy.getDOMNode().value;
        
        if(privacy == 'public') {
            var self=this;
            var post_prom = PuffForum.addPost( type, content, parents, metadata );

            post_prom
                .then(self.handleSubmitSuccess.bind(self))
                .catch(function(err) {
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
                
        var usernames = this.refs.usernames.getDOMNode().value.split(',')
                                                        .map(function(str) {return str.trim()})
                                                        .filter(Boolean)
        
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
            self.setState({err: err.message});
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
    handlePickType: function() {
        var type = this.refs.type.getDOMNode().value;
        var content = this.refs.content ? this.refs.content.getDOMNode().value : puffworldprops.reply.content;
        return events.pub('ui/reply/set-type', {'reply.type': type, 'reply.content': content});
    },
    handlePickPrivacy: function() {
        var privacy = this.refs.privacy.getDOMNode().value;
        /*if (privacy != "public") {
            this.getDOMNode().className = "encrypted";
        } else {
            this.getDOMNode().className = "";
        }*/
        return events.pub('ui/reply/set-privacy', {'reply.privacy': privacy});
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


    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var contentTypeNames = Object.keys(PuffForum.contentTypes);
        var privacyDefault = "public";
        var author = PuffWardrobe.getCurrentUsername();
        author = humanizeUsernames(author) || "anonymous";

        var defaultContent = puffworldprops.reply.content || '';
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
            var parentUsernames = parents.map(function(id) { return PuffForum.getPuffBySig(id) })
                                         .map(function(puff) { return puff.payload.replyTo || puff.username })
                                         .filter(function(item, index, array) { return array.indexOf(item) == index })
                                         .filter(Boolean)
                                         .join(', ')

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
        var usernames = this.props.reply.usernames || parentUsernames || "";

        var sendToSpanStyle = {
            width: '28%',
            marginRight: '2%',
            display: 'inline-block'
        }
        var sendToInputStyle = {
            display: 'inline-block',
            width: '70%',
            border: 'none',
            textAlign: 'left',
            marginBottom: '5px'
        }
        var sendToField = (
            <div>
                <span style={sendToSpanStyle}>Send to: </span><input className="btn" style={sendToInputStyle} type="text" name="usernames" ref="usernames" value={usernames} onChange={this.handleChangeUsernames} placeholder="everyone"></input>
            </div>
        );

        var typeStyle = {
            width: '28%',
            marginRight: '2%'
        }
        var typeOption = (
            <select className="btn" style={typeStyle} ref="type" value={type} disabled={this.state.showPreview} onChange={this.handlePickType} >
                {contentTypeNames.map(function(type) {
                    return <option key={type} value={type}>{type}</option>
                })}
            </select>
        );
        var privacyStyle = {
            width: '70%'
        };
        var privacyOption = (
            <select className="btn" style={privacyStyle} ref="privacy" 
                value={privacy} onChange={this.handlePickPrivacy}>
                <option key="public" value="public">{polyglot.t("replyForm.pOptions.public")}</option>
                <option key="private" value="private">{polyglot.t("replyForm.pOptions.private")}</option>
                <option key="anonymous" value="anonymous">{polyglot.t("replyForm.pOptions.anon")}</option>
                <option key="paranoid" value="paranoid">{polyglot.t("replyForm.pOptions.paranoid")}</option>
            </select>
        );

        var contentStyle = {
            width: (puffworldprops.reply.expand ? "400px" : '100%'),
            height: (type=="PGN" && this.state.showPreview) ? 'auto' : '200px',
            marginTop: '10px',
            marginBottom: '10px',
            border: '1px solid #333',
            display: 'block',
            background: '#FFFFFF'
        }
        var contentField = (
            <textarea id="content" ref="content" name="content" className="mousetrap" placeholder={polyglot.t('replyForm.textarea')} defaultValue={defaultContent} style={contentStyle}></textarea>
        );
        if (this.state.showPreview) {
            var currentType = this.props.reply.type || this.refs.type.getDOMNode().value;
            var currentContent = puffworldprops.reply.content;
            if (this.refs.content) {
                currentContent = this.refs.content.getDOMNode().value.trim();
                update_puffworldprops({'reply.content': currentContent})
                // DON'T MUTATE PROPS!
                // puffworldprops.reply.content = currentContent;
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

        var sendStyle = {
            minWidth: '60%',
            marginRight: '2%',
            display: 'inline-block'
        };
        var sendButton = (
            <a href="#" style={sendStyle}    onClick={this.handleSubmit}><i className="fa fa-paper-plane fa-fw"></i> Send as {author}</a>
        );

        var expandStyle = {
            position: 'relative',
            top: '-2em',
            float: 'right'
        };
        var expandButton = (
            <a href="#" style={expandStyle} onClick={this.handleExpand}><i className="fa fa-fw fa-expand"></i></a>
        );

        var boxStyle = {
            position: 'relative'
        }

        var errorField = "";
        if (this.state.err) errorField =  <span><em>{this.state.err}</em><br /></span>;

        var replyPrivacyDefault = this.state.advancedOpt.replyPrivacy || privacyDefault; 
        var replyPrivacyOption = (
            <div>
                Reply privacy level: <br />
                <select ref="replyPrivacy" className="btn" name="replyPrivacy" defaultValue={replyPrivacyDefault} onChange={this.handlePickAdvancedOpt}>
                <option key="public" value="public">{polyglot.t("replyForm.pOptions.public")}</option>
                <option key="private" value="private">{polyglot.t("replyForm.pOptions.private")}</option>
                <option key="anonymous" value="anonymous">{polyglot.t("replyForm.pOptions.anon")}</option>
                <option key="paranoid" value="paranoid">{polyglot.t("replyForm.pOptions.paranoid")}</option>
            </select>
                </div>
            );
        var licenseDefault = this.state.advancedOpt.contentLicense || "";
        var licenseOption = (
            <div>
                {polyglot.t("replyForm.format.contentLicense")}:
                <select ref="contentLicense" className="btn" name="contentLicense" defaultValue={licenseDefault} onChange={this.handlePickAdvancedOpt}>
                    <option value="CreativeCommonsAttribution">Creative Commons Attribution</option>
                    <option value="GNUPublicLicense">GNU Public License</option>
                    <option value="Publicdomain">Public domain</option>
                    <option value="Rights-managed">Rights-managed</option>
                    <option value="Royalty-free">Royalty-free</option>
                </select>
            </div>
            );
        var advancedField = (
            <div>
                <span>{polyglot.t("replyForm.advanced")}<a href="#" onClick={this.handleShowAdvanced}><i className="fa fa-fw fa-chevron-circle-left"></i></a></span>
            </div>
        );
        if (this.state.showAdvanced) {
            advancedField = (
                <div>
                <span>{polyglot.t("replyForm.advanced")}<a href="#" onClick={this.handleShowAdvanced}><i className="fa fa-fw fa-chevron-circle-down"></i></a></span><br/>
                {replyPrivacyOption}
                {licenseOption}
                </div>
            );
        }

        var className = privacy == 'public' ? "" : "encrypted"
        return (
            <div id="replyFormEmbed" className={className}>
                <div id="replyFormBox" style={boxStyle}>
                    {sendToField}
                    {typeOption}
                    {privacyOption}<br />
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
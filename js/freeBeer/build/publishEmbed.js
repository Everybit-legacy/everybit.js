/** @jsx React.DOM */

    
var PuffPublishFormEmbed = React.createClass({displayName: 'PuffPublishFormEmbed',
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
        var sendToInputStyle = {
            display: 'inline-block',
            width: '70%',
            border: 'none',
            textAlign: 'left',
            marginBottom: '5px'
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

        var sendToField = (
            React.DOM.div(null, 
                React.DOM.span( {style:leftColStyle}, polyglot.t("replyForm.sendTo"),": " ),React.DOM.input( {className:"btn", style:sendToInputStyle, type:"text", name:"usernames", ref:"usernames", value:usernames, onChange:this.handleChangeUsernames, placeholder:polyglot.t("replyForm.sendToPh")})
            )
        );

        var typeOption = (
            React.DOM.select( {className:"btn", style:typeStyle, ref:"type", value:type, disabled:this.state.showPreview, onChange:this.handlePickType} , 
                contentTypeNames.map(function(type) {
                    return React.DOM.option( {key:type, value:type}, type)
                })
            )
        );
        var privacyOption = (
            React.DOM.select( {className:"btn", style:rightColStyle, ref:"privacy", 
                value:privacy, onChange:this.handlePickPrivacy}, 
                React.DOM.option( {key:"public", value:"public"}, polyglot.t("replyForm.pOptions.public")),
                React.DOM.option( {key:"private", value:"private"}, polyglot.t("replyForm.pOptions.private")),
                React.DOM.option( {key:"anonymous", value:"anonymous"}, polyglot.t("replyForm.pOptions.anon")),
                React.DOM.option( {key:"paranoid", value:"paranoid"}, polyglot.t("replyForm.pOptions.paranoid"))
            )
        );

        
        var contentField = (
            React.DOM.textarea( {id:"content", ref:"content", name:"content", className:"mousetrap", placeholder:polyglot.t('replyForm.textareaPh'), defaultValue:defaultContent, style:contentStyle, onChange:this.updateContent})
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
                React.DOM.div(null, 
                    React.DOM.div( {style:contentStyle, id:"preview", ref:"preview", name:"preview", dangerouslySetInnerHTML:{__html: currentContent}})
                )
            )
        }
        // TODO: Did I hear someone say switch?
        // TODO: move this in to the content type handlers
        if(type == 'image') {
            // emply src will show no image icon in firefox
            var imageField = (React.DOM.img( {id:"preview_image"} ));
            if (this.state.imageSrc) {
                imageField = (React.DOM.img( {src:this.state.imageSrc, id:"preview_image"} ));
            }
            contentField = (
                React.DOM.div(null, 
                    React.DOM.div( {className:"menuItem"}, 
                        polyglot.t("replyForm.format.imageFile"),":",
                        React.DOM.input( {type:"file", id:"imageLoader", name:"imageLoader", ref:"imageLoader", onChange:this.handleImageLoad} )
                    ),
                    React.DOM.br(null ),React.DOM.br(null ),
                    imageField
                )
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
            React.DOM.span( {className:"replyPreview", style:toggleStyle}, 
                React.DOM.i( {className:cbClass, onClick:this.handleTogglePreview} ),
                React.DOM.a( {onClick:this.handleTogglePreview}, polyglot.t("replyForm.preview"))
            )
        );
        if (type == 'image') {
            previewToggle = (React.DOM.span(null)); // no preview toggle for image
        }

        var sendStyle = {
            minWidth: '60%',
            marginRight: '2%',
            display: 'inline-block'
        };
        var sendButton = (
            React.DOM.a( {href:"#", style:sendStyle,    onClick:this.handleSubmit}, React.DOM.i( {className:"fa fa-paper-plane fa-fw"}), " ", polyglot.t("replyForm.send", {author: author}))
        );

        var expandStyle = {
            position: 'relative',
            top: '-2em',
            float: 'right'
        };
        var expandButton = (
            React.DOM.a( {href:"#", style:expandStyle, onClick:this.handleExpand}, React.DOM.i( {className:"fa fa-fw fa-expand"}))
        );

        var boxStyle = {
            position: 'relative'
        }

        var errorField = "";
        if (this.state.err) errorField =  React.DOM.span(null, React.DOM.em(null, this.state.err),React.DOM.br(null ));

        var replyPrivacyDefault = this.state.advancedOpt.replyPrivacy || privacyDefault; 
        var replyPrivacyOption = (
            React.DOM.div(null, 
                React.DOM.span( {style:leftColStyle}, polyglot.t("replyForm.advanced.replyPrivacy")),
                React.DOM.select( {style:rightColStyle, ref:"replyPrivacy", className:"btn", name:"replyPrivacy", defaultValue:replyPrivacyDefault, onChange:this.handlePickAdvancedOpt}, 
                React.DOM.option( {key:"public", value:"public"}, polyglot.t("replyForm.pOptions.public")),
                React.DOM.option( {key:"private", value:"private"}, polyglot.t("replyForm.pOptions.private")),
                React.DOM.option( {key:"anonymous", value:"anonymous"}, polyglot.t("replyForm.pOptions.anon")),
                React.DOM.option( {key:"paranoid", value:"paranoid"}, polyglot.t("replyForm.pOptions.paranoid"))
            )
                )
            );
        var licenseDefault = this.state.advancedOpt.contentLicense || "";
        var licenseOption = (
            React.DOM.div(null, 
                React.DOM.span( {style:leftColStyle}, polyglot.t("replyForm.advanced.contentLicense")),
                React.DOM.select( {style:rightColStyle, ref:"contentLicense", className:"btn", name:"contentLicense", defaultValue:licenseDefault, onChange:this.handlePickAdvancedOpt}, 
                    React.DOM.option( {value:"CreativeCommonsAttribution"}, "Creative Commons Attribution"),
                    React.DOM.option( {value:"GNUPublicLicense"}, "GNU Public License"),
                    React.DOM.option( {value:"Publicdomain"}, "Public domain"),
                    React.DOM.option( {value:"Rights-managed"}, "Rights-managed"),
                    React.DOM.option( {value:"Royalty-free"}, "Royalty-free")
                )
            )
            );
        var advancedField = (
            React.DOM.div(null, 
                React.DOM.span(null, polyglot.t("replyForm.advanced.title"),React.DOM.a( {href:"#", onClick:this.handleShowAdvanced}, React.DOM.i( {className:"fa fa-fw fa-chevron-circle-left"})))
            )
        );
        if (this.state.showAdvanced) {
            advancedField = (
                React.DOM.div(null, 
                React.DOM.span(null, polyglot.t("replyForm.advanced.title"),React.DOM.a( {href:"#", onClick:this.handleShowAdvanced}, React.DOM.i( {className:"fa fa-fw fa-chevron-circle-down"}))),React.DOM.br(null),
                replyPrivacyOption,
                licenseOption
                )
            );
        }

        var className = privacy == 'public' ? "" : "encrypted"
        return (
            React.DOM.div( {id:"replyFormEmbed", className:className}, 
                React.DOM.div( {id:"replyFormBox", style:boxStyle}, 
                    sendToField,
                    typeOption,
                    privacyOption,React.DOM.br(null ),
                    contentField,
                    expandButton,
                    type == "bbcode" ? (React.DOM.span(null, polyglot.t("replyForm.format.bbcodeMsg"),React.DOM.br(null))) : "",
                    errorField,
                    previewToggle,
                    sendButton,
                    advancedField
                )
            )
        )
    }
});
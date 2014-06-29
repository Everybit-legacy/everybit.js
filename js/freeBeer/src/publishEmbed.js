/** @jsx React.DOM */

var PuffPublishFormEmbed = React.createClass({
    getInitialState: function() {
        return {imageSrc: '', showPreview: false};
    },
    componentDidMount: function() {
        // set silly global this is very very dumb
        globalReplyFormSubmitArg = this.handleSubmit.bind(this);

        var replyForm_el = this.getDOMNode();
        draggableize(replyForm_el);
        
        if(this.refs.content) {
            var content_el = this.refs.content.getDOMNode();
            // if(content_el.focus)
                // content_el.focus();
        }

        var content = document.getElementById("content");
        if (content) {
            content.addEventListener("mousedown", function(e){e.stopPropagation()}, false);
        }

    },
    componentDidUpdate: function() {
        var replyForm_el = this.getDOMNode();
        draggableize(replyForm_el);

        var content = document.getElementById("content");
        if (content) {
            content.addEventListener("mousedown", function(e){e.stopPropagation()}, false);
        }
        // MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    },
    componentWillUnmount: function() {
        // remove silly global
        globalReplyFormSubmitArg = null;
        puffworldprops.reply.preview = false;
    },

    handleSubmit: function() {
        var content = '';
        var metadata = {};
        
        var type = this.props.reply.type || this.refs.type.getDOMNode().value;
        if(!type) return false

        // TODO: allow the content type handler to dictate this part (pass all refs and props and state?)
        if(type == 'image') {
            content = this.state.imageSrc;
            metadata.license = this.refs.imageLicense.getDOMNode().value;
        } else {
            content = this.refs.content ? this.refs.content.getDOMNode().value.trim() : this.props.content ;
        }

        if(type == 'PGN') {
            metadata.quote = true;
        }

        var parents = this.props.reply.parents;
        if (content.length<CONFIG.minimumPuffLength) {
            alert("Not enough content");
            return false;
        }
        
        events.pub('ui/reply/submit', {'reply': {show: false, parents: []}}); // get this out of the way early
        
        var privacy = this.refs.privacy.getDOMNode().value
        
        if(privacy == 'public') {
            PuffForum.addPost( type, content, parents, metadata );
            return false;
        } 
        
        
        // ok. we're definitely sending an encrypted message now.
        
        
        
        // TODO: always get the user records before you send this out
        // TODO: if anon or paranoid create a new anon user doing this
        // TODO: by default include parent in the reply [add to ui box?]
        // TODO: but respect the replyTo payload field: add it at the expense of parent [add to ui box?]
        // TODO: if paranoid create a second new anon user as your replyTo
        
        var prom = Promise.resolve() // a promise we use to string everything along 
        
        // are we anonymous? make a new user.
        var envelopeUserKeys = ''
        if(privacy == 'anonymous' || privacy == 'paranoid' || !PuffWardrobe.getCurrentUsername()) {
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
            
            return PuffForum.addPost( type, content, parents, metadata, userRecords, envelopeUserKeys );
        })
        
        return false;
    },
    handleCancel: function() {
        // THINK: save the content in case they accidentally closed?
        return events.pub('ui/reply/cancel', {'reply': {show: false, parents: []}});
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
        return events.pub('ui/reply/set-type', {'reply.type': type});
    },
    handleTogglePreview: function() {
        puffworldprops.reply.preview = !this.state.showPreview;
        this.setState({showPreview: !this.state.showPreview});
    },
    handleChangeUsernames: function() {
        var usernames = this.refs.usernames.getDOMNode().value;
        return events.pub('ui/reply/set-usernames', {'reply.usernames': usernames});
    },


    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var contentTypeNames = Object.keys(PuffForum.contentTypes);
        var privacyDefault = "public";
        var author = PuffWardrobe.getCurrentUsername();
        author = humanizeUsernames(author) || "anonymous";

        var defaultContent = this.props.content || '';
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
        var usernames = this.props.reply.usernames || parentUsernames || "";

        var sendToSpanStyle = {
            marginRight: '2%',
            display: 'inline-block'
        }
        var sendToInputStyle = {
            display: 'inline-block',
            border: '1px solid #333333',
            marginBottom: '5px'
        }
        var sendToField = (
            <div>
                <span style={sendToSpanStyle}>Send to: </span><input style={sendToInputStyle} type="text" name="usernames" ref="usernames" value={usernames} onChange={this.handleChangeUsernames} placeholder="everyone"></input>
            </div>
        );

        var tyleStyle = {
            width: '28%',
            marginRight: '2%'
        }
        var typeOption = (
            <select style={tyleStyle} ref="type" className="btn" defaultValue={type} disabled={this.state.showPreview} onChange={this.handlePickType} >
                {contentTypeNames.map(function(type) {
                    return <option key={type} value={type}>{type}</option>
                })}
            </select>
        );
        var privacyStyle = {
            width: '70%'
        };
        var privacyOption = (
            <select style={privacyStyle} ref="privacy" className="btn" defaultValue={privacyDefault}>
                <option key="public" value="public">{polyglot.t("replyForm.pOptions.public")}</option>
                <option key="private" value="private">{polyglot.t("replyForm.pOptions.private")}</option>
                <option key="anonymous" value="anonymous">{polyglot.t("replyForm.pOptions.anon")}</option>
                <option key="paranoid" value="paranoid">{polyglot.t("replyForm.pOptions.paranoid")}</option>
            </select>
        );

        var contentStyle = {
            width: '100%',
            // height: (type=="PGN" && this.state.showPreview) ? '100%' : '20em',
            height: '200px',
            marginTop: '10px',
            border: '1px solid #333'
        }
        var contentField = (
            <textarea id="content" ref="content" name="content" className="mousetrap" placeholder={polyglot.t('replyForm.textarea')} defaultValue={defaultContent} style={contentStyle}></textarea>
        );
        if (this.state.showPreview) {
            var currentType = this.props.reply.type || this.refs.type.getDOMNode().value;
            var currentContent = this.refs.content.getDOMNode().value.trim();
            this.props.content = currentContent;
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
                    <div className="menuItem">{polyglot.t("replyForm.format.imageLicense")}:
                        <select id="imageLicense" name="imageLicense" ref="imageLicense">
                            <option value="Creative Commons Attribution">Creative Commons Attribution</option>
                            <option value="GNU Public License">GNU Public License</option>
                            <option value="Public domain">Public domain</option>
                            <option value="Rights-managed">Rights-managed</option>
                            <option value="Royalty-free">Royalty-free</option>
                        </select>
                    </div>
                    <br />
                    {imageField}
                </div>
            );
        } else if(type == 'bbcode') {
            contentField = (
                <div>
                    {contentField}
                    <p>{polyglot.t("replyForm.format.bbcodeMsg")}</p>
                </div>
            )
        }

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

        var discardStyle = {
            minWidth: '23%',
            marginRight: '2%',
            display: 'inline-block'
        };
        var discardButton = (
            <a href="#" style={discardStyle} onClick={this.handleCancel}><i className="fa fa-trash-o"></i> Discard</a>
        );
        var sendStyle = {
            marginTop: '10px',
            display: 'inline-block'
        };
        var sendButton = (
            <a href="#" style={sendStyle}    onClick={this.handleSubmit}><i className="fa fa-paper-plane fa-fw"></i> Send as {author}</a>
        );

        var formStyle = {
            textAlign: 'left'
        }
        var boxStyle = {
            position: 'relative'
        }

        return (
            <div id="replyFormEmbed" style={formStyle}>
                <div id="replyFormBox" style={boxStyle}>
                    {sendToField}
                    {typeOption}
                    {privacyOption}<br />
                    {contentField}<br/>
                    {previewToggle}
                    {sendButton}
                </div>
            </div>
        )
    }
});
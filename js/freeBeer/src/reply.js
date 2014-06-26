/** @jsx React.DOM */

var PuffReplyForm = React.createClass({
    componentDidMount: function() {
        // set silly global this is very very dumb
        globalReplyFormSubmitArg = this.handleSubmit.bind(this);

        var replyForm_el = this.getDOMNode();
        draggableize(replyForm_el);
        
        if(this.refs.content) {
            var content_el = this.refs.content.getDOMNode();
            if(content_el.focus)
                content_el.focus();
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
        MathJax.Hub.Queue(["Typeset",MathJax.Hub]);
    },
    componentWillUnmount: function() {
        // remove silly global
        globalReplyFormSubmitArg = null;
        puffworldprops.reply.preview = false;
    },
    getInitialState: function() {
        return {imageSrc: '', showPreview: false};
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
        
        if(privacy == 'public')
            return PuffForum.addPost( type, content, parents, metadata );
        
        // ok. we're definitely sending an encrypted message now.
        
        
        
        // TODO: always get the user records before you send this out
        // TODO: if anon or paranoid create a new anon user doing this
        // TODO: by default include parent in the reply [add to ui box?]
        // TODO: but respect the replyTo payload field: add it at the expense of parent [add to ui box?]
        // TODO: if paranoid create a second new anon user as your replyTo
        
        var prom = Promise.resolve() // a promise we use to string everything along 
        
        // are we anonymous? make a new user.
        if(privacy == 'anonymous' || privacy == 'paranoid' || !PuffWardrobe.getCurrentUsername()) {
            prom = prom.then(function() {
                return PuffWardrobe.addNewAnonUser().then(function(userRecord) {
                    PuffWardrobe.switchCurrent(userRecord.username)
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
                
        var usernames = this.refs.usernames.getDOMNode().value.split(',').map(function(str) {return str.trim()})
                                                        .concat(PuffWardrobe.getCurrentUsername()).filter(Boolean)
        
        var userRecords = usernames.map(PuffData.getCachedUserRecord).filter(Boolean)
        var userRecordUsernames = userRecords.map(function(userRecord) {return userRecord.username})
        
        // if we haven't cached all the users, we'll need to grab them first
        // THINK: maybe convert this to using Puffball.getUserRecords instead
        if(userRecords.length < usernames.length) {
            usernames.forEach(function(username) {
                if(!~userRecordUsernames.indexOf(username)) {
                    prom = prom.then(function() {
                        return Puffball.getUserRecordNoCache(username).then(function(userRecord) {
                            userRecords.push(userRecord)
                        })
                    })
                }
            })
        }
        
        prom.then(function() {
            PuffForum.addPost( type, content, parents, metadata, userRecords );
        })
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
    handleCancel: function() {
        // THINK: save the content in case they accidentally closed?
        return events.pub('ui/reply/cancel', {'reply': {show: false, parents: []}});
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
        var username = PuffWardrobe.getCurrentUsername() // make this a prop or something
        username = humanizeUsernames(username) || 'anonymous';
        puffworldprops.reply.preview = this.state.showPreview;
        
        // var userList = ['dann', 'mattasher', 'freebeer'];

        var contentTypeNames = Object.keys(PuffForum.contentTypes)

        if (typeof this.props.reply.parents != 'undefined') {
            var parents = this.props.reply.parents;
        } else {
            var parents = [];
        }

        var privacyDefault = "public";

        var defaultContent = this.props.content || '';
        if(parents.length) {
            var parent = PuffForum.getPuffBySig(parents[0]);
            var parentType = parent.payload.type;

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

        } else {
            var parentType = CONFIG.defaultContentType;
        }
        var type = this.props.reply.type || parentType;

        var usernames = this.props.reply.usernames || parentUsernames || ""

        var polyglot = Translate.language[puffworldprops.view.language];
        var divStyle = {
            width: '22em',
            textAlign: 'left',
            height: (type == 'PGN' && this.state.showPreview ? '100%' : '15em'),
            margin: 'auto',
            overflow: 'auto',
            marginBottom: '5px',
            background: '#fff'
        }
        var typeFields = (
            <div>
                <textarea id="content" ref="content" name="content" className="mousetrap" rows="10" cols="40" style={divStyle} placeholder={polyglot.t('replyForm.textarea')} defaultValue={defaultContent}></textarea>
            </div>
            )
        if (this.state.showPreview) {
            var type = this.props.reply.type || this.refs.type.getDOMNode().value;
            var content = this.refs.content.getDOMNode().value.trim();
            this.props.content = content;
            content = PuffForum.processContent(type, content, {});
            typeFields = (
                <div style={divStyle}>
                    <div id="preview" ref="preview" name="preview" dangerouslySetInnerHTML={{__html: content}}></div>
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
        var previewToggle = (
            <span className="replyPreview">
                <i className={cbClass} onClick={this.handleTogglePreview} ></i>
                <a onClick={this.handleTogglePreview}>{polyglot.t("replyForm.preview")}</a>
            </span>
            );

        // TODO: Did I hear someone say switch?
        // TODO: move this in to the content type handlers
        if(type == 'image') {
            // emply src will show no image icon in firefox
            var imageField = (<img id="preview_image" />);
            if (this.state.imageSrc) {
                imageField = (<img src={this.state.imageSrc} id="preview_image" />);
            }

            typeFields = (
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
            previewToggle = (<span></span>);
        }
        else if(type == 'bbcode') {
            typeFields = (
                <div>
                    {typeFields}
                    <p>{polyglot.t("replyForm.format.bbcodeMsg")}</p>
                </div>
                )
        }
        else if(type=='PGN') {

        }

        
        return (
            <div id="replyForm">
                <div id="replyFormBox">
                    <div id="authorDiv">{username}</div>
                    <form id="otherContentForm" onSubmit={this.handleSubmit}>

                        {typeFields}
                        <a href="#" onClick={this.handleCancel} className="floatLeft"><i className="fa fa-trash-o"></i> {polyglot.t("replyForm.cancel")}!</a>
                        <select disabled={this.state.showPreview} ref="type" className="btn" onChange={this.handlePickType} defaultValue={parentType}>
                            {contentTypeNames.map(function(type) {
                                return <option key={type} value={type}>{type}</option>
                            })}
                        </select>{previewToggle}
                        {' '}<a href="#" onClick={this.handleSubmit} className="floatRight"><i className="fa fa-paper-plane"></i> {polyglot.t("replyForm.submit")}!</a>
                        
                        <div>
                            <p>
                                {polyglot.t("replyForm.privacyOption")}:
                                <select ref="privacy" className="btn" defaultValue={privacyDefault}>
                                    <option key="public" value="public">{polyglot.t("replyForm.pOptions.public")}</option>
                                    <option key="private" value="private">{polyglot.t("replyForm.pOptions.private")}</option>
                                    <option key="anon" value="anon">{polyglot.t("replyForm.pOptions.anon")}</option>
                                    <option key="paranoid" value="paranoid">{polyglot.t("replyForm.pOptions.paranoid")}</option>
                                </select>
                            </p>
                            
                            <p>
                                <label>
                                    {polyglot.t("replyForm.sendTo")}:
                                    <input type="text" name="usernames" ref="usernames" value={usernames} onChange={this.handleChangeUsernames}></input>
                                </label>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
            );
    }
    
    /*
    {userList.map(function(user) {
        return (
            <p><label>
                <input type="checkbox" defaultChecked="checked" ref="users" name="users" id={'user-'+user} />
                {user}
            </label></p>
        )
    })}
    */
});
/** @jsx React.DOM */

var MetaInputContent = React.createClass({
    getInitialState: function() {
        return {
            array: [],
            msg: ""
        }
    },
    cleanUp: function() {
        this.setState(this.getInitialState());
        switch (this.props.fieldInfo.type) {
            case "array":
                this.refs.item.getDOMNode().value = "";
                break;
            default:
                var defaultValue = this.props.fieldInfo.defaultValue || "";
                if (typeof defaultValue == "function") {
                    defaultValue = defaultValue();
                }
                this.refs.content.getDOMNode().value = defaultValue;
                break;
        }
    },
    fillIn: function(content) {
        switch (this.props.fieldInfo.type) {
            case "array":
                this.setState({array: content});
                break;
            default:
                this.refs.content.getDOMNode().value = content;
                break;
        }
    },
    getValue: function() {
        var type = this.props.fieldInfo.type;
        var content = "";
        switch (type) {
            case "array":
                content = this.state.array;
                break;
            default:
                content = this.refs.content.getDOMNode().value;
                break;
        }
        return content;
    },
    validateInput: function(value) {
        if (value.length == '') return true;

        var valid = true;
        if (this.props.fieldInfo.validator) {
            valid = this.props.fieldInfo.validator(value);
        }
        if (!valid) {
            this.setState({msg: 'Invalid input.'});
        }

        return valid;
    },
    removeItem: function(value) {
        var self = this;
        var array = PB.shallow_copy(self.state.array);
        array = array.filter(function(v){return v != value});
        this.setState({array: array});
        return false;
    },
    addItem: function() {
        var value = this.refs.item.getDOMNode().value;
        var valid = true;
        if (this.props.fieldInfo.validator) {
            valid = this.props.fieldInfo.validator(value);
        }
        if (!valid) {
            this.setState({msg: 'Invalid input.'});
            return false;
        }
        var self = this;
        var array = PB.shallow_copy(self.state.array);
        if (array.indexOf(value) == -1) {
            array.push(value);
        }
        this.setState({array: array, msg:''});
        this.refs.item.getDOMNode().value = "";
        return false;
    },
    handleArrayKeyDown: function(e) {
        if (e.keyCode == 13) {
            this.addItem();
        }
    },
    handleInputChange: function(e) {
        var value = e.target.value;
        this.setState({msg: ''})
        return this.validateInput(value);
    },
    render: function() {
        var type = this.props.fieldInfo.type;

        var defaultValue = this.props.fieldInfo.defaultValue || "";
        if (typeof defaultValue == 'function')
            defaultValue = defaultValue();

        var contentStyle = {width: '100%', border: '1px solid'};
        var field = <input ref="content" type="text" className="btn" placeholder="content" style={contentStyle} defaultValue={defaultValue} onChange={this.handleInputChange}/>;
        var self = this;
        switch (type) {
            case "textarea":
                field = <textarea ref="content" className="btn" placeholder="content" style={contentStyle}/>
                break;
            case "pulldown":
                field = 
                    <select ref="content" className="btn" defaultValue={defaultValue} style={contentStyle}>
                        {self.props.fieldInfo.enum.map(function(v){
                            return <option key={v} value={v}>{v}</option>
                        })}
                    </select>;
                break;
            case "array":
                var inputStyle = PB.shallow_copy(contentStyle);
                inputStyle.width = "90%"
                var newItemInput = <input ref="item" type="text" className="btn" placeholder="new item" style={inputStyle} onKeyDown={this.handleArrayKeyDown} onChange={this.handleInputChange}/>;
                field = 
                    <div>
                        {self.state.array.map(function(value){
                            return (
                                <span key={value} className='bubbleNode'>
                                    {value}
                                    <a href="#" onClick={self.removeItem.bind(self, value)}>
                                        <i className="fa fa-times-circle-o fa-fw"></i>
                                    </a>
                                </span>
                            )
                        })}{self.state.array.length ? <br/> : ""}
                        {newItemInput}
                        <a href="#" onClick={self.addItem}><i className="fa fa-fw fa-plus-circle"></i></a>
                    </div>
                break;
            default:
                break;
        }
        return <span>{field}<span className="red">{this.state.msg}</span></span>;
    }
})

var MetaInput = React.createClass({
    getInitialState: function() {
        return {msg: '', show: true};
    },
    fillIn: function(key, content) {
        if (!this.state.show) return false;
        var keyDiv = this.refs.key.getDOMNode();
        if (keyDiv.tagName.toLowerCase() == "input" && key.length) {keyDiv.value = key};

        var contentComponent = this.refs.content;
        if (content.length) {contentComponent.fillIn(content)};
    },
    getKeyContentPair: function() {
        if (!this.state.show) return false;

        var key = this.refs.key.getDOMNode();
        if (key.tagName.toLowerCase() == "input") {key = key.value;}
        else {key = key.innerHTML;}
        var content = this.refs.content.getValue();
        var fail = this.refs.key.getDOMNode().style.border.indexOf('red') != -1;

        return {key: key, content: content, fail: fail};
    },
    handleCheckKey: function(e) {
        var key = e.target.value;
        if (key.length == 0) return;
        key = key.toLowerCase();
        key = StringConversion.toLowerCamelCase(key);
        if (!/^[a-z0-9]+$/i.test(key) || key.length > 255) {
            e.target.style.border = "1px solid red";
            this.setState({msg: "Key must be alphanumeric with max length of 255."})
        } else {
            e.target.style.border = "";
            this.setState({msg: ""})
        }
    },
    handleEditKey: function(e) {
        if (e.target.style.border) e.target.style.border = "";
        if (this.state.msg.length > 0) this.setState({msg: ''});
    },
    deleteSelf: function() {
        this.setState({show: false});
        return false;
    },
    cleanUp: function() {
        if (!this.state.show) return false;
        var keyNode = this.refs.key.getDOMNode();
        if (keyNode.tagName.toLowerCase() == 'input' && !keyNode.attributes.readOnly)
            keyNode.value = "";
        this.refs.content.cleanUp();
    },
    render: function() {
        if (!this.state.show) return <span></span>

        var contentStyle = {width: '100%', border: '1px solid'};
        var keyStyle = {marginRight: '5%', float: 'left', minWidth: '25%'};
        var key = this.props.metaKey;
        var keyField = <input ref="key" type="text" className="btn" placeholder="key" size="6" style={keyStyle} onChange={this.handleCheckKey}/>
        var type = this.props.type || 'text';

        var contentField = <MetaInputContent ref="content" fieldInfo={{type: type}}/>

        if (key) {
            var fieldInfo = PuffForum.metaFields.filter(function(f){return f.name == key});
            if (fieldInfo && fieldInfo.length) {
                fieldInfo = fieldInfo[0];
                keyField = <label ref="key" style={keyStyle}>{key}</label>
                contentField = <MetaInputContent ref="content" fieldInfo={fieldInfo} />
            } 
        }
        return (
            <div className="metaInput">
                {keyField}{' '}<span style={{display: 'block', overflow: 'hidden', paddingRight: '5%'}}>{contentField}</span>
                <span className="red">{this.state.msg}</span>
            </div>
        )
    }
})

var MetaFields = React.createClass({
    getInitialState: function() {
        return {
            profileMsg: '',
            public: true,
            imageSrc: '',
            additionRows: ['text'],
            deletedRows: 0,
            msg: ''
        }
    },
    handleAddNewRow: function(type) {
        type = type || 'text'
        var row = PB.shallow_copy(this.state.additionRows);
        if (row.length - this.state.deletedRows < 5) {
            row.push(type)
            this.setState({additionRows: row})
        } else {
            this.setState({msg: "Overlimit"})
        }
        return false;
    },
    handleCleanFields: function() {
        var refs = this.refs;

        for (var r in refs) {
            var component = refs[r];
            if (component && component.cleanUp) {
                component.cleanUp();
            }
        }
        this.setState({additionRows: ['text']})
        return false;
    },
    handleDeleteRow: function(rowRef, e) {
        if (this.refs[rowRef])
            this.refs[rowRef].deleteSelf();
        var target = e.target;
        target.parentNode.removeChild(target);
        var deletedRows = this.state.deletedRows+1;
        this.setState({deletedRows: deletedRows})
        return false;
    },
    getAllFields: function(fieldRequired) {
        var metadata = {};
        var refs = this.refs;

        fieldRequired = fieldRequired || false;
        var valid = !fieldRequired;

        for (var r in refs) {
            var component = refs[r];
            if (component) {
                var keyContentPair = component.getKeyContentPair();
                if (!keyContentPair) continue;
                var fail = keyContentPair.fail;
                if (fail) {
                    return {'FAIL': true, 'msg': "Please fix invalid fields."};
                }
                var key = keyContentPair.key;
                var content = keyContentPair.content;
                if (key && key.length>0 && content && content.length>0) {
                    key = StringConversion.toLowerCamelCase(key);
                    if (key == 'parents' || key == 'time') {
                        var msg = "Key reserved: " + key;
                        return {'FAIL': true, 'msg': msg};
                    }
                    if (typeof metadata[key] !== 'undefined') {
                        var msg = "Please fix dulplicate fields: " + key;
                        return {'FAIL': true, 'msg': msg};
                    }
                    metadata[key] = content;
                    valid = true;
                }
            }
        }
        if (!valid) {
            return {'FAIL':true, 'msg': "Must set at least one field."}
        }
        return metadata;
    },
    fillIn: function(meta) {
        if (meta) {
            this.setState({additionRows: []});
            var metaKeys = Object.keys(meta);
            for (var i=0; i<metaKeys.length; i++) {
                var key = metaKeys[i];
                if (this.refs[key]) {
                    this.refs[key].fillIn("", meta[key]);
                } else {
                    var reserved = ['parents', 'content', 'time', 'type'];
                    if (reserved.indexOf(key) != -1) continue;

                    var content = meta[key];
                    if (!content.length) continue;

                    var type = Array.isArray(content) ? 'array' : 'text';
                    this.handleAddNewRow(type);

                    var n = this.state.additionRows.length-1;
                    this.refs["row"+n].fillIn(key, meta[key]);
                }
            }
        }
    },
    render: function() {
        var type = this.props.type;
        var defaultFields = PuffForum.context[type] || [];
        var rows = [];
        var self = this;
        var deleteRowStyle = {
            position: 'absolute',
            right: '0'
        }
        for (var i=0; i<this.state.additionRows.length; i++) {
            var type = this.state.additionRows[i];
            var ref = "row"+i;
            rows.push(
                <span key={ref}>
                    <a href="#" style={deleteRowStyle} onClick={self.handleDeleteRow.bind(self, ref)}>X</a><MetaInput key={ref} ref={ref} type={type} />
                </span>
            );
        }

        var addNewText = <input type="button" className="btn" onClick={this.handleAddNewRow.bind(this, 'text')} value="Add text" style={{minWidth: '30%', marginRight: '3%', float: 'left'}}/>

        var addNewTextarea = <input type="button" className="btn" onClick={this.handleAddNewRow.bind(this, 'textarea')} value="Add textarea" style={{minWidth: '30%', marginRight: '3%', float: 'left'}}/>

        var addNewArray = <input type="button" className="btn" onClick={this.handleAddNewRow.bind(this, 'array')} value="Add array" style={{minWidth: '30%', marginRight: '3%', float: 'left'}}/>
        
        return (
            <div>
                {defaultFields.map(function(key){
                    var ref = StringConversion.toLowerCamelCase(key)
                    return <MetaInput key={ref} metaKey={key} ref={ref} />
                })}
                {rows}
                {addNewText}{addNewTextarea}{addNewArray}
            </div>
        )
    }
})

var PuffPublishFormEmbed = React.createClass({
    getInitialState: function() {
        return {imageSrc    : '',
                usernames   : [],
                parentUsernames: [],
                usernameErr : '',
                showPreview : false, 
                err         : false,
                showAdvanced: false,
                meta: {}};
    },
    componentDidMount: function() {
        // set silly global this is very very dumb
        // globalReplyFormSubmitArg = this.handleSubmit.bind(this);
        globalReplyFormSubmitArg = this.handleSubmit;

        // auto focus
        if(this.refs.content) {
            var contentDiv = this.refs.content.getDOMNode();
            if (puffworldprops.menu.section == "publish") {
                contentDiv.focus();
                // move cursor to the end
                if (typeof contentDiv.selectionStart == "number") {
                    contentDiv.selectionStart = contentDiv.selectionEnd = contentDiv.value.length;
                }
            }
        }
        if (puffworldprops.reply.state)
            this.setState(puffworldprops.reply.state);
        this.getRecipientUsernames();

        var privacyNode = this.refs.privacy.getDOMNode();
        var buttons = privacyNode.getElementsByTagName('button');
        for (var i=0; i<buttons.length; i++) {
            var button = buttons[i];
            button.onclick = this.handlePickPrivacy.bind(this, button.value);
        }

        if (this.props.showAdvanced) {
            this.setState({showAdvanced: true})
        }
    },
    componentDidUpdate: function(prevProp) {
        if (prevProp.reply.parents != this.props.reply.parents)
            this.getRecipientUsernames();

        if (prevProp.reply.state.meta != this.props.reply.state.meta) {
            this.setState({showAdvanced: true, 
                           imageSrc: this.props.reply.state.imageSrc})
            this.refs.meta.fillIn(this.props.reply.state.meta);
        }
    },
    componentWillUnmount: function() {
        // remove silly global
        globalReplyFormSubmitArg = null;

        var content = this.refs.content ? this.refs.content.getDOMNode().value.trim() : puffworldprops.reply.content;
        var state = this.state;
        update_puffworldprops({'reply.content': content, 'reply.state': state});
        return false;
    },
    cleanUpSubmit: function(){
        var className = this.refs.send.getDOMNode().className;
        className = className.replace(' deactive', '');
        this.refs.send.getDOMNode().className = className;
    },
    handleSubmitSuccess: function(puff) {
        this.cleanUpSubmit();
        this.refs.meta.handleCleanFields();
        // clear the content
        update_puffworldprops({'reply.content': ''})
        
        if (this.refs.content) this.refs.content.getDOMNode().value = '';

        // go to the puff
        var sig = puff.sig;
        if (typeof puff.payload.parents == 'undefined') {
            var decrypted = PuffForum.extractLetterFromEnvelopeByVirtueOfDecryption(puff);
            sig = decrypted.sig;
        }
        showPuff(sig);
        events.pub('ui/submit/success', 
                   { 'reply.parents': [],
                     'reply.lastType': puffworldprops.reply.type,
                     'view.cursor': sig, 
                     'view.flash': true,
                     'view.filters': {}  });
        // set back to initial state
        this.setState(this.getInitialState());
    },
    handleSubmit: function() {
        if (this.refs.send.getDOMNode().className.indexOf('deactive') != -1)
            return false;
        this.refs.send.getDOMNode().className += " deactive";

        var type = this.props.reply.type || this.refs.type.getDOMNode().value;
        if(!type) {
            this.cleanUpSubmit();
            return false
        }

        var metadata = this.refs.meta.getAllFields(type == 'profile') || {};
        if (metadata['FAIL'] === true) {
            this.setState({'err': metadata.msg});
            return false;
        }
        if (type == 'profile') {
            return this.handleSubmitProfile(metadata);
        }

        var self = this;
        var content = '';
        var parents = this.props.reply.parents;

        if (type != 'image') this.setState({'showPreview': false});
        // TODO: allow the content type handler to dictate this part (pass all refs and props and state?)
        if(type == 'image') {
            content = this.state.imageSrc;
        } else {
            content = this.refs.content ? this.refs.content.getDOMNode().value.trim() : puffworldprops.reply.content;
        }
        if (content.length < CONFIG.minimumPuffLength) {
            alert("Not enough content.");
            this.cleanUpSubmit();
            return false;
        }
        if(type == 'PGN') {
            metadata.quote = true;
        }

        metadata.routes = this.state.usernames;
        
        var privacy = this.refs.privacy.getDOMNode().querySelector("button.green").value;

        if(privacy == 'public') {
            var self=this;
            var post_prom = PuffForum.addPost( type, content, parents, metadata );

            post_prom
                .then(self.handleSubmitSuccess.bind(self))
                .catch(function(err) {
                    self.cleanUpSubmit();
                    // console.log(err);
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
    handleDiscard: function() {
        var type = this.refs.type.getDOMNode().value;
        this.refs.meta.handleCleanFields();
        
        if (type == 'image' || type == 'profile') {
            this.setState({imageSrc: ''});
            this.refs.imageLoader.getDOMNode().value = '';
            return false;
        } else {
            this.refs.content.getDOMNode().value = "";
            return events.pub("ui/reply/clear-content", {'reply.content': ''});
        }
    },

    /* functions for type = profile */
    handleUpdateProfile: function(puff){
        var self = this;
        var currentKeys = PuffWardrobe.getCurrentKeys();
        var oldProfile = PuffWardrobe.getCurrentUserRecord().profile;
        var type = 'updateUserRecord';
        var content = "setProfile";
        var payload = {};
        payload.profile = puff.sig;

        var update_puff = Puffball.buildPuff(currentKeys.username, currentKeys.admin, [], type, content, payload);

        var update_prom = PuffNet.updateUserRecord(update_puff);
        update_prom.then(function(userRecord){
            self.setState({msg: 'Success!'});
            showPuff(userRecord.profile);
            self.refs.meta.handleCleanFields();

            if (oldProfile) {
                var prom = PuffForum.flagPuff(oldProfile);
                prom.then(function() {
                    console.log('Old Profile flagged');
                })
            }
        }).catch(function(err){
            self.setState({msg: "Error."});
            console.log('error', err);
        });
    },
    handleSubmitProfile: function(metadata) {
        if (!this.state.imageSrc) {
            this.setState({err: "Profile image required."})
            return false;
        }
        metadata = metadata || {};

        // build puff
        var content = this.state.imageSrc;
        var type = 'profile';
        var self = this
        var privacy = this.refs.privacy.getDOMNode().querySelector("button.green").value;

        if (privacy) {
            // publish public profile
            var post_prom = PuffForum.addPost( type, content, [], metadata);
            post_prom
                    .then(function(puff){
                        self.cleanUpSubmit();
                        self.refs.meta.handleCleanFields();
                        self.handleUpdateProfile(puff);
                        var sig = puff.sig;
                    })
                    .catch(Puffball.promiseError('Posting failed'));    
        } else {
            // publish private profile
            var prom = Promise.resolve();
            var currentUserRecord = PuffWardrobe.getCurrentUserRecord();
            var userRecords = [];
            userRecords.push(currentUserRecord);
            var post_prom = PuffForum.addPost( type, content, [], metadata, userRecords );
            post_prom
                    .then(function(puff){
                        self.cleanUpSubmit();
                        self.refs.meta.handleCleanFields();
                        self.handleUpdateProfile(puff);
                    })
                    .catch(Puffball.promiseError("Posting failed"));
        }

        return false;
    },

    /* tabs */
    handleContentTab: function() {
        return this.setState({showPreview: false});
    },
    handlePreviewTab: function() {
        var type = this.refs.type.getDOMNode().value;
        if (type == 'image') {
            return false;
        }
        return this.setState({showPreview: true});
    },
    /* 
    handleZipLoad: function() {
        var self = this;
        var file = this.refs.zipLoader.getDOMNode().files[0];
        var fileListDiv = this.refs.zipFileList.getDOMNode();
        var reader = new FileReader();
        reader.onload = function(event) {
            self.state.zipSrc = event.target.result;
            console.log(event.target.result)
            return events.pub("ui/reply/zip-upload");
        }
        reader.readAsDataURL(file);

        zip.createReader(new zip.BlobReader(file), function(reader){
            reader.getEntries(function(entries){
                if (entries.length){
                    var entryArr = entries.map(function(e){
                            var name = e.filename.split('/');
                            name.splice(0, 1)
                            name = name.join('/');
                            return name;
                        });
                    entryArr = entryArr.sort().filter(Boolean);
                    fileListDiv.innerHTML = entryArr.join('<br>');
                }
            }, function(error){
                console.log(error)
            })
        })
        return false;
    },
    */
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
        var newUsername = StringConversion.toActualUsername(usernameNode.value);
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
        value = StringConversion.toActualUsername(value);
        var currentUsernames = this.state.usernames;
        currentUsernames = currentUsernames.filter(function(u){return u != value});
        this.setState({usernames: currentUsernames});
        return false;
    },
    handleSendtoInput: function(e) {
        if (e.keyCode == 13) {
            this.addUsername();
        } else {
            this.setState({usernameError: ''});
        }
    },
    handlePickType: function() {
        var type = this.refs.type.getDOMNode().value;
        var content = this.refs.content ? this.refs.content.getDOMNode().value : puffworldprops.reply.content;
        this.setState({parentType: false});
        return events.pub('ui/reply/set-type', {'reply.type': type, 'reply.content': content});
    },
    handlePickPrivacy: function(privacy) {
        return events.pub('ui/reply/set-privacy', {'reply.privacy': privacy});
    },
    handleTogglePreview: function() {
        this.setState({showPreview: !this.state.showPreview});
    },
    /*
    handleChangeUsernames: function() {
        var usernames = this.refs.usernames.getDOMNode().value;
        return events.pub('ui/reply/set-usernames', {'reply.usernames': usernames});
    },*/
    handleShowAdvanced: function() {
        this.setState({showAdvanced: !this.state.showAdvanced});
        return false;
    },
    getRecipientUsernames: function() {
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
    updateContent: function() {
        var content = this.refs.content.getDOMNode().value;
        update_puffworldprops({'reply.content': content});
        return false;
    },
    render: function() {
        /* variables, default value */
        var polyglot = Translate.language[puffworldprops.view.language];
        var contentTypeNames = Object.keys(PuffForum.contentTypes);
        var privacyDefault = this.props.reply.privacy || "public";
        /*var author = PuffWardrobe.getCurrentUsername();
        author = StringConversion.humanizeUsernames(author) || "anonymous";*/

        var defaultContent = puffworldprops.reply.content || '';
        var parents = [];
        if (typeof this.props.reply.parents != 'undefined') {
            parents = this.props.reply.parents;
        }
        if(parents.length) {
            var parent = PuffForum.getPuffBySig(parents[0]);
            // type = parent.payload.type;

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
        var contentStyle = {
            width: '100%',
            height: (type=="PGN" && this.state.showPreview) ? 'auto' : '200px',
            overflowY: "auto",
            cursor: this.state.showPreview ? "default" : "auto", 
            marginBottom: '10px',
            border: '1px solid #333',
            display: 'block',
            background: '#FFFFFF'
        }

        /* components */
        var sendButton = (
            <span className="linkTab">
            <a href="#" ref="send" onClick={this.handleSubmit}><i className="fa fa-paper-plane fa-fw"></i> {polyglot.t("replyForm.send")}</a>
            </span>
        );
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
        var recipients = this.state.usernames.map(StringConversion.toDisplayUsername);
        var sendToField = (
            <div>
                <span style={leftColStyle}>{polyglot.t("replyForm.recipient")}: </span>
                {recipients.map(function(value){
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

        var type = this.props.reply.type || this.props.reply.lastType || CONFIG.defaultContentType;
        var typeOption = (
            <select className="btn" ref="type" value={type} disabled={this.state.showPreview} onChange={this.handlePickType} >
                {contentTypeNames.map(function(type) {
                    return <option key={type} value={type}>{type}</option>
                })}
            </select>
        );
        var discardBtn = (
            <a onClick={this.handleDiscard} href="#">Discard</a>
        );
        var privacyToIcon = {
            'public': 'fa-bullhorn',
            'private': 'fa-lock',
            'anonymous': 'fa-barcode',
            'paranoid': 'fa-circle-thin'
        } 
        var supportedPrivacy = Object.keys(privacyToIcon);
        if (type == 'profile')
            supportedPrivacy = ['public', 'private'];
        var privacyOption = (
            <span ref="privacy" id="privacyDiv" className="icon">
                {polyglot.t("replyForm.privacyOption")}: <span className="relative" style={{width: '150px', display: 'inline-block'}}>
                {supportedPrivacy.map(function(p){
                    var color = privacyDefault == p ? 'green' : 'black';
                    return (
                        <span key={p}>
                            <button className={'btn ' + color} value={p}><i className={"fa fa-fw "+privacyToIcon[p]}></i></button>
                            <Tooltip position="above" content={polyglot.t("replyForm.pOptions."+p)} />
                        </span>)
                })}</span>
            </span>
        );

        var contentField = (
            <textarea id="content" ref="content" name="content" className="mousetrap" placeholder={polyglot.t('replyForm.textareaPh')} defaultValue={defaultContent} style={contentStyle} onChange={this.updateContent} />
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
                <div style={contentStyle} id="preview" ref="preview" name="preview" dangerouslySetInnerHTML={{__html: currentContent}}></div>
            )
        }
        // TODO: Did I hear someone say switch?
        // TODO: move this in to the content type handlers
        if (type == 'image' || type == 'profile') {
            // emply src will show no image icon in firefox
            var imageField = (<img id="preview_image" width="100%" height="1px"/>);
            if (this.state.imageSrc) {
                imageField = (<img src={this.state.imageSrc} id="preview_image" />);
            }
            contentField = (
                <div>
                    <div style={{marginLeft: '10px'}}>
                        <div style={{display: 'inline-block'}}>{polyglot.t("replyForm.format." + type+'File')}:
                        <input type="file" id="imageLoader" name="imageLoader" ref="imageLoader" onChange={this.handleImageLoad}/></div>
                    </div>
                    <br />{imageField}
                </div>
            );
        }

        // tabs
        /* content | preview |   send to */
        var contentTab = (
            <span className={this.state.showPreview ? "linkTab" : "linkTabHighlighted"} onClick={this.handleContentTab}>
                Content
            </span>
        );
        var previewTab = (
            <span className={this.state.showPreview ? "linkTabHighlighted" : "linkTab"} onClick={this.handlePreviewTab}>
                Preview
            </span>
        );
        if (type == 'image' || type == 'profile') previewTab = <span></span>;

        var errorField = "";
        if (this.state.err) errorField =  <span className="red" style={{fontWeight: 'bold'}}>{this.state.err}<br /></span>;

        /*
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
        */
       
        var advancedStyle = {
            display: this.state.showAdvanced ? 'block' : 'none'
        }
        var chevronIcon = this.state.showAdvanced ? 'fa-chevron-circle-down' : 'fa-chevron-circle-left';
        var advancedField = (
            <div>
                <span>{polyglot.t("replyForm.advanced.title")}<a href="#" onClick={this.handleShowAdvanced}><i className={"fa fa-fw "+chevronIcon}></i></a></span><br/>
                <div style={{display: this.state.showAdvanced ? 'block' : 'none'}}>
                    {sendToField}
                    {privacyOption}
                    <MetaFields  ref="meta" type={type} />
                </div>
            </div>
        );

        var className = privacyDefault == 'public' ? "replyFormEmbed" : "replyFormEmbed encrypted"
        return (
            <div className={className}>
                <div className='replyFormBox relative'>
                    {contentTab}{previewTab} {sendButton}
                    {contentField}
                    {type == "bbcode" ? (<span>{polyglot.t("replyForm.format.bbcodeMsg")}<br/></span>) : ""}
                    {errorField}
                    Type: {typeOption}{' '}{this.state.showPreview ? "" : discardBtn}
                    {advancedField}
                </div>
            </div>
        )
    }
});
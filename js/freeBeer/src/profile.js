/** @jsx React.DOM */

var ProfileInput = React.createClass({
	getInitialState: function() {
		return {msg: ''};
	},
	handleCheckKey: function(e) {
		var key = e.target.value;
		if (key.length < 0) return;
		key = key.toLowerCase();
		var reducedKey = reduceUsernameToAlphanumeric(key);
		if (reducedKey != key || key.length > 255) {
			e.target.style.border = "1px solid red";
			this.setState({msg: "Key must be alphanumeric with max length of 255."})
		} else if (reducedKey == 'type') {
			e.target.style.border = "1px solid red";
			this.setState({msg: "'type' has been reserved."})
		} else {
			e.target.style.border = "";
			this.setState({msg: ""})
		}
	},
	handleEditKey: function(e) {
		if (e.target.style.border) e.target.style.border = "";
		if (this.state.msg.length > 0) this.setState({msg: ''});
	},
	render: function() {
		var key = this.props.metaKey;
		var keyField = <input type="text" className="btn" placeholder="key" size="6" style={{marginRight: '5%', float: 'left'}} onChange={this.handleCheckKey}/>
		if (key)
			keyField = <input type="text" className="btn" value={key} readOnly size="6" style={{marginRight: '5%', float: 'left'}} />

		var contentField = <input type="text" className="btn" placeholder="content" style={{width:"100%"}}/>
		return (
			<div className="profileInput">
				{keyField}{' '}<span style={{display: 'block', overflow: 'hidden', paddingRight: '5%'}}>{contentField}</span>
				<span className="red">{this.state.msg}</span>
			</div>
		)
	}
})

var ProfileDisplay = React.createClass({
	render: function() {
		/*var username = PuffWardrobe.getCurrentUsername();
		if (!username) return <span></span>;

		var profiles = PuffData.Persist.get('profile') || {};
		var profileSig = profiles[username];
		if (!profile) return <span></span>;*/
		var profileSig = this.props.sig;

		var profilePuff = PuffForum.getPuffBySig(profileSig);
		var image = profilePuff.payload.content;
		var metadata = profilePuff.payload;

		return (
			<div>
				<img src={image} />
				{Object.keys(metadata).filter(function(k){return k!='type'&&k!='content'})
									  .map(function(k){
									  	if (metadata[key])
									  		return <div>{k}:{' '}{metadata[k]}</div>
									  })}
			</div>
		)
	}
})

var ProfileForm = React.createClass({
	getInitialState: function() {
		return {
			profilePuff: false,
			public: true,
			imageSrc: '',
			additionRows: 1,
			msg: ''
		}
	},
	handleImageLoad: function() {
		var self=this;
		var reader = new FileReader();
		reader.onload = function(event) {
			self.state.imageSrc = event.target.result;
			return events.pub('ui/profile/image-upload');
		}
        reader.readAsDataURL(this.refs.imageLoader.getDOMNode().files[0]);
		return false;
	},
	handleAddNewRow: function() {
		var row = this.state.additionRows;
		if (row < 5) {
			this.setState({additionRows: row+1})
		} else {
			this.setState({msg: "Overlimit"})
		}
		return false;
	},
	handlePickPrivacy: function(public){
		public = public || false;
		this.setState({public: public});
		return false;
	},
	handleUpdateProfile: function(puff){
		var self = this;
		var currentKeys = PuffWardrobe.getCurrentKeys();
		var type = 'updateUserRecord';
		var content = "setProfile";
		var payload = {};
		payload.profile = puff.sig;

		var update_puff = Puffball.buildPuff(currentKeys.username, currentKeys.admin, [], type, content, payload);

		var update_prom = PuffNet.updateUserRecord(update_puff);
		update_prom.then(function(userRecord){
			return PuffNet.getUserRecord(userRecord.username);
		}).then(function(userRecord){
			self.setState({msg: 'Success!'});
			console.log(userRecord);
		}).catch(function(err){
			self.setState({msg: "Error."});
			console.log('error', err);
		});
	},
	handleSubmit: function() {
		if (!this.state.imageSrc) {
			this.setState({msg: "Profile image required."})
			return false;
		}
		var rows = this.getDOMNode().getElementsByClassName('profileInput');
		var metadata = {};
		var valid = false;
		for (var i=0; i<rows.length; i++) {
			var row = rows[i];
			var fields = row.getElementsByTagName('input');
			var key = fields[0].value;
			var content = fields[1].value;
			if (fields[0].style.border.indexOf('red') != -1) {
				this.setState({msg: "Please fix invalid fields."});
				return false;
			}
			if (key && key.length>0 && content && content.length>0) {
				if (typeof metadata[key] !== 'undefined') {
					this.setState({msg: "Please fix dulplicate fields: " + key});
					return false;
				}
				metadata[key] = content;
				valid = true;
			}
		}
		if (!valid) {
			this.setState({msg: "Must set at least one field."})
			return false;
		}

		// build puff
		var content = this.state.imageSrc;
		var type = 'profile';
		var self = this;

		if (this.state.public) {
			// publish public profile
			var post_prom = PuffForum.addPost( type, content, [], metadata);
	        post_prom
		            .then(function(puff){
		            	self.handleUpdateProfile(puff);
		            	var sig = puff.sig;
				        self.setState({profilePuff: sig});
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
		            	self.handleUpdateProfile(puff);
			    		var decryptedPuff = PuffForum.extractLetterFromEnvelopeByVirtueOfDecryption(puff);
			    		var sig = decryptedPuff.sig;
				        self.setState({profilePuff: sig});
			    	})
			    	.catch(Puffball.promiseError("Posting failed"));
	    }

		return false;
	},
	render: function() {
		if (this.state.profilePuff) {
			return <span>Success</span>
		}

		var imageField = (
			<div>
				Profile image<span className="red">*</span>: 
				<input type="file" className="btn" ref="imageLoader" onChange={this.handleImageLoad} />
				<br/>
				<img src={this.state.imageSrc} ref="imagePreview" />
			</div>
		)

		var defaultRows = ['name', 'email', 'url', 'bio'];
		var rows = [];
		for (var i=0; i<this.state.additionRows; i++)
			rows.push(<ProfileInput />)

		var addNewBtn = <input type="button" className="btn" onClick={this.handleAddNewRow} value="Add new row" style={{minWidth: '45%', marginRight:'5%'}}/>
		var submitBtn = <input type="button" className="btn" onClick={this.handleSubmit} value="Submit" style={{minWidth: '45%', marginRight:'5%'}} />
        var privacyOption = (
            <div ref="privacy" className="icon">
            	Privacy: 
            	<span key={'public'}>
            		<button className={this.state.public ? "btn green" : "btn gray"} value="public" onClick={this.handlePickPrivacy.bind(this, true)}><i className="fa fa-fw fa-bullhorn"></i></button>
            	</span>
            	<span key={'private'}>
            		<button className={this.state.public ? "btn gray" : "btn green"} value="private" onClick={this.handlePickPrivacy.bind(this, false)}><i className="fa fa-fw fa-lock"></i></button>
            	</span>
            </div>
        );
		return (
			<div className="menuItem">
				{imageField}
				{defaultRows.map(function(key){
					return <ProfileInput metaKey={key} />
				})}
				{rows}
				{privacyOption}
				{addNewBtn}{submitBtn}
				<span className="red">{this.state.msg}</span>
			</div>
		)
	}
})
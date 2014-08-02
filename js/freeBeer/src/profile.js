/** @jsx React.DOM */

var ProfileInput = React.createClass({
	getInitialState: function() {
		return {msg: ''};
	},
	handleCheckKey: function(e) {
		var key = e.target.value;
		if (key.length < 0) return;
		key = key.toLowerCase();
		if (reduceUsernameToAlphanumeric(key) != key || key.length > 255) {
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

var ProfileForm = React.createClass({
	getInitialState: function() {
		return {
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
	handleSubmit: function() {
		var rows = this.getDOMNode().getElementsByClassName('profileInput');
		var metadata = {};
		var valid = false;
		for (var i=0; i<rows.length; i++) {
			var row = rows[i];
			var fields = row.getElementsByTagName('input');
			var key = fields[0].value;
			var content = fields[1].value;
			if (reduceUsernameToAlphanumeric(key) != key || key.length > 255) {
				this.setState({msg: "Please fix invalid fields."});
				return false;
			}
			if (key && key.length>0 && content && content.length>0) {
				metadata[key] = content;
				valid = true;
			}
		}
		if (!valid) {
			this.setState({msg: "Must set at least one field."})
			return false;
		}

		metadata.imgSrc = this.state.imgSrc;
		// build puff
		/*var type = 'profile';
		var self = this;
		var userprom = PuffWardrobe.getUpToDateUserAtAnyCost();
		var takeUserMakePuff = PuffForum.partiallyApplyPuffMaker(type, content, [], metadata, []);*/

		
		// publish puff
		console.log(metadata);
		return false;
	},
	render: function() {
		var imageField = (
			<div>
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
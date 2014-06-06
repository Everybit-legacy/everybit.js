/** @jsx React.DOM */

var PuffReplyForm = React.createClass({
    handleSubmit: function() {
        var type = this.props.reply.type;
        var content = '';
        var metadata = {};

        // THINK: allow the content type itself to dictate this part (pass all refs and props and state?)
        if(type == 'image') {
            content = this.state.imageSrc;
            metadata.license = this.refs.imageLicense.getDOMNode().value;
        } else {
            content = this.refs.content.getDOMNode().value.trim();
        }

        var parents = this.props.reply.parents;
        if (content.length<1) {
            var errorMSG = "Cannot send empty puff!"
            alert(errorMSG)
            return false;
        }
        PuffForum.addPost( type, content, parents, metadata );

        return events.pub('ui/reply/submit', {'reply': {show: false, parents: []}});
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
    componentDidMount: function() {
        var replyForm = document.getElementById('replyForm');
        draggableize(replyForm);
        // $('#replyForm').eq(0).draggable();
        // $("#replyForm [name='content']").focus();
    },
    componentDidUpdate: function() {
        var replyForm = document.getElementById('replyForm');
        draggableize(replyForm);
        // $('#replyForm').eq(0).draggable();
    },
    getInitialState: function() {
        return {imageSrc: ''};
    },
    render: function() {
        var username = PuffWardrobe.getCurrentUsername() // make this a prop or something
        var username = humanizeUsernames(username) || 'anonymous'

        var contentTypeNames = Object.keys(PuffForum.contentTypes)

        var type = this.props.reply.type
        var typeFields = (
            <div>
                <textarea id="content" ref="content" name="content" rows="15" cols="50" placeholder="Add your content here. Click on the reply buttons of other puffs to reply to these."></textarea>
            </div>
            )

        if(type == 'image') {
            typeFields = (
                <div>
                    <p>
                        <label htmlFor="imageLoader">Image File:</label>
                        <input type="file" id="imageLoader" name="imageLoader" ref="imageLoader" onChange={this.handleImageLoad} />
                    </p>
                    <p>
                        <label htmlFor="imageLicense">Image License:</label>
                        <select id="imageLicense" name="imageLicense" ref="imageLicense">
                            <option value="Creative Commons Attribution">Creative Commons Attribution</option>
                            <option value="GNU Public License">GNU Public License</option>
                            <option value="Public domain">Public domain</option>
                            <option value="Rights-managed">Rights-managed</option>
                            <option value="Royalty-free">Royalty-free</option>
                        </select>
                    </p>
                    <img src={this.state.imageSrc} id="preview_image" />
                </div>
                )
        }
        else if(type == 'bbcode') {
            typeFields = (
                <div>
                    {typeFields}
                    <p>You can use BBCode-style tags</p>
                </div>
                )
        }
        
        return (
            <div id="replyForm" className="mainForm">
                <div id="replyFormBox">
                    <div id="authorDiv">{username}</div>
                    <form id="otherContentForm" onSubmit={this.handleSubmit}>
                        
                        {typeFields}

                        <select ref="type" className="btn" onChange={this.handlePickType}>
                            {contentTypeNames.map(function(type) {
                                return <option key={type} value={type}>{type}</option>
                            })}
                        </select>

                        <input id="cancelreply" className="btn" type="reset" value="cancel" onClick={this.handleCancel}/>
                        <input type="submit" className="btn" value="GO!" />
                    </form>
                </div>
            </div>
            );
    }
});

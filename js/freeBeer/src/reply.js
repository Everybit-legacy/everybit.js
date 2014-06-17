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
    },
    componentWillUnmount: function() {
        // remove silly global
        globalReplyFormSubmitArg = null;
    },
    getInitialState: function() {
        return {imageSrc: ''};
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
            content = this.refs.content.getDOMNode().value.trim();
        }

        if(type == 'PGN') {
            metadata.quote = true;
        }

        var parents = this.props.reply.parents;
        if (content.length<CONFIG.minimumPuffLength) {
            alert("Not enough content");
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
    render: function() {
        var username = PuffWardrobe.getCurrentUsername() // make this a prop or something
        username = humanizeUsernames(username) || 'anonymous';

        var contentTypeNames = Object.keys(PuffForum.contentTypes)




        if (typeof this.props.reply.parents != 'undefined') {
            var parents = this.props.reply.parents;
        } else {
            var parents = [];
        }

        var defaultContent = '';
        if(parents.length) {
            var parentType = PuffForum.getPuffById(parents[0]).payload.type;

            // Should we quote the parent
            if (typeof PuffForum.getPuffById(parents[0]).payload.quote != 'undefined') {
                if(PuffForum.getPuffById(parents[0]).payload.quote) {
                    defaultContent = PuffForum.getPuffById(parents[0]).payload.content;
                }
            }

        } else {
            var parentType = CONFIG.defaultContentType;
        }
        var type = this.props.reply.type || parentType;

        var polyglot = Translate.language[puffworldprops.view.language];
        var typeFields = (
            <div>
                <textarea id="content" ref="content" name="content" className="mousetrap" rows="10" cols="40" placeholder={polyglot.t('replyForm.textarea')} defaultValue={defaultContent}></textarea>
            </div>
            )

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

            )
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
                        <select ref="type" className="btn" onChange={this.handlePickType} defaultValue={parentType}>
                            {contentTypeNames.map(function(type) {
                                return <option key={type} value={type}>{type}</option>
                            })}
                        </select>

                        {' '}<a href="#" onClick={this.handleSubmit} className="floatRight"><i className="fa fa-paper-plane"></i> {polyglot.t("replyForm.submit")}!</a>

                    </form>
                </div>
            </div>
            );
    }
});
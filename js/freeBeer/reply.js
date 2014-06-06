/** @jsx React.DOM */

var PuffReplyForm = React.createClass({displayName: 'PuffReplyForm',
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
            var errorMSG = "Cannot send empty Puff!"
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
            React.DOM.div(null, 
                React.DOM.textarea( {id:"content", ref:"content", name:"content", rows:"15", cols:"50", placeholder:"Add your content here. Click on the reply buttons of other puffs to reply to these."})
            )
            )

        if(type == 'image') {
            typeFields = (
                React.DOM.div(null, 
                    React.DOM.p(null, 
                        React.DOM.label( {htmlFor:"imageLoader"}, "Image File:"),
                        React.DOM.input( {type:"file", id:"imageLoader", name:"imageLoader", ref:"imageLoader", onChange:this.handleImageLoad} )
                    ),
                    React.DOM.p(null, 
                        React.DOM.label( {htmlFor:"imageLicense"}, "Image License:"),
                        React.DOM.select( {id:"imageLicense", name:"imageLicense", ref:"imageLicense"}, 
                            React.DOM.option( {value:"Creative Commons Attribution"}, "Creative Commons Attribution"),
                            React.DOM.option( {value:"GNU Public License"}, "GNU Public License"),
                            React.DOM.option( {value:"Public domain"}, "Public domain"),
                            React.DOM.option( {value:"Rights-managed"}, "Rights-managed"),
                            React.DOM.option( {value:"Royalty-free"}, "Royalty-free")
                        )
                    ),
                    React.DOM.img( {src:this.state.imageSrc, id:"preview_image"} )
                )
                )
        }
        else if(type == 'bbcode') {
            typeFields = (
                React.DOM.div(null, 
                    typeFields,
                    React.DOM.p(null, "You can use BBCode-style tags")
                )
                )
        }
        
        return (
            React.DOM.div( {id:"replyForm", className:"mainForm"}, 
                React.DOM.div( {id:"replyFormBox"}, 
                    React.DOM.div( {id:"authorDiv"}, username),
                    React.DOM.form( {id:"otherContentForm", onSubmit:this.handleSubmit}, 
                        
                        typeFields,

                        React.DOM.select( {ref:"type", className:"btn", onChange:this.handlePickType}, 
                            contentTypeNames.map(function(type) {
                                return React.DOM.option( {key:type, value:type}, type)
                            })
                        ),

                        React.DOM.input( {id:"cancelreply", className:"btn", type:"reset", value:"cancel", onClick:this.handleCancel}),
                        React.DOM.input( {type:"submit", className:"btn", value:"GO!"} )
                    )
                )
            )
            );
    }
});

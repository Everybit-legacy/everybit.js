/** @jsx React.DOM */

var PuffReplyForm = React.createClass({displayName: 'PuffReplyForm',
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
    },
    componentDidUpdate: function() {
        var replyForm_el = this.getDOMNode();
        draggableize(replyForm_el);
    },
    componentWillUnmount: function() {
        // remove silly global
        globalReplyFormSubmitArg = null;
    },
    getInitialState: function() {
        return {imageSrc: ''};
    },
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

        var type = this.props.reply.type;



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


        var typeFields = (
            React.DOM.div(null, 
                React.DOM.textarea( {id:"content", ref:"content", name:"content", className:"mousetrap", rows:"13", cols:"50", placeholder:"Add your content here. Click on the reply buttons of other puffs to reply to these.", defaultValue:defaultContent})
            )
            )

        // TODO: Did I hear someone say switch?
        if(type == 'image' || parentType == 'image') {
            typeFields = (
                React.DOM.div(null, 
                    React.DOM.div( {className:"menuItem"}, 
                        "Image File:",
                        React.DOM.input( {type:"file", id:"imageLoader", name:"imageLoader", ref:"imageLoader", onChange:this.handleImageLoad} )
                    ),
                    React.DOM.br(null ),React.DOM.br(null ),
                    React.DOM.div( {className:"menuItem"}, "Image License:",
                        React.DOM.select( {id:"imageLicense", name:"imageLicense", ref:"imageLicense"}, 
                            React.DOM.option( {value:"Creative Commons Attribution"}, "Creative Commons Attribution"),
                            React.DOM.option( {value:"GNU Public License"}, "GNU Public License"),
                            React.DOM.option( {value:"Public domain"}, "Public domain"),
                            React.DOM.option( {value:"Rights-managed"}, "Rights-managed"),
                            React.DOM.option( {value:"Royalty-free"}, "Royalty-free")
                        )
                    ),
                    React.DOM.br(null ),
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
        else if(type=='PGN') {

        }

        
        return (
            React.DOM.div( {id:"replyForm"}, 
                React.DOM.div( {id:"replyFormBox"}, 
                    React.DOM.div( {id:"authorDiv"}, username),
                    React.DOM.form( {id:"otherContentForm", onSubmit:this.handleSubmit}, 

                        typeFields,
                        React.DOM.a( {href:"#", onClick:this.handleCancel, className:"floatLeft"}, React.DOM.i( {className:"fa fa-trash-o"}), " NO!"),
                        React.DOM.select( {ref:"type", className:"btn", onChange:this.handlePickType, defaultValue:parentType}, 
                            contentTypeNames.map(function(type) {
                                return React.DOM.option( {key:type, value:type}, type)
                            })
                        ),

                        ' ',React.DOM.a( {href:"#", onClick:this.handleSubmit, className:"floatRight"}, React.DOM.i( {className:"fa fa-paper-plane"}), " GO!")

                    )
                )
            )
            );
    }
});

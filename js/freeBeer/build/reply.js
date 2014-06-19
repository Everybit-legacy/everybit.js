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
        
        var privacy = this.refs.privacy.getDOMNode().value
        // var users = this.refs.users.getDOMNode().value
        // users = ["anon.rps6d8d0ex", "anon.p563pdn4z2", "anon.oz4ujo3cfx"]
        // users = users.map(PuffData.getCachedUserRecord)
        var sendToUsers = this.refs.usernames.getDOMNode().value.split(',').map(function(str) {return str.trim()})
        var users = sendToUsers.concat(PuffWardrobe.getCurrentUsername()).map(PuffData.getCachedUserRecord).filter(Boolean)
        
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
        
        if(privacy == 'public') {
            PuffForum.addPost( type, content, parents, metadata );
        } else {
            PuffForum.addPost( type, content, parents, metadata, users );
        }

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

        // var userList = ['dann', 'mattasher', 'freebeer'];

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
            React.DOM.div(null, 
                React.DOM.textarea( {id:"content", ref:"content", name:"content", className:"mousetrap", rows:"10", cols:"40", placeholder:polyglot.t('replyForm.textarea'), defaultValue:defaultContent})
            )
            )

        // TODO: Did I hear someone say switch?
        // TODO: move this in to the content type handlers
        if(type == 'image') {
            // emply src will show no image icon in firefox
            var imageField = (React.DOM.img( {id:"preview_image"} ));
            if (this.state.imageSrc) {
                imageField = (React.DOM.img( {src:this.state.imageSrc, id:"preview_image"} ));
            }

            typeFields = (
                React.DOM.div(null, 
                    React.DOM.div( {className:"menuItem"}, 
                        polyglot.t("replyForm.format.imageFile"),":",
                        React.DOM.input( {type:"file", id:"imageLoader", name:"imageLoader", ref:"imageLoader", onChange:this.handleImageLoad} )
                    ),
                    React.DOM.br(null ),React.DOM.br(null ),
                    React.DOM.div( {className:"menuItem"}, polyglot.t("replyForm.format.imageLicense"),":",
                        React.DOM.select( {id:"imageLicense", name:"imageLicense", ref:"imageLicense"}, 
                            React.DOM.option( {value:"Creative Commons Attribution"}, "Creative Commons Attribution"),
                            React.DOM.option( {value:"GNU Public License"}, "GNU Public License"),
                            React.DOM.option( {value:"Public domain"}, "Public domain"),
                            React.DOM.option( {value:"Rights-managed"}, "Rights-managed"),
                            React.DOM.option( {value:"Royalty-free"}, "Royalty-free")
                        )
                    ),
                    React.DOM.br(null ),
                    imageField
                )

            )
        }
        else if(type == 'bbcode') {
            typeFields = (
                React.DOM.div(null, 
                    typeFields,
                    React.DOM.p(null, polyglot.t("replyForm.format.bbcodeMsg"))
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
                        React.DOM.a( {href:"#", onClick:this.handleCancel, className:"floatLeft"}, React.DOM.i( {className:"fa fa-trash-o"}), " ", polyglot.t("replyForm.cancel"),"!"),
                        React.DOM.select( {ref:"type", className:"btn", onChange:this.handlePickType, defaultValue:parentType}, 
                            contentTypeNames.map(function(type) {
                                return React.DOM.option( {key:type, value:type}, type)
                            })
                        ),

                        ' ',React.DOM.a( {href:"#", onClick:this.handleSubmit, className:"floatRight"}, React.DOM.i( {className:"fa fa-paper-plane"}), " ", polyglot.t("replyForm.submit"),"!"),
                        
                        React.DOM.div(null, 
                            React.DOM.p(null, 
                                "Privacy options:",
                                React.DOM.select( {ref:"privacy", className:"btn", defaultValue:"public"}, 
                                    React.DOM.option( {key:"public", value:"public"}, "Public (everyone can see this)"),
                                    React.DOM.option( {key:"private", value:"private"}, "Private (content is encrypted)"),
                                    React.DOM.option( {key:"anon", value:"anon"}, "Anonymous (encrypted and anonymous)"),
                                    React.DOM.option( {key:"paranoid", value:"paranoid"}, "Paranoid (regenerate anon user each time)")
                                )
                            ),
                            
                            React.DOM.p(null, 
                                React.DOM.label(null, 
                                    "Send to user:",
                                    React.DOM.input( {type:"text", name:"usernames", ref:"usernames"})
                                )
                            )
                        )
                    )
                )
            )
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
/** @jsx React.DOM */


globalCreateFancyPuffBox = function(puffplus) {
    var puff = puffplus.puff
    var className = puffplus.className
    var stats = puffplus
    return PuffFancyBox( {puff:puff, key:puff.sig, extraClassy:className, stats:stats} )
}

var PuffFancyBox = React.createClass({displayName: 'PuffFancyBox',
    render: function() {
        var puff = this.props.puff
        var className = 'block ' + (this.props.extraClassy || '')
        var style = {}
        var stats = this.props.stats
        var mode = stats.mode
        var width = stats.width
        var height = stats.height
        var top = stats.y
        var left = stats.x + CONFIG.leftMargin
        
        var offset = 30
        if(mode == 'arrows') {
            width  -= offset
            height -= offset
            top  += offset/2
            left += offset/2
        }

        var spacing = 3
        if(mode != 'arrows') {
            width  -= spacing
            height -= spacing
            top  += spacing
            left += spacing
        }
        
        if(stats)
            style = {position: 'absolute', width: width, height: height, left: left, top: top }
        
        return (
            React.DOM.div( {className:className, id:puff.sig, key:puff.sig, style:style}, 
                PuffAuthor( {username:puff.username} ),
                PuffContent( {puff:puff, height:height} ),
                PuffBar( {puff:puff} )
            )
        );
    }
});


var PuffAuthor = React.createClass({displayName: 'PuffAuthor',
    handleClick: function() {
        var username = this.props.username;
        return events.pub('ui/show/by-user', {'view.style': 'PuffByUser', 'view.puff': false, 'view.user': username})
    },
    render: function() {
        var username = humanizeUsernames(this.props.username)

        return (
            React.DOM.div( {className:"author"}, React.DOM.a( {href:"", onClick:this.handleClick}, username))
        );
    }
});

var PuffContent = React.createClass({displayName: 'PuffContent',
    handleClick: function() {
        var puff = this.props.puff
        showPuff(puff)
    },
    render: function() {
        var puff = this.props.puff
        var puffcontent = PuffForum.getProcessedPuffContent(puff)
        // FIXME: this is bad and stupid because user content becomes unescaped html don't do this really seriously
        return React.DOM.div( {style:{height: this.props.height}, className:"txt", onClick:this.handleClick, dangerouslySetInnerHTML:{__html: puffcontent}})
    }
});

var PuffBar = React.createClass({displayName: 'PuffBar',
    render: function() {
        var puff = this.props.puff
		var link = React.DOM.span( {className: "icon"}, React.DOM.a( {href:puff.payload.content, target:"new"}, React.DOM.i( {className:"fa fa-search-plus"})));
		return (
			React.DOM.div( {className:"bar"}, 
				puff.payload.type=='image' ? link : '',
				PuffInfoLink( {puff:puff} ),
				PuffChildrenCount( {puff:puff} ),
				PuffParentCount( {puff:puff} ),
				PuffPermaLink( {sig:puff.sig} ),
				PuffReplyLink( {sig:puff.sig} )
			)
		);
    }
});



var PuffParentCount = React.createClass({displayName: 'PuffParentCount',
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/parents', {'view.style': 'PuffAllParents', 'view.puff': puff})
    },
    render: function() {
        var puff = this.props.puff;
        var parents = PuffForum.getParents(puff)
        if (parents.length==0) {
            return (
                React.DOM.span( {className:"click"}, 
                    React.DOM.span( {className:"click"}, "0"),React.DOM.i( {className:"fa fa-male fa-fw"})
                )
           );
        } 
        else {
            return (
                React.DOM.span( {className:"icon"}, 
                    React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                        parents.length,React.DOM.i( {className:"fa fa-male fa-fw"})
                    )
                )
            );
        }
    }
});

var PuffInfoLink = React.createClass({displayName: 'PuffInfoLink',
    componentDidMount: function(){
        var node = this.getDOMNode();
        var infoLink = node.getElementsByClassName('infoLink')[0];
        var popup = node.getElementsByClassName('popup')[0];

        infoLink.onmouseover = function() {
            popup.style.display = 'block';
        }
        infoLink.onmouseout = function() {
            popup.style.display = 'none';
        }
    },
    render: function() {
        var puff = this.props.puff;
        var date = new Date(puff.payload.time);
        var formattedTime = React.DOM.span(null, "Created ", timeSince(date), " ago");
        var lisc = puff.payload.license ?  React.DOM.span(null, React.DOM.br(null),"License:",puff.payload.license) : '';
        var photographer = puff.photographer ? React.DOM.span(null, React.DOM.br(null),"Photographer:",puff.photographer) : '';
        var version = React.DOM.span(null, React.DOM.br(null), " Version: ", puff.version);
   //     var altText = formattedTime + ' ' + lisc + ' ' + photographer + ' ' + version;

        return (
            React.DOM.a(null, React.DOM.span( {className:"icon"}, 
                React.DOM.span( {className:"infoLink"}, 
                    React.DOM.i( {className:"fa fa-info fa-fw"}),
                    React.DOM.span( {className:"popup"}, 
                    formattedTime,
                    lisc,
                    photographer,
                    version
                    )
                )
            ))
            );
    }
});


var PuffChildrenCount = React.createClass({displayName: 'PuffChildrenCount',
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/children', {'view.style': 'PuffAllChildren', 'view.puff': puff})
        // viewAllChildren(puff)
    },
    render: function() {
        var puff = this.props.puff;
        var children = PuffForum.getChildren(puff)
        if (children.length==0) {
            return (
                React.DOM.span( {className:"click"}, 
                    React.DOM.span( {className:"click"}, "0"),React.DOM.i( {className:"fa fa-child fa-fw"})
                )
            );
        }
        else {
            return (
                React.DOM.span( {className:"icon"}, 
                    React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                        children.length,React.DOM.i( {className:"fa fa-child fa-fw"})
                    )
                )
            );
        }
    }
});

var PuffPermaLink = React.createClass({displayName: 'PuffPermaLink',
    handleClick: function() {
        var sig  = this.props.sig;
        var puff = PuffForum.getPuffById(sig);
        showPuff(puff);
    },
    render: function() {
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:'#' + this.props.sig, onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-link fa-fw"})
                )
            )
        );
    }
});

var PuffReplyLink = React.createClass({displayName: 'PuffReplyLink',
    handleClick: function() {
        var sig = this.props.sig;

        var parents = puffworldprops.reply.parents          // THINK: how can we get rid of this dependency?
            ? puffworldprops.reply.parents.slice()          // clone to keep pwp immutable
            : []
        var index   = parents.indexOf(sig)

        if(index == -1)
            parents.push(sig)
        else
            parents.splice(index, 1)

        return events.pub('ui/reply/add-parent', {'reply': {show: true, parents: parents}});

        // TODO: draw reply arrows
    },
    render: function() {
        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:"#", onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-reply fa-fw"})
                )
            )
        );
    }
});

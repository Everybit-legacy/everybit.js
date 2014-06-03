/** @jsx React.DOM */

var Arrow =  React.createClass({displayName: 'Arrow',
    componentDidMount: function() {
        this.getDOMNode().setAttribute('marker-end', 'url(#triangle)')
    },
    render: function() {
        
        
        var result = (
            React.DOM.line( {x1:this.props.x1, y1:this.props.y1, x2:this.props.x2, y2:this.props.y2, stroke:"black", strokeWidth:"10", dangerouslySetInnerHTML:{__html: '<animate attributeName="x2" from='+Math.random()+' to='+this.props.x2+' dur="1s" /><animate attributeName="y2" from='+Math.random()+' to='+this.props.y2+'  dur="1s" />'}} 
                
            )
        )
        
        return result
    }
})
 

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
            width -= offset
            height -= offset
            top += offset/2
            left += offset/2
        }
        
        if(stats)
            style = {position: 'absolute', width: width, height: height, left: left, top: top }
        
        return (
            React.DOM.div( {className:className, id:puff.sig, key:puff.sig, style:style}, 
                PuffAuthor( {username:puff.username} ),
                PuffContent( {puff:puff} ),
                PuffBar( {puff:puff} )
            )
            );
    }
});



var PuffBox = React.createClass({displayName: 'PuffBox',
    render: function() {
        var puff = this.props.puff

        return (
            React.DOM.div( {id:puff.sig, key:puff.sig, className:"block"}, 
                PuffAuthor( {username:puff.username} ),
                PuffContent( {puff:puff} ),
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
        return React.DOM.div( {className:"txt", onClick:this.handleClick, dangerouslySetInnerHTML:{__html: puffcontent}})
    }
});

var PuffBar = React.createClass({displayName: 'PuffBar',
    render: function() {
        var puff = this.props.puff
		var link = React.DOM.a( {href:puff.payload.content, target:"new"}, React.DOM.i( {className:"fa fa-download fa-fw downloadIcon"}));
        if(puff.payload.type=='image'){
			return (
				React.DOM.div( {className:"bar"}, 
					link,
					PuffInfoLink( {puff:puff} ),
					PuffChildrenCount( {puff:puff} ),
					PuffParentCount( {puff:puff} ),
					PuffPermaLink( {sig:puff.sig} ),
					PuffReplyLink( {sig:puff.sig} )
				)
				);
			}
		else{
			return (
				React.DOM.div( {className:"bar"}, 
					PuffInfoLink( {puff:puff} ),
					PuffChildrenCount( {puff:puff} ),
					PuffParentCount( {puff:puff} ),
					PuffPermaLink( {sig:puff.sig} ),
					PuffReplyLink( {sig:puff.sig} )
				)
				);
			}
    }
});


var PuffInfoLink = React.createClass({displayName: 'PuffInfoLink',
    handleClick: function() {
        var puff = this.props.puff;
        var date = new Date(puff.payload.time);
        var formattedTime = 'Created ' + timeSince(date) + ' ago';
        var lisc = puff.payload.license ? '\n' + 'License: ' + puff.payload.license : '';
        var photographer = puff.photographer ? '\n' + 'Photographer: ' + puff.photographer : '';
        var version = '\n' + 'Version: ' + puff.version;
        var altText = formattedTime + ' ' + lisc + ' ' + photographer + ' ' + version;

        alert(altText);
        return false;
    },

    render: function() {


        return (
            React.DOM.span( {className:"icon"}, 
                React.DOM.a( {href:"#", onClick:this.handleClick}, 
                    React.DOM.i( {className:"fa fa-info fa-fw"})
                )
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
                React.DOM.span( {className:"icon"}, 
                    0,React.DOM.i( {className:"fa fa-male fa-fw"})
                )
           );
        } else {
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
                React.DOM.span( {className:"icon"}, 
                    0,React.DOM.i( {className:"fa fa-child fa-fw"})
                )
                );
        } else {
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

        var parents = puffworldprops.reply.parents         // THINK: how can we get rid of this dependency?
            ? puffworldprops.reply.parents.slice() // clone to keep pwp immutable
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

/** @jsx React.DOM */


globalCreateFancyPuffBox = function(puffplus) {
    var puff = puffplus.puff
    var className = puffplus.className
    var stats = puffplus
    return <PuffFancyBox puff={puff} key={puff.sig} extraClassy={className} stats={stats} />
}

var PuffFancyBox = React.createClass({
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
            <div className={className} id={puff.sig} key={puff.sig} style={style}>
                <PuffAuthor username={puff.username} />
                <PuffContent puff={puff} />
                <PuffBar puff={puff} />
            </div>
        );
    }
});


var PuffAuthor = React.createClass({
    handleClick: function() {
        var username = this.props.username;
        return events.pub('ui/show/by-user', {'view.style': 'PuffByUser', 'view.puff': false, 'view.user': username})
    },
    render: function() {
        var username = humanizeUsernames(this.props.username)

        return (
            <div className="author"><a href="" onClick={this.handleClick}>{username}</a></div>
        );
    }
});

var PuffContent = React.createClass({
    handleClick: function() {
        var puff = this.props.puff
        showPuff(puff)
    },
    render: function() {
        var puff = this.props.puff
        var puffcontent = PuffForum.getProcessedPuffContent(puff)
        // FIXME: this is bad and stupid because user content becomes unescaped html don't do this really seriously
        return <div className="txt" onClick={this.handleClick} dangerouslySetInnerHTML={{__html: puffcontent}}></div>
    }
});

var PuffBar = React.createClass({
    render: function() {
        var puff = this.props.puff
		var link = <a href={puff.payload.content} target="new"><i className="fa fa-download fa-fw downloadIcon"></i></a>;
		return (
			<div className="bar">
				{puff.payload.type=='image' ? link : ''}
				<PuffInfoLink puff={puff} />
				<PuffChildrenCount puff={puff} />
				<PuffParentCount puff={puff} />
				<PuffPermaLink sig={puff.sig} />
				<PuffReplyLink sig={puff.sig} />
			</div>
		);
    }
});


var PuffInfoLink = React.createClass({
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
            <span className="icon">
                <a href='#' onClick={this.handleClick}>
                    <i className="fa fa-info fa-fw"></i>
                </a>
            </span>
        );
    }
});

var PuffParentCount = React.createClass({
    handleClick: function() {
        var puff  = this.props.puff;
        return events.pub('ui/show/parents', {'view.style': 'PuffAllParents', 'view.puff': puff})
    },
    render: function() {
        var puff = this.props.puff;
        var parents = PuffForum.getParents(puff)
        if (parents.length==0) {
            return (
                <span className="click">
                    <span className="click">0</span><i className="fa fa-male fa-fw"></i>
                </span>
           );
        } 
        else {
            return (
                <span className="icon">
                    <a href={'#' + this.props.sig} onClick={this.handleClick}>
                        {parents.length}<i className="fa fa-male fa-fw"></i>
                    </a>
                </span>
            );
        }
    }
});

var PuffChildrenCount = React.createClass({
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
                <span className="click">
                    <span className="click">0</span><i className="fa fa-child fa-fw"></i>
                </span>
            );
        }
        else {
            return (
                <span className="icon">
                    <a href={'#' + this.props.sig} onClick={this.handleClick}>
                        {children.length}<i className="fa fa-child fa-fw"></i>
                    </a>
                </span>
            );
        }
    }
});

var PuffPermaLink = React.createClass({
    handleClick: function() {
        var sig  = this.props.sig;
        var puff = PuffForum.getPuffById(sig);
        showPuff(puff);
    },
    render: function() {
        return (
            <span className="icon">
                <a href={'#' + this.props.sig} onClick={this.handleClick}>
                    <i className="fa fa-link fa-fw"></i>
                </a>
            </span>
        );
    }
});

var PuffReplyLink = React.createClass({
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
            <span className="icon">
                <a href="#" onClick={this.handleClick}>
                    <i className="fa fa-reply fa-fw"></i>
                </a>
            </span>
        );
    }
});

/** @jsx React.DOM */

var ComputeDimensionMixin = {
	getScreenCoords: function() {
		return GridLayoutMixin.getScreenCoords()
	},
	computeRowHeight: function() {
		var row = (parseInt(puffworldprops.view.rows) || 1);
		var screencoords = this.getScreenCoords();
		var rowHeight = (screencoords.height-36) / row;
		return rowHeight - 3; // TODO : add this to CONFIG
	},
	getColumnWidth: function(c){
		var columnProps = this.props.column;
		var columnArr = Object.keys(columnProps);
		columnArr = columnArr.filter(function(c){return columnProps[c].show});

		if (columnArr.indexOf(c) == -1) return 0;
		
		var screenWidth = this.getScreenCoords().width;
		var rowWidth = screenWidth - 80; // TODO : add this to config
		
		var weightArr = columnArr.map(function(c){return columnProps[c].weight});
		var totalWeight = weightArr.reduce(function(prev, curr){return prev+curr});
		
		var width = rowWidth * columnProps[c].weight / totalWeight; 
		return width;
	}
}

var RowRenderMixin = {
    handleViewUser: function(username) {
        return events.pub( 'filter/show/by-user',
            {
              'view.filters': {},
              'view.filters.users': [username],
              'view.mode': 'newview'
            }
        );
    },

	renderDefault: function(col) {
		var metadata = this.props.puff.payload || {};
		var content = metadata[col] || "";
		return content;
	},
	renderUser: function() {
		return <a href="#" onClick={this.handleViewUser.bind(this,this.props.puff.username)}>.{this.props.puff.username}</a>;
	},
	renderContent: function() {
		var puff = this.props.puff;
		var puffcontent = PuffForum.getProcessedPuffContent(puff);
		return <span dangerouslySetInnerHTML={{__html: puffcontent}}></span>
	},
	renderDate: function() {
		var puff = this.props.puff;
		var date = new Date(puff.payload.time);

        return <span>{date.yyyymmdd()}</span>;
		/// return date.toLocaleDateString() + " " + date.toLocaleTimeString();
	},
    // TODO: Link each tag to a search for that tag (maintain view as list)
    // TODO: Change the format of the links to be more normal
	renderTags: function() {
		var puff = this.props.puff;
		var tags = puff.payload.tags || [];
		tags = tags.filter(function(t, index, array){return array.indexOf(t) == index});
		return <span>{tags.map(function(tag){
			return <span key={tag} className="bubbleNode">{tag}</span>
		})}</span>
	},
	getReferenceIcon: function(sig) {
		// type = type || "";
		// if (!puff) return "";
		// var sig = puff.sig;
		var preview = <span></span>;
		var puff = PuffForum.getPuffBySig(sig);
		if (puff.payload && puff.payload.content)
			preview = <div className="rowReferencePreview"><PuffContent puff={puff} /></div>
		return <span key={sig} className="rowReference"><img style={{marginRight: '2px', marginBottom:'2px',display: 'inline-block',verticalAlign: 'tp'}} src={getImageCode(sig)}/>{preview}</span>
	},
	renderReferences: function() {
		var iconStyle = {
			display: 'inline-block',
			height: '20px',
			verticalAlign: 'top',
			marginBottom: '2px'
		};
		var sig = this.props.puff.sig;
		var self = this;

		var parentsEle = <span></span>;
		var parents = PuffData.graph.v(sig).out('parent').run();
		parents = parents.map(function(v){if (v.shell) return v.shell.sig})
						 .filter(Boolean)
						 .filter(function(s, i, array){return i == array.indexOf(s)});
		var parentIcons = parents.map(this.getReferenceIcon);
		if (parents.length)
			parentsEle = 
			<div style={{position: 'relative'}}>
				<span style={iconStyle}><i className="fa fa-fw fa-male"></i></span>{parentIcons}
			</div>;

		var childrenEle = <span></span>;
		var children = PuffData.graph.v(sig).out('child').run();
		children = children.map(function(v){if (v.shell) return v.shell.sig})
						   .filter(Boolean)
						   .filter(function(s, i, array){return i == array.indexOf(s)});
		var childrenIcon = children.map(this.getReferenceIcon);
		if (children.length) 
			childrenEle = <div style={{position: 'relative'}}><span style={iconStyle}><i className="fa fa-fw fa-child"></i></span>{childrenIcon}</div>;
		return <div>
			{parentsEle}
			{childrenEle}
		</div>
	},
	renderScore: function() {
        var showStar = true;
        var envelope = PuffData.getBonus(this.props.puff, 'envelope');
        if(envelope && envelope.keys)
            showStar = false;
		return <PuffStar sig={this.props.puff.sig}/>;
	},
	renderColumn: function(col, width, maxHeight) {
		var ret = <span></span>
		var content = "";
		var functionName = "render" + col.slice(0, 1).toUpperCase() + col.slice(1);
		if (this[functionName]) {
			content = this[functionName]();
		} else {
			content = this.renderDefault(col);
		}
		return <span key={col} className="listcell" style={{width: width, maxHeight: maxHeight}}>{content}</span>;
	}
}

var RowView = React.createClass({
	mixins: [ViewKeybindingsMixin, GridLayoutMixin],
	getInitialState: function() {
		return {loaded: 20, noMorePuff: false};
	},
	loadMore: function() {
		this.setState({loaded: this.state.loaded + 10});
		return false;
	},
	handleScroll: function() {
		var ele = this.refs.container.getDOMNode();
		if (ele.scrollTop - ele.scrollHeight + ele.offsetHeight == 0) {
			setTimeout(this.loadMore, 100);
		}
	},
	componentDidMount: function() {
		this.refs.container.getDOMNode().addEventListener("scroll", this.handleScroll);
	},
	componentDidUpdate: function(prevProp, prevState) {
		if (prevState.loaded != this.state.loaded) {
			var query = PB.shallow_copy(this.props.view.query);
			query.offset = (+query.offset || 0) + this.state.loaded;
			var filters = this.props.view.filters;
			var limit = 10;
			var puffs = PuffForum.getPuffList(query, filters, limit);
			if (puffs.length == 0)
				this.setState({noMorePuff: true});
			else
				this.setState({noMorePuff: false});
		}
	},
	render: function() {
		var self = this;
		var listprop = this.props.list;
		// TODO add this to config
		var top = CONFIG.verticalPadding - 10;
		var left = CONFIG.leftMargin - 10;
		var style={
			right:'10px', top: top, left:left, position: 'absolute'
		}		
		var query = this.props.view.query;
		var filters = this.props.view.filters;
		var limit = this.state.loaded;
		var puffs = PuffForum.getPuffList(query, filters, limit).filter(Boolean);

		var containerHeight = this.getScreenCoords().height - 30;
		return (
			<div style={style} className="listview">
				<RowHeader column={this.props.list.column}/>
				<div ref="container" className="listrowContainer" style={{maxHeight: containerHeight.toString()+'px'}}>{puffs.map(function(puff, index){
						return <RowSingle puff={puff} column={self.props.list.column} expand={self.props.list.expand} index={index} view={self.props.view} />
					})}
					<div className={this.state.noMorePuff ? "hidden" : "listfooter listrow" }>Loading...</div>
				</div>
			</div>
		)
	}
})

var RowViewColOptions = React.createClass({
	handleCheck: function(col) {
		var columnProp = this.props.column;
		var currentShow = columnProp[col].show;
		var jsonToSet = {};
		jsonToSet['list.column.'+col+'.show'] = !currentShow;
		return events.pub('ui/show-hide/col', jsonToSet);
	},
	render: function() {
		var columnProp = this.props.column;
		var possibleCols = Object.keys(columnProp);
		var self = this;
		return (
			<div className="rowViewColOptions">
				{possibleCols.map(function(col){
					return <div key={col}>
						<input type="checkbox" onChange={self.handleCheck.bind(self, col)} value={col} defaultChecked={columnProp[col].show}> {col}</input>
						</div>
				})}
			</div>
		)
	}
})

var RowHeader = React.createClass({
	mixins: [ComputeDimensionMixin],
	getInitialState: function() {
		return {showOptions: false}
	},
	handleManageCol: function() {
		this.setState({showOptions: !this.state.showOptions});
		return false;
	},
	render: function() {
		var columnProp = this.props.column;
		var columns = Object.keys(columnProp);
		columns = columns.filter(function(c){return columnProp[c].show});
		var self = this;

		return (
			<div className="listrow listheader" key="listHeader">
				{this.state.showOptions ? <RowViewColOptions column={columnProp}/> : ""}
				<span className="listcell" >
					<span className="listbar"><a href="#" onClick={this.handleManageCol}>
						<i className="fa fa-fw fa-cog"></i>
					</a></span>
				</span>
				{columns.map(function(c){
					var style = {
						width: self.getColumnWidth(c).toString()+'px'
					};
					return <span className="listcell" key={c} style={style}>{c}</span>
				})}
			</div>
		)
	}
})

var RowSingle = React.createClass({
	mixins: [ComputeDimensionMixin, RowRenderMixin],
    getInitialState: function() {
        return {showAll: false};
    },
	addColumn: function() {
		var metadata = this.props.puff.payload;
		var currentColumns = Object.keys(this.props.column);
		for (var col in metadata) {
			if (metadata[col] && metadata[col].length > 0 && 
				currentColumns.indexOf(col) == -1 &&
				col != 'parents') {
				var jsonToSet = {};
				jsonToSet['list.column.'+col] = PB.shallow_copy(CONFIG.defaultColumn);
				update_puffworldprops(jsonToSet)
			}
		}
		return events.pub('ui/new-column', {});
	},
	componentDidMount: function() {
		this.addColumn();
	},
    handleToggleShowAll: function() {
    	this.setState({showAll: !this.state.showAll});
    	return false;
    },
    handleHideAll: function() {
        this.setState({showAll: false});
        return false;
    },
    handleShowAll: function() {
        this.setState({showAll: true});
        return false;
    },
	render: function() {
		var puff = this.props.puff;

		var columnProp = this.props.column;
		var columns = Object.keys(columnProp);
		columns = columns.filter(function(c){return columnProp[c].show});

		var self = this;

		// var height = this.computeRowHeight();
		var maxHeight = puffworldprops.view.rows * 1.4;
		// var style = {};
		/*if (this.props.expand.puff == puff.sig) {
			var expandProp = this.props.expand;
			var factor = Math.min(puffworldprops.view.rows, expandProp.num);
			height = height * factor + 10 * (factor-1);
		}*/
		/*if (this.props.expand.puff != puff.sig) {
			style.maxHeight = maxHeight.toString() + 'em';
		}*/

		var className = ['listrow'];
		/*if (this.props.view.cursor == puff.sig) {
			className.push('cursor');
		}

         <i className="fa fa-fw fa-plus"></i>
         <img src="img/puffballIconBigger.png" style={{height:'16px'}} />
		*/

		return (
			<div className={className.join(' ')}>
				<span className="listcell" >
					<span className="listbar"><a href="#" onClick={this.handleToggleShowAll}>
                        <img key={puff.sig} style={{marginRight: '2px', marginBottom:'2px',display: 'inline-block',verticalAlign: 'tp'}} src={getImageCode(puff.sig)}/>


					</a></span>
				</span>
				{this.state.showAll ? <RowBar puff={puff} index={this.props.index} column={columnProp}/> : null}
				{columns.map(function(col){
					width = self.getColumnWidth(col).toString()+'px';
					return self.renderColumn(col, width, maxHeight.toString()+'em')
				})}
			</div>
		)
	}
})


var RowBar = React.createClass({
    getInitialState: function() {
        return {showAll: false};
    },
    render: function() {
        var puff = this.props.puff;

        var canViewRaw = puff.payload.type=='bbcode'||puff.payload.type=='markdown'||puff.payload.type=='PGN';
        var showStar = true;
        var envelope = PuffData.getBonus(this.props.puff, 'envelope');
        if(envelope && envelope.keys)
            showStar = false;

        return (
            <span className="listbarAllIcon">
                <div className="listBarIcon">
                    <RowExpand puff={puff} index={this.props.index}/>
                </div>
                <div className="listBarIcon">
                    <PuffReplyLink ref="reply" sig={puff.sig} />
                </div>
                <div className="listBarIcon">
                    <PuffFlagLink ref="flag" puff={puff} username={puff.username} flagged={this.props.flagged}/>
                </div>
                <div className="listBarIcon">
                    {canViewRaw ? <PuffViewRaw sig={puff.sig} /> : ''}
                </div>
                <div className="listBarIcon">
                    {puff.payload.type == 'image' ? <PuffViewImage puff={puff} /> : ""}
                </div>
                <div className="listBarIcon">
                    <PuffTipLink username={puff.username} />
                </div>
                <div className="listBarIcon">
                    <PuffJson puff={puff} />
                </div>
                <div className="listBarIcon">
                    <PuffClone puff={puff} />
                </div>
                <div className="listBarIcon">
                    <PuffPermaLink sig={puff.sig} />
                </div>
            </span>
        )
    }
});

var RowExpand = React.createClass({
	handleClick: function() {
		if (puffworldprops.list.expand.puff == this.props.puff.sig) {
			events.pub('ui/collapse-row', {'list.expand.puff': false});
		} else {
			var currentOffset = puffworldprops.view.query.offset || 0;
			var currentIndex = this.props.index;

			var totalRow = puffworldprops.view.rows;
			var expandRow = Math.min(totalRow, puffworldprops.list.expand.num);
			var newIndex = Math.floor((totalRow-expandRow)/2.0);
			var newOffset = Math.max(currentOffset - (newIndex-currentIndex), 0);

			events.pub('ui/collapse-row', {'list.expand.puff': this.props.puff.sig,
										   'view.query.offset': newOffset});
		}
		return false;
	},
    render: function() {
        var expand = puffworldprops.list.expand.puff == this.props.puff.sig ? "compress" : "expand";
        return (
            <span className="icon">
                <a href="#" onClick={this.handleClick}>
                    <i className={"fa fa-fw fa-"+expand}></i>
                </a>
            </span>
        );
    }
})
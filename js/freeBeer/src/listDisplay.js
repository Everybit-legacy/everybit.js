/** @jsx React.DOM */

var ComputeDimensionMixin = {
	getScreenCoords: function() {
		return GridLayoutMixin.getScreenCoords()
	},
	computeRowHeight: function() {
		var row = (parseInt(puffworldprops.view.rows) || 1);
		var screencoords = this.getScreenCoords();
		var rowHeight = (screencoords.height-60) / row;
		return rowHeight - 10; // TODO : add this to CONFIG
	},
	getColumnWidth: function(c){
		var columnProps = this.props.column;
		var columnArr = Object.keys(columnProps);
		columnArr = columnArr.filter(function(c){return columnProps[c].show});

		if (columnArr.indexOf(c) == -1) return 0;
		
		var screenWidth = this.getScreenCoords().width;
		var rowWidth = screenWidth - 40; // TODO : add this to config
		
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
		return <span>{tags.map(function(tag){
			return <span key={tag} className="bubbleNode">{tag}</span>
		})}</span>
	},
	getReferenceIcon: function(puff) {
		var sig = puff.sig;
		var preview = <span></span>;
		if (puff.payload.content)
			preview = <div className="rowReferencePreview"><PuffContent puff={puff} /></div>
		return <span key={sig} className="rowReference"><img key={sig} style={{marginRight: '2px', marginBottom:'2px'}} src={'http://puffball.io/img/icons/?sig='+sig}/>{preview}</span>
	},
	renderReferences: function() {
		var iconStyle = {
			display: 'inline-block',
			height: '24px',
			verticalAlign: 'middle',
			marginBottom: '2px'
		};
// <<<<<<< HEAD
		var sig = this.props.puff.sig;

		var parentsEle = <span></span>;
		var parents = PuffData.graph.v(sig).out('parent').run();
		parents = parents.map(function(v){return v.shell});
		var parentIcons = parents.map(this.getReferenceIcon);
		if (parents.length)
			parentsEle = 
			<div style={{position: 'relative'}}>
				<span style={iconStyle}><i className="fa fa-fw fa-male"></i></span>{parentIcons}
			</div>;

		var childrenEle = <span></span>;
		var children = PuffData.graph.v(sig).out('child').run();
		children = children.map(function(v){return v.shell});
		var childrenIcon = children.map(this.getReferenceIcon);
		if (children.length) 
			childrenEle = <div style={{position: 'relative'}}><span style={iconStyle}><i className="fa fa-fw fa-child"></i></span>{childrenIcon}</div>;
/*=======
		var parentsSpan = <span></span>;
		var parents = this.props.puff.payload.parents || [];
		var parentIcons = parents.map(function(sig){
            // return <img style={{marginRight: '2px', marginBottom:'2px'}} src={'http://puffball.io/img/icons/?sig='+sig}/>
			return <img style={{marginRight: '2px', marginBottom:'2px'}} src={getImageCode(sig)}/>
		})
		if (parents.length)
            parentsSpan = <span><span style={iconStyle}></span>{parentIcons}<i className="fa fa-fw fa-male"></i></span>;

		var childrenSpan = <span></span>;
		var sig = this.props.puff.sig;
		var children = PuffData.graph.v(sig).out('child').run();
		var childrenIcon = children.map(function(vertex){
			var s = vertex.shell.sig;
            // return <img key={s} style={{marginRight: '2px', marginBottom:'2px'}} src={'http://puffball.io/img/icons/?sig='+s}/>

            return <img style={{marginRight: '2px', marginBottom:'2px'}} src={getImageCode(s)}/>
		})
		if (children.length)
            childrenSpan = <span><span style={iconStyle}><i className="fa fa-fw fa-child"></i></span>{childrenIcon}</span>;
>>>>>>> 5f913db2f49bd2fb5a8d96f6f7bf8516449bfa35*/

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
	renderColumn: function(col, width) {
		var ret = <span></span>
		var content = "";
		var functionName = "render" + col.slice(0, 1).toUpperCase() + col.slice(1);
		if (this[functionName]) {
			content = this[functionName]();
		} else {
			content = this.renderDefault(col);
		}
		return <span key={col} className="listcell" style={{width: width}}>{content}</span>;
	}
}

var RowView = React.createClass({
	mixins: [ViewKeybindingsMixin, GridLayoutMixin],
	getPuffList: function() {
		var listprop = this.props.list;
		var query = this.props.view.query;
		var filters = this.props.view.filters;
		var limit = this.props.view.rows;
		if (listprop.expand.puff) {
			if (listprop.expand.num >= limit) {
				limit = 1;
			} else {
				limit = limit - (listprop.expand.num-1)
			}
		}
		var puffs = PuffForum.getPuffList(query, filters, limit);
		globalPuffRowList = puffs;
		return puffs;
	},
	getRowBox: function() {
		var rows = this.props.view.rows;
		var gridbox = this.getGridBox(rows, 1);

		// big row
		var expandRow = Math.min(this.props.list.expand.num, rows);

		var puffs = this.getPuffList();
		var minRow = 0;
		var puffBoxes = [];
		for (var i=0; i<puffs.length; i++) {
			var p = puffs[i];
			var box;
			if (p.sig == this.props.list.expand.puff) {
				box = this.applySizes(expandRow, 1, gridbox.add, {}, minRow)()(p)
				// minRow += expandRow;
			} else {
				box = this.applySizes(1, 1, gridbox.add, {}, minRow)()(p)
				// minRow += 1;
			}
			puffBoxes.push(box)
		}
		console.log(puffBoxes);
		return puffBoxes;
	},
	render: function() {
		var self = this;
		var listprop = this.props.list;
		// TODO add this to config
		var top = CONFIG.verticalPadding - 10;
		var left = CONFIG.leftMargin - 10;
		var style={
			top: top, left:left, position: 'absolute'
		}
		var puffs = this.getPuffList();
		return (
			<div style={style} className="listview">
				<RowHeader column={this.props.list.column}/>
				{puffs.map(function(puff, index){
					return <RowSingle key={puff.sig} puff={puff} column={self.props.list.column} expand={self.props.list.expand} index={index} view={self.props.view} />
				})}
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
				<span className="listcell" style={{width: '2em', padding: '0.5em 0px'}}>
					<a href="#" onClick={this.handleManageCol}>
						<i className="fa fa-fw fa-cog"></i>
					</a>
					{this.state.showOptions ? <RowViewColOptions column={columnProp}/> : ""}
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
	render: function() {
		var puff = this.props.puff;

		var columnProp = this.props.column;
		var columns = Object.keys(columnProp);
		columns = columns.filter(function(c){return columnProp[c].show});

		var self = this;

		var height = this.computeRowHeight();
		if (this.props.expand.puff == puff.sig) {
			var expandProp = this.props.expand;
			var factor = Math.min(puffworldprops.view.rows, expandProp.num);
			height = height * factor + 10 * (factor-1);
		}

		var className = ['listrow'];
		/*if (this.props.view.cursor == puff.sig) {
			className.push('cursor');
		}*/

		return (
			<div className={className.join(' ')} style={{height: height.toString()+'px'}}>
				<span className="listcell"><RowBar puff={puff} index={this.props.index}/></span>
				{columns.map(function(col){
					width = self.getColumnWidth(col).toString()+'px';
					return self.renderColumn(col, width)
				})}
			</div>
		)
	}
})


var RowBar = React.createClass({
    getInitialState: function() {
        return {iconSet: 0};
    },
    handleShowMore: function() {
        this.setState({iconSet: (this.state.iconSet+1)%3});
    },
    /*componentDidUpdate: function() {
        // to show tooltips for the other puffs
        this.componentDidMount();
    },*/
    render: function() {
        var puff = this.props.puff;
        var className = 'listbar'
        var canViewRaw = puff.payload.type=='bbcode'||puff.payload.type=='markdown'||puff.payload.type=='PGN';
        var showStar = true;
        var envelope = PuffData.getBonus(this.props.puff, 'envelope');
        if(envelope && envelope.keys)
            showStar = false;

        var polyglot = Translate.language[puffworldprops.view.language];
        var iconSet = this.state.iconSet;
        var boldStyle = {
            fontWeight: 'bold'
        };
        var selectedStyle = {
            color: '#00aa00'
        };
        var moreButton = (
            <span className ="icon">
                <a style={boldStyle} onClick={this.handleShowMore}>
                    {[0,1,2].map(function(i){
                        if (i == iconSet) return <span key={i} style={selectedStyle}>•</span>
                        else return <span key={i}>•</span>
                    })}
                </a>
                <Tooltip position="above" content={polyglot.t("menu.tooltip.seeMore")} />
            </span>
        )


        // ICON SETS
        var iconSetOne = (
            <span className={iconSet == 0 ? "" : "hidden"}>
                <RowExpand puff={puff} index={this.props.index}/>
                <PuffReplyLink ref="reply" sig={puff.sig} />
            </span>
        );
        var iconSetTwo = (
            <span className={iconSet == 1 ? "" : "hidden"}>
                <PuffFlagLink ref="flag" puff={puff} username={puff.username} flagged={this.props.flagged}/>
                {canViewRaw ? <PuffViewRaw sig={puff.sig} /> : ''}
                {puff.payload.type == 'image' ? <PuffViewImage puff={puff} /> : ""}
                <PuffTipLink username={puff.username} />
            </span>
        )
        var iconSetThree = (
            <span className={iconSet == 2 ? "" : "hidden"}>
                <PuffJson puff={puff} />
                <PuffPermaLink sig={puff.sig} />
                <PuffClone puff={puff} />
            </span>
        );
        // <img key={puff.sig} style={{marginBottom: '5px'}} src={'http://puffball.io/img/icons/?sig='+puff.sig}/>
        return (
        <div className={className}>
            <img key={puff.sig} style={{marginBottom: '5px'}} src={getImageCode(puff.sig)} />




            {iconSetOne}
            {iconSetTwo}
            {iconSetThree}
            {moreButton}
        </div>
        );
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
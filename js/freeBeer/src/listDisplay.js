/** @jsx React.DOM */

var listprop = {
	column: {
		identity: {
			show: true,
			weight: 2,
			allowSort: false
		},
		content: {
			show: true,
			weight: 4,
			allowSort: false
		},
		date: {
			show: true,
			weight: 2,
			allowSort: false
		},
		tags: {
			show: true,
			weight: 2,
			allowSort: false
		},
		parents: {
			show: true,
			weight: 2,
			allowSort: false
		},
		children: {
			show: true,
			weight: 2,
			allowSort: false
		},
		score: {
			show: true,
			weight: 2,
			allowSort: false
		}
	},
	defaultColumn: {
		show: false,
		weight: 1,
		allowSort: false
	},
	row: {
		num: 5,
		expand: 3
	}
}

var ComputeDimensionMixin = {
	getScreenCoords: function() {
		return GridLayoutMixin.getScreenCoords()
	},
	computeRowHeight: function() {
		var row = listprop.row.num + 1; // 1 more row for header
		var screencoords = this.getScreenCoords();
		var rowHeight = screencoords.height / row;
		return rowHeight - 10; // TODO : add this to CONFIG
	}
}

var ListRowRenderMixin = {
	renderDefault: function(col) {
		var metadata = this.props.puff.payload || {};
		var content = metadata[col] || "";
		return content;
	},
	renderIdentity: function() {
		return "." + this.props.puff.username;
	},
	renderContent: function() {
		var puff = this.props.puff;
		var puffcontent = PuffForum.getProcessedPuffContent(puff);
		return <span dangerouslySetInnerHTML={{__html: puffcontent}}></span>
	},
	renderDate: function() {
		var puff = this.props.puff;
		var date = new Date(puff.payload.time);
		return date.toLocaleDateString() + " " + date.toLocaleTimeString();
	},
	renderTags: function() {
		var puff = this.props.puff;
		var tags = puff.payload.tags || [];
		return <span>{tags.map(function(tag){
			return <span key={tag} className="bubbleNode">{tag}</span>
		})}</span>
	},
	renderParents: function() {
		return "";
	},
	renderChildren: function() {
		return "";
	},
	renderScore: function() {
		return "";
	},
	renderColumn: function(col, width) {
		var ret = <span></span>
		var content = "";
		var functionName = "render" + col.slice(0, 1).toUpperCase() + col.slice(1);
		console.log(col, this[functionName]);
		if (this[functionName]) {
			content = this[functionName]();
		} else {
			content = this.renderDefault(col);
		}
		return <span className="listcell" style={{width: width}}>{content}</span>;
	}
}

var ListView = React.createClass({
	mixins: [ComputeDimensionMixin],
	getInitialState: function() {
		var columnArr = [];
		var totalWeight = 0;
		for (var c in listprop.column) {
			if (listprop.column[c] && listprop.column[c].show) {
				columnArr.push(c);
				totalWeight += listprop.column[c].weight || listprop.defaultColumn.weight;
			}
		}
		return {
			columnArr: columnArr,
			totalWeight: totalWeight
		}
	},
	addNewColumn: function(c) {
		var columnArr = PB.shallow_copy(this.state.columnArr);
		if (columnArr.indexOf(c) != -1) return false;
		var column = listprop.column[c];
		if (!column) {
			column = PB.shallow_copy(listprop.defaultColumn);
			listprops.column[c] = column;
		}
		column.show = true;
		columnArr.push(c);
		var totalWeight = this.state.totalWeight + column.weight;
		this.setState({
			columnArr: columnArr,
			totalWeight: totalWeight
		});
		return false;
	},
	getColumnWidth: function(c){
		if (this.state.columnArr.indexOf(c) == -1) return 0;
		var screenWidth = this.getScreenCoords().width;
		var rowWidth = screenWidth - 40; // TODO : add this to config
		var width = rowWidth * (listprop.column[c].weight || listprop.defaultColumn.weight) / this.state.totalWeight; 
		return width;
	},
	componentDidUpdate: function(prevProp, prevState) {
	},
	render: function() {
		var self = this;
		// TODO add this to config
		var top = CONFIG.verticalPadding - 10;
		var left = CONFIG.leftMargin - 10;
		var style={
			top: top, left:left, position: 'absolute'
		}

		var query = this.props.view.query;
		var filters = this.props.view.filters;
		var limit = listprop.row.num;
		var puffs = PuffForum.getPuffList(query, filters, limit);

		return (
			<div style={style} className="listview">
				<ListHeader columns={this.state.columnArr} getColumnWidth={this.getColumnWidth}/>
				{puffs.map(function(puff){
					return <ListRow key={puff.sig} columns={self.state.columnArr} getColumnWidth={self.getColumnWidth} puff={puff} />
				})}
			</div>
		)
	}
})

var ListHeader = React.createClass({
	mixins: [ComputeDimensionMixin],
	render: function() {
		var columns = this.props.columns;
		var getColumnWidth = this.props.getColumnWidth;
		return (
			<div className="listrow listheader" style={{height: this.computeRowHeight().toString()+'px'}}>
				<span className="listcell" style={{width: '2em', padding: '0.5em 0px'}}>
					<a href="#" onClick={this.handleManageRow}>
						<i className="fa fa-fw fa-cog"></i>
					</a>
				</span>
				{columns.map(function(c){
					var style = {
						width: getColumnWidth(c).toString()+'px'
					};
					return <span className="listcell" key={c} style={style}>{c}</span>
				})}
			</div>
		)
	}
})

var ListRow = React.createClass({
	mixins: [ComputeDimensionMixin, ListRowRenderMixin],
	render: function() {
		var puff = this.props.puff;
		var columns = this.props.columns;
		var getColumnWidth = this.props.getColumnWidth;
		var self = this;
		return (
			<div className="listrow" style={{height: this.computeRowHeight().toString()+'px'}}>
				<span className="listcell"><ListBar puff={puff} hidden={false} /></span>
				{columns.map(function(col){
					width = getColumnWidth(col).toString()+'px';
					return self.renderColumn(col, width)
				})}
			</div>
		)
	}
})


var ListBar = React.createClass({
    getInitialState: function() {
        return {iconSet: 0};
    },
    handleShowMore: function() {
        this.setState({iconSet: (this.state.iconSet+1)%3});
    },
    componentDidUpdate: function() {
        // to show tooltips for the other puffs
        this.componentDidMount();
    },
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
                <PuffExpand puff={puff} />
                <PuffFlagLink ref="flag" puff={puff} username={puff.username} flagged={this.props.flagged}/>
                <PuffInfoLink puff={puff} />
                <PuffReplyLink ref="reply" sig={puff.sig} />
            </span>
        );
        var iconSetTwo = (
            <span className={iconSet == 1 ? "" : "hidden"}>
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
        return (
        <div className={className}>
            {iconSetOne}
            {iconSetTwo}
            {iconSetThree}
            {moreButton}
        </div>
        );
    }
});
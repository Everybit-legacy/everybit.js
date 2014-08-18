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
              'view.mode': 'tableView'
            }
        );
    },

	renderDefault: function(col) {
		var metadata = this.props.puff.payload || {};
		var content = metadata[col] || "";
		return content;
	},
	renderUser: function() {
        // Try and find profile for this user
        // TODO: Figure out why this is returning latest post by users
        /*
        var queryJSON = {}
        queryJSON.users = [].push(this.props.puff.username);
        queryJSON.type = 'profile'

        var prof = PuffForum.getPuffList(puffworldprops.view.query,queryJSON,1);

        if(prof.length) {

            return <span><a href="#" onClick={this.handleViewUser.bind(this,this.props.puff.username)}>.{this.props.puff.username}</a> <img className="iconSized" src={prof[0].payload.content}  /></span>;

        } else {

        }
        */

        return <span><a href="#" onClick={this.handleViewUser.bind(this,this.props.puff.username)}>.{this.props.puff.username}</a></span>;


	},
	renderContent: function() {
		var puff = this.props.puff;
		var puffcontent = PuffForum.getProcessedPuffContent(puff);
		return <span dangerouslySetInnerHTML={{__html: puffcontent}}></span>
	},
	renderOther: function() {
		var puff = this.props.puff;

        // If we are showing the info as a column, hide them from "other"
        var keysNotShow = ['content', 'parents'] // Never show these
        for(var k in puffworldprops.list.column) {
            if(puffworldprops.list.column[k].show == true && keysNotShow.indexOf(k)==-1) {
                keysNotShow.push(k);
            }
        }


		// var keysNotShow = ['content', 'parents'];
		return <span>
			{Object.keys(puff.payload).map(function(key){
				var value = puff.payload[key];
	            if (keysNotShow.indexOf(key)==-1 && value && value.length) {
	                return <div><span className="profileKey">{key+": "}</span><span className="profileValue">{value}</span></div>
	            }
			})}
		</span>
	},
	renderDate: function() {
		var puff = this.props.puff;
		var date = new Date(puff.payload.time);

        return <span>{date.yyyymmdd()}</span>;
		/// return date.toLocaleDateString() + " " + date.toLocaleTimeString();
	},
    // TODO: Link each tag to a search for that tag (maintain view as list)
    // TODO: Change the format of the links to be more normal
    handleShowTag: function(tag) {
    	return events.pub('filter/show/tag', {
    							'view.filters': {},
    							'view.filters.tags': [tag]
    						});
    },
	renderTags: function() {
		var puff = this.props.puff;
		var tags = puff.payload.tags || [];
		tags = tags.filter(function(t, index, array){return array.indexOf(t) == index});
		var self = this;
		return <span>{tags.map(function(tag){
			return <a href="#" onClick={self.handleShowTag.bind(self, tag)} key={tag}><span className="bubbleNode">{tag}</span></a>
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
	renderRefs: function() {
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
		if (parents.length) {
            parentsEle = (
                <div>
                    <span style={iconStyle}>
                        <i className="fa fa-fw fa-male"></i>
                    </span>{parentIcons}
                </div>
                )
        }

		var childrenEle = <span></span>;
		var children = PuffData.graph.v(sig).out('child').run();
		children = children.map(function(v){if (v.shell) return v.shell.sig})
						   .filter(Boolean)
						   .filter(function(s, i, array){return i == array.indexOf(s)});
		var childrenIcon = children.map(this.getReferenceIcon);
		if (children.length) 
			childrenEle = <div><span style={iconStyle}><i className="fa fa-fw fa-child"></i></span>{childrenIcon}</div>;
		return <div>
			{parentsEle}
			{childrenEle}
		</div>;
	},
	renderScore: function() {
        var showStar = true;
        var envelope = PuffData.getBonus(this.props.puff, 'envelope');
        if(envelope && envelope.keys)
            showStar = false;
		return <PuffStar sig={this.props.puff.sig}/>;
	},
	render_column: function(col, width, maxHeight) {
		var style = {};
		style['width'] = (width-1).toString() + 'px';

		if (maxHeight)
			style['maxHeight'] = maxHeight.toString() + 'em';

		var content = "";
		var cls = ['listcell'];
		var functionName = "render" + col.slice(0, 1).toUpperCase() + col.slice(1);
		if (this[functionName]) {
			content = this[functionName]();
		} else {
			content = this.renderDefault(col);
		}
		return <span key={col}><span className="listcellborder"></span><span className={cls.join(' ')} style={style}>{content}</span></span>;
	}
}

var RowSortMixin = {
	sortDate: function(p1, p2) {
		return p2.payload.time - p1.payload.time;
	}, 
	getScore: function(puff) {
		var score = 0;
        var starStats = PuffData.getBonus({sig: puff.sig}, 'starStats');
        if(starStats && starStats.from) {
            score = starStats.score
        }
        return score;
	},
	sortScore: function(p1, p2) {
		return this.getScore(p2) - this.getScore(p1);
	},
	sortUser: function(p1, p2){
		if (p1.username < p2.username) return -1;
		if (p1.username > p2.username) return 1;
		return 0;
	},
	sort_column: function(col) {
		var functionName = "sort" + col.slice(0, 1).toUpperCase() + col.slice(1);
		if (this[functionName]) {
			return this[functionName];
		}
		return false;
	}
}


var RowView = React.createClass({
	mixins: [ViewKeybindingsMixin, GridLayoutMixin, RowSortMixin],
	getInitialState: function() {
		return {loaded: 20, noMorePuff: false, headerHeight: 0};
	},
	loadMore: function() {
		this.setState({loaded: this.state.loaded + 10});
		return false;
	},
	handleScroll: function() {
		var ele = this.refs.container.getDOMNode();
		if (ele.scrollTop - ele.scrollHeight + ele.offsetHeight == 0) {
			setTimeout(this.loadMore, 10);
		}
	},
	checkMorePuff: function() {
		var query = PB.shallow_copy(this.props.view.query);
		query.offset = (+query.offset || 0) + this.state.loaded;
		var filters = this.props.view.filters;
		var limit = 10;
		var puffs = PuffForum.getPuffList(query, filters, limit);
		if (puffs.length == 0)
			this.setState({noMorePuff: true});
		else
			this.setState({noMorePuff: false});

	},
	sortPuffs: function(puffs) {
		var col = this.props.list.sort.column;
		var desc = this.props.list.sort.desc;
		puffs = puffs || [];
		var fn = this.sort_column(col);
		if (fn === false) {
			console.log('Missing sort function', col);
			return puffs;
		}
		puffs = puffs.sort(function(p1, p2){
			if (desc) return fn(p1, p2);
			else return -fn(p1, p2);
		})
		return puffs;
	},
	componentDidMount: function() {
		this.refs.container.getDOMNode().addEventListener("scroll", this.handleScroll);
	},
	componentDidUpdate: function(prevProp, prevState) {
		if (prevState.loaded != this.state.loaded) {
			this.checkMorePuff();
		}
		var headerNode = this.refs.header.getDOMNode();
		if (headerNode.offsetHeight != this.state.headerHeight) {
			this.setState({headerHeight: headerNode.offsetHeight});
		}
	},
	render: function() {
		var self = this;
		var listprop = this.props.list;
        var cntr = 0;

		// TODO add this to config
		var top = CONFIG.verticalPadding - 20;
		var left = CONFIG.leftMargin;
		var style={
			right:'30px', top: top, left:left, position: 'absolute'
		}

		var query = this.props.view.query;
		var filters = this.props.view.filters;
		var limit = this.state.loaded;
		var puffs = PuffForum.getPuffList(query, filters, limit).filter(Boolean);
		puffs = this.sortPuffs(puffs);

		var containerHeight = this.getScreenCoords().height - this.state.headerHeight + 6;
		return (
			<div style={style} className="listview">
				<RowHeader ref="header" column={this.props.list.column} bar={this.props.list.bar} sort={this.props.list.sort}/>
				<div ref="container" className="listrowContainer" style={{maxHeight: containerHeight.toString()+'px'}}>
                    {puffs.map(function(puff, index){
                        cntr++;
						return <RowSingle key={index} puff={puff} column={self.props.list.column} bar={self.props.list.bar}  view={self.props.view} cntr={cntr} />
					})}
					<div className="listfooter listrow" >{this.state.noMorePuff ? "End of puffs." : "Loading..."}</div>
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

var RowSortIcon = React.createClass({
	handleSort: function() {
		var col = this.props.col;
		if (this.props.sort.column != col) {
			return events.pub('ui/sort-by/'+col, 
					{'list.sort.column': col})
		} else {
			var desc = !this.props.sort.desc;
			return events.pub('ui/sort-by/'+col, 
					{'list.sort.desc': desc})
		}
	},
	render: function() {
		if (!this.props.allowSort)
			return <span></span>;
		var col = this.props.col;
		var iconClass = "fa-sort";
		if (this.props.sort.column == col) {
			if (this.props.sort.desc) iconClass = "fa-sort-desc";
			else iconClass = "fa-sort-asc";
		}
		return <a href="#" onClick={this.handleSort}><i className={"fa fa-fw " + iconClass}></i></a>
	}
})

var RowHeader = React.createClass({
	mixins: [ComputeDimensionMixin, TooltipMixin],
    handleManageCol: function() {
    	if (this.props.bar.showIcons == 'header') {
	    	return events.pub('ui/row/hide-all', 
	    		{'list.bar.showIcons': false});
    	} else {
	    	return events.pub('ui/row/show-all', 
	    		{'list.bar.showIcons': 'header'});
    	}
    },

    handleRemove: function(col) {
        var jsonToSet = {};
        jsonToSet['list.column.'+col+'.show'] = false;
        return events.pub('ui/show-hide/col', jsonToSet);
    },

	render: function() {
		var columnProp = this.props.column;
		var columns = Object.keys(columnProp);
		columns = columns.filter(function(c){return columnProp[c].show});
		var self = this;

        var polyglot = Translate.language[puffworldprops.view.language];
		return (
			<div className="listrow listheader" key="listHeader">
				<span className="listcell" >
					<span className="listbar">
						<a href="#" onClick={this.handleManageCol}>
							<i className="fa fa-fw fa-cog"></i>
						</a>
					</span>
				</span>
					<Tooltip content={polyglot.t("rowview.tooltip.colOptions")} />
				{this.props.bar.showIcons == "header" ? <RowViewColOptions column={columnProp}/> : ""}
				{columns.map(function(c){
					var style = {
						width: self.getColumnWidth(c).toString()+'px'
					};
					var allowSort = columnProp[c].allowSort;
					return (
                            <span>
                                <span className="listcell" key={c} style={style}>
                                    {c}
                                    <RowSortIcon col={c} allowSort={allowSort} sort={self.props.sort} />
                                    <span className="listCellOptions">
                                        <a href="#" onClick={self.handleRemove.bind(self,c)} className="btn blue"><i className="fa fa-fw fa-times-circle" /></a>



                                    </span>
                                </span>

                            </span>

                        )
				})}
			</div>
		)
	}
})

var RowSingle = React.createClass({
	mixins: [ComputeDimensionMixin, RowRenderMixin, TooltipMixin],
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
    handleToggleShowIcons: function() {
    	if (this.props.bar.showIcons == this.props.puff.sig) {
	    	return events.pub('ui/row/hide-all', 
	    		{'list.bar.showIcons': false});
    	} else {
	    	return events.pub('ui/row/show-all', 
	    		{'list.bar.showIcons': this.props.puff.sig});
    	}
    },
	render: function() {
		var puff = this.props.puff;

		var columnProp = this.props.column;
		var columns = Object.keys(columnProp);
		columns = columns.filter(function(c){return columnProp[c].show});

		var self = this;

		// var height = this.computeRowHeight();
		var maxHeight = puffworldprops.view.rows * 1.4 + 1; // +1 for padding
		if (this.props.bar.expand == puff.sig) {
			maxHeight = 0;
		}

		var classArray = ['listrow'];
        if(this.props.cntr % 2) {
            var bgColor = 'rgba(245,245,245,.9)';
        } else {
            var bgcolor = 'rgba(255,255,255,.9)';
        }



        var flaggedPuff = Puffball.Persist.get('flagged') || [];
        var flagged = false;
        var outerPuff = PuffData.getBonus(puff, 'envelope');
        if (flaggedPuff.indexOf(puff.sig)!= -1 ||
            (outerPuff && flaggedPuff.indexOf(outerPuff.sig) != -1)) {
            classArray.push('flagged');
            flagged = true;
        }		

		var showIcons = this.props.bar.showIcons == puff.sig;
		return (
			<div className={classArray.join(' ')} style={{backgroundColor: bgColor}}>
				<span className="listcell" >
					<span className="listbar"><a href="#" onClick={this.handleToggleShowIcons}>
                        <img key={puff.sig} style={{marginRight: '2px', marginBottom:'2px',display: 'inline-block',verticalAlign: 'tp'}} src={getImageCode(puff.sig)}/>
					</a></span>
				{showIcons ? <RowBar puff={puff} column={columnProp} flagged={flagged}/> : null}
				</span>
				{columns.map(function(col){
					width = self.getColumnWidth(col);
					return self.render_column(col, width, maxHeight)
				})}
			</div>
		)
	}
})


var RowBar = React.createClass({
	mixins: [TooltipMixin],
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
                    <RowExpand puff={puff} />
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
		if (puffworldprops.list.bar.expand == this.props.puff.sig) {
			events.pub('ui/collapse-row', 
						{'list.bar.expand': false});
		} else {
			events.pub('ui/collapse-row', 
						{'list.bar.expand': this.props.puff.sig});
		}
		return false;
	},
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language];
        var expand = puffworldprops.list.bar.expand == this.props.puff.sig ? "compress" : "expand";
        return (
            <span className="icon">
                <a href="#" onClick={this.handleClick}>
                    <i className={"fa fa-fw fa-"+expand}></i>
                </a>
                <Tooltip position="above" content={polyglot.t("rowview.tooltip.rowExpand")} />
            </span>
        );
    }
})

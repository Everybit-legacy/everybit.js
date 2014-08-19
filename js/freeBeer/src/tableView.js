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
        var queryJSON = {}
        queryJSON.users = [this.props.puff.username];
        queryJSON.type = ['profile']

        var prof = PuffForum.getPuffList(puffworldprops.view.query,queryJSON,1);

        if(prof.length) {
            return <span><a href="#" onClick={this.handleViewUser.bind(this,this.props.puff.username)}>.{this.props.puff.username}</a> <img className="iconSized" src={prof[0].payload.content}  /></span>;
        }
        
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

    // TODO: Change the format of the links to be more normal
    handleShowTag: function(tag) {
    	return events.pub('filter/show/tag', {
    							'view.mode': 'tableView',
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

    handleViewType: function(type) {
      // do the filter
        return events.pub('filter/show/type', {
            'view.filters': {},
            'view.filters.types': [type]
        });
    },

    renderType: function() {
        var puff = this.props.puff;
        var type = puff.payload.type;
        return <span><a href="#" onClick={this.handleViewType.bind(this,type)}>{type}</a></span>;
    },

	getReferenceIcon: function(sig, type) {
		var preview = <span></span>;
		var puff = PuffForum.getPuffBySig(sig);
		if (puff.payload && puff.payload.content)
			preview = <div className="rowReferencePreview"><PuffContent puff={puff} /></div>
		var highlight = this.props.highlight || [];
		var classArray = ["rowReference"];
		if (highlight.indexOf(sig) != -1) {
			classArray.push('highlight')
		}
		return <a key={sig} className={classArray.join(' ')} onClick={this.handleShowRelationGroup.bind(this, sig, type)}>
			<img style={{marginRight: '2px', marginBottom:'2px',display: 'inline-block',verticalAlign: 'tp'}} src={getImageCode(sig)}/>{preview}
		</a>
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
		var parentIcons = parents.map(function(sig) 
							{return self.getReferenceIcon(sig, 'parent')});
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
		var childrenIcons = children.map(function(sig) 
							{return self.getReferenceIcon(sig, 'child')});
		if (children.length) 
			childrenEle = <div><span style={iconStyle}><i className="fa fa-fw fa-child"></i></span>{childrenIcons}</div>;
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
		if ((!puffs) || (puffs.length == 0))
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
                        if (listprop.relationGroup && listprop.relationGroup.sig == puff.sig) {
                        	var parent = listprop.relationGroup.parent;
                        	var child = listprop.relationGroup.child;
                        	return <RowGroupCombined middle={puff.sig} parent={parent} child={child} relationGroup={self.props.list.relationGroup}/>
                        }
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
    handleShowRelationGroup: function(sig, type) {
    	if (this.props.inGroup) return false;
    	var rowSig = this.props.puff.sig;
    	var relationGroup = PB.shallow_copy(puffworldprops.list.relationGroup) || {};
    	/*if (relationGroup.sig == rowSig) {
    		return events.pub('ui/hide-relation-group', {'list.relationGroup':false})
    	}*/
    	var parent, child;
    	if (type == 'parent') {
    		parent = sig;
    		child = "";
    	} else {
    		parent = "";
    		child = sig;
    	}
    	relationGroup = {"parent": parent, "child": child, "sig": rowSig}
    	return events.pub('ui/show-relation-group', {'list.relationGroup': relationGroup} )
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
        /*
		if (this.props.clsPlus) {
			classArray.push(this.props.clsPlus)
		}
		*/

        var flaggedPuff = Puffball.Persist.get('flagged') || [];
        var flagged = false;
        var outerPuff = PuffData.getBonus(puff, 'envelope');
        if (flaggedPuff.indexOf(puff.sig)!= -1 ||
            (outerPuff && flaggedPuff.indexOf(outerPuff.sig) != -1)) {
            classArray.push('flagged');
            flagged = true;
        }	


        if(this.props.clsPlus == "center") {
            var bgColor = 'rgba(254,254,254,.9)';
        } else if(this.props.inGroup) {
            var bgColor = 'rgba(244,244,244,.9)';
        } else {
            if(this.props.cntr % 2) {
                var bgColor = 'rgba(245,245,245,.9)';
            } else {
                var bgColor = 'rgba(255,255,254,.9)';
            }
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

var RowGroupCombined = React.createClass({
	/*getInitialState: function() {
		return {
			parentGroup: [],
			parentIndex: 0,
			childGroup: [],
			childIndex: 0
		}
	},*/
	getGroup: function(originSig, relation) {
		var group = PuffData.graph.v(originSig).out(relation).run();
		group = group
				.map(function(v){if (v.shell) return v.shell.sig})
				.filter(Boolean)
				.filter(function(s, i, array){return i == array.indexOf(s)});
		return group;
	},
	/*getMoreGroups: function(sig, type) {
		var groupArray = [];

		var group = this.getGroup(sig, type);
		while (group.length != 0) {
			var nextSig = group[0];
			groupArray.push(group.map(PuffForum.getPuffBySig));
			group = this.getGroup(nextSig, type);
		}
		return groupArray;
	},
	getGroupAndIndex: function() {
		var originSig = this.props.middle;

		var parent = this.props.parent;
		var parentGroup = this.getGroup(originSig, 'parent');
		var parentIndex = Math.max(parentGroup.indexOf(parent), 0);
		if (parentGroup.length) parent = parentGroup[parentIndex];
		parentGroup = parentGroup.map(PuffForum.getPuffBySig);

		var child = this.props.child;
		var childGroup = this.getGroup(originSig, 'child');
		var childIndex = Math.max(childGroup.indexOf(child), 0);
		if (childGroup.length) child = childGroup[childIndex];
		childGroup = childGroup.map(PuffForum.getPuffBySig);

		events.pub('ui/update-relation-group', 
					{'list.relationGroup': 
						{sig: originSig,
						parent: parent,
						child: child}});

		return {
			parentGroup: parentGroup,
			parentIndex: parentIndex,
			childGroup: childGroup,
			childIndex: childIndex
		}
	},
	componentDidMount: function() {
		this.setState(this.getGroupAndIndex())
	},*/
	render: function() {
		var originSig = this.props.relationGroup.sig;

		var parent = this.props.relationGroup.parent;
		var parentGroup = this.getGroup(originSig, 'parent');
		var parentIndex = Math.max(parentGroup.indexOf(parent), 0);
		if (parentGroup.length) parent = parentGroup[parentIndex];
		parentGroup = parentGroup.map(PuffForum.getPuffBySig);

		var child = this.props.relationGroup.child;
		var childGroup = this.getGroup(originSig, 'child');
		var childIndex = Math.max(childGroup.indexOf(child), 0);
		if (childGroup.length) child = childGroup[childIndex];
		childGroup = childGroup.map(PuffForum.getPuffBySig);

		var highlight = [parent, child];

		var middle = this.props.middle;

		return (
            <div className="rowGroupCombined">

            <span>
			<RowGroup puffs={parentGroup} sig={parent} currentIndex={parentIndex} level="parent" />
			<RowGroupCenter onClick={this.handleClose} puff={PuffForum.getPuffBySig(middle)} column={puffworldprops.list.column} bar={puffworldprops.list.bar}  view={puffworldprops.view} clsPlus="center" highlight={highlight}/>
			<RowGroup puffs={childGroup} sig={child} currentIndex={childIndex} level="child" />
             </span>
		</div>
            )

	}
})

var RowGroupCenter = React.createClass({
	handleClose: function() {
		return events.pub('ui/close-relation-group', {'list.relationGroup': false})
	},
	render: function() {
		var collapseIcon = <a href="#" onClick={this.handleClose} className="rowGroupCollapse"><span><i className="fa fa-arrow-down"></i><i className="fa fa-arrow-up"></i></span></a>
		return <div className="rowGroup">{collapseIcon}<RowSingle puff={this.props.puff} column={this.props.column} bar={this.props.bar} view={this.props.view} clsPlus="center" highlight={this.props.highlight}/></div>
	}

})

var RowGroup = React.createClass({
	handleShowPrevNext: function(offset) {
		var puffList = this.props.puffs;
		var puff = PuffForum.getPuffBySig(this.props.sig);

		var total = this.props.puffs.length;
		if (total == 0) return false;
		var index = (puffList.indexOf(puff) + offset + total) % total;
		var setJSON = {};
		setJSON['list.relationGroup.'+this.props.level] = this.props.puffs[index].sig;
		return events.pub('ui/relation-group/change-'+this.props.level, setJSON);
	},
	render: function() {
		var puffList = this.props.puffs;
		if (!puffList || !puffList.length)
			return <span></span>;
		var puff = PuffForum.getPuffBySig(this.props.sig);

		var showPrev = <a className="rowGroupArrowLeft" href="#" onClick={this.handleShowPrevNext.bind(this, -1)}><i className="fa fa-chevron-left"></i></a>;
		var showNext = <a className="rowGroupArrowRight" href="#" onClick={this.handleShowPrevNext.bind(this, 1)}><i className="fa fa-chevron-right"></i></a>;
		if (puffList.indexOf(puff)-1 < 0)
			showPrev = <span></span>;
		if (puffList.indexOf(puff)+1 >= puffList.length)
			showNext = <span></span>

		var classArray=['rowGroup'];
		if (this.props.iscenter) classArray.push('center')

		return <div className={classArray.join(' ')}>
			{showPrev}
			<RowSingle puff={puff} column={puffworldprops.list.column} bar={puffworldprops.list.bar}  view={puffworldprops.view} inGroup={true}/>
			{showNext}
		</div>
	}
})

/** @jsx React.DOM */

var ComputeDimensionMixin = {
	getScreenCoords: function() {
        if(CONFIG.menuRight) {
            var margin = CONFIG.rightMargin
        } else {
            var margin = CONFIG.leftMargin
        }

        return { width:  window.innerWidth - margin
               , height: window.innerHeight - CONFIG.verticalPadding
               }
	},

	// SUSPICIOUS WIDTH FIDDLERS FOUND
	getRowWidth: function() {
		// percentage width of ICX content window
		var wRatio = 1 - ICX.config.content.insets.right - ICX.config.content.insets.left
		var screenWidth = this.getScreenCoords().width * wRatio
		var rowWidth = screenWidth - 40 // TODO : add this to config
		if (puffworldprops.view.table.format == "generation") {
			rowWidth = rowWidth - 28 // 2 * borderWidth
		}
		return rowWidth
	},
	computeRowHeight: function() {
		// height should be scaled down by the ratio of content window
		var hRatio = 1 - ICX.config.content.insets.top - ICX.config.content.insets.bottom
		var row = (parseInt(puffworldprops.view.rows) || 1)
		var screencoords = this.getScreenCoords() * hRatio
		var rowHeight = (screencoords.height-36) / row
		return rowHeight - 3 // remove marginBottom TODO : add this to CONFIG
	},
	// SUSPICIOUS WIDTH FIDDLERS FOUND
	getColumnWidth: function(c){
		var columnProps = puffworldprops.view.table.column
		var columnArr = Object.keys(columnProps)
		columnArr = columnArr.filter(function(c){return columnProps[c].show})
		if (columnArr.indexOf(c) == -1) return 0

		var rowWidth = this.getRowWidth()-27

		var weightArr = columnArr.map(function(c){return +columnProps[c].weight})
		var totalWeight = weightArr.reduce(function(prev, curr){return prev+curr})
		
		var width = rowWidth * columnProps[c].weight / totalWeight 
		return width
	}
}

var RowRenderMixin = {
    handleViewUser: function(username) {
        return Events.pub( 'filter/show/by-user',
            {
              'view.filters': {},
              'view.filters.users': [username],
              'view.mode': 'tableView'
            }
        )
    },

	render_default: function(col) {
		var metadata = this.props.puff.payload || {}
		var content = metadata[col] || ""
		return content
	},
	renderFrom: function() {        
        return <div className="username">.{this.props.puff.username}</div>
	},
	renderTo: function() {        
        return <div className="username">.{this.props.puff.routes[0]}</div>
	},
	renderUser: function() {
    },
	renderContent: function() {
		var puff = this.props.puff
		var puffcontent = PB.M.Forum.getProcessedPuffContent(puff)
		return (
			<div>
				<span dangerouslySetInnerHTML={{__html: puffcontent}}></span>
				<div className="listBarIcon">
		            <ICXReplyPuff ref="reply" sig={puff.sig} user={puff.username}/>
		        </div>
			</div>
		)
	},
	renderOther: function() {
		var puff = this.props.puff

        // If we are showing the info as a column, hide them from "other"
        var keysNotShow = ['content', 'parents'] // Never show these
        for(var k in puffworldprops.view.table.column) {
            if(puffworldprops.view.table.column[k].show == true && keysNotShow.indexOf(k)==-1) {
                keysNotShow.push(k)
            }
        }


		// var keysNotShow = ['content', 'parents']
		return <span>
			{Object.keys(puff.payload).map(function(key){
				var value = puff.payload[key]
	            if (keysNotShow.indexOf(key)==-1 && value && value.length) {
	                return <div key={key}><span className="profileKey">{key+": "}</span><span className="profileValue">{value}</span></div>
	            }
			})}
		</span>
	},
	renderDate: function() {
		var puff = this.props.puff
		var date = new Date(puff.payload.time)

        return <span className="date-since">{timeSince(date)} ago</span>

        // return <span>{date.yyyymmdd()}</span>
		/// return date.toLocaleDateString() + " " + date.toLocaleTimeString()
	},

    // TODO: Change the format of the links to be more normal
    handleShowTag: function(tag) {
    	return Events.pub('filter/show/tag', {
    							'view.mode': 'tableView',
    							'view.filters': {},
    							'view.filters.tags': [tag]
    						})
    },
	renderTags: function() {
		var puff = this.props.puff
		var tags = puff.payload.tags || []
		tags = tags.filter(function(t, index, array){return array.indexOf(t) == index})
		var self = this
		return <span>{tags.map(function(tag){
			return <a href="#" onClick={self.handleShowTag.bind(self, tag)} key={tag}><span className="bubbleNode">{tag}</span></a>
		})}</span>
	},

    handleViewType: function(type) {
      // do the filter
        return Events.pub('filter/show/type', {
            'view.filters': {},
            'view.filters.types': [type]
        })
    },
    renderType: function() {
        var puff = this.props.puff
        var type = puff.payload.type
        return <a href="#" onClick={this.handleViewType.bind(this,type)}>{type}</a>
    },

	getReferenceIcon: function(sig, type) {
		if (!sig) return <span></span>
		var preview = <span></span>
		var puff = PB.M.Forum.getPuffBySig(sig)
		if (puff.payload && puff.payload.content)
			preview = <div className="rowReferencePreview"><PuffContent puff={puff} /></div>
		var highlight = this.props.highlight || []
		var classArray = ["rowReference"]
		if (highlight.indexOf(sig) != -1) {
			classArray.push('highlight')
		}
        // TODO: wrapping this in a span squelches the DANGER error message, but any previews with anchor tags still don't show up. the underlying issue is that an anchor inside an anchor gets split into two consecutive anchors in the DOM.
        
		return (
            <span>
                <a key={sig} className={classArray.join(' ')} onClick={this.handleClickReference.bind(this, sig, type)}>
			        <img style={{marginRight: '2px', marginBottom:'2px',display: 'inline-block',verticalAlign: 'middle'}} src={getImageCode(sig)}/>{preview}
		        </a>
            </span>
        )
	},
	renderRefs: function() {
		var sig = this.props.puff.sig
		var self = this

		var parentsEle = <div></div>
		var parents = PB.Data.graph.v(sig).out('parent').run()
		parents = parents.map(function(v){if (v.shell) return v.shell.sig})
						 .filter(Boolean)
						 .filter(function(s, i, array){return i == array.indexOf(s)})
		var parentIcons = parents.map(function(sig) 
							{return self.getReferenceIcon(sig, 'parent')})
		if (parents.length) {
            parentsEle = (
                <div><i className="fa fa-fw fa-dot-circle-o"></i>{parentIcons}</div>
            )
        }

		var childrenEle = <div></div>
		var children = PB.Data.graph.v(sig).out('child').run()
		children = children.map(function(v){if (v.shell) return v.shell.sig})
						   .filter(Boolean)
						   .filter(function(s, i, array){return i == array.indexOf(s)})
		var childrenIcons = children.map(function(sig) 
							{return self.getReferenceIcon(sig, 'child')})




		if (children.length) {
                childrenEle = <div><i className="fa fa-fw">●</i>{childrenIcons}</div>
        }

		return (
            <span>
			    {parentsEle}
			    {childrenEle}
		    </span>
        )
	},
	renderScore: function() {
        var showStar = true
        var envelope = PB.Data.getBonus(this.props.puff, 'envelope')
        if(envelope && envelope.keys)
            showStar = false
		return showStar ? <PuffStar sig={this.props.puff.sig}/> : ''
	},
	render_column: function(col, width, maxHeight) {
		var style = {}
		style['width'] = width.toString() + 'px'

		if (maxHeight)
			style['maxHeight'] = maxHeight.toString() + 'em'

		var content = ""
		var cls = ['listcell']
		var functionName = "render" + col.slice(0, 1).toUpperCase() + col.slice(1)
		if (this[functionName]) {
			content = this[functionName]()
		} else {
			content = this.render_default(col)
		}
		return <span key={col} className={cls.join(' ')} style={style}>{content}</span>
	}
}

var RowSortMixin = {
	sortDate: function(p1, p2) {
		return p2.payload.time - p1.payload.time
	}, 
	getScore: function(puff) {
		var score = 0
        var starStats = PB.Data.getBonus({sig: puff.sig}, 'starStats')
        if(starStats && starStats.from) {
            score = starStats.score
        }
        return score
	},
	sortScore: function(p1, p2) {
		return this.getScore(p2) - this.getScore(p1)
	},
	sortUser: function(p1, p2){
		if (p1.username < p2.username) return -1
		if (p1.username > p2.username) return 1
		return 0
	},
	sort_column: function(col) {
		var functionName = "sort" + col.slice(0, 1).toUpperCase() + col.slice(1)
		if (this[functionName]) {
			return this[functionName]
		}
		return false
	}
}


var TableView = React.createClass({
	mixins: [ViewKeybindingsMixin, ComputeDimensionMixin, RowSortMixin],
	getInitialState: function() {
		return {loaded: CONFIG.initialLoad, 
				noMorePuff: false/*, 
				headerHeight: 0*/}
	},
	loadMore: function() {
		if (this.state.noMorePuff !== true) {
			this.setState({loaded: this.state.loaded + CONFIG.newLoad,
					   	   noMorePuff: false})
			this.refs.header.forceUpdate()
		}
		return false
	},
	handleScroll: function() {
		var ele = document.body
		if (ele.scrollTop - ele.scrollHeight + ele.offsetHeight == 0) {
			if (!this.isMounted()) {
				// handle error with reactjs warning
				return false
			}
			this.setState({noMorePuff: 'load'})
			setTimeout(this.loadMore, 10)
		}
	},
	sortPuffs: function(puffs) {
		var col = puffworldprops.view.table.sort.column
		var desc = puffworldprops.view.table.sort.desc
		puffs = puffs || []
		var fn = this.sort_column(col)
		if (fn === false) {
			console.log('Missing sort function', col)
			return puffs
		}
		puffs = puffs.sort(function(p1, p2){
			if (desc) return fn(p1, p2)
			else return -fn(p1, p2)
		})
		return puffs
	},
	handleForceLoad: function() {
		var query = Boron.shallow_copy(this.props.view.query)
		query.offset = (+query.offset || 0) + this.state.loaded
		var filters = puffworldprops.view.filters
		var limit = 10
		var puffs = PB.M.Forum.getPuffList(query, filters, limit)
		if ((!puffs) || (puffs.length == 0)) {
			this.setState({noMorePuff: true})
		} else {
			this.loadMore()
		}
		return false
	},
	componentDidMount: function() {
		window.addEventListener("scroll", this.handleScroll)
	},
	componentDidUpdate: function(prevProp, prevState) {
		if (prevProp.view.query != this.props.view.query || 
			prevProp.view.filters != this.props.view.filters) {
			// set noMorePuff back to false when filters/query has changed
			this.setState({noMorePuff: false})
		}
		if (this.refs.header) {
			var headerNode = this.refs.header.getDOMNode()
			if (headerNode.offsetHeight != this.state.headerHeight) {
				this.setState({headerHeight: headerNode.offsetHeight})
			}
		}
	},
	render: function() {
		var self = this
        var cntr = 0

		var footer = <div></div>
		if (this.state.noMorePuff === true) {
			footer = <div className="listfooter listrow" style={{minWidth: this.getRowWidth()}}>End of puffs.</div>
		} else if (this.state.noMorePuff === 'load') {
			footer = <div className="listfooter listrow" style={{minWidth: this.getRowWidth()}}>Loading...</div>
		} else {
			footer = <div className="listfooter listrow" style={{minWidth: this.getRowWidth()}}><a href="#" onClick={this.handleForceLoad}>Ask for more puffs.</a></div>
		}
		if (puffworldprops.view.table.format == "list") {
			var query = puffworldprops.view.query
			var filters = puffworldprops.view.filters
			var limit = this.state.loaded
			var puffs = PB.M.Forum.getPuffList(query, filters, limit).filter(Boolean)
			puffs = this.sortPuffs(puffs)	

			return (
				<div className="listview">
					<RowHeader ref="header" />
					<div ref="container" className="listrowContainer">
	                    {puffs.map(function(puff, index){
	                        cntr++
							return <RowSingle key={index} puff={puff} cntr={cntr} />
						})}
						{footer}
					</div>
				</div>
			)
		} else if (puffworldprops.view.table.format == "generation") {
			var focus = puffworldprops.view.query.focus
			return (
				<div style={style} className="listview">
					<RowHeader ref="header" />
					<div ref="container" className="listrowContainer" style={{marginTop: '46px'}}>
						<RowBox puff={PB.M.Forum.getPuffBySig(focus)} lastClick={puffworldprops.view.table.lastClick} />
					</div>
				</div>
			)
		}
		return <span></span>
	}
})


var TableViewColOptions = React.createClass({
	handleCheck: function(col) {
		var columnProp = puffworldprops.view.table.column
		var currentShow = columnProp[col].show
		var jsonToSet = {}
		jsonToSet['view.table.column.'+col+'.show'] = !currentShow
		return Events.pub('ui/view/table/col', jsonToSet)
	},
	render: function() {
		var columnProp = puffworldprops.view.table.column
		var possibleCols = Object.keys(columnProp)
		var self = this
		return (
			<div className="tableViewColOptions">
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
		var col = this.props.col
		if (puffworldprops.view.table.sort.column != col) {
			return Events.pub('ui/view/table/sort-by/'+col, {'view.table.sort.column': col})
		} else {
			var desc = !puffworldprops.view.table.sort.desc
			return Events.pub('ui/view/table/sort-by/'+col, {'view.table.sort.desc': desc})
		}
	},
	render: function() {
		if (!this.props.allowSort)
			return <span></span>
		var col = this.props.col
		var iconClass = "fa-sort"
		if (puffworldprops.view.table.sort.column == col) {
            if (puffworldprops.view.table.sort.desc) {
                iconClass = "fa-sort-desc"
            } else {
                iconClass = "fa-sort-asc"
            }
		}
		return <a href="#" onClick={this.handleSort}><i className={"fa fa-fw " + iconClass}></i></a>
	}
})

var RowHeader = React.createClass({
	mixins: [ComputeDimensionMixin, TooltipMixin],
	getInitialState: function() {
		return {showColOptions: false}
	},
    handleManageCol: function() {
    	this.setState({showColOptions: !this.state.showColOptions})
    	return false
    },
    handleHideColOptions: function() {
    	this.setState({showColOptions: false})
    	return false
    },

	render: function() {

		// filters out columns not needed to display
		var columnProp = puffworldprops.view.table.column
		var columns = Object.keys(columnProp)
		columns = columns.filter(function(c){return columnProp[c].show})

		var self = this

        var polyglot = Translate.language[puffworldprops.view.language]
        var headerStyle = {}
        if (puffworldprops.view.table.format == 'generation') {
        	headerStyle = {'paddingLeft': '14px', 'paddingRight': '14px'}
        }
		return (
			<div className="listrow listheader" key="listHeader" style={headerStyle} onMouseLeave={this.handleHideColOptions}>
				<span className="listcell" >
					<span className="listbar">
						<a href="#" onClick={this.handleManageCol}>
							<i className="fa fa-fw fa-cog"></i>
						</a>
					</span>
				</span>
					<Tooltip content={polyglot.t("tableview.tooltip.col_options")} />
				{this.state.showColOptions ? <TableViewColOptions /> : ""}
				{columns.map(function(c){
					var style = {
						width: self.getColumnWidth(c).toString()+'px' //this width needs to be fixed
					}
					var allowSort = columnProp[c].allowSort
					return (
                        <span className="listcell headertext" key={c} style={style}>
                            {c}
                            <RowSortIcon col={c} allowSort={allowSort} />
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
        return { showAll: false, 
        		 showBar: false,
        		 showIcons: false}
    },
	addColumn: function() {
		var metadata = this.props.puff.payload
		var currentColumns = Object.keys(puffworldprops.view.table.column)
		for (var col in metadata) {
			if (metadata[col] && metadata[col].length > 0 && 
				currentColumns.indexOf(col) == -1 &&
				col != 'parents') {
				var jsonToSet = {}
				jsonToSet['view.table.column.'+col] = Boron.shallow_copy(CONFIG.defaultColumn)
				update_puffworldprops(jsonToSet)
			}
		}
		return Events.pub('ui/view/table/new-column', {})
	},
	componentDidMount: function() {
		this.addColumn()
	},
    handleToggleShowIcons: function() {
    	this.setState({showIcons: !this.state.showIcons})
    	return false
    },
    handleShowRelationGroup: function(sig, type) {
    	if (this.props.inGroup) return false
    	var rowSig = this.props.puff.sig
    	var relationGroup = Boron.shallow_copy(puffworldprops.view.table.relationGroup) || {}
    	/*if (relationGroup.sig == rowSig) {
    		return Events.pub('ui/hide-relation-group', {'view.table.relationGroup':false})
    	}*/
    	var parent, child
    	if (type == 'parent') {
    		parent = sig
    		child = ""
    	} else {
    		parent = ""
    		child = sig
    	}
    	relationGroup = {"parent": parent, "child": child, "sig": rowSig}
    	return Events.pub('ui/view/show-relation-group', {'view.table.relationGroup': relationGroup} )
    },
    handleClickReference: function(sig) {
		return Events.pub('ui/show-generation', {'view.query.focus': this.props.puff.sig,
												 'view.table.lastClick': sig,
												 'view.table.format': 'generation',
												 'view.filters': {}})
    },
    handleOverRow: function(e){
    	if (!this.isMounted()) return false // fix react warning when scrolling

    	var showBar = this.state.showBar
    	if (e.type == "mouseleave") {
    		this.setState({showBar: false, showIcons: false})
    	} else if (e.type == "mouseenter") {
    		this.setState({showBar: true})
    	}
    	return false
    },
	render: function() {
		var puff = this.props.puff
		if (!puff.sig) {return <span></span>}

		var columnProp = puffworldprops.view.table.column
		var columns = Object.keys(columnProp)
		columns = columns.filter(function(c){return columnProp[c].show})

		var self = this

		// var height = this.computeRowHeight()
		var maxHeight = puffworldprops.view.table.maxRowHeight
		if (puffworldprops.view.table.bar.expand == puff.sig) {
			maxHeight = 0
		}

		var classArray = ['listrow']

        var flaggedPuff = PB.Persist.get('flagged') || []
        var flagged = false
        var outerPuff = PB.Data.getBonus(puff, 'envelope')
        if (flaggedPuff.indexOf(puff.sig)!= -1 ||
            (outerPuff && flaggedPuff.indexOf(outerPuff.sig) != -1)) {
            classArray.push('flagged')
            flagged = true
        }	
        var envelope = PB.Data.getBonus(this.props.puff, 'envelope')
        if(envelope && envelope.keys)
            classArray.push('encrypted')

        var additionStyle = {}
        if (!this.props.direction) {
            if(this.props.cntr % 2) {
                additionStyle.backgroundColor = 'rgba(245,245,245,.9)'
            } else {
                additionStyle.backgroundColor = 'rgba(255,255,254,.9)'
            }
            // additionStyle.borderRight = '14px solid #ABAAB5'
        } else if (this.props.direction == 'main') {
            additionStyle.backgroundColor = 'rgba(255,255,254,.9)'
            additionStyle.borderLeft = '14px solid rgba(0,128,0,.8)'
            additionStyle.borderRight = '14px solid rgba(0,128,0,.8)'
            // additionStyle.outline = '2px solid'
        } else {
	        if(this.props.level % 2) {
	            additionStyle.backgroundColor = 'rgba(255,255,254,.9)'
	        } else {
	            additionStyle.backgroundColor = 'rgba(245,245,245,.9)'
	        }
            // additionStyle.borderRight = '14px solid #ABAAB5'
        }

        // additionStyle.width = this.getRowWidth().toString() + 'px'
		var barClass = ['listbar']
        var pufficonClass = ['listbar']
		var wrenchElement = <img src={getImageCode(this.props.puff.sig)}/>


		return (
            <div className={classArray.join(' ')} style={additionStyle} onMouseEnter={this.handleOverRow} onMouseLeave={this.handleOverRow}>
                <span className="listcell" >
                    {wrenchElement}
                </span>
                {columns.map(function(col){
                    width = self.getColumnWidth(col)
                    return self.render_column(col, width, maxHeight)
                })}
                { this.props.showArrow ? <div className="rowArrow"></div> : null }
            </div>
        )
	}
})

var RowBox = React.createClass({
	getInitialState: function() {
		return {
			parentSelected: [],
			parentGroups: [], 
			childSelected: [],
			childGroups: []
		}
	},
	getGroup: function(originSig, relation) {
		var group = PB.Data.graph.v(originSig).out(relation).run()
		group = group
				.map(function(v){return v.shell})
				.filter(Boolean)
				.filter(function(s, i, array){return i == array.indexOf(s)})
		return group
	},
	getMoreGroups: function(sig, relation) {
		var groupArray = []
		var group = this.getGroup(sig, relation)
		var level = 2 // start from 2 since 1st generation is the row that's changing itself
		while (group.length != 0 && level < CONFIG.maxGeneration) {
			var nextSig = group[0].sig // default to first item in list
			// groupArray.push(group.map(PB.M.Forum.getPuffBySig))
			groupArray.push(group)
			level = level + 1
			group = this.getGroup(nextSig, relation)
		}
		return groupArray
	},
	regenerateGroups: function(originSig, targetSig, dir, originLevel) {
		var group = this.getGroup(originSig, dir)
		if (!group.length) {
			var newStateToSet = {}
			newStateToSet[dir+'Selected'] = []
			newStateToSet[dir+'Groups'] = []
			return this.setState(newStateToSet)
		}

		var firstIndex = -1
		for (var i=0; i<group.length && firstIndex==-1; i++) {
			if (group[i].sig == targetSig)
				firstIndex = i
		}
		if (firstIndex == -1) {
			firstIndex = 0
			targetSig = group[0]
		}
		var additionGroups = targetSig.length ? this.getMoreGroups(targetSig, dir) : []

		var indexArray = [firstIndex]
							.concat(additionGroups.map(function(){return 0}))
		var groupArray = [group].concat(additionGroups)

		var newSelected = Boron.shallow_copy(this.state[dir+'Selected'])
		if (originLevel != -1) {
			newSelected = newSelected.slice(0, originLevel+1)			
		} else {
			newSelected = []
		}
		newSelected = newSelected.concat(indexArray)

		var newGroups = Boron.shallow_copy(this.state[dir+'Groups'])
		if (originLevel != -1) {
			newGroups = newGroups.slice(0, originLevel+1)
		} else {
			newGroups = []
		}
		newGroups = newGroups.concat(groupArray)
		var newStateToSet = {}
		newStateToSet[dir+'Selected'] = newSelected
		newStateToSet[dir+'Groups'] = newGroups
		this.setState(newStateToSet)
		return false
	},
	handleShowPrevNext: function(offset, originalPuff, dir, level) {
		var currentLevel = this.state[dir+'Groups'][level]
		var newIndex = this.state[dir+'Selected'][level] + offset
		var targetSig = currentLevel[newIndex].sig

		var prevLevelSig = this.props.puff.sig
		if (level > 0) {
			var prevLevelIndex = this.state[dir+'Selected'][level-1]
			prevLevelSig = this.state[dir+'Groups'][level-1][prevLevelIndex.toString()].sig
		}
		return this.regenerateGroups(prevLevelSig, targetSig, dir, level-1)
	},
	getInitialGroups: function() {
		var lastClick = puffworldprops.view.table.lastClick || ""
		this.regenerateGroups(this.props.puff.sig, lastClick, 'parent', -1)
		this.regenerateGroups(this.props.puff.sig, lastClick, 'child', -1)
	},
	componentDidUpdate: function(prevProps, prevState) {
		if (prevProps.puff != this.props.puff || prevProps.lastClick != this.props.lastClick) {
			this.getInitialGroups()
			this.refs.main.getDOMNode().scrollIntoView(true)
		}
	},
	componentDidMount: function() {
		this.getInitialGroups()
	},
	handleClose: function() {
		return Events.pub('ui/switch-to-list', {'view.table.format': 'list'})
	},
	render: function() {
		var highlight = []
		var self = this

		// parent
		var parentGroupsCombined = <span></span>
		var parentGroups = Boron.shallow_copy(this.state.parentGroups)
		if (parentGroups.length) {
			var parentSelected = Boron.shallow_copy(this.state.parentSelected)
			if (!parentSelected || !parentSelected.length) {
				parentSelected = parentGroups.map(function(){return 0})
			}

			// add first parent to highlight
			var parent = parentGroups[0][parentSelected[0]]
			parent = parent.sig ? parent.sig : parent
			highlight.push(parent)

			// for display, need to reverse parentGroups and parentSelected
			parentGroups.reverse()
			parentSelected.reverse()
			var totalLevel = parentGroups.length
			parentGroupsCombined = <div>
				{parentGroups.map(function(group, index){
					var puffIndex = parentSelected[index]
					var parent = group[puffIndex]

					var highlight = []
					if (typeof parentSelected[index-1] !== 'undefined') {
						var p = parentGroups[index-1][parentSelected[index-1]]
						if (p) {
							p = p.sig ? p.sig : p
							highlight.push(p)
						}
					} 
					if (typeof parentSelected[index+1] !== 'undefined') {
						var p = parentGroups[index+1][parentSelected[index+1]]
						if (p) {
							p = p.sig ? p.sig : p
							highlight.push(p)
						}
					} else {
						highlight.push(self.props.puff.sig)
					}
					var level = totalLevel - 1 - index
					return <RowGroup key={"parent"+index} puffs={group.map(PB.M.Forum.getPuffBySig)} sig={parent} direction="parent" level={level} highlight={highlight} boxShowPrevNext={self.handleShowPrevNext} cntr={self.props.cntr} showArrow={true}/>
				})}
			</div>
		}

		// child
		var childGroupsCombined = <span></span>
		var childGroups = Boron.shallow_copy(this.state.childGroups)
		if (childGroups.length) {
			var childSelected = Boron.shallow_copy(this.state.childSelected)
			if (!childSelected || !childSelected.length) {
				childSelected = childGroups.map(function(){return 0})
			}

			// add first child to highlight
			var child = childGroups[0][childSelected[0]]
			child = child.sig ? child.sig : child
			highlight.push(child)

			childGroupsCombined = <div>
				{childGroups.map(function(group, index){
					var puffIndex = childSelected[index]
					var child = group[puffIndex]

					var highlight = []
					if (typeof childSelected[index+1] !== 'undefined') {
						var p = childGroups[index+1][childSelected[index+1]]
						if (p) {
							p = p.sig ? p.sig : p
							highlight.push(p)
						}
					} 
					if (typeof childSelected[index-1] !== 'undefined') {
						var p = childGroups[index-1][childSelected[index+1]]
						if (p) {
							p = p.sig ? p.sig : p
							highlight.push(p)
						}
					} else {
						highlight.push(self.props.puff.sig)
					}
					var level = index
					return <RowGroup key={"child"+index} puffs={group.map(PB.M.Forum.getPuffBySig)} sig={child} direction="child" level={level} highlight={highlight} boxShowPrevNext={self.handleShowPrevNext} cntr={self.props.cntr} showArrow={level != childGroups.length-1}/>
				})}
			</div>
		}

		var collapseIcon = <a href="#" onClick={this.handleClose} className="rowGroupCollapse"><span><i className="fa fa-arrow-down"></i><i className="fa fa-arrow-up"></i></span></a>

		return (
        <div className="rowBox">
            {parentGroupsCombined}
            <div className="rowGroup" ref="main">
				<RowSingle puff={this.props.puff} cntr={this.props.cntr} direction="main" highlight={highlight} level={-1} showArrow={childGroups.length}/>
            </div>
            {childGroupsCombined}
		</div>
        )
	}
})

var RowGroup = React.createClass({
	handleShowPrevNext: function(offset) {
		var boxShowPrevNext = this.props.boxShowPrevNext
		if (!boxShowPrevNext) return false

		return boxShowPrevNext(offset, PB.M.Forum.getPuffBySig(this.props.sig), this.props.direction, this.props.level)
	},
	render: function() {
		var puffList = this.props.puffs
		var puff = PB.M.Forum.getPuffBySig(this.props.sig)
		if (!puffList || !puffList.length || !puff)
			return <span></span>

        var additionalStyle = {}
		var showPrev = <a className="rowGroupArrowLeft" href="#" onClick={this.handleShowPrevNext.bind(this, -1)}><i className="fa fa-chevron-left"></i></a>
		var showNext = <a className="rowGroupArrowRight" href="#" onClick={this.handleShowPrevNext.bind(this, 1)}><i className="fa fa-chevron-right"></i></a>
		if (puffList.indexOf(puff)-1 < 0) {
            additionalStyle.backgroundColor = '#ABAAB5'
            var showPrev = <span></span>
        }
		if (puffList.indexOf(puff)+1 >= puffList.length) {
            additionalStyle.backgroundColor = '#ABAAB5'
            var showNext = <span></span>
        }

        // Make the main one green
        if(this.props.direction == 'main') {
            additionalStyle.backgroundColor = 'rgba(0, 88, 0, 0.8);'
        } else {
            additionalStyle.marginLeft = '14px'
            additionalStyle.marginRight = '14px'
        }

		return (
            <div className='rowGroup' style={additionalStyle}>
                {showPrev}
                <RowSingle puff={puff} column={puffworldprops.view.table.column} bar={puffworldprops.view.table.bar}  view={puffworldprops.view} highlight={this.props.highlight} direction={this.props.direction} level={this.props.level} cntr={this.props.cntr} showArrow={this.props.showArrow}/>
                {showNext}
		    </div>
        )
	}
})

var RowBar = React.createClass({
	mixins: [TooltipMixin],
    getInitialState: function() {
    },
    render: function() {
        var puff = this.props.puff

        return (
        	<div>
        <div className="listBarIcon">
            <RowExpand puff={puff} />
        </div>
        <div className="listBarIcon">
            <ICXReplyPuff ref="reply" sig={puff.sig} />
        </div>
            </div>
        )
    }
})

var RowExpand = React.createClass({
	handleClick: function() {
		if (puffworldprops.view.table.bar.expand == this.props.puff.sig) {
			Events.pub('ui/view/table/collapse-row',
						{'view.table.bar.expand': false})
		} else {
			Events.pub('ui/view/table/collapse-row',
						{'view.table.bar.expand': this.props.puff.sig})
		}
		return false
	},
    render: function() {
        var polyglot = Translate.language[puffworldprops.view.language]
        var expand = puffworldprops.view.table.bar.expand == this.props.puff.sig ? "compress" : "expand"
        return (
            <span className="icon">
                <a href="#" onClick={this.handleClick}>
                    <i className={"fa fa-fw fa-"+expand}></i>
                </a>
                <Tooltip position="above" content={polyglot.t("tableview.tooltip.row_expand")} />
            </span>
        )
    }
})

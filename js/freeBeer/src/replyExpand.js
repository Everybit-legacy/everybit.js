/** @jsx React.DOM */


var PuffPublishFormExpand = React.createClass({
    mixins: [TooltipMixin],
    componentDidMount: function(){
        var el = this.getDOMNode();
        draggableize(el);

    },
    render: function() {
        if (!puffworldprops.reply.expand) {
            return <span></span>
        }
        return (
            <div id="replyFormExpand">
                <PuffPublishFormEmbed reply={this.props.reply}/>
            </div>
        )
    }
});


var PopoutCluster = React.createClass({
    mixins: [TooltipMixin],
    render: function() {
        if (!this.props.section) {
            return <span></span>
        } 
        var section = this.props.section;
        var cluster = <Cluster clusterName={section} view={this.props.view} clusterPath={'ui/clusters/'+section} clusterPropPath={'clusters.'+section} isPopout={true}/>
        return (
            <div className="expand">
                {cluster}
            </div>
        )
    }
})
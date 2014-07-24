/** @jsx React.DOM */

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
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
/** @jsx React.DOM */


var PuffPublishFormExpand = React.createClass({
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
})

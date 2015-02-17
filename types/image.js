PB.Data.addContentType('image', {
    toHtml: function(content) {
        if(puffworldprops.view.mode == "tableView")
            return '<img src=' + content + ' />';
        else
            return '<img class="imgInBox" src=' + content + ' />';
    }
})

EB.Data.addContentType('profile', {
    toHtml: function(content, puff) {
        if(puffworldprops.view.mode == "tableView")
            return '<img src=' + content + ' />';
        else
            return '<img class="imgInBox" src=' + content + ' />';
        /*var keysNotShow = ['content', 'type'];
        for (var key in puff.payload) {
            var value = puff.payload[key];
            if (keysNotShow.indexOf(key)==-1 && value && value.length) {
                toRet += '<div><span class="profileKey">' + key + ': </span><span class="profileValue">' + value + '</span></div>';
            }
        }*/
    }
})

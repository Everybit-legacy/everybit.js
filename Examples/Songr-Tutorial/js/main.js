PB.init();

PB.M.Forum.addContentType('audio', {
    toHtml: function(content) {
        return '<audio controls><source src=' + content + ' type=\"audio/mpeg\">' + '</audio>'
    }
});



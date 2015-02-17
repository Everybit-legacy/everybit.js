PB.Data.addContentType('markdown', {
    toHtml: function(content) {
        var converter = new Markdown.Converter();
        return '<span>'+converter.makeHtml(content)+'</span>';
    }
})

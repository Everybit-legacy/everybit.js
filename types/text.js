EB.Data.addContentType('text', {
    toHtml: function(content) {
        var safe_content = XBBCODE.process({ text: content })   // not ideal, but it does seem to strip out raw html
        safe_content.html = safe_content.html.replace(/\n/g, '</br>');  // Set line breaks
        return '<span>' + safe_content.html + '</span>'
    }
})

EB.Data.addContentType('file', {
    toHtml: function(content, puff) {
        return puff.payload.filename
    }
})

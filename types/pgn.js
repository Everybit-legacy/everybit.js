// Used to display chess boards
EB.Data.addContentType('PGN', {
    toHtml: function(content) {
        return chessBoard(content);
    }
})

// Used to display chess boards
PB.Data.addContentType('PGN', {
    toHtml: function(content) {
        return chessBoard(content);
    }
})

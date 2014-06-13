/**
 *
 * @param chess from class chess.js
 * @return HTML string for display of board
 */
function chessBoard(content) {
    // var num = puff.sig;
    var chess = new Chess();
    chess.load_pgn(content);
    var letters = 'abcdefgh';

    var htmlToWrite = '<div class="stretchy-wrapper"><div>';
    htmlToWrite += '<table class="chessTable">';
    for(m = 1; m <= 8; m++) {
        htmlToWrite += '<tr>';
        for (i = 0; i < 8; i++) {
            var n = letters[i];
            var cell = n + m;

            colorIndex = (m + i) % 2;
            if (colorIndex) {
                classToUse = 'chessSquareWhite'
            } else {
                classToUse = 'chessSquareBlack'
            }
            htmlToWrite += '<td class="'+classToUse+'">';
            var cellInfo = chess.get(cell);
            if(cellInfo) {
                var code = cellInfo.color + cellInfo.type;
                htmlToWrite += '<img src="img/chess/' + code + '.png" class="chessPiece"  />';
            } else {
                htmlToWrite += '<img src="img/chess/blank.png" class="chessPiece" />';
            }
            htmlToWrite += '</td>';
        }
        htmlToWrite += '</tr>';
    }

    htmlToWrite += '</table>';
    htmlToWrite += '</div></div>';

    return htmlToWrite;
}

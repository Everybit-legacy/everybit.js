/**
* Functions related to menu options
*
*/


function getBlockchian() {
    if((typeof PuffForum.userinfoLivesHereForNow.username === 'undefined') || PuffForum.userinfoLivesHereForNow.username === '') {
        return false;
    } else {

        // return
        var blocks = Puff.Blockchain.exportChain(PuffForum.userinfoLivesHereForNow.username);
        var linkData = encodeURIComponent(JSON.stringify(blocks))

        // var linkHTML = '<a href="data:application/octet-stream;charset=utf-8;base64,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';
        // var linkHTML = '<a href="data:text/json,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';

        // pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        // pom.setAttribute('download', filename);

        var linkHTML = '<a download="blockchain.json" href="data:text/plain;charset=utf-8,' + linkData + '">DOWNLOAD BLOCKCHAIN</a>';

        document.getElementById('blockchainLink').innerHTML = linkHTML;
    }
}
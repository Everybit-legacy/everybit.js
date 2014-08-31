var Scrape = {};

Scrape.LIST = [];

Scrape.userCreate = function(parent, signingKey, username, privateRk, privateAk, privateDk) {
    
    var resultDiv = document.getElementById('userCreateResult');
    //resultDiv.innerHTML += parent + '<br>';
    
    var prom = PB.getUserRecord(username)
            .then(function() {
                resultDiv.innerHTML += username + ' exist <br>';
                Scrape.rec();
            })
            .catch(function(){
                resultDiv.innerHTML += username + ' DNE <br>';
                //Scrape.rec();
                var res = PuffNet.registerSubuser(
                    parent, signingKey, username, 
                    PB.Crypto.privateToPublic(privateRk),
                    PB.Crypto.privateToPublic(privateAk),
                    PB.Crypto.privateToPublic(privateDk));
                if (resultDiv) {
                    res.then(function(userRecord) {
                            resultDiv.innerHTML += username + ' success ' + '<br>';
                            Scrape.rec();
                        })
                       .catch(function(err) {
                            resultDiv.innerHTML += username + ' fail ' + err.message + '<br>';
                        });
                };
            });
    
};

Scrape.rec = function() {
    if (Scrape.LIST.length == 0) {
        console.log("done.");
        return false;
    }
    var item = Scrape.LIST.shift();
    Scrape.userCreate.apply(null, item);
};
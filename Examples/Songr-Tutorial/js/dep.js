    function prepareNewAccount(username, password) {
        var prependedPassword = username + passphrase;
        var privateKey = PB.Crypto.passphraseToPrivateKeyWif(prependedPassword);
        var publicKey = PB.Crypto.privateToPublic(privateKey);

        var rootKeyPublic     = publicKey;
        var adminKeyPublic    = publicKey;
        var defaultKeyPublic  = publicKey;

        var privateRootKey    = privateKey;
        var privateAdminKey   = privateKey;
        var privateDefaultKey = privateKey;

        var payload = {
            requestedUsername: username,
            rootKey: rootKeyPublic,
            adminKey: adminKeyPublic,
            defaultKey: defaultKeyPublic
        }

        var routes = [];
        var type = 'updateUserRecord';
        var content = 'requestUsername';

        return PB.Puff.build(username, privateAdminKey, routes, type, content, payload);
    }

    function handleSignup() {
        var requestedUser = $('#username').val();
        var password = $('#password').val();
        if (requestedUser.length < 10 || password.length < 10) {
            //have to check if this user is already registered
            alert("Usernames and passwords must be at least 10 characters long") // make sure to explain how this works with everybit in the html
            return false;
        } else {
            var prependedPassword = requestedUser + password; // explain why we do this
            var privateKey = PB.Crypto.passphraseToPrivateKeyWif(prependedPassword) // explain this function
            var publicKey = PB.Crypto.privateToPublic(privateKey);

            var payload = {
                requestedUsername: newUsername,
                defaultKey: publicKey,
                adminKey: publicKey,
                rootKey: publicKey,
                time: Date.now()
            }

            var routing = [] // THINK: DHT?
            var content = 'requestUsername'
            var type    = 'updateUserRecord'


            var puff = PB.Puff.build('updateUserRecord', privateKey, routing, type, content, payload)

            var prom = PB.Net.updateUserRecord(puff);

            prom.then(function(userRecord) {
                PB.addAlias(userRecord.username, userRecord.username, 1, privateKey, privateKey, privateKey, {passphrase: passphrase});
                PB.switchIdentityTo(userRecord.username);
            })
        }
    }
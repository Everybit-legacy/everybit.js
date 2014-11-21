/*

    Data management for the EveryBit platform.
    
    All puff-related data flows through here:
    caching, persistence, optimizations and network access are  handled within this module.

    Copyright 2014 EveryBit. See README for license information.

 */

PB.Data = {}
// PB.Data.puffs = []
PB.Data.bonii = {}
PB.Data.shells = []
PB.Data.shellSort = {}
// PB.Data.shelf = []
PB.Data.pendingPuffPromises = {}

PB.Data.profiles = {}

PB.Data.init = function(options) {
    if(!options.disablePublicPuffs)
        PB.Data.importShells()                                          // preload relevant shells
    PB.addBeforeSwitchIdentityHandler(PB.Data.removeAllPrivateShells)   // clear private caches
}


///////////////// new graph stuff ////////////////////

PB.Data.addSigAsVertex = function(sig) {
    var matches = PB.Data.graph.v(sig).run()
    
    if(matches.length) return false         // returns false if nothing happens
    
    return PB.Data.graph.addVertex({_id: sig, name: sig, type: 'shell'}) || true
}

PB.Data.addShellAsVertex = function(shell) {
    var matches = PB.Data.graph.v(shell.sig).run()
    
    if(!matches.length)
        return PB.Data.graph.addVertex({ _id: shell.sig, name: shell.sig, shell: shell, type: 'shell' }) || true
    
    var vertex = matches[0]
    if(vertex.shell) return false           // NOTE: returns false if it does nothing
    
    return vertex.shell = shell             // NOTE: mutation & pointer setting
}

PB.Data.addShellUsernameAsVertex = function(shell) {
    //// add shell.username to graph and connect them up
    
    var username = shell.username
    var matches = PB.Data.graph.v(username).run()
    var vertex = matches[0]
    
    if(!vertex)                             // THINK: make usernames unique like USERNAME::<username> or something
        vertex = PB.Data.graph.addVertex({ _id: username, name: username, type: 'username' })
    else
        if(PB.Data.graph.v(shell.sig).out('author').property('name').run()[0] == username)
            return false
        
    // TODO: add easy filtering by vertex type for both 'v' and also outV etc
    PB.Data.graph.addEdge({ _out: shell.sig, _in: shell.username, _label: 'author'})
}

PB.Data.graph = Dagoba.graph()

PB.Data.addToGraph = function(shells) {
    shells.forEach(PB.Data.addShellAsVertex)
    shells.forEach(PB.Data.addShellUsernameAsVertex)
    PB.runHandlers('relationship', shells)
}

// TODO: alias children() as .in('parent') and parents() as .out('parent') and use those instead (halves # of edges)

///////////////// end new graph stuff ////////////////////



PB.Data.getAllMyShells = function() {
    var publicShells = PB.Data.getPublicShells()
    var privateShells = PB.Data.getCurrentDecryptedLetters()
    return publicShells.concat(privateShells)
}


/**
 * get all currently known shells
 * @return {Shell[]}
 */
PB.Data.getShells = function() {
    //// Get all currently known shells
    // NOTE: always use this accessor instead of referencing PB.Data.shells directly, as what this function does will change.
    return PB.Data.shells
}

/**
 * get all public shells
 * @returns {Shell[]}
 */
PB.Data.getPublicShells = function() {
    //// Get all public shells
    var shells = PB.Data.getShells()
    return shells.filter(function(shell) {return !shell.keys})
}

/**
 * Get cached shells by sig
 * @param {string} sig
 * @returns {shell[]}
 */
PB.Data.getCachedShellBySig = function(sig) {
    return PB.Data.shellSort[sig]
    // return PB.Data.getShells().filter(function(shell) { return sig === shell.sig })[0]
}

/**
 * adds bonus
 * @param {object} puff
 * @param {string} key
 * @param {string} value
 */
PB.Data.addBonus = function(puff, key, value) {
    //// this simulates a WeakMap
    // THINK: we'll need to provide some GC here
    var id = puff.sig
    
    if(!PB.Data.bonii[id])
        PB.Data.bonii[id] = {}
    
    PB.Data.bonii[id][key] = value
}

/**
 * gets bonus
 * @param puff
 * @param key
 * @returns {object}
 */
PB.Data.getBonus = function(puff, key) {
    //// pull from our FauxWeakMap
    var id = puff.sig
    var puffBonii = PB.Data.bonii[id]
    return puffBonii && puffBonii[key]
}








PB.Data.addStar = function(sig, username, starsig) {
    // TODO: consider moving this to a module
    
    var fauxshell = {sig: sig} // THINK: can we formalize this?
    var starStats = PB.Data.getBonus(fauxshell, 'starStats') || {score: 0, from: {}}
    
    starStats.from[username] = starsig                                  // admittedly strange, but helpful when unstarring
    starStats.score = PB.Data.scoreStars(Object.keys(starStats.from))  // OPT: O(n^2) in stars-per-puff
    
    PB.Data.addBonus(fauxshell, 'starStats', starStats)
}

PB.Data.removeStar = function(sig, username) {
    // TODO: consider moving this to a module
    
    var fauxshell = {sig: sig} // THINK: ye gads is this ugly
    var starStats = PB.Data.getBonus(fauxshell, 'starStats') || {score: 0, from: {}}
    
    delete starStats.from[username]
    
    starStats.score = PB.Data.scoreStars(Object.keys(starStats.from))  // OPT: O(n^2) in stars-per-puff
    
    PB.Data.addBonus(fauxshell, 'starStats', starStats)
}

PB.Data.scoreStars = function(usernames) {
    
    return 0
    
    // TODO: move this into a module
    /*
    var tluScore = 0;
    var suScore = 0;
    var scorePref = Boron.shallow_copy(puffworldprops.view.score);
    for (var k in scorePref) {
        if (scorePref[k]) {
            var s = parseFloat(scorePref[k]);
            if (isNaN(s))
                s = parseFloat(puffworlddefaults.view.score[k]);
            scorePref[k] = s;
        }
    }
    
    usernames.forEach(function(username) {
        if (username.indexOf('.') == -1) {
            tluScore += scorePref.tluValue;
        } else {
            suScore += scorePref.suValue;
        }
    })
    
    var score = tluScore + Math.min(scorePref.maxSuValue, suScore);
    score = score.toFixed(1);
    if (score == parseInt(score)) score = parseInt(score);
    return score
    */
}








/*
    Some new shell handling equipment. Need to integrate this more deeply and clean and test.
*/

PB.Data.addShellsThenMakeAvailable = function(shells) {
    //// adds shells to the system, then returns a report on its progress
    
    // report.delivered: 10
    // report.valid: 8
    // report.new_shells: 7
    // report.new_puffs: 5
    // report.GC: 0
    
    // report.public: 2
    // report.stars: 0
    
    // report.private_promise: {sigs:[], failed: }
    
    // report.public_puff_sigs: []
    
    function not(fun) {return function(x) {return !fun(x)}}
    
    var report = {counts: {}}
    
    shells = Array.isArray(shells) ? shells : [shells]
    report.counts.delivered = shells.length
    
    shells = shells.filter(PB.isValidShell)
    report.counts.valid = shells.length
    
    report.meta = PB.Data.handleMetaPuffs(shells)
    
    shells = shells.filter(not(PB.Data.isMetaPuff))
    report.counts.nonmeta = shells.length
    
    report.private_promise = PB.Data.handlePrivatePuffs(shells)
    
    shells = shells.filter(not(PB.Data.isPrivatePuff))
    report.counts.public = shells.length
    
    shells = PB.Data.handleAndFilterExistingShells(shells)
    report.counts.new_public = report.counts.public - shells.length
    
    PB.Data.handleNewPublicShells(shells)
    
    shells = PB.Data.handleAndFilterByGC(shells)
    report.counts.gc = report.counts.new_public - shells.length

    report.public_puff_sigs = shells.map(PB.prop('sig'))
    
    PB.runHandlers('newPuffs', shells)
    PB.runHandlers('newPuffReport', report)
    
    return report
}


PB.Data.handleMetaPuffs = function(shells) {
    // TODO: move this to a module
    var metapuffs = shells.filter(PB.Data.isMetaPuff)
    
    metapuffs.forEach(function(shell) {
        var sig = shell.payload.content
        PB.Data.addStar(sig, shell.username, shell.sig)
    })
    
    return {stars: metapuffs.length}
}

PB.Data.isMetaPuff = function(shell) {
    // TODO: move this to a module
    return shell.payload.type == 'star'    
}


PB.Data.handlePrivatePuffs = function(shells) {
    var privatepuffs = shells.filter(PB.Data.isPrivatePuff)    
    return PB.Data.ingestEncryptedShells(privatepuffs) // TODO: this returns our promise report
}


PB.Data.isPrivatePuff = function(shell) {
    return shell.payload.type == 'encryptedpuff'
}


PB.Data.handleAndFilterExistingShells = function(shells) {
    // THINK: this can't answer the question of "did we updated an existing shell with content"?
    return shells.filter(function(shell) {
        var existing = PB.Data.getCachedShellBySig(shell.sig)

        if(existing) {
            if(existing.payload.content) return false
            if(shell.payload.content === undefined) return false    // it's an empty shell
            existing.payload.content = shell.payload.content        // add the missing content
            return true // true because we changed it
        }
    })
}


PB.Data.handleNewPublicShells = function(shells) {
    shells.forEach(function(shell) {
        PB.Data.shells.push(shell)
        PB.Data.shellSort[shell.sig] = shell
    })

    PB.Data.addToGraph(shells)
    PB.Data.rateSomePuffs(shells)
    PB.Data.persistShells()                                     // drop new stuff into localStorage
}


PB.Data.handleAndFilterByGC = function(shells) {
    var compacted = PB.Data.garbageCompactor()                  // OPT: call this earlier
    if(!compacted) return shells
    
    return shells.map(PB.prop('sig'))                            // if GC eats puffs this spits them out
                 .map(PB.Data.getCachedShellBySig)
                 .filter(Boolean)
}


/**
 * to persist shells
 * @param {Shell[]}
 * @returns {(boolean|*)}
 */
PB.Data.persistShells = function(shells) {
    if(PB.CONFIG.noLocalStorage) return false                      // THINK: this is only for debugging and development
    
    // THINK: when we receive shells directly we should compact them too
    if(!shells) 
        shells = function() {return PB.Data.getShellsForLocalStorage()} // thunked for perf
    
    // when you save shells, GC older "uninteresting" shells and just save the latest ones
    // THINK: is this my puff? then save it. otherwise, if the content is >1k strip it down.
    // THINK: we need knowledge of our user records here... how do we get that? 
    // PB.Data.interesting_usernames?
    
    // shells = shells.filter(function(shell) { return !shell.payload.content || (shell.payload.content.length < 1000) })
    
    PB.Persist.save('shells', shells)
}



PB.Data.getConversationPuffs = function(convoId, offset, batchsize) {
    offset = offset || 0
    batchsize = batchsize || PB.CONFIG.pageBatchSize || 10
    
    var prom
    prom = PB.Net.getConversationPuffs(convoId, batchsize, offset)
    prom = prom.then(PB.Data.addShellsThenMakeAvailable)
    return prom
}

PB.Data.getConversationPuffs = PB.promiseMemoize(PB.Data.getConversationPuffs, function(key, report) {
    report.private_promise.then(function() {
        PB.removePromisePending(key)
    })
})


/**
 * to import shells from local and remote sources
 */
PB.Data.importShells = function() {
    //// fetch shells from local and remote sources
    
    // THINK: this should take a set of routes so we can pass them to importRemoteShells
    
    // grab the local shells and add them to the system
    // then grab some remote shells (latest 100) and compare them
    // go back until we fill in the gaps, or hit the threshold (500?)
    
    // when you want to look at shells that don't exist, like when scrolling, grab them as a batch
    
    PB.Data.importLocalShells()
    // PB.Data.getMoreShells()
    PB.Data.importRemoteShells()
    // PB.Data.importAllStars()
}

/**
 * to import local shells
 */
PB.Data.importLocalShells = function() {   // callback) {
    // PB.Data.shells = PB.Persist.get('shells') || []
    var localShells = PB.Persist.get('shells') || []
    
    PB.Data.addShellsThenMakeAvailable(localShells)
}


PB.Data.importAllStars = function() {
    // TODO: consider moving this to a module
    var prom = PB.Net.getStarShells()
    prom.then(PB.Data.addShellsThenMakeAvailable)
}


PB.Data.horridStash = {}

PB.Data.isBadEnvelope = function(sig) {
    return PB.Data.horridStash[sig]
}

PB.Data.addBadEnvelope = function(sig) {
    PB.Data.horridStash[sig] = true
}


PB.Data.currentDecryptedLetters = []
PB.Data.currentDecryptedLetterMap = {}

PB.Data.getCurrentDecryptedLetters = function() {
    //// NOTE: always use this instead of hitting currentDecryptedLetters directly, as this function may change
    return PB.Data.currentDecryptedLetters
}

PB.Data.getDecryptedLetterBySig = function(sig) {
    if(PB.Data.currentDecryptedLetterMap[sig])
        return PB.Data.currentDecryptedLetterMap[sig]
}


PB.Data.addDecryptedLetter = function(letter, envelope) {
    // THINK: how can we avoid doing this 'existing letter' check twice?
    var maybeLetter = PB.Data.getDecryptedLetterBySig(envelope.sig)
    if(maybeLetter) return false
    
    PB.Data.currentDecryptedLetters.push(letter)
    
    PB.Data.currentDecryptedLetterMap[envelope.sig] = letter       // letter is a puff too
    PB.Data.currentDecryptedLetterMap[letter.sig] = letter         // stash it both ways
    PB.Data.addBonus(letter, 'envelope', envelope)                 // mark it for later
    
    PB.Data.addToGraph([letter])

    return true
}

PB.Data.removeAllPrivateShells = function() {
    PB.Data.currentDecryptedLetters.forEach(function(shell) {
        PB.Data.removeShellFromCache(shell.sig)
    })
    
    PB.Data.currentDecryptedLetterMap = {}
    PB.Data.currentDecryptedLetters = [] 
}



PB.Data.encryptPuff = function(letter, myPrivateWif, userRecords, privateEnvelopeAlias) {
    //// stick a letter in an envelope. userRecords must be fully instantiated.
    var puffkey = PB.Crypto.getRandomKey()                                        // get a new random key
    
    var letterCipher = PB.Crypto.encryptWithAES(JSON.stringify(letter), puffkey)  // encrypt the letter
    var versionedUsername = letter.username
    
    if(privateEnvelopeAlias) {
        myPrivateWif = privateEnvelopeAlias.default
        versionedUsername = PB.Users.makeVersioned(privateEnvelopeAlias.username, privateEnvelopeAlias.capa)
    }
    
    var envelope = PB.Data.packagePuffStructure(versionedUsername, letter.routes  // envelope is also a puff
                           , 'encryptedpuff', letterCipher, {}, letter.previous)  // it includes the letter
    
    envelope.keys = PB.Crypto.createKeyPairs(puffkey, myPrivateWif, userRecords)  // add decryption keys
    envelope.sig = PB.Crypto.signPuff(envelope, myPrivateWif)                     // sign the envelope
    
    return envelope
}

PB.Data.extractLetterFromEnvelope = function(envelope) {                // the envelope is a puff
    if(PB.Data.isBadEnvelope(envelope.sig)) 
        return Promise.reject('Bad envelope')                           // flagged as invalid envelope

    var maybeLetter = PB.Data.getDecryptedLetterBySig(envelope.sig)     // have we already opened it?
    
    if(maybeLetter)
        return Promise.resolve(maybeLetter)                             // resolve to existing letter
    
    var prom = PB.Data.getDecryptedPuffPromise(envelope)                // do the decryption
    
    return prom.catch(function(err) { return false })
               .then(function(letter) {
                   if(!letter) {
                       PB.Data.addBadEnvelope(envelope.sig)             // decryption failed: flag envelope
                       return PB.throwError('Invalid envelope')         // bail out
                   }

                   return letter
               })
    
}

PB.Data.getDecryptedPuffPromise = function(envelope) {
    //// pull a letter out of the envelope -- returns a promise!

    if(!envelope || !envelope.keys) 
        return PB.emptyPromise('Envelope does not contain an encrypted letter')
    
    var senderVersionedUsername = envelope.username
    var userProm = PB.Users.getUserRecordPromise(senderVersionedUsername)
    
    var puffprom = userProm
    .catch(PB.catchError('User record acquisition failed'))
    .then(function(senderVersionedUserRecord) {
        var prom // used for leaking secure promise

        PB.useSecureInfo(function(identities, currentUsername) {
            // NOTE: leaks a promise which resolves to unencrypted puff
        
            var identity = identities[currentUsername]
            var keylist = Object.keys(envelope.keys)
            
            var aliases = identity.aliases.filter(function(alias) {
                var versionUsername = PB.Users.makeVersioned(alias.username, alias.capa)
                return keylist.indexOf(versionUsername) !== -1
            })

            if(!aliases.length)
                return PB.throwError('No key found for current user')

            var alias = aliases[0] // just take the first one

            var myVersionedUsername = PB.Users.makeVersioned(alias.username, alias.capa)
            var privateDefaultKey = alias.privateDefaultKey
            
            prom = new Promise(function(resolve, reject) {
                return PB.cryptoworker
                     ? PB.workersend( 'decryptPuffForReals'
                                    , [ envelope
                                      , senderVersionedUserRecord.defaultKey
                                      , myVersionedUsername
                                      , privateDefaultKey ]
                                    , resolve, reject )
                     : resolve( PB.decryptPuffForReals( envelope
                                                      , senderVersionedUserRecord.defaultKey
                                                      , myVersionedUsername
                                                      , privateDefaultKey ) )
            })
        })

        return prom
    })
    
    return puffprom
}




PB.Data.packagePuffStructure = function(versionedUsername, routes, type, content, payload, previous) {
    //// pack all the parameters into an object with puff structure (without signature)
    
    payload = payload || {}                     // TODO: check all of these values more carefully
    payload.content = content
    payload.type = type

    routes = routes || []
    previous = previous || false                // false for DHT requests and beginning of blockchain, else valid sig

    var puff = { username: versionedUsername
               ,   routes: routes
               , previous: previous
               ,  version: '0.1.0'              // version accounts for crypto type and puff shape
               ,  payload: payload              // early versions will be aggressively deprecated and unsupported
               }
    
    return puff
}











PB.Data.getMorePrivatePuffs = function(username, offset, batchsize) {
    // THINK: race condition while toggling identities?
    if(!username) username = PB.getCurrentUsername()
    
    offset = offset || 0
    // offset = offset || PB.CONFIG.initLoadBatchSize || 20
    batchsize = batchsize || PB.CONFIG.pageBatchSize || 10
    
    var prom
    prom = PB.Net.getMyPrivatePuffs(PB.getCurrentUsername(), batchsize, offset) // THINK: why switched param order?
    prom = prom.then(PB.Data.addShellsThenMakeAvailable)
    return prom
}


PB.Data.updatePrivateShells = function(offset) {
    var username = PB.getCurrentUsername()
    var batchsize = 1
    var fullOrShell = 'full' // OPT: just gather the shell (or sig) here when checking latest
    offset = offset || 0     //      actually... we need a list of all sigs we've encountered (not just good ones)
                             //      otherwise bad envelopes (etc) could block prior good content.

    PB.Net.getMyPrivatePuffs(username, batchsize, offset, fullOrShell)
          .then(function(shells) {
              var shell = shells[0]
              if(!shell) return false
              
              var prom = PB.Data.ingestAnEncryptedShell(shell) // manual because we need the decryption promise
              
              prom.then(function(fresh) {
                  if(fresh)
                      PB.Data.updatePrivateShells(1+offset)
              })
          })
}


PB.Data.ingestEncryptedShells = function(shells) {
    var proms = shells.map(PB.Data.ingestAnEncryptedShell)
    
    // NOTE: Promise.all rejects immediately upon any rejection, so we have to do this manually
    
    return new Promise(function(resolve, reject) {
        var remaining = proms.length
        var report = {good: 0, bad: 0, goodsigs: []}
        
        function unhappy_path() {
            report.bad++
            if(!--remaining) resolve(report)
        }
        
        proms.forEach(function(prom) {
            prom.then(function(letter) {
                if(!letter) return unhappy_path()                       // catches old or weird puffs 
                report.good++                                           // TODO: differentiate above cases
                report.goodsigs.push(letter.sig)
                if(!--remaining) resolve(report)
            }, unhappy_path )                                           // catches decryption errors
        })
    })
}


PB.Data.ingestAnEncryptedShell = function(envelope) {
    var prom = PB.Data.extractLetterFromEnvelope(envelope)

    prom = prom.then(function(letter) {
        if(!letter) return false
        
        var fresh = PB.Data.addDecryptedLetter(letter, envelope)        // add the letter to our system
        if(!fresh) return false
        
        PB.runHandlers('newPuffs', [letter])                            // always returns an array of puffs
        return letter
    })
    
    return prom
    
    // NOTE: this doesn't appear to do much, mostly because extractLetterFromEnvelope is quite effectful.
    //       it calls PB.Data.addDecryptedLetter as part of its processing, which does all the real work.
    
    // THINK: consider adding this back in, though remember that each decryption pushes its own errors...
    // if (letters.length != privateShells.length) {
    //     Events.pub('track/decrypt/some-decrypt-fails',
    //                 {letters: letters.map(function(p){return p.sig}),
    //                  privateShells: privateShells.map(function(p){return p.sig})})
    // }
}




// the slot locker contains information on queries made to fill slots. 
// in particular it holds the offset, which will be -1 when [] is returned.
// it keeps queries from re-requesting the same shells over and over, 
// and provides some concurrency / flow control by allowing a query
// to set it to -1 when it is running and then replace it when done.
PB.Data.slotLocker = {}

// THINK: we're calling this from the 'refresh' button now...


PB.Data.importRemoteShells = function() {
    //// only called during initial application bootup. handles both cold loads and hot loads.
    
    var offset = 0
    var giveup = PB.CONFIG.initLoadGiveup
    var limit  = PB.CONFIG.initLoadBatchSize
    var new_shells = []
    var keep_going = true
    
    var key = '[{"sort":"DESC"},{"tags":[],"types":[],"users":[],"routes":[]}]' // TODO: upgrade this default query
    PB.Data.slotLocker[key] = -1
    
    // TODO: index by username
    // TODO: if duplicate check update times for latest
    // TODO: persist to LS (maybe only sometimes? onunload? probabilistic?)
         
    function getMeSomeShells(puffs) {
        if(puffs) {
            var delta = PB.Data.addShellsThenMakeAvailable(puffs)
            // new_shells = new_shells.concat(my_new_shells)
            // var delta = my_new_shells.length
            
            if(delta != limit) // some shells were already in our cache
                keep_going = false
        }
        
        if(offset > giveup)
            keep_going = false

        if(!keep_going) {
            PB.Data.slotLocker[key] = 1
            // PB.Data.stupidHorribleGlobalThing = true
            // PB.Data.makeShellsAvailable(new_shells)
            return false
        }
        
        var prom = PB.Net.getSomeShells({}, {}, limit, offset)
        prom.then(getMeSomeShells)

        offset += limit
    }
    
    getMeSomeShells()
}


/**
 * to fill some slots
 * @param {number} need
 * @param {number} have
 * @param {string} query
 * @param {string} filters
 * @returns {boolean}
 */
PB.Data.fillSomeSlotsPlease = function(need, have, query, filters) {
    //// we have empty slots on screen. fill them with puffs.
    
    if(have >= need) return false
    
    // -- redraw screen on new puffs being ingested (w/o looping)
    // -- cycle all new puffs through graph stuff
    // -- call fillSomeSlotsPlease every time we have slots to fill
    // -- get focused puff immediately
    
    // - perform GC on in-memory puffs (can remove content also)
    // - use GC funs for persisting shells
    // - store size of each shell/puff for GC
    // - manage empty vertices better (different type?)

    var args = [query, filters]
    // var args = [query, filters, need]
    // if(!query.mode) args.push(have) // hack for alternate query modes

    var key = JSON.stringify(args)
    var my_offset = PB.Data.slotLocker[key] || 0
    
    if(my_offset < 0)
        return false // slot is locked, go elsewhere
    
    PB.Data.slotLocker[key] = -1 // prevent concurrent versions of the same request
    
    //////

    // var limit = need - have + 3 // 3 for luck
    
    var limit = need // so... if we only do this once, and we have half the puffs already, we might only grab that half again. this is true even if we send an offset of 'have' to the server, because what we have might map to that slice (or to anything else -- our offsets are totally different than the servers). so we have to grab enough to cover the difference, which means grabbing the same shells multiple times... (but only empty shells, fortunately. but still.)
    
    // var received_shells = 0
    
    var prom = PB.Net.getSomeShells(query, filters, limit, query.offset)
    // prom.then(function(shells) {received_shells = shells.length; return shells})
    prom.then(PB.Data.addShellsThenMakeAvailable)
        .then(function(delta) { 
            PB.Data.slotLocker[key] = delta ? 1 : -1}) 
            // if the request is fruitful, unlock it (but be careful of offsets here).
            // also, this locks when we received data but chose not to keep it (either dups or GC),
            // so we could have an issue with locked queries that would be fruitful w/ different offset / limits...
    
    
    // TODO: the slotLocker really should keep track of what 'slices' of the server you've seen, so we know not to re-request those over and over. this is... complicated. 
    //       so send query.offset+have to getSomeShells, and store that same offset as part of the slotLocker.
    //       then you can track how much of some type of stuff is on the server... except that doesn't work for the P2P network.
    
    return true
    
    //////


    // OLD STUFF SAVE FOR REFERENCE

    // var batchSize = PB.CONFIG.fillSlotsBatchSize
    // var giveup = PB.CONFIG.fillSlotsGiveup
    // var new_shells = []
    //
    // giveup = giveup + my_offset
    //
    // function getMeSomeShells(puffs) {
    //     if(puffs) {
    //         var my_new_shells = PB.Data.hereHaveSomeNewShells(puffs)
    //         new_shells = new_shells.concat(my_new_shells)
    //         var delta = my_new_shells.length
    //         // THINK: but do they pass the filter?
    //         // TODO: can we make available here now that we're locking?
    //         have += delta || 0
    //     }
    //
    //     if(have >= need || my_offset > giveup || (query.mode && (my_offset - giveup < 0))) {
    //         PB.Data.makeShellsAvailable(new_shells)
    //         PB.Data.slotLocker[key] = my_offset-limit
    //         return false
    //     }
    //
    //     var limit = need - have
    //     // if(!query.mode) limit += 50 // grab a few extras to help work through bare patches
    //
    //     var prom = PB.Net.getSomeShells(query, filters, limit, my_offset)
    //     prom.then(getMeSomeShells)
    //
    //     my_offset += limit
    // }
    //
    // getMeSomeShells()
}


/*
    End shell collection intake equipment
*/


/**
 * returns a puff from a shell
 * @param  {(string|object)} shell 
 * @return {object} returns a puff based on the shell; returns false if the shell is empty
 */
PB.Data.getPuffFromShell = function(shell) {
    if(!shell)
        return false // so we can filter empty shells out easily, while still loading them on demand
    
    if(shell.payload && shell.payload.content !== undefined)
        return shell // it's actually a full blown puff
    
    return PB.Data.getPuffBySig(shell.sig) // returns a puff, or asks the network and returns false
}

/**
 * to get puff by its sig
 * @param {string} sig
 * @returns {(object|false)}
 */
PB.Data.getPuffBySig = function(sig) {
    var shell = PB.Data.getCachedShellBySig(sig) // OPT: this happens twice almost always
    
    if(shell && shell.payload && typeof shell.payload.content != 'undefined')
        return shell
    
    if(PB.Data.pendingPuffPromises[sig])
        return false
        
    // locally cached shells that are missing content on the network prevent slotfills from resolving,
    // so we clear it from our cache if we can't find it.
    function badShellClearCache(shells) {
        if(!shells.length) {
            var fauxshell = {sig: sig}
            if(!PB.Data.getBonus(fauxshell, 'envelope')) {
                PB.Data.removeShellFromCache(sig)
                return PB.onError("Content can not be found for shell '" + sig + "'") // THINK: why was this throwError?
                // THINK: unlock PB.Data.pendingPuffPromises[sig]? probably not, but it might re-appear later...
            }
        }
        return shells
    }
    
    PB.Data.pendingPuffPromises[sig] = PB.Net.getPuffBySig(sig)      // TODO: drop this down in to PB.Net instead
    PB.Data.pendingPuffPromises[sig].then(badShellClearCache)
                        .then(PB.Data.addShellsThenMakeAvailable)
                        .then(function() {                           // delay GC to stop runaway network requests
                            setTimeout(function() { delete PB.Data.pendingPuffPromises[sig] }, 10000) })
    
    return false
}

PB.Data.removeShellFromCache = function(sig) {
    // remove from PB.Data.shells
    var shell = PB.Data.getCachedShellBySig(sig)
    PB.Data.shells.splice( PB.Data.shells.indexOf(shell), 1 )
    
    // remove from PB.Data.shellSort
    delete PB.Data.shellSort[sig]
    
    // remove shell's bonii
    delete PB.Data.bonii[sig]
    
    PB.Data.purgeShellFromGraph(sig)
    
    PB.Data.removeCachedPuffScore(shell)
}

PB.Data.purgeShellFromGraph = function(sig) {
    // change graph vertex to 'pseudo-shell' type (or 'purged' type?)
    //   and remove the content of the 'shell' property
    // TODO: this is icky make it better
    var vertex = PB.Data.graph.v(sig).run()[0]
    if(vertex) {
        vertex.type = 'purged'
        vertex.shell = undefined
    }
}


/**
 * to get my puff chain
 * @param  {string} username 
 * @return {object}
 */
PB.Data.getMyPuffChain = function(username) {
    // CURRENTLY UNUSED
    // TODO: this should grab my puffs from a file or localStorage or wherever my identity's puffs get stored
    // TODO: that collection should be updated automatically with new puffs created through other devices
    // TODO: the puffchain should also be sorted in chain order, not general collection order
    
    var shells = PB.Data.getShells()
    
    return shells.filter(function(puff) { return puff && puff.username == username }) // TODO: use the graph
    // return PB.M.Forum.getByUser(username) // TODO: test this 
}



///////////////////////////////////////////
//                                       //
//       Garbage Collector Thing         //
//                                       //
///////////////////////////////////////////



PB.Data.runningSizeTally = 0
PB.Data.scoreSort = {}

PB.Data.heuristics = []
PB.Data.addHeuristics = function(fun) {
    PB.Data.heuristics.push(fun)
}

PB.Data.addHeuristics(function(shell) {
    return parseFloat( (PB.Data.getBonus(shell, 'starStats') || {}).score || 0 ) * 100
})

// TODO: add heuristics for: my puffs (which go elsewhere, ultimately), replies to my puffs, my puff's parents, 
//       friend's puffs (whatever that means), puff freshness, last seen, etc


PB.Data.rateMyPuff = function(puff) {
    var scores = PB.Data.heuristics.map(function(h) {return h(puff)})           // apply heuristics
    var total  = scores.reduce(function(acc, score) {return acc+(score||0)}, 0) // get total // TODO: improve algo
    return total
}

PB.Data.rateSomePuffs = function(puffs) {
    puffs.forEach(function(puff) {                                              // rate each puff
        var score = PB.Data.rateMyPuff(puff)
        PB.Data.doStuffWithScore(puff, score)
        PB.Data.doStuffWithPuff (puff)
    })
    // THINK: some heuristics rely on scores of related puffs... possible feedback loop? topological ordering?
    //        a toposort is easy-ish w/ graph db...
}

// TODO: when you switch identities, rescore the puffs


PB.Data.doStuffWithScore = function(puff, score) {
    PB.Data.removeCachedPuffScore(puff)                                         // NOTE: has to come before bonii
    PB.Data.addBonus(puff, 'rating', score)                                     // add rating to bonii
    PB.Data.cachePuffScore(puff, score)    
    // OPT: cache sorted version
    // maybe bins[score.floor].push(puff) or something...
}

PB.Data.doStuffWithPuff = function(puff) {
    var puffsize = JSON.stringify(puff).length
    PB.Data.addBonus(puff, 'size', puffsize)
    PB.Data.runningSizeTally += puffsize || 0                                  // block NaNs
}

PB.Data.cachePuffScore = function(puff, score) {
    var key = PB.Data.convertScoreToKey(score)
    PB.Data.scoreSort[key] = PB.Data.scoreSort[key] || []
    PB.Data.scoreSort[key].push(puff)
}

PB.Data.removeCachedPuffScore = function(puff) {
    if(!puff) return false
    
    var score = PB.Data.getBonus(puff, 'score')
    var key = PB.Data.convertScoreToKey(score)
    var bin = PB.Data.scoreSort[key]
    if(!bin) return false
    if(!bin.length) return false
    
    for(var i = bin.length - 1; i >= 0; i--) {
        if(bin[i].sig == puff.sig) {
            bin.splice(i, 1)
            var puffsize = PB.Data.getBonus(puff, 'size')
            PB.Data.runningSizeTally -= puffsize || 0                          // block NaNs
            return false
        }
    }
}

PB.Data.getCachedPuffs = function(limit, bottom) {
    var seen = 0
    var result = []
    var keys = Object.keys(PB.Data.scoreSort).map(parseFloat).sort()
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var puffs = PB.Data.scoreSort[key] // OPT: short-circuit on !bottom
        
        puffs.reduce(function(seen, puff) {
            if(seen > limit == !!bottom) result.push(puff)
            return seen+1
        }, 0)
    }
    
    return result
}

PB.Data.convertScoreToKey = function(score) {
    return Math.floor(score / 10) || 0 // TODO: make this smarter
}


PB.Data.getTopPuffs = function(limit) {
    return PB.Data.getCachedPuffs(limit)
}

PB.Data.getNotTopPuffs = function(limit) {
    // grab the puffs below the limit threshold (w/ 300 puffs and limit=100 this returns the 200 worst puffs)
    return PB.Data.getCachedPuffs(limit, 'bottom')
}

// PB.Data.getTopPuffs = function(options) {
//     var numberLimit =  options.number || 0
//     var sizeLimit   =    options.size || 0
//     var compact     = options.compact || false  // whether to allow compaction of returned puffs
//     var reverse     = options.reverse || false  // return bottom puffs instead of top puffs
// }

PB.Data.garbageCompactor = function() {
    // are we over the limits?
    var limit     = PB.CONFIG.inMemoryShellLimit
    var memlimit  = PB.CONFIG.inMemoryMemoryLimit
    var sizelimit = PB.CONFIG.shellContentThreshold
    var didStuff  = false

    if(PB.Data.shells.length > limit) {
        didStuff = true
        PB.Data.shells.slice(limit).map(PB.prop('sig')).forEach(PB.Data.removeShellFromCache)
    }
    
    if(PB.Data.runningSizeTally > memlimit) {
        didStuff = true
        for (var i = PB.Data.shells.length - 1; i >= 0; i--) {
            var shell = PB.Data.shells[i]
            var content_size = (shell.payload.content||"").toString().length // THINK: non-flat content borks this
            if (content_size > sizelimit) {
                delete shell.payload.content // THINK: this is hardcore
                total -= content_size + 13 // NOTE: magic number == '"content":"",'.length
                if(total <= memlimit) break
            }
        }
    }
    
    return didStuff
}


PB.Data.getShellsForLocalStorage = function() {
    var limit     = PB.CONFIG.localStorageShellLimit
    var memlimit  = PB.CONFIG.localStorageMemoryLimit
    var sizelimit = PB.CONFIG.shellContentThreshold
    
    var shells = PB.Data.getTopPuffs(limit)
    var total = shells.reduce(function(size, shell) {
        return size + (PB.Data.getBonus(shell, 'size') || 0)
    }, 0)
    
    if (total <= memlimit) return shells
    
    // compact the puffs
    for (var i = shells.length - 1; i >= 0; i--) {
        var shell = shells[i]
        var content_size = (shell.payload.content||"").toString().length // THINK: non-flat content borks this
        if (content_size > sizelimit) {
            var new_shell = PB.Data.compactPuff(shell)
            shells[i] = new_shell
            total -= content_size + 13 // NOTE: magic number == '"content":"",'.length
            if(total <= memlimit) break
        }
    }
    
    if (total <= memlimit) return shells
    
    // remove shells until under memlimit
    for (var i = shells.length - 1; i >= 0; i--) {
        var content_size = JSON.stringify(shell).length
        total -= content_size
        if(total <= memlimit) break
    }
    
    shells = shells.slice(0, Math.max(i, 1)) // prevent -1 
    
    return shells
}


PB.Data.compactPuff = function(puff) {
    // THINK: instead of rebuilding the puff, use a JSON.stringify reducer that strips out the content
    var new_shell = Boron.extend(puff)
    var new_payload = {}
    for(var prop in puff.payload)
        if(prop != 'content')
            new_payload[prop] = puff.payload[prop] 

    new_shell.payload = new_payload
    return new_shell
}

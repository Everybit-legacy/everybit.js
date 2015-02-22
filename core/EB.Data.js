/*

    Data management for the EveryBit platform.
    
    All puff-related data flows through here:
    caching, persistence, optimizations and network access are managed through this module.

    Copyright 2014-2015 EveryBit. See README for license information.

 */

EB.Data = {}
EB.Data.bonii = {}
EB.Data.shells = []
EB.Data.shellSort = {}
EB.Data.pendingPuffPromises = {}

EB.Data.profiles = {}

EB.Data.init = function(options) {
    // THINK: disabling preloading may affect older EB example code
    // if(!options.disablePublicPuffs)
    //     EB.Data.importShells()                                       // preload relevant shells
    EB.addBeforeSwitchIdentityHandler(EB.Data.removeAllPrivateShells)   // clear private caches on id change
}


///////////////// new graph stuff ////////////////////

EB.Data.addSigAsVertex = function(sig) {
    var matches = EB.Data.graph.v(sig).run()
    
    if(matches.length) return false         // returns false if nothing happens
    
    return EB.Data.graph.addVertex({_id: sig, name: sig, type: 'shell'}) || true
}

EB.Data.addShellAsVertex = function(shell) {
    var matches = EB.Data.graph.v(shell.sig).run()
    
    if(!matches.length)
        return EB.Data.graph.addVertex({ _id: shell.sig, name: shell.sig, shell: shell, type: 'shell' }) || true
    
    var vertex = matches[0]
    if(vertex.shell) return false           // NOTE: returns false if it does nothing
    
    return vertex.shell = shell             // NOTE: mutation & pointer setting
}

EB.Data.addShellUsernameAsVertex = function(shell) {
    //// add shell.username to graph and connect them up
    
    var username = shell.username
    var matches = EB.Data.graph.v(username).run()
    var vertex = matches[0]
    
    if(!vertex)                             // THINK: make usernames unique like USERNAME::<username> or something
        vertex = EB.Data.graph.addVertex({ _id: username, name: username, type: 'username' })
    else
        if(EB.Data.graph.v(shell.sig).out('author').property('name').run()[0] == username)
            return false
        
    // TODO: add easy filtering by vertex type for both 'v' and also outV etc
    EB.Data.graph.addEdge({ _out: shell.sig, _in: shell.username, _label: 'author'})
}

EB.Data.graph = Dagoba.graph()

EB.Data.addToGraph = function(shells) {
    shells.forEach(EB.Data.addShellAsVertex)
    shells.forEach(EB.Data.addShellUsernameAsVertex)
    EB.runHandlers('relationship', shells)
}

// TODO: alias children() as .in('parent') and parents() as .out('parent') and use those instead (halves # of edges)

///////////////// end new graph stuff ////////////////////


//// CONTENT TYPES ////

EB.Data.contentTypes = {}

// TODO: this might get big, need some GC here
EB.Data.puffContentStash = {}

EB.Data.clearPuffContentStash = function() {
    EB.Data.puffContentStash = {}
}


/**
 * to process the content
 * @param  {string} type
 * @param  {string} content
 * @param  {puff} puff
 * @return {string}
 */
EB.Data.processContent = function(type, content, puff) {
    var typeObj = EB.Data.contentTypes[type]
    
    if(!typeObj)
        typeObj = EB.Data.contentTypes['text']

    return typeObj.toHtml(content, puff)
}


/**
 * Get the content of a puff
 * @param  {puff} puff
 * @return {string}
 */
EB.Data.getProcessedPuffContent = function(puff) {
    // THINK: we've already ensured these are proper puffs, so we don't have to check for payload... right?
    if(EB.Data.puffContentStash[puff.sig])
        return EB.Data.puffContentStash[puff.sig]
    
    var content = EB.Data.processContent(puff.payload.type, puff.payload.content, puff)
    EB.Data.puffContentStash[puff.sig] = content
    
    return content
}

/**
 * Add support for types of content to the system
 * @param {string} name
 * @param {string} type
 */
EB.Data.addContentType = function(name, type) {
    // THINK: move this down into EB?
    
    if(!name) 
        return EB.onError('Invalid content type name')
    if(EB.CONFIG.supportedContentTypes && EB.CONFIG.supportedContentTypes.indexOf(name) == -1)
        return EB.onError('Unsupported content type: ' + name)
    if(!type.toHtml) 
        return EB.onError('Invalid content type: object is missing toHtml method', name)
    
    EB.Data.contentTypes[name] = type
}

//// END CONTENT TYPES ////




EB.Data.getAllMyShells = function() {
    var publicShells = EB.Data.getPublicShells()
    var privateShells = EB.Data.getCurrentDecryptedLetters()
    return publicShells.concat(privateShells)
}


/**
 * get all currently known shells
 * @return {Shell[]}
 */
EB.Data.getShells = function() {
    //// Get all currently known shells
    // NOTE: always use this accessor instead of referencing EB.Data.shells directly, as what this function does will change.
    return EB.Data.shells
}

/**
 * get all public shells
 * @returns {Shell[]}
 */
EB.Data.getPublicShells = function() {
    //// Get all public shells
    var shells = EB.Data.getShells()
    return shells.filter(function(shell) {return !shell.keys})
}

/**
 * Get cached shells by sig
 * @param {string} sig
 * @returns {shell[]}
 */
EB.Data.getCachedShellBySig = function(sig) {
    return EB.Data.shellSort[sig]
    // return EB.Data.getShells().filter(function(shell) { return sig === shell.sig })[0]
}

/**
 * adds bonus
 * @param {object} puff
 * @param {string} key
 * @param {string} value
 */
EB.Data.addBonus = function(puff, key, value) {
    //// this simulates a WeakMap
    // THINK: we'll need to provide some GC here
    var id = puff.sig
    
    if(!EB.Data.bonii[id])
        EB.Data.bonii[id] = {}
    
    EB.Data.bonii[id][key] = value
}

/**
 * gets bonus
 * @param puff
 * @param key
 * @returns {object}
 */
EB.Data.getBonus = function(puff, key) {
    //// pull from our FauxWeakMap
    var id = puff.sig
    var puffBonii = EB.Data.bonii[id]
    return puffBonii && puffBonii[key]
}








EB.Data.addStar = function(sig, username, starsig) {
    // TODO: consider moving this to a module
    
    var fauxshell = {sig: sig} // THINK: can we formalize this?
    var starStats = EB.Data.getBonus(fauxshell, 'starStats') || {score: 0, from: {}}
    
    starStats.from[username] = starsig                                  // admittedly strange, but helpful when unstarring
    starStats.score = EB.Data.scoreStars(Object.keys(starStats.from))  // OPT: O(n^2) in stars-per-puff
    
    EB.Data.addBonus(fauxshell, 'starStats', starStats)
}

EB.Data.removeStar = function(sig, username) {
    // TODO: consider moving this to a module
    
    var fauxshell = {sig: sig} // THINK: ye gads is this ugly
    var starStats = EB.Data.getBonus(fauxshell, 'starStats') || {score: 0, from: {}}
    
    delete starStats.from[username]
    
    starStats.score = EB.Data.scoreStars(Object.keys(starStats.from))  // OPT: O(n^2) in stars-per-puff
    
    EB.Data.addBonus(fauxshell, 'starStats', starStats)
}

EB.Data.scoreStars = function(usernames) {
    
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


/**
 * handle a newly created puff: add to our local cache and fire new content callbacks
 * @param {object} puff
 */
EB.Data.addPuffToSystem = function(puff) {
    if(EB.Data.getCachedShellBySig(puff.sig)) return false
    
    EB.Data.addShellsThenMakeAvailable(puff)

    EB.Net.distributePuff(puff)
    
    return puff
}








/*
    Some new shell handling equipment. Need to integrate this more deeply and clean and test.
*/

EB.Data.addShellsThenMakeAvailable = function(shells) {
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
    
    shells = shells.filter(EB.isValidShell)
    report.counts.valid = shells.length
    
    report.meta = EB.Data.handleMetaPuffs(shells)
    
    shells = shells.filter(not(EB.Data.isMetaPuff))
    report.counts.nonmeta = shells.length
    
    report.private_promise = EB.Data.handlePrivatePuffs(shells)
    
    shells = shells.filter(not(EB.Puff.isPrivate))
    report.counts.public = shells.length
    
    shells = EB.Data.handleAndFilterExistingShells(shells)
    report.counts.new_public = report.counts.public - shells.length
    
    EB.Data.handleNewPublicShells(shells)
    
    shells = EB.Data.handleAndFilterByGC(shells)
    report.counts.gc = report.counts.new_public - shells.length

    report.public_puff_sigs = shells.map(EB.prop('sig'))
    
    EB.runHandlers('newPuffs', shells)
    EB.runHandlers('newPuffReport', report)
    
    return report
}


EB.Data.handleMetaPuffs = function(shells) {
    // TODO: move this to a module
    var metapuffs = shells.filter(EB.Data.isMetaPuff)
    
    metapuffs.forEach(function(shell) {
        var sig = shell.payload.content
        EB.Data.addStar(sig, shell.username, shell.sig)
    })
    
    return {stars: metapuffs.length}
}

EB.Data.isMetaPuff = function(shell) {
    // TODO: move this to a module
    return shell.payload.type == 'star'    
}


EB.Data.handlePrivatePuffs = function(shells) {
    var privatepuffs = shells.filter(EB.Puff.isPrivate)    
    return EB.Data.ingestEncryptedShells(privatepuffs)          // TODO: this returns our promise report
}


EB.Data.handleAndFilterExistingShells = function(shells) {
    // THINK: this can't answer the question of "did we updated an existing shell with content"?
    return shells.filter(function(shell) {                      // returns all new (and newly full) puffs
        var existing = EB.Data.getCachedShellBySig(shell.sig)

        if(!existing) return true                               // it's new
        if(EB.Puff.isFull(existing)) return false               // it's known
        if(EB.Puff.isEmpty(shell)) return false                 // it's an empty shell

        existing.payload.content = shell.payload.content        // add the missing content
        return true                                             // true because we changed it
    })
}


EB.Data.handleNewPublicShells = function(shells) {
    shells.forEach(function(shell) {
        EB.Data.shells.push(shell)
        EB.Data.shellSort[shell.sig] = shell
    })

    EB.Data.addToGraph(shells)
    EB.Data.rateSomePuffs(shells)
    EB.Data.persistShells()                                     // drop new stuff into localStorage
}


EB.Data.handleAndFilterByGC = function(shells) {
    var compacted = EB.Data.garbageCompactor()                  // OPT: call this earlier
    if(!compacted) return shells
    
    return shells.map(EB.prop('sig'))                            // if GC eats puffs this spits them out
                 .map(EB.Data.getCachedShellBySig)
                 .filter(Boolean)
}


/**
 * to persist shells
 * @param {Shell[]}
 * @returns {(boolean|*)}
 */
EB.Data.persistShells = function(shells) {
    if(EB.CONFIG.noLocalStorage) return false                      // THINK: this is only for debugging and development
    
    // THINK: when we receive shells directly we should compact them too
    if(!shells) 
        shells = function() {return EB.Data.getShellsForLocalStorage()} // thunked for perf
    
    // when you save shells, GC older "uninteresting" shells and just save the latest ones
    // THINK: is this my puff? then save it. otherwise, if the content is >1k strip it down.
    // THINK: we need knowledge of our user records here... how do we get that? 
    // EB.Data.interesting_usernames?
    
    // shells = shells.filter(function(shell) { return !shell.payload.content || (shell.payload.content.length < 1000) })
    
    EB.Persist.save('shells', shells)
}



EB.Data.getConversationPuffs = function(convoId, offset, batchsize) {
    offset = offset || 0
    batchsize = batchsize || EB.CONFIG.pageBatchSize || 10
    
    var prom
    prom = EB.Net.getConversationPuffs(convoId, batchsize, offset)
    prom = prom.then(EB.Data.addShellsThenMakeAvailable)
    return prom
}

EB.Data.getConversationPuffs = EB.promiseMemoize(EB.Data.getConversationPuffs, function(key, report) {
    report.private_promise.then(function() {
        EB.removePromisePending(key)
    })
})


/**
 * to import shells from local and remote sources
 */
EB.Data.importShells = function() {
    //// fetch shells from local and remote sources
    
    // THINK: this should take a set of routes so we can pass them to importRemoteShells
    
    // grab the local shells and add them to the system
    // then grab some remote shells (latest 100) and compare them
    // go back until we fill in the gaps, or hit the threshold (500?)
    
    // when you want to look at shells that don't exist, like when scrolling, grab them as a batch
    
    EB.Data.importLocalShells()
    // EB.Data.getMoreShells()
    EB.Data.importRemoteShells()
    // EB.Data.importAllStars()
}

/**
 * to import local shells
 */
EB.Data.importLocalShells = function() {   // callback) {
    // EB.Data.shells = EB.Persist.get('shells') || []
    var localShells = EB.Persist.get('shells') || []
    
    EB.Data.addShellsThenMakeAvailable(localShells)
}


EB.Data.importAllStars = function() {
    // TODO: consider moving this to a module
    var prom = EB.Net.getStarShells()
    prom.then(EB.Data.addShellsThenMakeAvailable)
}


EB.Data.horridStash = {}

EB.Data.isBadEnvelope = function(sig) {
    return EB.Data.horridStash[sig]
}

EB.Data.addBadEnvelope = function(sig) {
    EB.Data.horridStash[sig] = true
}


EB.Data.currentDecryptedLetters = []
EB.Data.currentDecryptedLetterMap = {}

EB.Data.getCurrentDecryptedLetters = function() {
    //// NOTE: always use this instead of hitting currentDecryptedLetters directly, as this function may change
    return EB.Data.currentDecryptedLetters
}

EB.Data.getDecryptedLetterBySig = function(sig) {
    if(EB.Data.currentDecryptedLetterMap[sig])
        return EB.Data.currentDecryptedLetterMap[sig]
}


EB.Data.addDecryptedLetter = function(letter, envelope) {
    // THINK: how can we avoid doing this 'existing letter' check twice?
    var maybeLetter = EB.Data.getDecryptedLetterBySig(envelope.sig)
    if(maybeLetter) return false
    
    if(letter.payload.type == 'identity') return false             // THINK: where should this live?
    
    EB.Data.currentDecryptedLetters.push(letter)
    
    EB.Data.currentDecryptedLetterMap[envelope.sig] = letter       // letter is a puff too
    EB.Data.currentDecryptedLetterMap[letter.sig] = letter         // stash it both ways
    EB.Data.addBonus(letter, 'envelope', envelope)                 // mark it for later
    
    EB.Data.addToGraph([letter])

    return true
}

EB.Data.removeAllPrivateShells = function() {
    EB.Data.currentDecryptedLetters.forEach(function(shell) {
        EB.Data.removeShellFromCache(shell.sig)
    })
    
    EB.Data.currentDecryptedLetterMap = {}
    EB.Data.currentDecryptedLetters = [] 
    EB.Data.clearPuffContentStash()
}






EB.Data.getMorePrivatePuffs = function(username, offset, batchsize) {
    // THINK: race condition while toggling identities? username isn't used below.
    if(!username) username = EB.getCurrentUsername()
    
    offset = offset || 0
    // offset = offset || EB.CONFIG.initLoadBatchSize || 20
    batchsize = batchsize || EB.CONFIG.pageBatchSize || 10
    
    var prom
    prom = EB.Net.getMyPrivatePuffs(EB.getCurrentUsername(), batchsize, offset) // THINK: why switched param order?
    prom = prom.then(EB.Data.addShellsThenMakeAvailable)
    return prom
}


EB.Data.updatePrivateShells = function(offset) {
    var username = EB.getCurrentUsername()
    var batchsize = 1
    var fullOrShell = 'full' // OPT: just gather the shell (or sig) here when checking latest
    offset = offset || 0     //      actually... we need a list of all sigs we've encountered (not just good ones)
                             //      otherwise bad envelopes (etc) could block prior good content.

    EB.Net.getMyPrivatePuffs(username, batchsize, offset, fullOrShell)
          .then(function(shells) {
              var shell = shells[0]
              if(!shell) return false
              
              var prom = EB.Data.ingestAnEncryptedShell(shell) // manual because we need the decryption promise
              
              prom.then(function(fresh) {
                  if(fresh)
                      EB.Data.updatePrivateShells(1+offset)
              })
          })
}


EB.Data.ingestEncryptedShells = function(shells) {
    var proms = shells.map(EB.Data.ingestAnEncryptedShell)
    
    // NOTE: Promise.all rejects immediately upon any rejection, so we have to do this manually
    
    return new Promise(function(resolve, reject) {
        var remaining = proms.length
        var report = {good: 0, bad: 0, goodsigs: []}
        
        // TODO: add more information about what went wrong to the report
        
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


EB.Data.ingestAnEncryptedShell = function(envelope) {
    var prom = EB.Puff.promiseLetter(envelope)

    prom = prom.then(function(letter) {
        if(!letter) return false
        
        var fresh = EB.Data.addDecryptedLetter(letter, envelope)        // add the letter to our system
        if(!fresh) return false
        
        EB.runHandlers('newPuffs', [letter])                            // always receives an array of puffs
        return letter
    })
    
    return prom
    
    // NOTE: this doesn't appear to do much, mostly because extractLetterFromEnvelope is quite effectful.
    //       it calls EB.Data.addDecryptedLetter as part of its processing, which does all the real work.
    
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
EB.Data.slotLocker = {}

// THINK: we're calling this from the 'refresh' button now...


EB.Data.importRemoteShells = function() {
    //// only called during initial application bootup. handles both cold loads and hot loads.
    
    var offset = 0
    var giveup = EB.CONFIG.initLoadGiveup
    var limit  = EB.CONFIG.initLoadBatchSize
    var new_shells = []
    var keep_going = true
    
    var key = '[{"sort":"DESC"},{"tags":[],"types":[],"users":[],"routes":[]}]' // TODO: upgrade this default query
    EB.Data.slotLocker[key] = -1
    
    // TODO: index by username
    // TODO: if duplicate check update times for latest
    // TODO: persist to LS (maybe only sometimes? onunload? probabilistic?)
         
    function getMeSomeShells(puffs) {
        if(puffs) {
            var delta = EB.Data.addShellsThenMakeAvailable(puffs)
            // new_shells = new_shells.concat(my_new_shells)
            // var delta = my_new_shells.length
            
            if(delta != limit) // some shells were already in our cache
                keep_going = false
        }
        
        if(offset > giveup)
            keep_going = false

        if(!keep_going) {
            EB.Data.slotLocker[key] = 1
            // EB.Data.stupidHorribleGlobalThing = true
            // EB.Data.makeShellsAvailable(new_shells)
            return false
        }
        
        var prom = EB.Net.getSomeShells({}, {}, limit, offset)
        prom.then(getMeSomeShells)

        offset += limit
    }
    
    getMeSomeShells()
}



/*
    End shell collection intake equipment
*/


/**
 * get a puff by its sig
 * @param {string} sig
 * @returns {promise}
 */
EB.Data.getPuffBySig = function(sig) {
    var shell = EB.Data.getCachedShellBySig(sig)                    // check in public cache
    
    if(!shell)
        shell = EB.Data.getDecryptedLetterBySig(sig)                // check in private cache
    
    if(EB.Puff.isFull(shell))
        return Promise.resolve(shell)                               // it has content
    
    if(EB.Data.pendingPuffPromises[sig])                            // establish a foothold
        return EB.Data.pendingPuffPromises[sig]
    
    return EB.Data.getPuffBySigFromElsewhere(sig)                   // gather a promise
}

EB.Data.getPuffOrNot = function(sig) {
    // Supports the fire-and-forget style, where we ask for a puff and either
    // - receiving it directly if it's in the cache, or
    // - receiving false, but meanwhile a request is sent.
    // This can be easier than dealing with promises for e.g. showing cat photos, 
    // since you just always show whichever ones you have. When more cats arrive 
    // a refresh is triggered and all available cats are shown. 
    
    var shell = EB.Data.getCachedShellBySig(sig)                    // check in public cache
    
    if(!shell)
        shell = EB.Data.getDecryptedLetterBySig(sig)                // check in private cache

    if(EB.Puff.isFull(shell))
        return shell                                                // it has content
        
    EB.Data.getPuffBySigFromElsewhere(sig)                          // get the puff from the network
        
    return false                                                    // but return false for easy filtering
}


/**
 * get a puff by its sig from elsewhere
 * @param {string} sig
 * @returns {promise}
 */
EB.Data.getPuffBySigFromElsewhere = function(sig) {
    EB.Data.pendingPuffPromises[sig] = EB.Net.getPuffBySig(sig)
    var output = EB.Data.pendingPuffPromises[sig].then(badShellClearCache)

    output.then(EB.Data.addShellsThenMakeAvailable)
          .then(function() {                                        // delay GC to stop runaway network requests
                    setTimeout(function() { delete EB.Data.pendingPuffPromises[sig] }, 10000) })
    
    return output
        
    // locally cached shells that are missing content on the network prevent slotfills from resolving,
    // so we clear it from our cache if we can't find it.
    function badShellClearCache(shells) {
        if(!shells.length) {
            var fauxshell = {sig: sig}
            if(!EB.Data.getBonus(fauxshell, 'envelope')) {
                EB.Data.removeShellFromCache(sig)
                return EB.onError("Content can not be found for shell '" + sig + "'") // THINK: why was this throwError?
                // THINK: unlock EB.Data.pendingPuffPromises[sig]? probably not, but it might re-appear later...
            }
        }
        return shells
    }
}

EB.Data.removeShellFromCache = function(sig) {
    var shell = EB.Data.getCachedShellBySig(sig)                    // remove from EB.Data.shells
    EB.Data.shells.splice( EB.Data.shells.indexOf(shell), 1 )
    
    delete EB.Data.shellSort[sig]                                   // remove from EB.Data.shellSort
    
    delete EB.Data.bonii[sig]                                       // remove shell's bonii
    
    EB.Data.purgeShellFromGraph(sig)                                // remove from graph
    
    EB.Data.removeCachedPuffScore(shell)                            // remove allocator score
}

EB.Data.purgeShellFromGraph = function(sig) {
    // change graph vertex to 'pseudo-shell' type (or 'purged' type?)
    //   and remove the content of the 'shell' property
    // TODO: this is icky make it better
    var vertex = EB.Data.graph.v(sig).run()[0]
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
EB.Data.getMyPuffChain = function(username) {
    // CURRENTLY UNUSED
    // TODO: this should grab my puffs from a file or localStorage or wherever my identity's puffs get stored
    // TODO: that collection should be updated automatically with new puffs created through other devices
    // TODO: the puffchain should also be sorted in chain order, not general collection order
    
    var shells = EB.Data.getShells()
    
    return shells.filter(function(puff) { return puff && puff.username == username }) // TODO: use the graph
    // return EB.M.Forum.getByUser(username) // TODO: test this 
}



///////////////////////////////////////////
//                                       //
//       Garbage Collector Thing         //
//                                       //
///////////////////////////////////////////



EB.Data.runningSizeTally = 0
EB.Data.scoreSort = {}

EB.Data.heuristics = []
EB.Data.addHeuristics = function(fun) {
    EB.Data.heuristics.push(fun)
}

EB.Data.addHeuristics(function(shell) {
    return parseFloat( (EB.Data.getBonus(shell, 'starStats') || {}).score || 0 ) * 100
})

// TODO: add heuristics for: my puffs (which go elsewhere, ultimately), replies to my puffs, my puff's parents, 
//       friend's puffs (whatever that means), puff freshness, last seen, etc


EB.Data.rateMyPuff = function(puff) {
    var scores = EB.Data.heuristics.map(function(h) {return h(puff)})           // apply heuristics
    var total  = scores.reduce(function(acc, score) {return acc+(score||0)}, 0) // get total // TODO: improve algo
    return total
}

EB.Data.rateSomePuffs = function(puffs) {
    puffs.forEach(function(puff) {                                              // rate each puff
        var score = EB.Data.rateMyPuff(puff)
        EB.Data.doStuffWithScore(puff, score)
        EB.Data.doStuffWithPuff (puff)
    })
    // THINK: some heuristics rely on scores of related puffs... possible feedback loop? topological ordering?
    //        a toposort is easy-ish w/ graph db...
}

// TODO: when you switch identities, rescore the puffs


EB.Data.doStuffWithScore = function(puff, score) {
    EB.Data.removeCachedPuffScore(puff)                                         // NOTE: has to come before bonii
    EB.Data.addBonus(puff, 'rating', score)                                     // add rating to bonii
    EB.Data.cachePuffScore(puff, score)    
    // OPT: cache sorted version
    // maybe bins[score.floor].push(puff) or something...
}

EB.Data.doStuffWithPuff = function(puff) {
    var puffsize = JSON.stringify(puff).length
    EB.Data.addBonus(puff, 'size', puffsize)
    EB.Data.runningSizeTally += puffsize || 0                                  // block NaNs
}

EB.Data.cachePuffScore = function(puff, score) {
    var key = EB.Data.convertScoreToKey(score)
    EB.Data.scoreSort[key] = EB.Data.scoreSort[key] || []
    EB.Data.scoreSort[key].push(puff)
}

EB.Data.removeCachedPuffScore = function(puff) {
    if(!puff) return false
    
    var score = EB.Data.getBonus(puff, 'score')
    var key = EB.Data.convertScoreToKey(score)
    var bin = EB.Data.scoreSort[key]
    if(!bin) return false
    if(!bin.length) return false
    
    for(var i = bin.length - 1; i >= 0; i--) {
        if(bin[i].sig == puff.sig) {
            bin.splice(i, 1)
            var puffsize = EB.Data.getBonus(puff, 'size')
            EB.Data.runningSizeTally -= puffsize || 0                          // block NaNs
            return false
        }
    }
}

EB.Data.getCachedPuffs = function(limit, bottom) {
    var seen = 0
    var result = []
    var keys = Object.keys(EB.Data.scoreSort).map(parseFloat).sort()
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i]
        var puffs = EB.Data.scoreSort[key] // OPT: short-circuit on !bottom
        
        puffs.reduce(function(seen, puff) {
            if(seen > limit == !!bottom) result.push(puff)
            return seen+1
        }, 0)
    }
    
    return result
}

EB.Data.convertScoreToKey = function(score) {
    return Math.floor(score / 10) || 0 // TODO: make this smarter
}


EB.Data.getTopPuffs = function(limit) {
    return EB.Data.getCachedPuffs(limit)
}

EB.Data.getNotTopPuffs = function(limit) {
    // grab the puffs below the limit threshold (w/ 300 puffs and limit=100 this returns the 200 worst puffs)
    return EB.Data.getCachedPuffs(limit, 'bottom')
}

// EB.Data.getTopPuffs = function(options) {
//     var numberLimit =  options.number || 0
//     var sizeLimit   =    options.size || 0
//     var compact     = options.compact || false  // whether to allow compaction of returned puffs
//     var reverse     = options.reverse || false  // return bottom puffs instead of top puffs
// }

EB.Data.garbageCompactor = function() {
    // are we over the limits?
    var limit     = EB.CONFIG.inMemoryShellLimit
    var memlimit  = EB.CONFIG.inMemoryMemoryLimit
    var sizelimit = EB.CONFIG.shellContentThreshold
    var didStuff  = false

    if(EB.Data.shells.length > limit) {
        didStuff = true
        EB.Data.shells.slice(limit).map(EB.prop('sig')).forEach(EB.Data.removeShellFromCache)
    }
    
    if(EB.Data.runningSizeTally > memlimit) {
        didStuff = true
        for (var i = EB.Data.shells.length - 1; i >= 0; i--) {
            var shell = EB.Data.shells[i]
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


EB.Data.getShellsForLocalStorage = function() {
    var limit     = EB.CONFIG.localStorageShellLimit
    var memlimit  = EB.CONFIG.localStorageMemoryLimit
    var sizelimit = EB.CONFIG.shellContentThreshold
    
    var shells = EB.Data.getTopPuffs(limit)
    var total = shells.reduce(function(size, shell) {
        return size + (EB.Data.getBonus(shell, 'size') || 0)
    }, 0)
    
    if (total <= memlimit) return shells
    
    // compact the puffs
    for (var i = shells.length - 1; i >= 0; i--) {
        var shell = shells[i]
        var content_size = (shell.payload.content||"").toString().length // THINK: non-flat content borks this
        if (content_size > sizelimit) {
            var new_shell = EB.Puff.compactPuff(shell)
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






// /**
//  * to fill some slots
//  * @param {number} need
//  * @param {number} have
//  * @param {string} query
//  * @param {string} filters
//  * @returns {boolean}
//  */
// EB.Data.fillSomeSlotsPlease = function(need, have, query, filters) {
//     //// we have empty slots on screen. fill them with puffs.
//
//     if(have >= need) return false
//
//     // -- redraw screen on new puffs being ingested (w/o looping)
//     // -- cycle all new puffs through graph stuff
//     // -- call fillSomeSlotsPlease every time we have slots to fill
//     // -- get focused puff immediately
//
//     // - perform GC on in-memory puffs (can remove content also)
//     // - use GC funs for persisting shells
//     // - store size of each shell/puff for GC
//     // - manage empty vertices better (different type?)
//
//     var args = [query, filters]
//     // var args = [query, filters, need]
//     // if(!query.mode) args.push(have) // hack for alternate query modes
//
//     var key = JSON.stringify(args)
//     var my_offset = EB.Data.slotLocker[key] || 0
//
//     if(my_offset < 0)
//         return false // slot is locked, go elsewhere
//
//     EB.Data.slotLocker[key] = -1 // prevent concurrent versions of the same request
//
//     //////
//
//     // var limit = need - have + 3 // 3 for luck
//
//     var limit = need // so... if we only do this once, and we have half the puffs already, we might only grab that half again. this is true even if we send an offset of 'have' to the server, because what we have might map to that slice (or to anything else -- our offsets are totally different than the servers). so we have to grab enough to cover the difference, which means grabbing the same shells multiple times... (but only empty shells, fortunately. but still.)
//
//     // var received_shells = 0
//
//     var prom = EB.Net.getSomeShells(query, filters, limit, query.offset)
//     // prom.then(function(shells) {received_shells = shells.length; return shells})
//     prom.then(EB.Data.addShellsThenMakeAvailable)
//         .then(function(delta) {
//             EB.Data.slotLocker[key] = delta ? 1 : -1})
//             // if the request is fruitful, unlock it (but be careful of offsets here).
//             // also, this locks when we received data but chose not to keep it (either dups or GC),
//             // so we could have an issue with locked queries that would be fruitful w/ different offset / limits...
//
//
//     // TODO: the slotLocker really should keep track of what 'slices' of the server you've seen, so we know not to re-request those over and over. this is... complicated.
//     //       so send query.offset+have to getSomeShells, and store that same offset as part of the slotLocker.
//     //       then you can track how much of some type of stuff is on the server... except that doesn't work for the P2P network.
//
//     return true
//
//     //////
//
//
//     // OLD STUFF SAVE FOR REFERENCE
//
//     // var batchSize = EB.CONFIG.fillSlotsBatchSize
//     // var giveup = EB.CONFIG.fillSlotsGiveup
//     // var new_shells = []
//     //
//     // giveup = giveup + my_offset
//     //
//     // function getMeSomeShells(puffs) {
//     //     if(puffs) {
//     //         var my_new_shells = EB.Data.hereHaveSomeNewShells(puffs)
//     //         new_shells = new_shells.concat(my_new_shells)
//     //         var delta = my_new_shells.length
//     //         // THINK: but do they pass the filter?
//     //         // TODO: can we make available here now that we're locking?
//     //         have += delta || 0
//     //     }
//     //
//     //     if(have >= need || my_offset > giveup || (query.mode && (my_offset - giveup < 0))) {
//     //         EB.Data.makeShellsAvailable(new_shells)
//     //         EB.Data.slotLocker[key] = my_offset-limit
//     //         return false
//     //     }
//     //
//     //     var limit = need - have
//     //     // if(!query.mode) limit += 50 // grab a few extras to help work through bare patches
//     //
//     //     var prom = EB.Net.getSomeShells(query, filters, limit, my_offset)
//     //     prom.then(getMeSomeShells)
//     //
//     //     my_offset += limit
//     // }
//     //
//     // getMeSomeShells()
// }


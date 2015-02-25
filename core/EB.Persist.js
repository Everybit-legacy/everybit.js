/*

    Persistence layer for the EveryBit platform.

    It's like a network on your hard drive... which means this could be part of EB.Net.

    Copyright 2014-2015 EveryBit. See README for license information.

 */

EB.Persist = {};
EB.Persist.todo = {}
EB.Persist.todoflag = false

/**
 * to save key/value
 * @param  {string} key
 * @param  {string} value
 */
EB.Persist.save = function(key, value) {
    if(value == null)
        value = false
    EB.Persist.todo[key] = value
    if(!EB.Persist.todoflag) {
        onceInAwhile(function() {
            for(var key in EB.Persist.todo) {
                var realkey = 'PUFF::' + key;                           // prepend PUFF:: so we're good neighbors
                var value = EB.Persist.todo[key];
                if(typeof value == 'function')                          // in case we're passed a thunk
                    value = value();
                var str = JSON.stringify(value);                
                localStorage.setItem(realkey, str);
            }
            EB.Persist.todo = {};
            EB.Persist.todoflag = false;
        }, 100);                                                        // call at most every 100ms
    }
    EB.Persist.todoflag = true
}

/**
 * get the parsed JSON info from the given key
 * @param  {string} key
 * @return {anything}
 */
EB.Persist.get = function(key) {
    // TODO: return empty string instead of false

    var realkey = 'PUFF::' + key;
    var str = localStorage.getItem(realkey);
    if(!str) return false;
    return EB.parseJSON(str);
}

/**
 * to remove the item according to the given key
 * @param  {string} key
 */
EB.Persist.remove = function(key) {
    var realkey = 'PUFF::' + key;
    localStorage.removeItem(realkey);
}

/*

    Persistence layer for the EveryBit platform.

    It's like a network on your hard drive... which means this could be part of PB.Net.

    Copyright 2014 EveryBit. See README for license information.

 */

PB.Persist = {};
PB.Persist.todo = {}
PB.Persist.todoflag = false

/**
 * to save key/value
 * @param  {string} key
 * @param  {string} value
 */
PB.Persist.save = function(key, value) {
    if(value == null)
        value = false
    PB.Persist.todo[key] = value
    if(!PB.Persist.todoflag) {
        onceInAwhile(function() {
            for(var key in PB.Persist.todo) {
                var realkey = 'PUFF::' + key;                           // prepend PUFF:: so we're good neighbors
                var value = PB.Persist.todo[key];
                if(typeof value == 'function')                          // in case we're passed a thunk
                    value = value();
                var str = JSON.stringify(value);                
                localStorage.setItem(realkey, str);
            }
            PB.Persist.todo = {};
            PB.Persist.todoflag = false;
        }, 100);                                                        // call at most every 100ms
    }
    PB.Persist.todoflag = true
}

/**
 * get the parsed JSON info from the given key
 * @param  {string} key
 * @return {(false|string)}
 */
PB.Persist.get = function(key) {
    var realkey = 'PUFF::' + key;
    var str = localStorage.getItem(realkey);
    if(!str) return false;
    return PB.parseJSON(str);
}

/**
 * to remove the item according to the given key
 * @param  {string} key
 */
PB.Persist.remove = function(key) {
    var realkey = 'PUFF::' + key;
    localStorage.removeItem(realkey);
}

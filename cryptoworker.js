importScripts('vendor/bitcoinjs-min.js')
importScripts('core/PB.js')
importScripts('core/PB.Crypto.js')

onmessage = function (event) {
    var args = event.data.args
    var fun = event.data.fun
    var result
    
    try {
        result = PB[fun].apply(PB, args)
        postMessage({ id: event.data.id
                    , evaluated: result
                    })
    } catch(e) {
        postMessage({ id: event.data.id
                    , error: e
                    , evaluated: false
                    })
    }    
}

PB.onError = function(msg, obj) {
    console.log(msg, obj) // adding this back in for debugging help
    return false
}

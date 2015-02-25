importScripts('vendor/bitcoinjs-min.js')
importScripts('core/EB.js')
importScripts('core/EB.Crypto.js')

onmessage = function (event) {
    var args = event.data.args
    var fun = event.data.fun
    var result
    
    try {
        result = EB[fun].apply(EB, args) // THINK: can we call in to EB.Data instead?
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

EB.onError = function(msg, obj) {
    console.log(msg, obj) // adding this back in for debugging help
    return false
}

importScripts('vendor/bitcoinjs-min.js')
importScripts('core/PB.js')
importScripts('core/PB.Crypto.js')

onmessage = function (event) {
    var args = event.data.args
    var fun = event.data.fun
    
    // console.log(event, event.data, fun, args)
    // postMessage([event, event.data, fun, args])
    
	postMessage({
		"id": event.data.id,
		"evaluated": PB[fun].apply(PB, args)
	});
}

PB.onError = function(msg, obj) {
    console.log(msg, obj) // adding this back in for debugging help
    return false
}

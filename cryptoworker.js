importScripts('scripts/bitcoinjs-min.js')
importScripts('js/core/PB.js')
importScripts('js/core/PB.Crypto.js')

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

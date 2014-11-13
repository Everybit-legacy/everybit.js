

// From brainwallet
function passphraseToPrivateKeyWif(passphrase) {
    var hashStr = Bitcoin.Crypto.SHA256(passphrase).toString();
    // hash = Bitcoin.Crypto.util.bytesToHex(hash);
    // var hash_str = pad(hash, 64, '0');
    hash = Bitcoin.convert.hexToBytes(hashStr);

    return Bitcoin.ECKey(hash).toWif()
}




// END OF THINGS
/////////////////////////////////////////////






/////// minimap ////////

// <div id="minimap"></div>

// var updateMinimap = function() {  
//   var mapdom = $('#minimap')
//   
//   // PB.Data.getShells().forEach(function(puff) {
//   //   template = '<p><a href="#" onclick="showPuff(PB.getPuffBySig(\'' 
//   //            + puff.sig + '\'));return false;" class="under">' 
//   //            + puff.sig + '</a></p>'
//   //   mapdom.append($(template))
//   // })
// }

////// end minimap /////




/* not in use
function draggableize(el) {
    /// modified from http://jsfiddle.net/tovic/Xcb8d/light/
    
    var x_pos = 0,  y_pos = 0,                                      // mouse coordinates
        x_elem = 0, y_elem = 0;                                     // top and left element coords
                                                                    
    // called when user starts dragging an element              
    function drag_init(e) {                                     
        x_pos = e.pageX;                                            // store coords
        y_pos = e.pageY;                                            
        x_elem = x_pos - el.offsetLeft;                         
        y_elem = y_pos - el.offsetTop;                          
        document.addEventListener('mousemove', move_el);            // start moving
        return false
    }

    // called each time the mouse moves
    function move_el(e) {
        x_pos = e.pageX;
        y_pos = e.pageY;
        el.style.left = (x_pos - x_elem) + 'px';
        el.style.top  = (y_pos - y_elem) + 'px';
    }

    // bind the functions
    el.addEventListener('mousedown', drag_init);
    el.addEventListener('mouseup', function() {
        document.removeEventListener('mousemove', move_el);
    });
}
*/




// KEEP THIS HERE FOR NOW

// var workIt = function(workerObject, fun, args) {
//     var message = {fun: fun, args: args}
//     return new Promise(function(resolve, reject) {
//
//     }
// }
//
//
// var function makeWorker(url) {
//     var worker = new Worker(url)
//     var queue = []
//     var id = 0
//
//     obj = { worker: worker
//           , queue: []
//           , id: 0
//           , send: worker.postMessage.bind(worker)
//     }
//
//     var receive = function(msg) {
//         var id = msg._id
//         if(!id) return false // TODO: add onError here
//
//         var fun = queue[_id]
//         if(!fun) return false // TODO: add onError here
//
//         fun(msg.data)
//
//         delete queue[id]
//     }
//
//     worker.addEventListener("message", receive)
//
//     var send = function(msg, fun) {
//         msg._id = ++id
//         queue[id] = funfix(fun)
//         worker.postMessage(msg)
//     }
//
//     return obj
// }
//
// var cryptoworker = {
//     worker: new Worker("js/cryptoworker.js")
//     queue: []
//     id: 0
// }
//
// cryptoworker.addEventListener("message", console.log.bind(console))
// 
// Object.keys(PB.Crypto).forEach(function(key) {
//     PB.Crypto[key] = function() {
//         cryptoworker.postMessage({fun: key, args: [].slice.call(arguments)})
//         return Promise
//         // build response list, match by id
//         // change all requests to async requests
//     }
// })
// 
// cryptoworker.postMessage({fun: 'puffToSiglessString', args: [{asdF:123}]})
//
// var workIt = function(workerObject, fun, args) {
//     var message = {fun: fun, args: args}
//     return new Promise(function(resolve, reject) {
//
//     }
// }
//
// var partial = function(fun) {
//     var args = [].slice.call(arguments, 1)
//     return function() {
//         return fun.apply(fun, args.concat([].slice.call(arguments)))
//     }
// }



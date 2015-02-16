/*
    Timing is everything
*/

~function() {
    var setImmediate, handleMessage
    
    ~function() {
        //// postpone until next tick
        // inspired by http://dbaron.org/log/20100309-faster-timeouts
        var later = []
        var messageName = 12345
        var gimme_a_tick = true

        setImmediate = function(fun) {
            later.push(fun)

            if(gimme_a_tick) {
                gimme_a_tick = false
                window.postMessage(messageName, "*")
            }
        
            return false
        }

        handleMessage = function(event) {
            if(event.data != messageName) return false

            event.stopPropagation()
            gimme_a_tick = true

            var now = later
            later = []

            for(var i=0, l=now.length; i < l; i++)
                now[i]()
        }
    }

    function queuer() {
        //// do something after some other things
        var queue = []

        var nexttime = function(invoker) {
            invoker(function() {
                if(!queue.length) return false
                queue.shift()()
                nexttime(invoker)
            })
        }

        var queuer = function(invoker, fun) {
            queue.push(fun)
            if(queue.length > 1) return false // THINK: possible race condition
            nexttime(invoker) 
        }

        return queuer
    }

    function once() {
        //// do something later, but only once
        var later = []

        var step = function() {
            var now = later
            later = []
            for(var i=0, l=now.length; i < l; i++)
                now[i]()
        }

        var once = function(invoker, fun) {
            if(~later.indexOf(fun)) return false
            later.push(fun)
            if(later.length > 1) return false // THINK: possible race condition
            invoker(step) 
        }

        return once
    }

    if(typeof window != 'undefined') {
        window.addEventListener('message', handleMessage, true)
        window.setImmediate = setImmediate
        
        window.queueImmediate = queuer().bind(null, setImmediate)
        window.onceImmediate  = once().bind(null, setImmediate)
        window.queueRAF = queuer().bind(null, requestAnimationFrame)
        window.onceRAF  = once().bind(null, requestAnimationFrame)
    
        var timefunbind = {}
        window.onceInAwhile = function(fun, time) {
            //// NOTE: don't use the same fun with different times
            if(timefunbind[fun]) return false
            timefunbind[fun] = setTimeout(function() {fun(); timefunbind[fun] = false}, time)
        }
    }
}()

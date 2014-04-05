/*
       _______  __   __  _______  _______  _______  _______  ___      ___     
      |       ||  | |  ||       ||       ||  _    ||   _   ||   |    |   |    
      |    _  ||  | |  ||    ___||    ___|| |_|   ||  |_|  ||   |    |   |    
      |   |_| ||  |_|  ||   |___ |   |___ |       ||       ||   |    |   |    
      |    ___||       ||    ___||    ___||  _   | |       ||   |___ |   |___ 
      |   |    |       ||   |    |   |    | |_|   ||   _   ||       ||       |
      |___|    |_______||___|    |___|    |_______||__| |__||_______||_______|                                                
 
 core.js
 getAllPuffs() # Gets evey existing puff sends off as POJO
 onNewContent(callback) # Calls the callback when new content arrive

 /data
 blockchain.js
 puffValidator.js

 /network
 socket.js
 rtc.js
 localStorage.js
 core.js
 */

Puff = {}

Puff.addPuff = function(user, privkey, type, content, metadata) {
  
}
// Puff.addPuff(user, privkey, 'text', content, {time: Date.now(), parents: parents})
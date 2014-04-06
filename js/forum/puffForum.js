/*
 addPost(content) #Takes content field from the form as a string, returns an id
 - Looks for the users name is the system.

 # Pulls info from localStorage and from network into a graph db stored client side
 # By calling puff.js and asking for things.
 puffGraph
 .edges
 .nodes

 onNewContent()

 getRootPuffs(N) # Goes into puffGraph, gets out N most recent root puffs
 */

 PuffForum = {}
 PuffForum.getContentById = function(id) {
   return {
      "author":"greyhawk",
      "id":"3kk3k3k3",
      "content":"Exactly. Which is a good thing.",
      "contentType":"bcc30999b194564f",
      "tags":"",
      "parents":"[8bce02938015e9f845]",
      "zones":"[bitcointalk]"
   }
 }

PuffForum.getChildren = function(puff) {
  return [{
     "author":"freewil",
     "id":"143f94ec6f96da570ed0",
     "content":"This is a great step forward for Bitcoin, but yes I agree the barrier to membership for Bitcoin businesses seems to be a bit high.",
     "contentType":"text",
     "tags":"",
     "parents":"[8f69722abb89ec45]",
     "zones":"[bitcointalk]"
  },
  {
     "author":"adamas",
     "id":"299535726f5b6fcfd2",
     "content":"",
     "contentType":"moderation",
     "tags":"[+1]",
     "parents":"[9ffdfa031c5b1e2f6c]",
     "zones":""
  },
  {
     "author":"Technomage",
     "id":"2a31a8adb852b8d058",
     "content":"This is not your standard industry. Bitcoin economy has perhaps half a dozen companies currently that can possibly afford the higher industry membership fees. Half a dozen, give or take. Mostly it's filled with startup companies that likely can't afford even the Silver membership.\r\n\r\nI don't really see a problem other than the fact that they have priced it in a way that they will actually get less money than they would if they would price it in another way. I'm fairly certain of this. The individual pricing is very good though, I have no issue with that.",
     "contentType":"text",
     "tags":"",
     "parents":"[a0a61c5c97dbf78578]",
     "zones":"[bitcointalk]"
  }]
}

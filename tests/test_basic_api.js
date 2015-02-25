var expect = chai.expect
var should = chai.should()

describe('Integration Tests for the Basic API', function() {
  this.timeout(7000)
  
  describe('Get a profile puff', function() {
    var prom

    it('should get a profile puff', function() {
      return prom = EB.getProfilePuff('everybit')
    })

    it('should be a profile puff', function() {
      return prom.should.eventually.have.deep.property('payload.type', 'profile')
    })

    it('should be for the everybit user', function() {
      return prom.should.eventually.have.property('username').and.contain('everybit')
    })
  })
  
  describe('Create and use an anonymous user', function() {
    var username, public_puff_sig, prom, recipient
    
    it('should create a new anonymous user', function() {
      prom = EB.Users.createAnonUserAndMakeCurrent()
    })
    
    it('should login as that user', function(done) { // explicit done
      prom.then(function(userRecord) {
        // TODO: test for userRecord
        username = EB.getCurrentUsername()
        username.should.contain('anon.')
        done()
      })
    })
    
    describe('Add a public message', function() {
      var prom
      
      it('should add a public message', function() {
        prom = EB.postPublicMessage('Hello World', 'text')
        prom.should.eventually.be.an('object')
        prom.then(function(puff) { public_puff_sig = puff.sig })
      })
      
      it('should have our anon username', function() {
        prom.should.eventually.have.property('username').and.contain(username)
      })
      
      it('should have the right content', function() {
        prom.should.eventually.have.deep.property('payload.content', 'Hello World')
      })
      
      it('should be of type text', function() {
        prom.should.eventually.have.deep.property('payload.type', 'text')
      })      
    })
    
    describe('Get the public message, fire-and-forget style', function() {
      var puff
      
      it('should get the public message from cache', function() {
        puff = EB.FAF.getPuffBySig(public_puff_sig)
        puff.should.exist()
        puff.should.not.be.false()
      })
      
      it('should have our anon username', function() {
        puff.username.should.contain(username)
      })
      
      it('should have the right content', function() {
        puff.payload.content.should.equal('Hello World')
      })
      
      it('should be of type text', function() {
        puff.payload.type.should.equal('text')
      })
    })
    
    describe('Get the public message', function() {
      var prom
      
      it('should get a promise for the public message', function() {
        prom = EB.getPuffBySig(public_puff_sig)
        prom.should.exist()
      })
      
      it('should have our anon username', function() {
        prom.should.eventually.have.property('username').and.contain(username)
      })
      
      it('should have the right content', function() {
        prom.should.eventually.have.deep.property('payload.content', 'Hello World')
      })
      
      it('should be of type text', function() {
        prom.should.eventually.have.deep.property('payload.type', 'text')
      })
    })
    
    describe('Add a private message', function() {
      var prom 
      
      it('should add a private message', function() {
        return prom = EB.postPrivateMessage('Hello World', username) // send to ourself
      })
      
      it('should have some content', function() {
        return prom.should.eventually.have.deep.property('payload.content')
      })
      
      it('should have type encryptedpuff', function() {
        return prom.should.eventually.have.deep.property('payload.type', 'encryptedpuff')
      })
      
      it('should have our username as a key', function() {
        return prom.should.eventually.have.property('keys').and.property(username + ':1') // THINK: hardcoded capa
      })
      
      it('should be from our username', function() {
        return prom.should.eventually.have.property('username').and.contain(username)
      })
      
      it('should have our username in the routes', function() {
        return prom.should.eventually.have.property('routes').and.contain(username)
      })
      
    })

    describe('Add an anonymous mode private message', function() {
      var prom

      it('should add an anonymous private message', function(done) {
        var userprom = EB.Users.addAnonymousUser()
        userprom.then(function(userRecord) {
          recipient = userRecord.username
          prom = EB.postAnonymousPrivateMessage('Hello World', recipient)
        }).then(done)
      })
      
      it('should have some content', function() {
        return prom.should.eventually.have.deep.property('payload.content')
      })
      
      it('should have type encryptedpuff', function() {
        return prom.should.eventually.have.deep.property('payload.type', 'encryptedpuff')
      })
      
      it('should have recipient as a key', function() {
        return prom.should.eventually.have.property('keys').and.property(recipient + ':1') // THINK: hardcoded capa
      })
      
      it('should not have our username as a key', function() {
        return prom.should.eventually.have.property('keys').and.not.property(username + ':1') // THINK: hardcoded capa
      })
      
      it('should not be from our username', function() {
        return prom.should.eventually.have.property('username').and.not.contain(username)
      })
      
      it('should not have our username in the routes', function() {
        return prom.should.eventually.have.property('routes').and.not.contain(username)
      })
      
      it.skip('should have our username as the letter', function() {
        // return prom.should.eventually.have.property('routes').and.not.contain(username)
      })
      
    })
      
    describe('Add a doubly anonymous mode private message', function() {
      var prom

      it('should add an anonymous private message', function() {
        prom = EB.postTracelessPrivateMessage('Hello World', recipient)
      })
      
      it('should have some content', function() {
        return prom.should.eventually.have.deep.property('payload.content')
      })
      
      it('should have type encryptedpuff', function() {
        return prom.should.eventually.have.deep.property('payload.type', 'encryptedpuff')
      })
      
      it('should have recipient as a key', function() {
        return prom.should.eventually.have.property('keys').and.property(recipient + ':1') // THINK: hardcoded capa
      })
      
      it('should not have our username as a key', function() {
        return prom.should.eventually.have.property('keys').and.not.property(username + ':1') // THINK: hardcoded capa
      })
      
      it('should not be from our username', function() {
        return prom.should.eventually.have.property('username').and.not.contain(username)
      })
      
      it('should not have our username in the routes', function() {
        return prom.should.eventually.have.property('routes').and.not.contain(username)
      })
      
      it.skip('should have our username as the letter', function() {
        // return prom.should.eventually.have.property('routes').and.not.contain(username)
      })
      
      it.skip('should have an anonymous user as the reply-to', function() {
        // return prom.should.eventually.have.property('routes').and.not.contain(username)
      })
    })
    
    
    // TODO: logout and check for non-existence of user in the persistent store
  })
})

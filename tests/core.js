// var should = require('should')
// var PB = require('../build/everybitJS/everybit-min.js')

var expect = chai.expect
var should = chai.should()

describe('Validations', function() {
  describe('PB.validateUsername', function() {
    it('should reject empty usernames', function() {
      expect(PB.validateUsername('')).to.be.false();
    })

    it('should reject usernames > 256 characters', function() {
      PB.validateUsername(Array(258).join('x')).should.be.false();
    })

    it('should accept usernames <= 256 characters', function() {
      PB.validateUsername(Array(257).join('x')).should.be.true();
    })

    it('should reject non-lowercase usernames', function() {
      PB.validateUsername('ASdF').should.be.false();
    })

    it('should reject regular non-alphanumeric usernames', function() {
      PB.validateUsername('a*b').should.be.false();
    })

    it('should reject unicode non-alphanumeric usernames', function() {
      PB.validateUsername('a💩b').should.be.false();
    })

    it('should accept mixed numbers and lowercase letters in usernames', function() {
      PB.validateUsername('4a56bc78').should.be.true();
    })

    it('should accept dots in usernames', function() {
      PB.validateUsername('a.b').should.be.true();
    })

    it('should reject consecutive dots in usernames', function() {
      PB.validateUsername('a..b').should.be.false();
    })

    it('should reject a leading dot in usernames', function() {
      PB.validateUsername('.a.b').should.be.false();
    })
  })
})


//// Integration tests

describe('Integration Tests for the Basic API', function() {
  this.timeout(3000)
  
  describe('Get a profile puff', function() {
    var prom

    it('should get a profile puff', function() {
      return prom = PB.getProfilePuff('everybit')
    })

    it('should be a profile puff', function() {
      return prom.should.eventually.have.deep.property('payload.type', 'profile')
    })

    it('should be for the everybit user', function() {
      return prom.should.eventually.have.property('username').and.contain('everybit')
    })
  })
  
  describe('Create and use an anonymous user', function() {
    var username, public_puff_sig, prom
    
    it('should create a new anonymous user', function() {
      return prom = PB.Users.createAnonUserAndMakeCurrent()
    })
    
    it('should login as that user', function(done) { // explicit done
      prom.then(function(userRecord) {
        // TODO: test for userRecord
        username = PB.getCurrentUsername()
        username.should.contain('anon.')
        done()
      })
    })
    
    describe('Add a public message', function() {
      var puff
      
      it('should add a public message', function() {
        puff = PB.postPublicMessage('Hello World', 'text')
        public_puff_sig = puff.sig
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
      var puff
      
      it('should get the public message from cache', function() {
        puff = PB.getPuffBySig(public_puff_sig)
        // TODO: the public puff isn't getting saved in the local cache
        // THINK: PB.Net.getPuffBySig works (test elsewhere)
        // THINK: should PB.getPuffBySig just always return a promise?
        console.log('asdf!', puff, public_puff_sig)
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
    
    describe('Add a private message', function() {
      var prom 
      
      it('should add a private message', function() {
        return prom = PB.postPrivateMessage('Hello World', username) // send to ourself
      })
      
      it('should have some content', function() {
        return prom.should.eventually.have.deep.property('payload.content')
      })
      
      it('should add have type encryptedpuff', function() {
        return prom.should.eventually.have.deep.property('payload.type', 'encryptedpuff')
      })
      
      it('should add have our username as a key', function() {
        return prom.should.eventually.have.property('keys').and.property(username + ':1') // THINK: hardcoded capa
      })
      
      it('should add be from our username', function() {
        return prom.should.eventually.have.property('username').and.contain(username)
      })
      
      it('should add have our username in the routes', function() {
        return prom.should.eventually.have.property('routes').and.contain(username)
      })
      
    })

    describe('Add an anonymous private message', function() {

      it('should add an anonymous private message', function() {
        var prom = PB.postAnonymousPrivateMessage('Hello World', username) // send to ourself
        
        var p1 = prom.should.eventually.have.deep.property('payload.type', 'profile')
        var p2 = prom.should.eventually.have.property('username').and.contain('everybit')
        return p2
      })
      
    })
      
    describe('Add a paranoid private message', function() {

      it('should add a paranoid private puff', function() {
        var prom = PB.postParanoidPrivateMessage('Hello World', username) // send to ourself
        
        var p1 = prom.should.eventually.have.deep.property('payload.type', 'profile')
        var p2 = prom.should.eventually.have.property('username').and.contain('everybit')
        return p2
      })
    })
    
  })
})




/// examples

describe('timeout', function() {
  describe('#blip()', function() {
    it('should timeout and increment', function(done) { // explicit 'done' param means manual async mode
      setTimeout(done, 5)
    })
  })
})

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present') // no function arg means pending (or use .skip)
  })
})

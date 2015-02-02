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

describe('Basic API', function() {
  this.timeout(3000)
  
  describe('Get a profile puff', function() {
    it('should get a profile puff', function() {
      var prom = PB.getProfilePuff('everybit')
      var p1 = prom.should.eventually.have.deep.property('payload.type', 'profile')
      var p2 = prom.should.eventually.have.property('username').and.contain('everybit')
      return p2
    })
  })
  
  describe('Create and use an anonymous user', function() {
    var username, public_puff_sig
    
    it('should create a new anonymous user and log us in', function(done) { // explicit done
      var prom = PB.Users.createAnonUserAndMakeCurrent()
      
      prom.then(function(userRecord) {
        // TODO: test for userRecord
        username = PB.getCurrentUsername()
        username.should.contain('anon.')
        done()
      })
    })
    
    describe('Then add messages', function() {
      it('should add a public puff', function() {
        var puff = PB.postPublicMessage('Hello World', 'text')
        
        puff.username.should.contain(username)
        puff.payload.content.should.equal('Hello World')
        puff.payload.type.should.equal('text')
        public_puff_sig = puff.sig
      })

      it('should add a private puff', function() {
        var prom = PB.postPrivateMessage('Hello World', username) // to ourself
        
        var p1 = prom.should.eventually.have.deep.property('payload.content')
        var p2 = prom.should.eventually.have.deep.property('payload.type', 'encryptedpuff')
        var p3 = prom.should.eventually.have.property('keys').and.property(username + ':1') // THINK: hardcoded capa
        var p4 = prom.should.eventually.have.property('username').and.contain(username)
        var p5 = prom.should.eventually.have.property('routes').and.contain(username)
        return Promise.all([p1, p2, p3, p4, p5])
      })

      it('should add an anonymous private puff', function() {
        var prom = PB.postAnonymousPrivateMessage('Hello World', username) // to ourself
        
        var p1 = prom.should.eventually.have.deep.property('payload.type', 'profile')
        var p2 = prom.should.eventually.have.property('username').and.contain('everybit')
        return p2
      })

      it('should add a paranoid private puff', function() {
        var prom = PB.postParanoidPrivateMessage('Hello World', username) // to ourself
        
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

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

// describe('Basic API', function() {
//   describe('Get a profile puff', function() {
//     it('should get a profile puff', function(done) {
//       var prom = PB.getProfilePuff('everybit')
//       prom.should.eventually.have.deep.property('payload.type', 'profile')
//       prom.should.eventually.have.property('payload.type').which.contains('everybit')
//       return prom
//
//     //   prom.then(function(data) {
//     //     it('should get a profile puff', function(done) {
//     //
//     //     data.payload.type.should.equal('profile')
//     //     PB.Users.justUsername(data.username).should.equal('everybit')
//     //     done()
//     // })
//     //   }, function(err) {
//     //     done(err)
//     })
//   })
// })




/// examples

describe('timeout', function() {
  describe('#blip()', function() {
    it('should timeout and increment', function(done) {
      setTimeout(done, 5)
    })
  })
})

describe('Array', function() {
  describe('#indexOf()', function() {
    it('should return -1 when the value is not present')
  })
})

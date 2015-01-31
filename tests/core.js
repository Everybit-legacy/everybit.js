// var should = require('should')
// var PB = require('../build/everybitJS/everybit-min.js')

var expect = chai.expect
var should = chai.should()

describe('Validations', function(){
  describe('PB.validateUsername', function(){
    it('should reject empty usernames', function(){
      expect(PB.validateUsername('')).to.be.false();
    })

    it('should reject non-lowercase usernames', function(){
      PB.validateUsername('ASdF').should.be.false();
    })

    it('should reject non-alphanumeric usernames', function(){
      PB.validateUsername('a*b').should.be.false();
    })

    it('should not allow usernames > 256 characters', function(){
      PB.validateUsername(Array(258).join('x')).should.be.false();
    })

    it('should allow usernames <= 256 characters', function(){
      PB.validateUsername(Array(257).join('x')).should.be.true();
    })

    it('should allow dots in usernames', function(){
      PB.validateUsername('a.b').should.be.true();
    })

    it('should not allow consecutive dots in usernames', function(){
      PB.validateUsername('a..b').should.be.false();
    })

    it('should not allow a leading dot in usernames', function(){
      PB.validateUsername('.a.b').should.be.false();
    })
  })
})

describe('timeout', function(){
  describe('#blip()', function(){
    it('should timeout and increment', function(done) {
      setTimeout(done, 5)
    })
  })
})


describe('Array', function(){
  describe('#indexOf()', function(){
    it('should return -1 when the value is not present')
  })
})

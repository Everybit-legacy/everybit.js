var expect = chai.expect
var should = chai.should()

describe('Validations', function() {
  describe('PB.validateUsername', function() {
    it('should reject empty usernames', function() {
      PB.validateUsername('').should.be.false()
    })

    it('should reject usernames > 256 characters', function() {
      PB.validateUsername(Array(258).join('x')).should.be.false()
    })

    it('should accept usernames <= 256 characters', function() {
      PB.validateUsername(Array(257).join('x')).should.be.true()
    })

    it('should reject non-lowercase usernames', function() {
      PB.validateUsername('ASdF').should.be.false()
    })

    it('should reject regular non-alphanumeric usernames', function() {
      PB.validateUsername('a*b').should.be.false()
    })

    it('should reject unicode non-alphanumeric usernames', function() {
      PB.validateUsername('a💩b').should.be.false()
    })

    it('should accept mixed numbers and lowercase letters in usernames', function() {
      PB.validateUsername('4a56bc78').should.be.true()
    })

    it('should accept dots in usernames', function() {
      PB.validateUsername('a.b').should.be.true()
    })

    it('should reject consecutive dots in usernames', function() {
      PB.validateUsername('a..b').should.be.false()
    })

    it('should reject a leading dot in usernames', function() {
      PB.validateUsername('.a.b').should.be.false()
    })

    it('should reject a trailing dot in usernames', function() {
      PB.validateUsername('a.b.').should.be.false()
    })
  })
})


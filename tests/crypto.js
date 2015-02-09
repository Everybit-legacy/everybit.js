var expect = chai.expect
var should = chai.should()

describe('Crypto', function() {
  var prikey, pubkey
  
  describe('PB.Crypto.generatePrivateKey', function() {
    prikey = PB.Crypto.generatePrivateKey()
    
    it('should create a new ECC key in WIF format', function() {
      prikey.should.be.a('string')
      prikey.length.should.be.at.least(45)
    })

    it('should convert to an compressed object', function() {
      var obj = PB.Crypto.wifToPriKey(prikey)
      obj.should.have.property('compressed', true)
      obj.should.have.property('priv')
    })

  })

  describe('PB.Crypto.privateToPublic', function() {
    pubkey = PB.Crypto.privateToPublic(prikey)
    
    it('should convert to a public ECC key in WIF format', function() {
      pubkey.should.be.a('string')
      pubkey.length.should.be.at.least(45)
    })

    it('should convert to a public key object', function() {
      var obj = PB.Crypto.wifToPubKey(pubkey)
      obj.should.have.property('compressed', true)
      obj.should.have.property('pub')
    })

    it('should not convert to a private key object', function() {
      PB.Crypto.wifToPriKey(pubkey).should.be.false
    })
    
  })

})


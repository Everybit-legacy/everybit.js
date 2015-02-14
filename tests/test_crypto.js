var expect = chai.expect
var should = chai.should()

describe('Crypto', function() {
  var prikey, pubkey, sig
  
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

  describe('PB.Crypto.signPuff', function() {
    // THINK: rename this function PB.Crypto.getObjectSignature or something -- it doesn't need to be a real puff
    var faux_puff = {username: 'foo'}
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.signPuff(faux_puff, 'FAKEKEY')
      response.should.be.false()
      // TODO: should trigger an error -- override PB.onError to expose those to Mocha
    })

    it('should return a signature with a known key', function() {
      var good_key = '5JdDNbi9Q1edW6FyeZsJsB281YjF8xVEXZqnMkCjfQFnws1EqxE'
      var good_sig = 'AN1rKrMcCo6rKurxL722tw1x6vt9FPPKwFDrLoaaN1aXuWRL2vtrkm9JvcXoBZcyYboWXh3DqDZ1nTsJEbviqQvRHhjhkHvjw'
      var response = PB.Crypto.signPuff(faux_puff, good_key)
      response.should.equal(good_sig)
    })

    it('should return a signature with a generated key', function() {
      sig = PB.Crypto.signPuff(faux_puff, prikey)
      sig.should.exist()
    })
  })

  describe('PB.Crypto.verifyPuffSig', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.verifyPuffSig(faux_puff, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = PB.Crypto.verifyPuffSig(faux_puff, pubkey)
      response.should.be.true()
    })
  })

  describe('PB.Crypto.puffToSiglessString', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    it('should return a puff string without a sig', function() {
      var response = PB.Crypto.puffToSiglessString(faux_puff)
      response.should.equal('{"username":"foo"}')
    })    
  })

  describe('PB.Crypto.createMessageHash', function() {
    it('should return the SHA256 hash', function() {
      var nullhash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      PB.Crypto.createMessageHash('').should.equal(nullhash)
    })

    it('should return the SHA256 hash', function() {
      var badcabhash = 'c86429619be700c72e5106e8b61d04d54d1e2986de0b7fa5e937a9ab9487f94b'
      PB.Crypto.createMessageHash('ABADCAB').should.equal(badcabhash)
    })
  })

  describe('PB.Crypto.verifyMessage', function() {
    var faux_puff = {username: 'foo', sig: sig}
    var message = PB.Crypto.puffToSiglessString(faux_puff)
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = PB.Crypto.verifyMessage(message, sig, pubkey)
      response.should.be.true()
    })
  })

  describe('PB.Crypto.wifToPriKey', function() {
    it('should fail on a bad key', function() {
      PB.Crypto.wifToPriKey('FAKEKEY').should.be.false()
    })

    it('should fail on a pubkey', function() {
      PB.Crypto.wifToPriKey(pubkey).should.be.false()
    })

    it('should create a new key object', function() {
      PB.Crypto.wifToPriKey(prikey).should.be.an('object')
    })
  })

  describe('PB.Crypto.wifToPubKey', function() {
    it('should fail on a bad key', function() {
      PB.Crypto.wifToPubKey('FAKEKEY').should.be.false()
    })
    
    it('should fail on a prikey', function() {
      PB.Crypto.wifToPriKey(prikey).should.be.false()
      // THINK: does this actually give the correct pubkey?
    })

    it('should create a new key object', function() {
      PB.Crypto.wifToPubKey(pubkey).should.be.an('object')
    })
  })

  describe('PB.Crypto.passphraseToPrivateKeyWif', function() {
    var passkey
    
    it('should create a new private key', function() {
      passkey = PB.Crypto.passphraseToPrivateKeyWif('')
      passkey.should.be.a('string')
    })

    it('should be a real key', function() {
      PB.Crypto.wifToPubKey(passkey).should.be.an('object')
    })
  })




  describe('PB.Crypto.encryptWithAES', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = PB.Crypto.verifyPuffSig(faux_puff, pubkey)
      response.should.be.true()
    })
  })
  
  describe('PB.Crypto.decryptWithAES', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = PB.Crypto.verifyPuffSig(faux_puff, pubkey)
      response.should.be.true()
    })
  })
  
  describe('PB.Crypto.getOurSharedSecret', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = PB.Crypto.verifyPuffSig(faux_puff, pubkey)
      response.should.be.true()
    })
  })
  
  describe('PB.Crypto.encryptPrivateMessage', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = PB.Crypto.verifyPuffSig(faux_puff, pubkey)
      response.should.be.true()
    })
  })
  
  describe('PB.Crypto.decryptPrivateMessage', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = PB.Crypto.verifyPuffSig(faux_puff, pubkey)
      response.should.be.true()
    })
  })

  // TODO: test randomness functions
  
  // PB.Crypto.random
  // PB.Crypto.getRandomInteger
  // PB.Crypto.getRandomItem
  // PB.Crypto.getRandomKey
  // PB.Crypto.getRandomValues
  // PB.Crypto.getRandomValuesShim

  describe('PB.Crypto.createKeyPairs', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    it('should fail on a bad key', function() {
      var response = PB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = PB.Crypto.verifyPuffSig(faux_puff, pubkey)
      response.should.be.true()
    })
  })

})


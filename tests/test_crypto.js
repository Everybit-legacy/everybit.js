var expect = chai.expect
var should = chai.should()

describe('Crypto', function() {
  var prikey, pubkey, sig, faux_puff
  
  describe('EB.Crypto.generatePrivateKey', function() {
    it('should create a new ECC key in WIF format', function() {
      prikey = EB.Crypto.generatePrivateKey()
      prikey.should.be.a('string')
      prikey.length.should.be.at.least(45)
    })

    it('should convert to an compressed object', function() {
      var obj = EB.Crypto.wifToPriKey(prikey)
      obj.should.have.property('compressed', true)
      obj.should.have.property('priv')
    })
  })

  describe('EB.Crypto.privateToPublic', function() {
    it('should convert to a public ECC key in WIF format', function() {
      pubkey = EB.Crypto.privateToPublic(prikey)
      pubkey.should.be.a('string')
      pubkey.length.should.be.at.least(45)
    })

    it('should convert to a public key object', function() {
      var obj = EB.Crypto.wifToPubKey(pubkey)
      obj.should.have.property('compressed', true)
      obj.should.have.property('pub')
    })

    it('should not convert to a private key object', function() {
      EB.Crypto.wifToPriKey(pubkey).should.be.false
    })
  })

  describe('EB.Crypto.signPuff', function() {
    // THINK: rename this function EB.Crypto.getObjectSignature or something -- it doesn't need to be a real puff
    it('should fail on a bad key', function() {
      faux_puff = {username: 'foo'}
      var response = EB.Crypto.signPuff(faux_puff, 'FAKEKEY')
      response.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should return a signature with a known key', function() {
      var good_key = '5JdDNbi9Q1edW6FyeZsJsB281YjF8xVEXZqnMkCjfQFnws1EqxE'
      var good_sig = 'AN1rKrMcCo6rKurxL722tw1x6vt9FPPKwFDrLoaaN1aXuWRL2vtrkm9JvcXoBZcyYboWXh3DqDZ1nTsJEbviqQvRHhjhkHvjw'
      var response = EB.Crypto.signPuff(faux_puff, good_key)
      response.should.equal(good_sig)
    })

    it('should return a signature with a generated key', function() {
      sig = EB.Crypto.signPuff(faux_puff, prikey)
      sig.should.exist()
    })
  })

  describe('EB.Crypto.verifyPuffSig', function() {
    it('should fail on a bad key', function() {
      faux_puff = {username: 'foo', sig: sig}
      var response = EB.Crypto.verifyPuffSig(faux_puff, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = EB.Crypto.verifyPuffSig(faux_puff, pubkey)
      response.should.be.true()
    })
  })

  describe('EB.Crypto.puffToSiglessString', function() {
    it('should return a puff string without a sig', function() {
      faux_puff = {username: 'foo', sig: sig}
      var response = EB.Crypto.puffToSiglessString(faux_puff)
      response.should.equal('{"username":"foo"}')
    })    
  })

  describe('EB.Crypto.createMessageHash', function() {
    it('should return the SHA256 hash', function() {
      var nullhash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      EB.Crypto.createMessageHash('').should.equal(nullhash)
    })

    it('should return the SHA256 hash', function() {
      var badcabhash = 'c86429619be700c72e5106e8b61d04d54d1e2986de0b7fa5e937a9ab9487f94b'
      EB.Crypto.createMessageHash('ABADCAB').should.equal(badcabhash)
    })
  })

  describe('EB.Crypto.verifyMessage', function() {
    var message
    
    it('should fail on a bad key', function() {
      faux_puff = {username: 'foo', sig: sig}
      message = EB.Crypto.puffToSiglessString(faux_puff)
      
      var response = EB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
      response.should.be.false()
    })

    it('should validate a good match', function() {
      var response = EB.Crypto.verifyMessage(message, sig, pubkey)
      response.should.be.true()
    })
  })

  describe('EB.Crypto.wifToPriKey', function() {
    it('should fail on a bad key', function() {
      EB.Crypto.wifToPriKey('FAKEKEY').should.be.false()
    })

    it('should fail on a pubkey', function() {
      EB.Crypto.wifToPriKey(pubkey).should.be.false()
    })

    it('should create a new key object', function() {
      EB.Crypto.wifToPriKey(prikey).should.be.an('object')
    })
  })

  describe('EB.Crypto.wifToPubKey', function() {
    it('should fail on a bad key', function() {
      EB.Crypto.wifToPubKey('FAKEKEY').should.be.false()
    })
    
    // THINK: This generates a seemingly valid public key, but a different one than EB.Crypto.wifToPubKey(pubkey)
    // it('should fail on a prikey', function() {
    //   EB.Crypto.wifToPubKey(prikey).should.be.false()
    // })

    it('should create a new key object', function() {
      EB.Crypto.wifToPubKey(pubkey).should.be.an('object')
    })
  })

  describe('EB.Crypto.passphraseToPrivateKeyWif', function() {
    var passkey
    
    it('should create a new private key', function() {
      passkey = EB.Crypto.passphraseToPrivateKeyWif('')
      passkey.should.be.a('string')
    })

    it('should be a real key', function() {
      EB.Crypto.wifToPubKey(passkey).should.be.an('object')
    })
  })




  describe('EB.Crypto.encryptWithAES', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    // it('should fail on a bad key', function() {
    //   var response = EB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
    //   response.should.be.false()
    // })
    //
    // it('should validate a good match', function() {
    //   var response = EB.Crypto.verifyPuffSig(faux_puff, pubkey)
    //   response.should.be.true()
    // })
  })
  
  describe('EB.Crypto.decryptWithAES', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    // it('should fail on a bad key', function() {
    //   var response = EB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
    //   response.should.be.false()
    // })
    //
    // it('should validate a good match', function() {
    //   var response = EB.Crypto.verifyPuffSig(faux_puff, pubkey)
    //   response.should.be.true()
    // })
  })
  
  describe('EB.Crypto.getOurSharedSecret', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    // it('should fail on a bad key', function() {
    //   var response = EB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
    //   response.should.be.false()
    // })
    //
    // it('should validate a good match', function() {
    //   var response = EB.Crypto.verifyPuffSig(faux_puff, pubkey)
    //   response.should.be.true()
    // })
  })
  
  describe('EB.Crypto.encryptPrivateMessage', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    // it('should fail on a bad key', function() {
    //   var response = EB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
    //   response.should.be.false()
    // })
    //
    // it('should validate a good match', function() {
    //   var response = EB.Crypto.verifyPuffSig(faux_puff, pubkey)
    //   response.should.be.true()
    // })
  })
  
  describe('EB.Crypto.decryptPrivateMessage', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    // it('should fail on a bad key', function() {
    //   var response = EB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
    //   response.should.be.false()
    // })
    //
    // it('should validate a good match', function() {
    //   var response = EB.Crypto.verifyPuffSig(faux_puff, pubkey)
    //   response.should.be.true()
    // })
  })

  // TODO: test randomness functions
  
  // EB.Crypto.random
  // EB.Crypto.getRandomInteger
  // EB.Crypto.getRandomItem
  // EB.Crypto.getRandomKey
  // EB.Crypto.getRandomValues
  // EB.Crypto.getRandomValuesShim

  describe('EB.Crypto.createKeyPairs', function() {
    var faux_puff = {username: 'foo', sig: sig}
    
    // it('should fail on a bad key', function() {
    //   var response = EB.Crypto.verifyMessage(message, sig, 'FAKEKEY')
    //   response.should.be.false()
    // })
    //
    // it('should validate a good match', function() {
    //   var response = EB.Crypto.verifyPuffSig(faux_puff, pubkey)
    //   response.should.be.true()
    // })
  })

})


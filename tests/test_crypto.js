var expect = chai.expect
var should = chai.should()

describe('Crypto', function() {
  var prikey, pubkey, sig, faux_puff, ciphertext
  
  // pre-generate some keys for later use
  var your_private = EB.Crypto.passphraseToPrivateKeyWif('your_private')
  var your_public  = EB.Crypto.privateToPublic(your_private)
  var my_private   = EB.Crypto.passphraseToPrivateKeyWif('my_private')
  var my_public    = EB.Crypto.privateToPublic(my_private)

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
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
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
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should validate a good match', function() {
      var response = EB.Crypto.verifyMessage(message, sig, pubkey)
      response.should.be.true()
    })
  })
  

  describe('EB.Crypto.wifToPriKey', function() {
    it('should fail on a bad key', function() {
      EB.Crypto.wifToPriKey('FAKEKEY').should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should fail on a pubkey', function() {
      EB.Crypto.wifToPriKey(pubkey).should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should create a new key object', function() {
      EB.Crypto.wifToPriKey(prikey).should.be.an('object')
    })
  })

  describe('EB.Crypto.wifToPubKey', function() {
    it('should fail on a bad key', function() {
      EB.Crypto.wifToPubKey('FAKEKEY').should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
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

    it('should equal the empty key', function() {
      passkey.should.equal('5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss')
    })
  })


  describe('EB.Crypto.encryptWithAES', function() {
    var message = 'asdf'
    var passkey = EB.Crypto.passphraseToPrivateKeyWif('')
    
    it('should encrypt a string', function() {
      ciphertext = EB.Crypto.encryptWithAES(message, passkey)
      ciphertext.should.be.a('string')
    })

    it('should fail on a non-string message', function() {
      var err = EB.Crypto.encryptWithAES([123], passkey)
      err.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should fail on a non-string key', function() {
      var err = EB.Crypto.encryptWithAES(message, [123])
      err.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })
  })
  
  describe('EB.Crypto.decryptWithAES', function() {
    var message = 'asdf'
    var passkey = EB.Crypto.passphraseToPrivateKeyWif('')
    
    it('should decrypt the ciphertext', function() {
      var plaintext = EB.Crypto.decryptWithAES(ciphertext, passkey)
      plaintext.should.equal(message)
    })

    it('should fail on a non-string ciphertext', function() {
      var err = EB.Crypto.decryptWithAES([123], passkey)
      err.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should fail on a non-string key', function() {
      var err = EB.Crypto.decryptWithAES(ciphertext, [123])
      err.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })
  })
  
  
  describe('EB.Crypto.getOurSharedSecret', function() {
    var secret
    
    it('should generate a secret', function() {
      secret = EB.Crypto.getOurSharedSecret(your_public, my_private)
      secret.should.be.a('string')
      secret.should.have.lengthOf(64)
    })

    it('should match the reverse secret', function() {
      var reverse_secret = EB.Crypto.getOurSharedSecret(my_public, your_private)
      reverse_secret.should.equal(secret)
    })

    it('should work for my own keys', function() {
      var my_secret = EB.Crypto.getOurSharedSecret(my_public, my_private)
      my_secret.should.be.a('string')
      my_secret.should.have.lengthOf(64)
    })

    it('should fail on a bad public key', function() {
      var bad_secret = EB.Crypto.getOurSharedSecret('ASDF', your_private)
      bad_secret.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should fail on a bad private key', function() {
      var bad_secret = EB.Crypto.getOurSharedSecret(my_public, 'ASDF')
      bad_secret.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })
  })
  
  
  describe('EB.Crypto.encryptPrivateMessage', function() {
    var message = 'asdf1234'
    
    it('should encrypt my message for you', function() {
      ciphertext = EB.Crypto.encryptPrivateMessage(message, your_public, my_private)
      ciphertext.should.be.a('string')
      ciphertext.length.should.be.greaterThan(40)
    })

    it('should encrypt the same text differently', function() {
      var ct2 = EB.Crypto.encryptPrivateMessage(message, your_public, my_private)
      ct2.should.be.a('string')
      ct2.length.should.be.greaterThan(40)
      ct2.should.not.equal(ciphertext)
    })

    it('should fail on a bad public key', function() {
      var bad_response = EB.Crypto.encryptPrivateMessage(message, 'ABADCAB', my_private)
      bad_response.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should fail on a bad private key', function() {
      var bad_response = EB.Crypto.encryptPrivateMessage(message, your_public, 'ABADCAB')
      bad_response.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should fail on a non-string message', function() {
      var bad_response = EB.Crypto.encryptPrivateMessage([123], your_public, my_private)
      bad_response.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })
  })
  
  describe('EB.Crypto.decryptPrivateMessage', function() {
    var message = 'asdf1234'
    
    it('should allow you to decrypt my message', function() {
      var plaintext = EB.Crypto.decryptPrivateMessage(ciphertext, my_public, your_private)
      plaintext.should.equal(message)
    })

    it('should allow me to decrypt my own message', function() {
      var plaintext = EB.Crypto.decryptPrivateMessage(ciphertext, your_public, my_private)
      plaintext.should.equal(message)
    })

    it('should fail on a bad public key', function() {
      var bad_response = EB.Crypto.decryptPrivateMessage(message, 'ABADCAB', my_private)
      bad_response.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should fail on a bad private key', function() {
      var bad_response = EB.Crypto.decryptPrivateMessage(message, your_public, 'ABADCAB')
      bad_response.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })

    it('should fail on a non-string message', function() {
      var bad_response = EB.Crypto.decryptPrivateMessage([123], your_public, my_private)
      bad_response.should.be.false()
      // TODO: should trigger an error -- override EB.onError to expose those to Mocha
    })
  })
  

  describe('EB.Crypto.createKeyPairs', function() {
    var your_userrecord = EB.Users.build('you', your_private)
    var my_userrecord   = EB.Users.build('me',  my_private)
    var userRecords     = [your_userrecord, my_userrecord]
    var aes_key = 'dfghjklkjhgfdfghjk'
    
    it('should make pairs of usernames and keys', function() {
      var keypairs = EB.Crypto.createKeyPairs(aes_key, my_private, userRecords)
      keypairs.should.be.an('object')
      keypairs['you:1'].should.be.a('string')
      keypairs['me:1'].should.be.a('string')
    })
    
    // TODO: add failing cases

  })


  // TODO: test randomness functions

  // EB.Crypto.random
  // EB.Crypto.getRandomInteger
  // EB.Crypto.getRandomItem
  // EB.Crypto.getRandomKey
  // EB.Crypto.getRandomValues
  // EB.Crypto.getRandomValuesShim

})


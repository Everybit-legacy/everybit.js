var expect = chai.expect
var should = chai.should()

describe('PB.Persist (localStorage)', function() {
  var key    = 'foobazlala'
  var value  = 123123
  var objkey = 'foobazlala-obj'
  var obj    = {a: 1, b: 'b', c: {d: 4}}
  
  describe('PB.Persist.save', function() {
    it('should save a primitive value', function(cb) {
      PB.Persist.save(key, value)
      setTimeout(cb, 111) // persist calls are batched every 100ms
    })

    it('should save a JSONifiable value', function(cb) {
      PB.Persist.save(objkey, obj)
      setTimeout(cb, 111) // persist calls are batched every 100ms      
    })
  })

  describe('PB.Persist.get', function() {
    it('should get the primitive value of the key', function() {
      var val = PB.Persist.get(key)
      val.should.equal(value)
    })

    it('should get the object value of the key', function() {
      var val = PB.Persist.get(objkey)
      JSON.stringify(val).should.equal(JSON.stringify(obj))
    })
  })

  describe('PB.Persist.remove', function() {
    it('should remove the item from storage', function() {
      var val = PB.Persist.get(key)
      val.should.equal(value)
      
      PB.Persist.remove(key)
      val = PB.Persist.get(key)
      val.should.be.false()
      
      PB.Persist.remove(objkey)
      val = PB.Persist.get(objkey)
      val.should.be.false()
    })
  })

})

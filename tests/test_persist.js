var expect = chai.expect
var should = chai.should()

describe('EB.Persist (localStorage)', function() {
  var key    = 'foobazlala'
  var value  = 123123
  var objkey = 'foobazlala-obj'
  var obj    = {a: 1, b: 'b', c: {d: 4}}
  
  describe('EB.Persist.save', function() {
    it('should save a primitive value', function(cb) {
      EB.Persist.save(key, value)
      setTimeout(cb, 111) // persist calls are batched every 100ms
    })

    it('should save a JSONifiable value', function(cb) {
      EB.Persist.save(objkey, obj)
      setTimeout(cb, 111) // persist calls are batched every 100ms      
    })
  })

  describe('EB.Persist.get', function() {
    it('should get the primitive value of the key', function() {
      var val = EB.Persist.get(key)
      val.should.equal(value)
    })

    it('should get the object value of the key', function() {
      var val = EB.Persist.get(objkey)
      val.should.deep.equal(obj)
    })
  })

  describe('EB.Persist.remove', function() {
    it('should remove the item from storage', function() {
      var val = EB.Persist.get(key)
      val.should.equal(value)
      
      EB.Persist.remove(key)
      val = EB.Persist.get(key)
      val.should.be.false()
      
      EB.Persist.remove(objkey)
      val = EB.Persist.get(objkey)
      val.should.be.false()
    })
  })

})

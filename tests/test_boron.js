var expect = chai.expect
var should = chai.should()

describe('Boron', function() {
  describe('Boron.persistent_merge', function() {
    it('should merge an object with a flattened object and return a new object using path-copying')
  })
  
  describe('Boron.set_deep_value', function() {
    it('should use path-copying to create a new object')
    
    it('should use path-copying to create a new array', function() {
      var arr = [1,[2],[3,4]]
      var out = Boron.set_deep_value(arr, '2.1', 99)
      arr.should.deep.equal([1,[2],[3,4]])
      arr[1].should.equal(out[1])
      arr[2].should.not.equal(out[2])
      out[2].should.deep.equal([3,99])
    })
  })
  
  describe('Boron.shallow_copy', function() {
    it('should return a new object with pointer-equivalent nested structures')
    it('should return a new array  with pointer-equivalent nested structures')
  })
  
  describe('Boron.shallow_diff', function() {
    // TODO: highlight oldObj constructor and test object/array and vice versa
    it('should return a new object revealing shallow differences')
    it('should return a new array  revealing shallow differences')
    it('should reject non-objects')
    it('should reject nulls')
  })
  
  describe('Boron.deep_diff', function() {
    // TODO: highlight newObj constructor and test object/array and vice versa
    it('should return a new object revealing deep differences')
    it('should return a new array  revealing deep differences')
    it('should reject non-objects')
    it('should reject nulls')
  })
  
  describe('Boron.flatten', function() {
    it('should flatten a flat object', function() {
      var obj = {x: [1,2,3], y: 123}
      Boron.flatten(obj).should.not.equal(obj)
      Boron.flatten(obj).should.deep.equal(obj)
    })

    it('should flatten a nested object', function() {
      var obj = {x: [1,2, [3,4]], y: {z: {a: 1, b: 2}}}
      var out = {x: [1,2, [3,4]], 'y.z.a': 1, 'y.z.b': 2}
      Boron.flatten(obj).should.deep.equal(out)
    })

    it('should attach a prefix', function() {
      var obj = {x: [1,2, [3,4]], y: {z: {a: 1, b: 2}}}
      var out = {'foo.x': [1,2, [3,4]], 'foo.y.z.a': 1, 'foo.y.z.b': 2}
      Boron.flatten(obj, 'foo').should.deep.equal(out)
    })

    it('should reject non-objects', function() {
      // THINK: error, exception, or silent passthru?
      Boron.flatten([]).should.deep.equal({})
      Boron.flatten([], 'foo').should.deep.equal({})
      Boron.flatten(123, 'foo').should.deep.equal({})
    })
  })
  
  describe('Boron.unflatten', function() {
    it('should expand a flattened object', function() {
      var obj = {x: [1,2, [3,4]], 'y.z.a': 1, 'y.z.b': 2}
      var out = {x: [1,2, [3,4]], y: {z: {a: 1, b: 2}}}
      Boron.unflatten(obj).should.deep.equal(out)
    })
  })
  
  describe('Boron.proper_object', function() {
    it('should accept objects', function() {
      Boron.proper_object({}).should.be.true()
    })

    // THINK: error, exception, or silent passthru?

    it('should reject nulls', function() {
      Boron.proper_object(null).should.be.false()
    })

    it('should reject arrays', function() {
      Boron.proper_object([]).should.be.false()
    })

    it('should reject primitives', function() {
      Boron.proper_object(11).should.be.false()
      Boron.proper_object('').should.be.false()
      Boron.proper_object(false).should.be.false()
      Boron.proper_object(undefined).should.be.false()
    })
  })
  
  describe('Boron.extend', function() {
    it('should shallow copy a single object', function() {
      var o1 =  {yay: [1,2,3]}
      Boron.extend(o1).should.not.equal(o1)
      Boron.extend(o1).should.deep.equal(o1)
    })
    
    it('should extend an object with new values', function() {
      var o1 =  {fun:123, yay:123}
      var o2 =  {yay:456, ok:789}
      var out = {fun:123, yay:456, ok:789}
      Boron.extend(o1, o2).should.deep.equal(out)
    })
    
    it('should reject non-object arguments', function() {
      // THINK: error, exception, or silent passthru?
      var x = {}
      Boron.extend(x.x).should.deep.equal({})
      Boron.extend(101).should.deep.equal({})
    })
  })
  
  describe('Boron.memoize', function() {
    it('should remember the old value of a function', function() {
      var count = 0
      var f = function() {return ++count}
      var memf = Boron.memoize(f)
      memf(1).should.equal(1)
      memf(1).should.equal(1) // obviously your memoized function should be referentially transparent
      memf(2).should.equal(2)
    })

    it('should reject non-functions', function() {
      // THINK: error, exception, or silent passthru?
      var asdf = Boron.memoize('asdf')
      asdf(123)
    })
  })
  
})

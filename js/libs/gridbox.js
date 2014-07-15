
getGridCoordBox = function(rows, cols, outerwidth, outerheight) {
    var min = function(a, b) {return Math.min(a, b)}
    var max = function(a, b) {return Math.max(a, b)}
    var gridwidth  = outerwidth  / cols
    var gridheight = outerheight / rows
    var eq = function(a, b) {return a == b}
    var grid = Array.apply(0, Array(rows))
        .map(function() {return Array.apply(0, Array(cols))
            .map(function() {return 0})}) // build 2D array

    return { get: function() {return grid}
        , set_eq: function(new_eq) {eq = new_eq}
        , add: function(width, height, miny, minx, maxy, maxx, pointer) {
            maxy = min(maxy||rows-height, rows-height), maxx = min(maxx||cols-width, cols-width)
            miny = min(miny||0, maxy), minx = min(minx||0, maxx)
            if(maxx<0 || maxy<0) return Puffball.onError('Block is too big for the grid')

            top: for(var y = miny; y <= maxy; y++) {
                bot: for(var x = minx; x <= maxx;  x++) {
                    for(var dy = 0; dy < height; dy++) {
                        for(var dx = 0; dx < width; dx++) {
                            if(grid[y+dy][x+dx]) continue bot }}
                    break top }}
            if(x == maxx+1 && y == maxy+1) return Puffball.onError('No room in the grid')
            if(x == null || y == null) return Puffball.onError('Block too big for the grid')
            for(var dy = 0; dy < height; dy++) {
                for(var dx = 0; dx < width; dx++) {
                    grid[y+dy][x+dx] = pointer || 1 } }
            return {width: width*gridwidth, height: height*gridheight, x: x*gridwidth, y: y*gridheight}
        }
    }
}

function findNeighbor(grid, pointer, dir) {
    var boxCoords = findBoxInGrid(grid, pointer)
    if(!boxCoords) return false

    // TODO: need to indicate if dirBox is outside of grid, versus pointer not found

    var dirBox = makeDirBox(boxCoords, dir)
    if(!dirBox) return false

    return firstThingInBox(grid, dirBox[0], dirBox[1])
}

function findBoxInGrid(grid, target, eq) {
    /// find something in a grid box and return coords
    /// NOTE: this assumes rectilinear shapes
    eq = eq || function(a, b) {return a === b}
    eq = function(a, b) {return a.sig === b.sig} // TODO: encapsulate eq in gridBox // OPT: don't look inside

    top: for(var y = 0, ly = grid.length; y < ly; y++)
        for(var x = 0, lx = grid[y].length; x < lx; x++)
            if(eq(grid[y][x], target)) break top                     // find top and left coords

    if(y == grid.length && x == grid[0].length) return false        // target not in box

    for(var dy = 0, ly = grid.length-y; dy < ly; dy++)
        if(!eq(grid[y+dy][x], target)) break                         // find bottom coord

    for(var dx = 0, lx = grid[y].length-x; dx < lx; dx++)
        if(!eq(grid[y][x+dx], target)) break                         // find right coord

    return [[x, y], [x+dx-1, y+dy-1]]                              // minus one because deltas always overshoot
}

function firstThingInBox(grid, topleft, botright) { // lteq because our boxes are inclusive; boundaries built in.
    for(var y = Math.max(topleft[1], 0), ly = Math.min(botright[1], grid.length-1); y <= ly; y++)
        for(var x = Math.max(topleft[0], 0), lx = Math.min(botright[0], grid[0].length-1); x <= lx; x++)
            if(grid[y][x]) return grid[y][x]
}

function makeDirBox(boxCoords, dir) {
    var top   = boxCoords[0][1]
    var left  = boxCoords[0][0]
    var bot   = boxCoords[1][1]
    var right = boxCoords[1][0]

    if(dir == 'up')    return [[left, top-1],  [right, top-1]]
    if(dir == 'down')  return [[left, bot+1],  [right, bot+1]]
    if(dir == 'left')  return [[left-1, top],  [left-1, bot]]
    if(dir == 'right') return [[right+1, top], [right+1, bot]]
}

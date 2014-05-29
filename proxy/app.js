var http = require('http');

http.createServer(onRequest).listen(8080);

function onRequest(client_req, client_res) {
  var url = client_req.url
  var urlparts = url.split('/')

  if(url == '/favicon.ico') {
    client_res.writeHead(200, {'Content-Type': 'image/x-icon'})
    client_res.end()
    return
  }
    
  // console.log(urlparts, urlparts[1], urlparts.slice(2).join('/'))

  var headers = {};
  
  // Access-Control-Allow-Headers:origin, x-requested-with, content-type
  // Access-Control-Allow-Methods:PUT, GET, POST, DELETE, OPTIONS
  // Access-Control-Allow-Origin:*
  // 
  // Access-Control-Allow-Headers:X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Content-Length, Authorization, Accept
  // Access-Control-Allow-Methods:POST, GET, PUT, DELETE, OPTIONS
  // Access-Control-Allow-Origin:*
  
  headers["Access-Control-Allow-Origin"] = "*";
  headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
  headers["Access-Control-Allow-Headers"] = "origin, x-requested-with, content-type";
  // headers["Access-Control-Allow-Credentials"] = true;
  // headers["Access-Control-Max-Age"] = '86400'; // 24 hours
  // headers["Access-Control-Allow-Headers"] = "X-Requested-With, Access-Control-Allow-Origin, X-HTTP-Method-Override, Content-Type, Content-Length, Authorization, Accept";
  client_res.writeHead(200, headers)
  
  var options = {
    hostname: urlparts[1],
    port: 80,
    path: '/' + urlparts.slice(2).join('/'),
    method: 'GET'
  };
  
  console.log('serve: ' + options.hostname + options.path);

  var proxy = http.request(options, function (res) {
    res.pipe(client_res, {
      end: true
    });
  });

  client_req.pipe(proxy, {
    end: true
  });
}
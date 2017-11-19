var http = require('http');
var fs = require('fs');
var qstr = require('querystring');
var url = require('url');


http.createServer(function(req, res) {
    pathName = url.parse(req.url).pathname;
    if (pathName === '/') pathName += 'pacman.html';
    fs.readFile(__dirname + pathName, function(err, data) {
        if (err) {            
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end('Page Not Found');
        }
        else {
            var cntType;
            var i = pathName.indexOf('.');
            if (i == -1) cntType = 'text/plain';
            else {
                if (pathName.substr(i + 1) === 'html') cntType = 'text/html';
                else if (pathName.substr(i + 1) === 'css') cntType = 'text/css';
                else if (pathName.substr(i + 1) === 'js') cntType = 'text/javascript';
                else cntType = 'text/plain';
            }
            res.writeHead(200, {'Content-type':cntType})
            res.end(data);
        }
    });
    console.log('port 8000: request for ' + pathName);
}).listen(8000);
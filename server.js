var http = require('http');
var parse = require('url').parse;
var join = require('path').join;
var fs = require('fs');
var io = require('socket.io')(http);
var root = __dirname;
var Jimp = require('jimp');

var server = http.createServer(function(req, res) {    
    
        var url = parse(req.url);
        var path;        
        
        switch(req.method)
        {
            case 'GET':
                
                if(url.path === "/")
                    path = join(root, "/index.html");
                else
                    path = join(root, url.pathname);
                
                fs.stat(path, function(err, stat) {         //check if requested page exists
                    if(err)
                    {
                        if(err.code === 'ENOENT')
                        {
                            res.statusCode = 404;
                            res.end("Page not found");
                        }
                        else
                        {
                            res.statudCode = 500;
                            res.end("Internal server error");
                        }
                    }
                    else
                    {
                        res.setHeader('Content-Length', stat.size);                        
                        var stream = fs.createReadStream(path);
                        stream.pipe(res);
                        stream.on('error', function(err) {
                            res.satusCode = 500;
                            res.end("Internal server error");
                        });
                    }
                });
                
                break;
        }
});

server.listen(3000);
console.log("Server listening on port 3000...");


//Socketing
var Server = require('socket.io');
var io = new Server();
var listener = io.listen(server);
var path = require('path');

listener.sockets.on('connection', function(socket) {
    console.log("A new user connected...");
    
    socket.on('upload', function(data) {
        
        var jmp = new Jimp(data.arrayBuffer, function () {
            this.crop(data.xClip, data.yClip, 100, 100) // crop                        
            .write(path.basename(data.name, path.extname(data.name)) + ".png"); // save
            console.log(path.basename(data.name, path.extname(data.name)));
        });
        socket.emit('Upload Complete', {'name': data.name});            
       
    });    
});


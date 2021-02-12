var http = require('http');
var fetch = require('node-fetch');
var fs = require('fs');
var path = require('path');

const zlib = require('zlib');
const untarToMemory = require('untar-memory')
const {Readable} = require("stream");

function zlibGunzip(readStream) {
    return new Promise((resolve,reject)=> {
        zlib.gunzip(readStream,(err,res)=>{
            if (err) reject(err);
            resolve(res);
            // .then((mem)=>resolve(mem.data.package))
            // .catch(error=>reject(error))
        })
    });
}

//create a server object:
http.createServer(async function (req, res) {
    var u=req.url;
    if (u.startsWith('/proxy?')){
        dest=u.substr(7);
        console.log(dest)

        let f=await fetch(dest);
        let r=await f.text();
        res.write(r); //write a response to the client
        res.end();
    }
    else if (u.startsWith('/getNPM?')){
        var url=u.substr(8);
        
        var files=[];
        var fe=await fetch(url);
        var readStream=await fe.arrayBuffer();
    
        var result=await zlibGunzip(readStream);
    
        const readStream2 = Readable.from(await result.toString())
    
        var memoryFileSystem=await untarToMemory(readStream2);
            
        for (const file in memoryFileSystem.data.package) {
            if (memoryFileSystem.data.package.hasOwnProperty.call(memoryFileSystem.data.package, file)) {
                const element = memoryFileSystem.data.package[file];
                if (file!=""){
                    //if (file.toLowerCase().endsWith(".js"))
                    files.push({
                        file:file,
                        content:element.toString()
                    })                            
                }
            }
        }
        res.write(JSON.stringify(files));
        res.end();
    }
    else
    {
        var staticBasePath = './static';
        var resolvedBase = path.resolve(staticBasePath);
        var safeSuffix = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
        var fileLoc = path.join(resolvedBase, safeSuffix);
        console.log(fileLoc)
            
        fs.readFile(fileLoc, function(err, data) {
            if (err) {
                res.writeHead(404, 'Not Found');
                res.write('404: File ' + fileLoc + ' Not Found!');
                return res.end();
            }
            
            res.statusCode = 200;
    
            res.write(data);
            res.end();
        });
    }
  
}).listen(8080); //the server object listens on port 8080


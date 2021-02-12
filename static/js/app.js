var fileList=[];
var expandedList=[];
const { fs, vol, run } = window.nodebowl;

(function(){
    var _privateLog = console.log;
    var _privateError = console.error;
    var _privateWarning = console.warning;
    console.log = function (message) {
        document.getElementById("divConsole").innerHTML+="<div>" + message + "</div>";
        _privateLog.apply(console, arguments);
    };
    console.error = function (message) {
        document.getElementById("divConsole").innerHTML+="<div class=red>" + message + "</div>";
        _privateError.apply(console, arguments);
    };
    console.warning = function (message) {
        document.getElementById("divConsole").innerHTML+="<div class=orange>" + message + "</div>";
        _privateWarning.apply(console, arguments);
    };
})();

function Message(t,color){
    if (!color)
        document.getElementById("divMessage").style.backgroundColor="orange";
    else
        document.getElementById("divMessage").style.backgroundColor=color;
    document.getElementById("divMessage").innerHTML=t;
}

function dispFile(file){
    var content=fs.readFileSync(file);
    document.getElementById("divShow").innerHTML="<pre>" + content + "</pre>";
}

function dispFolder(folder){
    var l=fs.readdirSync(folder,{ withFileTypes: true });
    var s="";
    var p=folder.lastIndexOf("/");
    var prev=folder.substr(0,p);
    if (p>=0)
        s+=`<div style='color:blue' onclick="dispFolder('${prev}')">... up</div>`;
    for (let index = 0; index < l.length; index++) {
        const r = l[index];
        if (r.mode==16895)
            s+=`<div style='color:blue' onclick="dispFolder('${folder}/${r.name}')">${folder}/${r.name}/</div>`;
        else
            s+=`<div onclick="dispFile('${folder}/${r.name}')">${r.name}</div>`;
    }
    document.getElementById("fsList").innerHTML=s;
}


async function btnLoadFiles(){
    vol.reset();
    document.getElementById("divConsole").innerHTML="";

    Message("Loading Git files");
    for(let n=0;n<fileList.length;n++)
    {
        if (fileList[n].type!="tree"){
            //console.log("LOADING:" + fileList[n].url)
            let decodedData=await getGit.RetrieveContentAsync(fileList[n].url,fileList[n].type);
            fs.writeFileSync(fileList[n].path, decodedData);
        }
        else
            fs.mkdirSync(fileList[n].path);
    }
    Message("Done","green");

    Message("Loading NPM dependency files");
    fs.mkdirSync("/node_modules");
    for(let n=0;n<expandedList.length;n++)
    {
        let ex=expandedList[n];

        var tree=ex.name.split('/');
        var s="/node_modules";
        for(let i=0;i<tree.length;i++)
        {
            s+="/" + tree[i];
            try {
                fs.mkdirSync(s);
            } catch (error) {
                //duplicate dir
            }
        }


        FF=await fetch("/getNPM?" + ex.tarball);
        var decodedData=await FF.text();
        decodedData=JSON.parse(decodedData);
        for(let f=0;f<decodedData.length;f++){
            //console.log("/node_modules/" + ex.name + "/" + decodedData[f].file)
            fs.writeFileSync("/node_modules/" + ex.name + "/" + decodedData[f].file, decodedData[f].content);
        }
    }

    dispFolder("");

    // FF=await fetch("https://raw.githubusercontent.com/shrpne/entity-decode/master/node.js");
    // var decodedData=await FF.text();
    // fs.writeFileSync("entity-decode.js", decodedData);

    // FF=await fetch("https://raw.githubusercontent.com/mathiasbynens/he/master/he.js");
    // decodedData=await FF.text();
    // fs.writeFileSync("he.js", decodedData);

    Message("Done","green");
}

async function btnRun(){
    var s=document.getElementById("selStart").value;
    try {
        run(s);
    } catch (error) {
        document.getElementById("divConsole").innerHTML=error;
    }
    // run('index.js', {
    //     env: {
    //         NODE_ENV: 'dev'
    //     }
    // }); // NODE_ENV=dev node ./index.js
}

async function btnLoad(){
    var git=document.getElementById("txtGit").value;
    if (git.toLowerCase().startsWith("https://github.com/"))
    {
        git=git.replace("https://github.com/","");
    }

    Message("Getting files from github");
    //GET FILES
    fileList=await getGit.FileListAsync(git)

    var iPackageJson=-1;

    Message("Displaying file list");

    //ADD TO DIV
    //console.log(fileList)
    var sel=document.getElementById("selStart");
    while (sel.options.length > 0) {
        sel.remove(0);
    }
    for(let i=0;i<fileList.length;i++){
        if (fileList[i].path.toLowerCase()=="/package.json")
        {
            iPackageJson=i;
        }
        var option = document.createElement("option");
        option.text = fileList[i].path;
        if (fileList[i].path=="/index.js")
            option.selected=true;
        sel.add(option)
    }

    Message("Getting Package Json NPM Dependencies");

    //GET PACKAGE.JSON
    if (iPackageJson==-1){
        document.getElementById("divPackageJson").innerHTML="Not a NodeJS project";
        Message("Not a NodeJS project","red");
    }
    else    
    {
        var dependencyList=[];
        let decodedData=await getGit.RetrieveContentAsync(fileList[iPackageJson].url,fileList[iPackageJson].type);
        var pack=JSON.parse(decodedData);
        for (const key in pack.dependencies) {
            if (Object.hasOwnProperty.call(pack.dependencies, key)) {
                const element = pack.dependencies[key];
        
                dependencyList.push({
                    name:key,
                    value:element
                })
            }
        }

        Message("Getting NPM Dependencies");
        
        expandedList=[];
        for(var f=0;f<dependencyList.length;f++){
            let d=dependencyList[f];

            //Get files from dependencies
            var list=await getNPM.DependencyList(d.name,d.value);
            expandedList=expandedList.concat(list);
        };

        var check = new Set();
        expandedList= expandedList.filter(obj => !check.has(obj["name"]) && check.add(obj["name"]));

        expandedList.sort((a,b)=>{ if (a.name>b.name) return 1; else return -1;});
    }
    await btnLoadFiles();
}

async function runAll(){
    await btnLoad();
    await btnRun();
}

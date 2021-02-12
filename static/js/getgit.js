var getGit={
    FileListAsync:async function(gitName) {
        const URLbase="https://api.github.com/repos/";
        const URLBranches=URLbase + gitName + "/branches";
        var branch="master";
        if (!await this.BranchExistsAsync(URLBranches,"master")){
            if (await this.BranchExistsAsync(URLBranches,"main"))
                branch="main";
            else
                branch="";
        }
        if (branch!="")
        {
            var URLMaster=URLbase + gitName + "/branches/" + branch;
            //let list=await getGitHubFileList(URLMaster);
            let F1=await fetch(URLMaster);
            let R1=await F1.json();

            var tree=R1.commit.commit.tree.url;

            var fileList=await this.TreeAsync(tree,"");
            return fileList;
        }
        else
        {
            console.log("No master or main branch");
            return null;
        }
    },

    BranchExistsAsync:async function(URLBranches,branchName) {
        let F1=await fetch(URLBranches);
        let R1=await F1.json();
        var bExists=false;
        R1.forEach(branch => {
            if (branch.name==branchName){
                bExists=true;
            }
        });
        return bExists;
    },

    TreeAsync:async function(url,path){
        let F2=await fetch(url);
        let R2=await F2.json();

        var fileList=[];
        for (let index = 0; index < R2.tree.length; index++) {
            const file = R2.tree[index];
            
            if (file.type=="tree"){
                fileList.push(
                    {
                        path:path + "/" + file.path,
                        type:file.type,
                        url:file.url
                    }
                )
                var fL=await this.TreeAsync(file.url,path + "/" + file.path);
                fileList=fileList.concat(fL);
            }
            else{
                fileList.push(
                    {
                        path:path + "/" + file.path,
                        type:file.type,
                        size:file.size,
                        url:file.url
                    }
                )
            }
        }
        return fileList;
    },

    RetrieveContentAsync:async function(url,contentType){
        let FF=await fetch(url);
        let RF=await FF.json();
        switch (contentType) {
            case "blob":
                var decodedData = window.atob(RF.content); // decode the string    
                return decodedData;
                break;
        
            default:
                var decodedData = window.atob(RF.content); // decode the string    
                return decodedData;
                break;
        }
    }
}

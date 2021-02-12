var getNPM={

    Description:async function(packageName, version){
        var f=await fetch("/proxy?https://registry.npmjs.org/" + packageName)
        var r=await f.json();

        var latest=r["dist-tags"].latest;
        //console.log(r["versions"][latest])
        if (version!=null){
            var desc=r["versions"][version];
            if (desc==null)
                desc=r["versions"][latest];
        }            
        else
            var desc=r["versions"][latest];

        if (version!=null){
            return {
                name:packageName,
                main:desc.main,
                latest:latest,
                tarball:desc.dist.tarball,
                dependencies:desc.dependencies
                // jsdelivr:desc.jsdelivr,
                // unpkg:desc.unpkg
            }    
        }

        return {
            name:packageName,
            main:desc.main,
            latest:latest,
            tarball:desc.dist.tarball,
            dependencies:desc.dependencies
            // jsdelivr:desc.jsdelivr,
            // unpkg:desc.unpkg
        }
    },

    DependencyList:async function(name,version){
        var listOfDependencies=[];
        
        var a=await getNPM.Description(name,version);
        listOfDependencies.push(a)
        
        var i=0;
        while(i<listOfDependencies.length){
            a=listOfDependencies[i]; 
            if (typeof a.dependencies!="undefined"){
                for (const key in a.dependencies) {
                    if (Object.hasOwnProperty.call(a.dependencies, key)) {
                        const element = a.dependencies[key];
                        //CHECK if element is already in the list
                        if (listOfDependencies.findIndex(f=>f.name==element)<0){
                            var b=await getNPM.Description(key,element);
                            listOfDependencies.push(b)
                            //console.log(b)    
                        }
                    }
                }
            }
            i++;
        }
        return listOfDependencies;
    }
    
}
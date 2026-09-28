import { authHeaders } from "./Helpers";

export const fetchProjectByUserId = async(userId) => {
    return await fetch('/api/v1/projects/customer/' + userId,{
        headers: authHeaders(),
        method: 'GET'
    });
}

export const fetchProjectById = async(projectId) => {
    return await fetch('/api/v1/projects/' + projectId,{
        headers: authHeaders(),
        method: 'GET'
    });
}

export const updateProject = async(project) => {
    return await fetch('/api/v1/projects/' + project.projectId,{
        body: JSON.stringify(project),
        headers: authHeaders(),
        method: 'PUT'
    });
}

export const addWebpageAndUpdateProject = async (project, website, webpage) => {

    if(isWebpageExist(website.webpages, webpage.url)){
        const newWebpages = website.webpages.map(obj => {
            // 👇️ if id equals 2, update country property
            if (obj.url === webpage.url) {
              return {...obj, currentSuggestion: webpage.currentSuggestion};
            }
      
            // 👇️ otherwise return object as is
            return obj;
        });

        website.webpages.push(...newWebpages);
    }
    else {
        if(website.webpages == null){
            const webpages = [];
            webpages.push(webpage);
            website.webpages = webpages;
        }
        else {
            website.webpages.push(webpage);
        }
    }

    console.log("webpages:" + JSON.stringify(website.webpages));


    const newWebsites = project.websites.map(obj => {
        // 👇️ if id equals 2, update country property
        if (obj.url === website.url) {
          return {...obj, webpages: website.webpages};
        }
  
        // 👇️ otherwise return object as is
        return obj;
    });

    project.websites = newWebsites;

    return await updateProject(project);


}

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

export const getCrawlingData = () => {
    const store = storage();
    if (!store) return null;
    const raw = store.getItem("crawlingData");
    return raw ? JSON.parse(raw) : null;
}

export const getProject = () => {
    const store = storage();
    if (!store) return null;
    const raw = store.getItem("project");
    return raw ? JSON.parse(raw) : null;
}

export const getWebsite = () => {
    const store = storage();
    if (!store) return null;
    const raw = store.getItem("currentWebsite");
    return raw ? JSON.parse(raw) : null;
}

export const isWebsiteExist = (websites, url) => {
    let isExist = false;
    if(websites == null || websites.length == 0) {
        return false;
    }
    if(websites == null || websites.length == 0) {
        isExist = false;
    }
    websites.some(element => {
        if (element.url === url) {
            isExist = true;
        }
      });
    return  isExist;
} 

export const isWebpageExist = (webpages, url) => {
    if(webpages == null || webpages.length == 0) {
        return false;
    }
    webpages.some(element => {
        if (element.url === url) {
          return true;
        }
    
        return false;
      });
} 

export const pickupFieldFromSuggestion = (suggestion, fieldName) => {
    var result = null;
    if(suggestion != null && suggestion.fieldContents != null) {
        suggestion.fieldContents.some(element => {
            if (element.name === fieldName) {
              result = element;
            }
          });
    }

    return result;
}

export const pickupWebsiteFromProject = (project, url) => {
    var result = null;
    if(project != null && project.websites != null) {
        project.websites.some(element => {
            if (element.url === url) {
              result = element;
            }
          });
    }

    return result;
}


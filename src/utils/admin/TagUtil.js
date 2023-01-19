import CONFIG from "../../config/admin/Constant";

export const fetchTags = async(data) => {
    return await fetch(CONFIG.hostname + ':8084/tagging/tags',{
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

export const fetchSearchifyTags = async(domain) => {
    return await fetch(CONFIG.hostname + ':8084/suggestion/tags',{
        body: JSON.stringify({domain: domain}),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

export const createNewTag = async(domain, tagName) => {
    return await fetch(CONFIG.hostname + ':8084/suggestion/tags/create',{
        body: JSON.stringify({domain: domain, tagName: tagName}),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

export const fetchAllSuggestions = async() => {
    return await fetch(CONFIG.hostname + ':8084/suggestion/multi',{
        body: JSON.stringify(['Education']),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

export const fetchSuggestionsByDomain = async(domain) => {
    return await fetch(CONFIG.hostname + ':8084/suggestion/domain',{
        body: JSON.stringify({domain: domain}),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

export const fetchAllDomains = async() => {
    return await fetch(CONFIG.hostname + ':8084/suggestion/domains',{
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'GET'
    });
}

export const simplifyTags = (tags) => {
    const simplifiedTags = [];
    tags.forEach(element => {
        simplifiedTags.push({id: element.tag_id, name: element.tag_name});
    });
     return simplifiedTags
}

export const fetchDeepSuggestions = async(description)  => {
    console.log("description : " + description)
    const res = await fetch(CONFIG.hostname + ':8084/wordai/text?text=' + description,{
        body: null,
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });

    const result =  await res.json();
    
    return result;
}

export const createSimpleSuggestion = async(data) => {
    return await fetch(CONFIG.hostname + ':8084/suggestion/create',{
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

export const editSuggestion = async(data) => {
    return await fetch(CONFIG.hostname + ':8084/suggestion/update',{
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

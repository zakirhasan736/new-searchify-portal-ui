import { authHeaders } from "./Helpers";

export const fetchTags = async(data) => {
    return await fetch('/api/v1/tags',{
        body: JSON.stringify(data),
        headers: authHeaders(),
        method: 'POST'
    });
}

export const fetchSearchifyTags = async(domain) => {
    return await fetch('/api/v1/suggestions/tags',{
        body: JSON.stringify({domain: domain}),
        headers: authHeaders(),
        method: 'POST'
    });
}

export const fetchAllSuggestions = async() => {
    return await fetch('/api/v1/suggestions/domain',{
        body: JSON.stringify({domain: 'Education'}),
        headers: authHeaders(),
        method: 'POST'
    });
}

export const fetchSuggestionsByDomain = async(domain) => {
    return await fetch('/api/v1/suggestions/domain',{
        body: JSON.stringify({domain: domain}),
        headers: authHeaders(),
        method: 'POST'
    });
}

export const fetchAllDomains = async() => {
    return await fetch('/api/v1/suggestions/domains',{
        headers: authHeaders(),
        method: 'GET'
    });
}

export const detectTagsData = (detectTags, sourceTags) => {
    const tags = [];
    console.log("Detect:" + JSON.stringify(detectTags));
    console.log("Source:" + JSON.stringify(sourceTags));
    for (let i = 0; i < detectTags.length; i++) {
      for (let j = 0; j < sourceTags.length; j++) {
        console.log("Compare: " + detectTags[i].tag_name + " / " + sourceTags[j].name);
        if(detectTags[i].tag_name == sourceTags[j].name)
        {
            console.log("Compare OK: " + detectTags[i].tag_name + " / " + sourceTags[j].name);
            const object ={label: sourceTags[j].name, value: sourceTags[j].id}
            tags.push(object);
        }
      }
    }

    return tags;
    // setTagsData(tags);
  }

export const simplifyTags = (tags) => {
    const simplifiedTags = [];
    const seperator = "||";
    tags.forEach(element => {
        const index = element.tag_name.indexOf(seperator);
        const tagName = element.tag_name.substring(index+3);
        simplifiedTags.push({id: element.tag_id, tag_name: tagName, confidence: element.confidence});
    });
     return simplifiedTags
}

export const getDomainFromTag = (tag) => {
    const seperator = "||";
    const index = tag.tag_name.indexOf(seperator);
    const tagName = tag.tag_name.substring(0, index - 1)
    return tagName;
}

export const fetchDeepSuggestions = async(description)  => {
    console.log("description : " + description)
    const res = await fetch('/api/v1/suggestions/text',{
        body: JSON.stringify({text: description}),
        headers: authHeaders(),
        method: 'POST'
      });

    const result =  await res.json();
    
    return result;
}

export const findDomain = (domainName, domains) => {
  return domains.find((element) => {
    return element.name === domainName;
  })
}

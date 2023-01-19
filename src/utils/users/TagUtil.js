import CONFIG from "../../config/users/Constant";

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
    const res = await fetch(CONFIG.hostname + ':8084/wordai/text',{
        body: JSON.stringify({text: description}),
        headers: {
          'Content-Type': 'application/json'
        },
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

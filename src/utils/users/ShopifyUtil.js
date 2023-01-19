import CONFIG from "../../config/users/Constant";

export const fetchShopifyPages = async(data) => {
    return await fetch(CONFIG.hostname + ':8087/shopify/pages',{
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

export const fetchShopifyPageSeo = async(data) => {
    return await fetch(CONFIG.hostname + ':8087/shopify/pageseo/getpage',{
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

export const updateShopifyPageSeo = async(data) => {
    return await fetch(CONFIG.hostname + ':8087/shopify/pageseo/update',{
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST'
    });
}

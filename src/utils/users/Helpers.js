export const parseJwt = (token) => {
    if (!token) { return }
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(window.atob(padded))
  }
  
export const handleLogError = (error) => {
    if (error.response) {
      console.log(error.response.data);
    } else if (error.request) {
      console.log(error.request);
    } else {
      console.log(error.message);
    }
  }

const storage = () => (typeof window === "undefined" ? null : window.localStorage);

export const getUser = () => {
    const store = storage();
    if (!store) return null;
    const raw = store.getItem("user");
    return raw ? JSON.parse(raw) : null;
  }

export const  userIsAuthenticated = () => {
    const store = storage();
    if (!store) return false;
    let user = store.getItem("user");
    if (!user) {
      return false;
    }
    user = JSON.parse(user);
    
    // if user has token expired, logout user
    if (Date.now() > user.data.exp * 1000) {
      userLogout();
      return false;
    }
    return true;
  }

export const  userLogin = user => {
    const store = storage();
    if (!store) return;
    store.setItem("user", JSON.stringify(user));
    window.dispatchEvent(new Event("sf-auth"));
  }

export const  userLogout = () => {
    const store = storage();
    if (!store) return;
    store.removeItem("user");
    window.dispatchEvent(new Event("sf-auth"));
    store.removeItem("project");
    store.removeItem("currentWebsite");
    store.removeItem("crawlingData");
  }

export function authHeaders() {
    const token = getUser()?.result?.token;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}


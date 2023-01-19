export const parseJwt = (token) => {
    if (!token) { return }
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace('-', '+').replace('_', '/')
    return JSON.parse(window.atob(base64))
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

export const getUser = () => {
    return JSON.parse(localStorage.getItem('user'))
  }

export const  userIsAuthenticated = () => {
    let user = localStorage.getItem('user')
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
    localStorage.setItem('user', JSON.stringify(user));
  }

export const  userLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('project');
    localStorage.removeItem('currentWebsite');
    localStorage.removeItem('crawlingData');
    
  }


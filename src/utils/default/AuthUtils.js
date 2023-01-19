export const removeUserSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
}
export const setUserSession = (token, user) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', user)
}
export const getToken = () => {
    return localStorage.getItem('token')
}
export const getUser = () => {
    return localStorage.getItem('user')
}
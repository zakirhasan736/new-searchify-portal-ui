import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { getToken } from '.';
const PrivateRoute = ({ redirectTo }) => {
    if (!getToken()) {
        return <Navigate to={redirectTo} />
    }
    return <Outlet />
};
export default PrivateRoute;
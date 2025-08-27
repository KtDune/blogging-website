import { Route, Routes, useNavigate } from "react-router-dom";
import Navbar from "./components/navbar.component";
import UserAuthForm from "./pages/userAuthForm.page";
import { createContext, useEffect, useState } from "react";
import { lookInSession } from "./common/session";
import Editor from "./pages/editor.pages";
import HomePage from "./pages/home.page";
import SearchPage from "./pages/search.page";
import PageNotFound from "./pages/404.page";
import ProfilePage from "./pages/profile.page";
import BlogPage from "./pages/blog.page";
import SideNavbar from "./components/sidenavbar.component";
import ChangePassword from "./pages/change-password.page";
import EditProfile from "./pages/edit-profile.page";
import NotificationPage from "./pages/notifications.page";
import ManageBlogs from "./pages/manage-blogs.page";
import axios from "axios";

axios.defaults.withCredentials = true;

export const UserContext = createContext({})

const App = () => {
    const [userAuth, setUserAuth] = useState({})
    const navigate = useNavigate()

    useEffect(() => {
        let userSession = lookInSession('user')
        userSession ? setUserAuth(JSON.parse(userSession)) : setUserAuth({ access_token: null })
    }, [])

    useEffect(() => {
        // 🔥 Add interceptor here so setUserAuth & navigate are in scope
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config

                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true
                    try {
                        const res = await axios.post(
                            `${import.meta.env.VITE_SERVER_DOMAIN}/refresh`
                        )
                        const newAccessToken = res.data?.access_token

                        if (newAccessToken) {
                            setUserAuth(prev => ({
                                ...prev,
                                access_token: newAccessToken
                            }))


                            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                            return axios(originalRequest) // retry request
                        }
                        else {
                            navigate("/")
                            console.log('No refresh token lol')
                        }
                    } catch (refreshError) {
                        navigate("/") // refresh token failed → logout
                        return Promise.reject(refreshError)
                    }
                }
                return Promise.reject(error)
            }
        )

        return () => axios.interceptors.response.eject(interceptor) // cleanup on unmount
    }, [setUserAuth, navigate])

    return (
        <UserContext.Provider value={{ userAuth, setUserAuth }}>
            <Routes>
                <Route path="/editor" element={<Editor />} />
                <Route path="/editor/:blog_id" element={<Editor />} />
                <Route path="/" element={<Navbar />}>
                    <Route index element={<HomePage />} />
                    <Route path="/dashboard" element={<SideNavbar />}>
                        <Route path="blogs" element={<ManageBlogs />} />
                        <Route path="notification" element={<NotificationPage />} />
                    </Route>
                    <Route path="/settings" element={<SideNavbar />}>
                        <Route path="edit-profile" element={<EditProfile />} />
                        <Route path="change-password" element={<ChangePassword />} />
                    </Route>
                    <Route path="/signin" element={<UserAuthForm type="sign-in" />} />
                    <Route path="/signup" element={<UserAuthForm type="sign-up" />} />
                    <Route path="/search/:query" element={<SearchPage />} />
                    <Route path="/user/:id" element={<ProfilePage />} />
                    <Route path="/blog/:id" element={<BlogPage />} />
                    <Route path="*" element={<PageNotFound />} />
                </Route>
            </Routes>
        </UserContext.Provider>
    )
}

export default App;
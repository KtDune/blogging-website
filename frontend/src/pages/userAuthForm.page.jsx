import { Link, Navigate } from "react-router-dom"
import InputBox from "../components/input.component"
import googleIcon from '../imgs/google.png'
import AnimationWrapper from "../common/page-animation"
import { useContext } from "react"
import { Toaster, toast } from "react-hot-toast"
import axios from 'axios'
import { storeInSession } from "../common/session"
import { UserContext } from "../App"
import { authWithGoogle } from "../common/firebase"

const UserAuthForm = (props) => {
    let emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; // regex for email
    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

    let { userAuth: { access_token }, setUserAuth } = useContext(UserContext)

    const userAuthThroughServer = (route, formData) => {
        axios.post(import.meta.env.VITE_SERVER_DOMAIN + route, formData)
            .then(({ data }) => {
                storeInSession("user", JSON.stringify(data))

                setUserAuth(data)
            })
            .catch(({ response }) => toast.error(response.data.error))
    }

    const handleGoogleAuth = async (e) => {
        e.preventDefault

        try {
            const result = await authWithGoogle()

            if (result) {
                let serverRoute = '/google-auth'

                let formData = {
                    access_token: result.accessToken,
                }

                userAuthThroughServer(serverRoute, formData)
            }
        }
        catch (err) {
            toast.error('Trouble login into user')
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault() // Prevent fomr from submitting

        // Retrieve form data
        let form = new FormData(authForm)
        let formData = {} // Even we have a FormData object, its content can only be retrieved via a loop for security reasons.

        for (let [key, value] of form.entries()) {
            formData[key] = value
        }

        let { fullName, email, password } = formData

        // validating data from frontend
        if (fullName && fullName.length < 3) {
            return toast.error('Full name must be at least 3 letters long')
        }

        if (!email.length) {
            return toast.error('Please enter an email')
        }

        if (!emailRegex.test(email)) {
            return toast.error('Invalid email format')
        }

        if (!password) {
            return toast.error('Please enter a password')
        }

        if (!passwordRegex.test(password)) {
            return toast.error('Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters')
        }

        let route = props.type === 'sign-in' ? '/signin' : '/signup'

        userAuthThroughServer(route, formData)
    }

    return (
        access_token
            ? <Navigate to='/' />
            : (<AnimationWrapper keyValue={props.type}>
                <section className="h-cover flex items-center justify-center">
                    <Toaster />
                    <form id="authForm" className="w-[8-%] max-w-[400px]">
                        <h1 className="text-4xl font-gelasio capitalize text-center mb:24">
                            {props.type === 'sign-up' ? 'Join Us Today!' : 'Welcome Back!'}
                        </h1>

                        {
                            props.type === 'sign-in'
                                ? ''
                                : <InputBox
                                    type={'text'}
                                    name={'fullName'}
                                    icon={'fi-rr-user'}
                                    placeholder={'Full Name'} />
                        }

                        <InputBox
                            type={'email'}
                            name={'email'}
                            icon={'fi-rr-envelope'}
                            placeholder={'Email'} />

                        <InputBox
                            type={'password'}
                            name={'password'}
                            icon={'fi-rr-key'}
                            placeholder={'Password'} />

                        <button type="submit"
                            onClick={handleSubmit}
                            className="btn-dark center mt-14">
                            {props.type.replace('-', ' ')}
                        </button>

                        <div className="relative w-full flex items-center gap-2 my-10 pacity-10 uppercase text-black font-bold">
                            <hr className="w-1/2 border-black" />
                            <p>or</p>
                            <hr className="w-1/2 border-black" />
                        </div>
                        <button
                        type="button"
                            className="btn-dark flex items-center justify-center gap-4 w-[90%] center"
                            onClick={handleGoogleAuth}
                        >
                            <img src={googleIcon} className="w-5" />
                            Continue with Google
                        </button>

                        {
                            props.type === 'sign-in'
                                ?
                                (
                                    <p className="mt-6 text-dark-grey text-xl text-center">
                                        Don't have an account? <Link to={'/signup'} className="underline text-black text-xl ml-1">Sign Up</Link>
                                    </p>
                                )
                                :
                                (
                                    <p className="mt-6 text-dark-grey text-xl text-center">
                                        Already a member? <Link to={'/signin'} className="underline text-black text-xl ml-1">Sign In</Link>
                                    </p>
                                )
                        }
                    </form>
                </section>
            </AnimationWrapper>)
    )
}

export default UserAuthForm
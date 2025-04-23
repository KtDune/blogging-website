import { Link } from "react-router-dom"
import InputBox from "../components/input.component"
import googleIcon from '../imgs/google.png'
import AnimationWrapper from "../common/page-animation"

const UserAuthForm = (props) => {
    return (
        <AnimationWrapper keyValue={props.type}>
            <section className="h-cover flex items-center justify-center">
                <form className="w-[8-%] max-w-[400px]">
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

                    <button type="submit" className="btn-dark center mt-14">
                        {props.type.replace('-', ' ')}
                    </button>

                    <div className="relative w-full flex items-center gap-2 my-10 pacity-10 uppercase text-black font-bold">
                        <hr className="w-1/2 border-black" />
                        <p>or</p>
                        <hr className="w-1/2 border-black" />
                    </div>
                    <button className="btn-dark flex items-center justify-center gap-4 w-[90%] center">
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
        </AnimationWrapper>
    )
}

export default UserAuthForm
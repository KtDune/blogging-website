import AnimationWrapper from "../common/page-animation"
import InputBox from "../components/input.component"
import { useContext, useRef } from "react"
import { Toaster, toast } from "react-hot-toast"
import axios from "axios"
import { UserContext } from "../App"

const ChangePassword = () => {

    let passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{6,20}$/; // regex for password

    const changePasswordForm = useRef()
    const { userAuth: { access_token } } = useContext(UserContext)

    const handleSubmitFunction = (e) => {
        e.preventDefault()

        const form = new FormData(changePasswordForm.current)
        const formData = {}

        for (let [key, value] of form.entries()) {
            formData[key] = value
        }

        const { currentPassword, newPassword } = formData

        if (!currentPassword.length || ! newPassword.length) {
            return toast.error('Please fill in every fields')
        }

        if (!passwordRegex.test(currentPassword) || !passwordRegex.test(newPassword)) {
             return toast.error('Password should be 6 to 20 characters long with a numeric, 1 lowercase and 1 uppercase letters')
        }

        let toastLoading = toast.loading('Updating')
        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/change-password`, formData, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        .then(() => {
            toast.dismiss(toastLoading)
            toast.success('Password updated successfully!!!')
        })
        .catch(({ response: { data: { error } } }) => {
            toast.dismiss(toastLoading)
            toast.error(error)
        })
    }

    return (
        <AnimationWrapper>
            <Toaster />
            <form ref={changePasswordForm}>
                <h1 className="max-md:hidden">Change password</h1>

                <div className="py-10 w-full md:max-w-[400px]">
                    <InputBox
                        name="currentPassword"
                        type="password"
                        className="profile-edit-input"
                        placeholder="Current Password"
                        icon="fi-rr-unlock"
                    />

                    <InputBox
                        name="newPassword"
                        type="password"
                        className="profile-edit-input"
                        placeholder="New Password"
                        icon="fi-rr-unlock"
                    />

                    <button type="submit" className="btn-dark px-10" onClick={handleSubmitFunction}>
                        Change Password
                    </button>
                </div>
            </form>
        </AnimationWrapper>
    )
}

export default ChangePassword

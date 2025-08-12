import { useContext, useEffect, useRef, useState } from "react"
import { UserContext } from "../App"
import axios from "axios"
import { Toaster, toast } from "react-hot-toast"
import { profileDataStructure } from "./profile.page"
import AnimationWrapper from "../common/page-animation"
import Loader from "../components/loader.component"
import InputBox from "../components/input.component"
import { uploadImage } from "../common/firebase"
import { storeInSession } from "../common/session"
import { deleteImage } from "../components/tools.component"

const EditProfile = () => {

    const bioLimit = 200

    const { userAuth, userAuth: { access_token, username }, setUserAuth } = useContext(UserContext)
    const [profile, setProfile] = useState(profileDataStructure)
    const [charactersLeft, setCharactersLeft] = useState(bioLimit)
    const [updatedProfileImg, setUpdatedProfileImg] = useState(null)
    const profile_img_element = useRef()
    const formRef = useRef()

    const {
        personal_info: { fullname, username: profile_username, profile_img, email, bio },
        social_links
    } = profile

    const handleCharacterChange = (e) => {
        if (charactersLeft.length >= 200) {
            e.preventDefault()
        }

        setCharactersLeft(prev => bioLimit - e.target.value.length)
    }

    const handleImagePreview = (e) => {
        const img = e.target.files[0]

        profile_img_element.current.src = URL.createObjectURL(img)
        setUpdatedProfileImg(img)
    }

    // DONE: Delete the current image after the new image has been updated. Only delete the image if it is not default image.
    const handleImageUploadFunction = async (e) => {
        e.preventDefault()

        if (updatedProfileImg) {
            let loadingToast = toast.loading('Uploading...')
            const url = await uploadImage(updatedProfileImg, access_token)

            if (url) {

                // If the profile img is not default image, then delete the current image.
                if (!userAuth.profile_img.match(/^(?:https?:\/\/)?api\.dicebear\.com(?:\/|$)/)) {
                    await deleteImage(userAuth.profile_img, access_token)
                }

                axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/update-profile-img`, {
                    url
                }, {
                    headers: {
                        Authorization: `Bearer ${access_token}`
                    }
                })
                    .then(({ data }) => {
                        let newUserAuth = { ...userAuth, profile_img: data.profile_img }

                        storeInSession("user", JSON.stringify(newUserAuth))
                        setUserAuth(newUserAuth)

                        setUpdatedProfileImg(null)


                        toast.dismiss(loadingToast)
                        toast.success('Uploaded! 👍')
                    })
                    .catch(({ response: { data: { error } } }) => {
                        setUpdatedProfileImg(null)

                        toast.dismiss(loadingToast)
                        toast.error('Error:' + error)
                    })
            }
            else {
                toast.dismiss(loadingToast)
                toast.error('Image upload failed.')
            }
        }
        else {
            toast.error('Please upload an image')
        }
    }

    const handleFormSubmission = (e) => {
        e.preventDefault()

        const form = new FormData(formRef.current)

        const formData = {}

        for (const [key, value] of form.entries()) {
            formData[key] = value
        }

        const {
            username,
            bio,
            youtube,
            facebook,
            instagram,
            github,
            twitter,
            website
        } = formData

        if (username.length < 3) {
            toast.error('Username should be at least 3 letters long.')

            return
        }

        const loadingToast = toast.loading('Updating...')
        e.target.setAttribute('disabled', true)

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/update-profile`, {
            username, bio, social_links: { youtube, facebook, twitter, github, instagram, website }
        }, {
            headers: {
                Authorization: `Bearer ${access_token}`
            }
        })
            .then(({ data }) => {

                if (userAuth.username !== data.username) {
                    const newUserAuth = { ...userAuth, username: data.username }

                    storeInSession('user', JSON.stringify(newUserAuth))
                    setUserAuth(newUserAuth)
                }

                toast.dismiss(loadingToast)
                e.target.removeAttribute('disabled', false)
                toast.success('Profile updated!')

            })
            .catch(({ response: { data: { error } } }) => {
                toast.dismiss(loadingToast)
                e.target.removeAttribute('disabled', false)
                toast.error(error.message)
            })
    }

    useEffect(() => {
        if (access_token) {
            axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-profile`, {
                username
            })
                .then(({ data }) => {
                    setProfile(data)
                })
                .catch(({ response: { data: { error } } }) => console.error(error))
        }
    }, [access_token])

    return (
        <AnimationWrapper>
            {
                Boolean(profile_username)
                    ? <form ref={formRef}>
                        <Toaster />

                        <h1 className="max-md:hidden">Edit Profile</h1>

                        <div className="flex flex-col lg:flex-row items-start py-10 gap-8 lg:gap-10">
                            <div className="max-lg:center mb-5">
                                <label htmlFor="uploadedImg" id="profileImgLabel" className="relative block w-48 h-48 bg-grey rounded-full overflow-hidden">
                                    <img src={profile_img} ref={profile_img_element} />
                                    <div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-white bg-black/80 opacity-0 hover:opacity-100 cursor-pointer">
                                        Upload Image
                                    </div>
                                </label>

                                <input type="file" id="uploadedImg" accept=".jpeg, .png, .jpg, .webp" hidden onChange={handleImagePreview} />

                                <button type="button" className="btn-light mt-5 max-lg:center lg:full px-10" onClick={handleImageUploadFunction}>Upload</button>
                            </div>

                            <div className="w-full">
                                <div className="grid grid-cols-1 md:grid-cols-2 md:gap-5">
                                    <div>
                                        <InputBox name="fullname" type="text" value={fullname} placeholder="Fullname..." icon="fi fi-rr-user" disable={true} />
                                    </div>

                                    <div>
                                        <InputBox name="email" type="email" value={email} placeholder="Email..." icon="fi fi-rr-envelope" disable={true} />
                                    </div>
                                </div>

                                <InputBox name="username" type="text" value={profile_username} placeholder="Username..." icon="fi fi-rr-at" />
                                <p className="text-dark-grey -mt-3 text-sm">Username will be used to search user and will be visible to all users.</p>

                                <textarea name="bio" maxLength={bioLimit} defaultValue={bio} className="input-box h-64 lg:h-40 resize-none leading-7 mt-5 pl-5" placeholder="Bio..." onChange={handleCharacterChange} />
                                <p className="mt-1 text-dark-grey">{charactersLeft} characters left.</p>

                                <p className="my-6 text-dark-grey">Add your social handles below...</p>

                                <div className="md:grid md:grid-cols-2 gap-x-6">
                                    {
                                        Object.keys(social_links).map((key, i) => {
                                            let link = social_links[key]

                                            return (
                                                <InputBox key={i} name={key} type="text" value={link} placeholder="https://..." icon={`fi ${key !== 'website' ? `fi-brands-${key}` : 'fi-rr-globe'}`} />
                                            )
                                        })
                                    }
                                </div>

                                <button type="submit" onClick={handleFormSubmission} className="btn-dark w-auto px-10">Update</button>
                            </div>
                        </div>
                    </form>
                    : <Loader />
            }
        </AnimationWrapper>
    )
}

export default EditProfile

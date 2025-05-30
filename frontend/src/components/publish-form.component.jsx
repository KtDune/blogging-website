import { Toaster, toast } from "react-hot-toast"
import AnimationWrapper from "../common/page-animation"
import { useContext } from "react"
import { EditorContext } from "../pages/editor.pages"
import Tag from "./tags.component"
import { UserContext } from "../App"
import { useNavigate } from "react-router-dom"
import axios from 'axios'

const PublishForm = () => {
    const characterLimit = 200
    const tagLimit = 10
    const { blog, blog: { banner, title, content, tags, des }, setEditorState, setBlog } = useContext(EditorContext)
    const { userAuth: { access_token } } = useContext(UserContext)
    const navigate = useNavigate()

    const handleCloseEvent = () => {
        setEditorState('editor')
    }

    const handleBlogTitleChange = (e) => {
        let input = e.target

        setBlog(prev => ({ ...prev, title: input.value }))
    }

    const handleBlogDescriptionChange = (e) => {
        let input = e.target

        setBlog(prev => ({ ...prev, des: input.value }))
    }

    const handleTitleKeyDown = (e) => {
        if (e.keyCode == 13) {
            e.preventDefault() // Prevent user from typing newline character
        }
    }

    const handleKeydownFunction = (e) => {
        if (e.keyCode == 13 || e.keyCode == 188) {
            e.preventDefault()

            let input = e.target.value
            if (tags.length < tagLimit) {
                if (!tags.includes(input) && input.length > 0) {
                    setBlog(prev => ({ ...prev, tags: [...tags, input] }))
                }
            }
            else {
                toast.error(`Maximum ${tagLimit} tags allowed.`)
                return
            }

            e.target.value = ""
        }
    }

    const publishBlogFunction = (e) => {
        if (e.target.className.includes('disable')) {
            return
        }

        if (!title.length) {
            return toast.error('Write blog title before publishing.')
        }

        if (!des.length || des.length > characterLimit) {
            return toast.error(`Write description about your blog within ${characterLimit} characters before publishing.`)
        }

        let loadingToast = toast.loading('Publishing...')

        e.target.classList.add('disable')

        const payload = {
            title, banner, des, content, tags, draft: false,
        }

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/create-blog`, payload, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
        .then(() => {
            e.target.classList.remove('disable')

            toast.dismiss(loadingToast)

            toast.success('Published 👍')

            setTimeout(() => {
                navigate('/')
            }, 500)
        })
        .catch(({ response }) => {
            e.target.classList.remove('disable')

            toast.dismiss(loadingToast)

            return toast.error(response.data.error)
        })
    }
    return (
        <AnimationWrapper>
            <section className="w-screen min-h-screen grid items-center lg:grid-cols-2 py-16 lg:gap-4">
                <Toaster />

                <button
                    className="w-12 h-12 absolute right-[5vw] max-eigh z-10 top-[6%] lg:top-[10%]"
                    onClick={handleCloseEvent}
                >
                    <i className="fi fi-br-cross" />
                </button>

                <div className="max-w-[550px] center">
                    <p className="text-dark-grey mb-1">Preview</p>

                    <div className="w-full aspect-video rounded-lg overflow-hidden bg-grey mt-4">
                        <img src={banner} />
                    </div>

                    <h1 className="text-4xl font-medium mt-3 leading-tight overflow-auto">{title}</h1>

                    <p className="font-gelasioline-clamp-2 text-xl leading-7 mt-4">{des}</p>


                </div>

                <div className="border-grey lg:border-1 lg:pl-8">
                    <p className="text-dark-grey mb-2 mt-9">Blog Title: </p>
                    <input
                        type="text"
                        placeholder="Blog title"
                        defaultValue={title}
                        className="input-box pl-4"
                        onChange={handleBlogTitleChange}
                        onKeyDown={handleTitleKeyDown}
                    />

                    <p className="text-dark-grey mb-2 mt-9">Short description about your blog:</p>
                    <textarea
                        maxLength={characterLimit}
                        defaultValue={des}
                        className="h-40 resize-none leading-7 input-box pl-4"
                        onChange={handleBlogDescriptionChange}
                        onKeyDown={handleTitleKeyDown}
                    >

                    </textarea>

                    <p className="mt-4 text-dark-grey text-sm text-right">{characterLimit - des.length} characters left</p>

                    <p className="text-dark-grey mb-2 mt-9">Tags:</p>
                    <div className="relative input-box pl-2 py-2 pb-4">
                        <input
                            type="text"
                            placeholder="Tags"
                            className="input-box sticky top-0 left-0 p-4 mb-3 focus:bg-white"
                            onKeyDown={handleKeydownFunction}
                        />
                        {
                            tags.map((tag, index) => <Tag tag={tag} key={index} />)
                        }
                    </div>

                    <p className="mt-4 text-dark-grey text-sm text-right">{tagLimit - tags.length} tags left</p>

                    <button
                        className="btn-dark px-8"
                        onClick={publishBlogFunction}
                    >
                        Publish
                    </button>
                </div>

            </section>
        </AnimationWrapper>
    )
}

export default PublishForm
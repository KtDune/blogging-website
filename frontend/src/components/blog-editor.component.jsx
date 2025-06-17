import { Link, useNavigate } from "react-router-dom"
import logo from "../imgs/logo.png"
import AnimationWrapper from "../common/page-animation"
import { Toaster, toast } from "react-hot-toast"
import { uploadImage } from "../common/firebase"
import { useContext, useEffect, useRef } from "react"
import { EditorContext } from "../pages/editor.pages"
import defaultBanner from "../imgs/blog banner.png"
import EditorJS from "@editorjs/editorjs"
import { toolBar } from "./tools.component"
import axios from "axios"
import { UserContext } from "../App"
import Loader from "./loader.component"

const BlogEditor = () => {
    const context = useContext(EditorContext)
    const authContext = useContext(UserContext)

    if (!context || !authContext) {
        return null
    }

    const {
        blog: { title, banner, content, tags, des },
        setEditorState,
        setBlog,
        textEditor,
        setTextEditor,
    } = context

    const { userAuth: { access_token } } = authContext
    const navigate = useNavigate()

    useEffect(() => {
        if (!textEditor.isReady) {
            setTextEditor(new EditorJS({
                holder: "textEditor",
                data: content,
                tools: toolBar,
                placeholder: 'Start your story here...',
            }))
        }
    }, [])

    const handlePublishEvent = (e) => {
        if (!banner) {
            toast.error('Upload a banner to publish it.')

            return
        }

        if (!title.length) {
            toast.error('Add blog title to publish')

            return
        }

        if (textEditor.isReady) {
            textEditor.save().then(data => {
                if (data.blocks.length) {
                    setBlog(prev => ({ ...prev, content: data }))
                    setEditorState("publish")
                }
                else {
                    return toast.error("Write somthing in your blog to publish it")
                }
            })
                .catch(err => console.error(err))
        }
    }

    const handleError = (e) => {
        let img = e.target

        img.src = defaultBanner // If no image is set, set the default image
    }

    const handleTitleKeyDown = (e) => {
        if (e.keyCode == 13) {
            e.preventDefault() // Prevent user from typing newline character
        }
    }

    const handleTitleChange = (e) => {
        let input = e.target

        input.style.height = 'auto' // reset height
        input.style.height = input.scrollHeight + 'px'

        setBlog(prev => ({ ...prev, title: input.value }))
    }

    const handleBannerUpload = async (e) => {
        let image = e.target.files[0]

        if (image) {
            let loadingToast = toast.loading('Uploading Image...')
            const url = await uploadImage(image)

            if (url) {
                toast.dismiss(loadingToast)
                toast.success('Uploaded! 👍')

                setBlog(prev => ({ ...prev, banner: url }))
            }
            else {
                toast.dismiss(loadingToast)
                toast.success('Uploaded Failed')
                toast.error('Image upload failed.')
            }
        }
        else {
            toast.error('Please upload an image')
        }
    }

    const handleSaveDraft = (e) => {
        if (e.target.className.includes('disable')) {
            return
        }

        if (!title.length) {
            return toast.error('Write blog title before saving it as a draft.')
        }

        let loadingToast = toast.loading('Saving draft...')

        e.target.classList.add('disable')

        if (textEditor.isReady) {
            textEditor.save().then(content => {
                const payload = {
                    title, banner, des, content, tags, draft: true,
                }

                axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/create-blog`, payload, {
                    headers: {
                        'Authorization': `Bearer ${access_token}`
                    }
                })
                    .then(() => {
                        e.target.classList.remove('disable')

                        toast.dismiss(loadingToast)

                        toast.success('Saved 👍')

                        setTimeout(() => {
                            navigate('/')
                        }, 500)
                    })
                    .catch(({ response }) => {
                        e.target.classList.remove('disable')

                        toast.dismiss(loadingToast)

                        return toast.error(response.data.error)
                    })

            })
        }


    }
    return (
        Boolean(context && authContext)
            ? <>
                <Toaster />
                <nav className="navbar">
                    <Link to="/" className="flex-none w-10">
                        <img src={logo} alt="Upload Banner" />
                    </Link>

                    <p className="max-md:hidden text-black line-clamp-1 w-full">{title.length > 0 ? title : 'New Blog'}</p>

                    <div className="flex gap-4 ml-auto">
                        <button type="button" className="btn-dark py-2" onClick={handlePublishEvent}>
                            Publish
                        </button>
                        <button
                            type="button"
                            className="btn-light py-2"
                            onClick={handleSaveDraft}
                        >
                            save Draft
                        </button>
                    </div>
                </nav>

                <AnimationWrapper>
                    <section>
                        <div className="mx-auto max-w-[900px] w-full">

                            <div className="relative aspect-video hover:opacity-80 bg-white border-4 border-grey">
                                <label htmlFor="uploadBanner">
                                    <img
                                        src={banner}
                                        className="z-20" // TODO: Fit the image to its parent container.
                                        onError={handleError}
                                    />
                                    <input
                                        id="uploadBanner"
                                        type="file"
                                        accept=".png, .jpg, .jpeg"
                                        hidden
                                        onChange={handleBannerUpload}
                                    />
                                </label>
                            </div>

                            <textarea
                                defaultValue={title}
                                placeholder="Blog Title"
                                className="text-4xl font font-medium w-full h-20 outline-none resize-none mt-10 leading-tight placeholder:opacity-40"
                                onKeyDown={handleTitleKeyDown}
                                onChange={handleTitleChange}
                            >

                            </textarea>

                            <hr className="w-full opacity-10 my-5" />

                            <div
                                id="textEditor"
                                className="font-gelasio"
                            >

                            </div>

                        </div>
                    </section>
                </AnimationWrapper>
            </>
            : <Loader />
    )
}

export default BlogEditor
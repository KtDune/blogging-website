import { Toaster, toast } from "react-hot-toast"
import AnimationWrapper from "../common/page-animation"
import { useContext } from "react"
import { EditorContext } from "../pages/editor.pages"
import Tag from "./tags.component"

const PublishForm = () => {
    const characterLimit = 200
    const tagLimit = 10
    const { blog, blog: { banner, title, text, tags, des }, setEditorState, setBlog } = useContext(EditorContext)

    const handleCloseEvent = () => {
        setEditorState('editor')
    }

    const handleBlogTitleChange = (e) => {
        let input = e.target

        setBlog({ ...blog, title: input.value })
    }

    const handleBlogDescriptionChange = (e) => {
        let input = e.target

        setBlog({ ...blog, des: input.value })
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
                    setBlog({ ...blog, tags: [...tags, input] })
                }
            }
            else {
                toast.error(`Maximum ${tagLimit} tags allowed.`)
                return
            }

            e.target.value = ""
        }
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

                    <button className="btn-dark px-8">Publish</button>
                </div>

            </section>
        </AnimationWrapper>
    )
}

export default PublishForm
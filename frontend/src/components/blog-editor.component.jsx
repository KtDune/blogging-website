import { Link } from "react-router-dom"
import defaultBanner from "../imgs/blog banner.png"
import logo from "../imgs/logo.png"
import AnimationWrapper from "../common/page-animation"
import { Toaster, toast } from "react-hot-toast"
import { uploadImage } from "../common/firebase"
import { useRef } from "react"

const BlogEditor = () => {
    let blogBannerRef = useRef()


    const handleBannerUpload = async (e) => {
        let image = e.target.files[0]

        if (image) {
            const url = await uploadImage(image)

            if (url) {
                blogBannerRef.current.src = url
            }
            else {
                toast.error('Image upload failed.')
            }
        }
        else {
            toast.error('Please upload an image')
        }
    }


    return (
        <>
            <Toaster />
            <nav className="navbar">
                <Link to="/" className="flex-none w-10">
                    <img src={logo} alt="Upload Banner" />
                </Link>

                <p className="max-md:hidden text-black line-clamp-1 w-full">New Blog</p>

                <div className="flex gap-4 ml-auto">
                    <button type="button" className="btn-dark py-2">
                        Publish
                    </button>
                    <button type="button" className="btn-light py-2">
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
                                    ref={blogBannerRef}
                                    src={defaultBanner}
                                    className="z-20" // TODO: Fit the image to its parent container.
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

                    </div>
                </section>
            </AnimationWrapper>
        </>
    )
}

export default BlogEditor
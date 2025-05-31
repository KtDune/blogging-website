import axios from "axios"
import AnimationWrapper from "../common/page-animation"
import InPageNavigation from "../components/inpage-navigation.component"
import { useEffect, useState } from "react"
import Loader from '../components/loader.component'
import BlogPostCard from "../components/blog-post.component"

const HomePage = () => {
    const [blogs, setBlogs] = useState(null)

    useEffect(() => {
        fetchLatestBlog()
    }, [])

    const fetchLatestBlog = () => {
        axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/latest-blog`)
            .then(({ data }) => { setBlogs(data.blogs) })
            .catch(err => console.error(err))
    }
    return (
        <AnimationWrapper>
            <section className="h-cover flex justify0center gap-10">
                <div className="w-full">
                    <InPageNavigation routes={['Home', 'Trending Blogs']} defaultHidden={['Trending Blogs']}>

                        <>
                            {
                                blogs === null
                                    ? <Loader />
                                    : blogs.map((blog, i) => (
                                        <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                                            <BlogPostCard content={blog} author={blog.author.personal_info} />
                                        </AnimationWrapper>
                                    ))
                            }
                        </>

                        <h1>Trending blog here</h1>

                    </InPageNavigation>
                </div>

                <div>

                </div>
            </section>
        </AnimationWrapper>
    )
}
export default HomePage
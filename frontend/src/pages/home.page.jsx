import axios from "axios"
import AnimationWrapper from "../common/page-animation"
import InPageNavigation from "../components/inpage-navigation.component"
import { useEffect, useState } from "react"
import Loader from '../components/loader.component'
import BlogPostCard from "../components/blog-post.component"
import MinimalBlogPost from "../components/nobanner-blog-post.component"
import { getDay, getHomeDate } from "../common/date"
import WeatherComponent from "../components/weather.component"

const HomePage = () => {
    const [blogs, setBlogs] = useState(null)
    const [trendingBlogs, setTrendingBlogs] = useState(null)
    const categories = []

    useEffect(() => {
        fetchLatestBlog()
        fetchTrendingBlog()
    }, [])

    const fetchLatestBlog = () => {
        axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/latest-blog`)
            .then(({ data }) => { setBlogs(data.blogs) })
            .catch(err => console.error(err))
    }

    const fetchTrendingBlog = () => {
        axios.get(`${import.meta.env.VITE_SERVER_DOMAIN}/trending-blog`)
            .then(({ data }) => { setTrendingBlogs(data.blogs) })
            .catch(err => console.error(err))
    }
    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
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

                    </InPageNavigation>
                </div>

                <div className="min-w-[40%] lg:min-w-[400px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                    <div className="flex flex-col gap-10">
                        <h1 className="font-medium text-xl">{getHomeDate(new Date())}</h1>

                        <WeatherComponent />
                        
                    </div>

                    <div>
                        <h1 className="font-medium text-xl mb-8">
                            Trending
                            <i className="fi fi-rr-arrow-trend-up"></i>
                        </h1>

                        <>
                            {
                                trendingBlogs === null
                                    ? <Loader />
                                    : trendingBlogs.map((blog, i) => (
                                        <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                                            <MinimalBlogPost blog={blog} index={i} />
                                        </AnimationWrapper>
                                    ))
                            }
                        </>
                    </div>
                </div>
            </section>
        </AnimationWrapper>
    )
}
export default HomePage
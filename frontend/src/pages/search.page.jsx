import { useParams } from "react-router-dom"
import AnimationWrapper from "../common/page-animation"
import Loader from '../components/loader.component'
import { useEffect, useState } from "react"
import LoadMoreDataBtn from "../components/load-more.component"
import NodataMessage from "../components/nodata.component"
import axios from "axios"
import BlogPostCard from "../components/blog-post.component"

const SearchPage = () => {

    const { query } = useParams()
    const [blogs, setBlogs] = useState(null)
    const [curPage, setCurPage] = useState(1)

    useEffect(() => {
        searchBlog(curPage)
    }, [query, curPage])

    const searchBlog = (page = 1) => {
        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/search-blog`, {
            page,
            query,
        })
        .then(({ data }) => {
            setBlogs(data)
        })
        .catch(err => console.error(err))
    }

    return (
        <AnimationWrapper>
            <section className="h-cover flex justify-center gap-10">
                <div className="w-full">
                    <h3>Search result from "{query}":</h3>
                    <>
                        {
                            blogs === null
                                ? <Loader />
                                : blogs?.blogs.length === 0
                                    ? <NodataMessage message={'No blogs published'} />
                                    : blogs?.blogs.map((blog, i) => (
                                        <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                                            <BlogPostCard content={blog} author={blog.author.personal_info} />
                                        </AnimationWrapper>
                                    ))
                        }
                        <LoadMoreDataBtn state={blogs} setCurPage={setCurPage} curPage={curPage} />
                    </>
                </div>
            </section>
        </AnimationWrapper>
    )
}

export default SearchPage
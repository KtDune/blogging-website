import { useParams } from "react-router-dom"
import AnimationWrapper from "../common/page-animation"
import Loader from '../components/loader.component'
import { useEffect, useState } from "react"
import LoadMoreDataBtn from "../components/load-more.component"
import NodataMessage from "../components/nodata.component"
import axios from "axios"
import BlogPostCard from "../components/blog-post.component"
import InPageNavigation from "../components/inpage-navigation.component"
import UserCard from "../components/usercard.component"

const SearchPage = () => {

    const { query } = useParams()
    const [blogs, setBlogs] = useState(null)
    const [curPage, setCurPage] = useState(1)
    const [users, setUsers] = useState(null)
    const [navPage, setNavPage] = useState('Blogs')

    useEffect(() => {
        searchBlog(curPage)
        fetchUser()
    }, [query, curPage])

    const searchBlog = (page = 1) => {
        setBlogs(null)

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/search-blog`, {
            page,
            query,
        })
            .then(({ data }) => {
                setBlogs(data)
            })
            .catch(err => console.error(err))
    }

    const fetchUser = () => {
        setUsers(null)

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/search-user`, { query })
            .then(({ data }) => {
                setUsers(data)
            })
    }

    return (
        <section className="h-cover flex justify-center gap-10">
            <div className="w-full">
                <AnimationWrapper>
                    <h3>Search result from "{query}":</h3>
                </AnimationWrapper>
                <InPageNavigation routes={['Blogs', 'Users']} setNavPage={setNavPage} defaultHidden={['Users']}>
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

                    <>
                        {
                            users === null
                                ? <Loader />
                                : users.length > 0
                                    ? users.map((user, i) => (
                                        <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                                            <UserCard user={user} />
                                        </AnimationWrapper>
                                    ))
                                    : <NodataMessage message={'No user found'} />
                        }
                    </>
                </InPageNavigation>
            </div>

            <div className="min-w-[40%] lg:min-w-[350px] max-w-min border-l border-grey pl-8 pt-3 max-md:hidden">
                <h1 className="font-medium text-xl mb-8">Related user <i className="fi fi-rr-user mt-1"></i></h1>
                <>
                    {
                        users === null
                            ? <Loader />
                            : users.length > 0
                                ? users.map((user, i) => (
                                    <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                                        <UserCard user={user} />
                                    </AnimationWrapper>
                                ))
                                : <NodataMessage message={'No user found'} />
                    }
                </>
            </div>
        </section>
    )
}

export default SearchPage
import { useContext, useEffect, useState } from "react"
import { UserContext } from "../App"
import { fetchBlogInManage } from "../components/tools.component"
import toast, { Toaster } from "react-hot-toast"
import InPageNavigation from "../components/inpage-navigation.component"
import Loader from "../components/loader.component"
import BlogPostCard from "../components/blog-post.component"
import NodataMessage from "../components/nodata.component"
import AnimationWrapper from "../common/page-animation"
import ManageBlogCard from "../components/manage-blogcard.component"
import LoadMoreDataBtn from "../components/load-more.component"

// DONE: Change search on keydown to search on enter / click search icon.
const ManageBlogs = () => {

    const [blogs, setBlogs] = useState(null)
    const [draft, setDraft] = useState(null)
    const [query, setQuery] = useState('')
    const [page, setPage] = useState(1)
    const [navPage, setNavPage] = useState('Published Blogs')
    const [searchTrigger, setSearchTrigger] = useState(true)
    const { userAuth: { access_token } } = useContext(UserContext)

    useEffect(() => {
        setPage(1)
    }, [navPage])

    useEffect(() => {

        const fetchContent = async () => {
            try {

                if (navPage === 'Drafts') {
                    const result = await fetchBlogInManage({ page, query, draft: true, access_token })

                    setDraft(result)
                }
                else {
                    const result = await fetchBlogInManage({ page, query, draft: false, access_token })

                    setBlogs(result)
                }
            }
            catch (err) {
                console.error(err)
            }
        }

        if (access_token && searchTrigger) {
            fetchContent()
            setSearchTrigger(false)
        }

    }, [access_token, page, navPage, searchTrigger])

    const handleChange = (e) => {
        if (e.target.value.length === 0) {
            setSearchTrigger(true)
            setQuery('')
            setBlogs(null)
            setDraft(null)
        }
    }

    const handleSearchFunction = (e) => {
        const searchQuery = e.target.value
        setQuery(searchQuery)

        if (e.keyCode === 13 && searchQuery.length) {
            setBlogs(null)
            setDraft(null)
            setSearchTrigger(true)
        }
    }

    return (
        <>

            <h1 className="max-md:hidden">Manage Blogs</h1>

            <Toaster />

            <div className="relative max-md:mt-5 md:mt-8 mb-10">
                <input
                    type="search"
                    className="w-full bg-grey p-4 pl-12 pr-6 rounded-full placeholder:text-dark-grey"
                    placeholder="Search blogs..."
                    onChange={handleChange}
                    onKeyDown={handleSearchFunction}
                />

                <i className="fi fi-rr-search absolute right-[10%] md:pointer-events-none md:left-5 top-1/2 -translate-y-1/2 text-xl text-dark-grey"></i>
            </div>

            <InPageNavigation routes={['Published Blogs', 'Drafts']} setNavPage={setNavPage}>
                {
                    blogs === null
                        ? <Loader />
                        : blogs?.blogs.length
                            ? (
                                <>
                                    {blogs.blogs.map((item, i) => (
                                        <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                                            <ManageBlogCard
                                                item={item}
                                                page={page}
                                                query={query}
                                                setArray={setBlogs}
                                            />
                                        </AnimationWrapper>
                                    ))}
                                </>
                            )
                            : <NodataMessage message={'No blogs available'} />
                }

                {
                    draft === null
                        ? <Loader />
                        : draft?.blogs.length
                            ? (
                                <>
                                    {draft.blogs.map((item, i) => (
                                        <AnimationWrapper key={i} transition={{ delay: i * 0.04 }}>
                                            <ManageBlogCard
                                                item={item}
                                                page={page}
                                                query={query}
                                                setArray={setDraft}
                                            />
                                        </AnimationWrapper>
                                    ))}
                                </>
                            )
                            : <NodataMessage message={'No draft available'} />
                }
            </InPageNavigation>
            <LoadMoreDataBtn
                state={navPage === 'Published Blogs' ? blogs : draft}
                curPage={page}
                setCurPage={setPage}
            />


        </>
    )
}

export default ManageBlogs

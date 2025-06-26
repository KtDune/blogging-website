import { Link, useParams } from "react-router-dom"
import axios from "axios"
import { useEffect, useState } from "react"
import AnimationWrapper from "../common/page-animation"
import Loader from "../components/loader.component"
import { getHomeDate } from "../common/date"
import BlogInteraction from "../components/blog-interaction.component"
import BlogPostCard from "../components/blog-post.component"
import BlogContent from "../components/blog-content.component"
import CommentsContainer from "../components/comments.component"

export const defaultBlogStructure = {
    title: '',
    banner: '',
    des: '',
    content: [],
    tags: [],
    author: { personal_info: {} },
    publishedAt: '',
}

const BlogPage = () => {

    const { id: blog_id } = useParams()
    const [blog, setBlog] = useState(defaultBlogStructure)
    const [similarBlog, setSimilarBlog] = useState(null)
    const [isLikedByUser, setIsLikedByUser] = useState(false)
    const [commentWrapper, setCommentWrapper] = useState(true)
    const [totalParentCommentLoaded, setTotalParentCommentLoaded] = useState(0)

    const {
        title,
        banner,
        des,
        content,
        tags,
        author: {
            personal_info: {
                fullname,
                username: author_username,
                profile_img
            }
        },
        publishedAt
    } = blog

    useEffect(() => {
        resetPage()

        fetchBlog()
    }, [blog_id])

    const resetPage = () => {
        setBlog(defaultBlogStructure)
        setSimilarBlog(null)
        setIsLikedByUser(false)
        setCommentWrapper(true)
        setTotalParentCommentLoaded(0)
    }

    const fetchBlog = () => {
        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-blog`, {
            blog_id: blog_id
        })
            .then(({ data: { blog } }) => {

                setBlog(blog)

                const firstTag = blog.tags.length > 0 ? blog.tags[0] : ''

                axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/search-blog`, {
                    query: `@${firstTag}`,
                    eliminate_blog: blog_id,
                })
                    .then(({ data }) => { setSimilarBlog(data.blogs) })
                    .catch(err => console.log(err, message))

            })
            .catch(err => console.error(err))
    }

    return (

        <AnimationWrapper>
            {
                Boolean(banner && title && content)
                    ? <div className="max-w-[900px] center py-10 max-lg:px-[5vw]">

                        <CommentsContainer
                            blog={blog}
                            setBlog={setBlog}
                            commentWrapper={commentWrapper}
                            setCommentWrapper={setCommentWrapper}
                            totalParentCommentLoaded={totalParentCommentLoaded}
                            setTotalParentCommentLoaded={setTotalParentCommentLoaded}
                        />

                        <img src={banner} className="aspect-video" />
                        <div className="mt-12">
                            <h2>{title}</h2>

                            <div className="flex max-sm:flex-col justify-between my-8">
                                <div className="flex gap-5 items-start">
                                    <img src={profile_img} className="w-12 h-12 rounded-full" />

                                    <p className="capitalize">
                                        {fullname}<br />
                                        <Link to={`/user/${author_username}`} className="underline">
                                            @{author_username}
                                        </Link>
                                    </p>
                                </div>

                                <p className="text-dark-grey opacity-75 max-sm:mt-6 max-sm:ml-12 max-sm:pl-5">Published at: {getHomeDate(publishedAt)}</p>
                            </div>
                        </div>

                        <BlogInteraction
                            blog={blog}
                            setBlog={setBlog}
                            isLikedByUser={isLikedByUser}
                            setIsLikedByUser={setIsLikedByUser}
                            setCommentWrapper={setCommentWrapper}
                        />

                        <div className="my-12 font-gelasio blog-page-content">
                            {
                                content[0]?.blocks.map((block, i) => (
                                    <div key={i} className="my-4 md:my-8">
                                        <BlogContent block={block} />
                                    </div>
                                ))
                            }
                        </div>

                        {/** Show two of this component so that the user won't need to navigate to the top to add like / comment. */}
                        <BlogInteraction
                            blog={blog}
                            setBlog={setBlog}
                            isLikedByUser={isLikedByUser}
                            setIsLikedByUser={setIsLikedByUser}
                            setCommentWrapper={setCommentWrapper}
                        />

                        {
                            Boolean(similarBlog?.length > 0)
                                ? <>
                                    <h1 className="text-2xl mt-14 mb-10 font-medium">Similar Blog</h1>
                                    {
                                        similarBlog.map((blog, i) => {
                                            const { author: { personal_info } } = blog

                                            return (
                                                <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.08 }}>
                                                    <BlogPostCard content={blog} author={personal_info} />
                                                </AnimationWrapper>
                                            )
                                        })
                                    }
                                </>
                                : ''
                        }

                    </div>
                    : <Loader />
            }
        </AnimationWrapper>

    )
}

export default BlogPage
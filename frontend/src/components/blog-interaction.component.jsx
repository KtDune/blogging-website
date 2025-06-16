import { useContext } from "react"
import { Link } from "react-router-dom"
import { UserContext } from "../App"

const BlogInteraction = ({ blog, setBlog }) => {

    const {
        blog_id,
        activity: { total_likes, total_comments },
        author: { personal_info: { username: author_username } }
    } = blog

    const { userAuth: { username } } = useContext(UserContext)

    return (
        <>
            <hr className="border-grey my2" />
            <div className="flex gap-6">
                <div className="flex gap-2 items-center">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey">
                        <i className="fi fi-rr-heart"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_likes}</p>
                </div>

                <div className="flex gap-2 items-center">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center bg-grey">
                        <i className="fi fi-rr-comment-dots"></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_comments}</p>
                </div>

                {
                    username === author_username
                        ? <Link to={`/editor/${blog_id}`} className="underline hover:text-purple ms-auto my-auto me-2">
                            Edit
                        </Link>
                        : ''
                }
            </div>
            <hr className="border-grey my2" />
        </>
    )
}

export default BlogInteraction
import { useEffect } from "react"
import CommentField from "./comment-field.component"
import axios from "axios"

export const fetchComments = async ({ skip = 0, blog_id, setCommentArray, replyingTo = undefined }) => {

    await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-blog-comments`, {
        skip, blog_id, replyingTo
    })
        .then(({ data }) => {
            setCommentArray(prev => {
                const merged = [...data, ...prev];
                const uniqueById = Array.from(new Map(merged.map(obj => [obj._id, obj])).values())

                const finalResult = uniqueById.sort((a, b) => new Date(b.commentedAt) - new Date(a.commentedAt))

                return finalResult
            })

        })
        .catch(error => console.error(error.message))

}

const CommentsContainer = ({ blog, commentWrapper, setCommentWrapper }) => {

    const { _id: blog_id, title, author: { _id: author_id, personal_info: { username } }, activity: { total_parent_comments } } = blog

    return (
        <div className={`max-sm:w-full fixed ${commentWrapper ? "top-0 sm:right-0" : "top-[100%] sm:right-[-100%]"} duration-700 max-sm:right-0 sm:top-0 w-[30%] min-w-[350px] h-full z-50 bg-white shadow-2xl p-8 px-16 overflow-y-auto overflow-x-hidden`}>
            <div className="relative">
                <h1 className="text-xl font-medium">Comments</h1>
                <p className="text-lg mt-2 w-[70%] text-dark-grey line-clamp-1">{title}</p>
                <button type="button" onClick={() => setCommentWrapper(prev => !prev)} className="absolute top-0 right-0 flex  justify-center items-center w-12 h-12 rounded-full bg-grey">
                    <i className="fi fi-br-cross text-zxl mt-1"></i>
                </button>
            </div>

            <hr className="border-dark-grey my-8 w-[120%] -ml-10 " />

            <CommentField action={'comment'}
                _id={blog_id}
                blog_author={author_id}
                username={username}
                total_parent_comment={total_parent_comments}
            />

        </div>
    )
}

export default CommentsContainer
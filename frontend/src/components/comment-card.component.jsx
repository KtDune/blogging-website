import { useContext, useState } from "react"
import { getDay } from "../common/date"
import { UserContext } from "../App"
import toast, { Toaster } from "react-hot-toast"
import axios from "axios"
import { fetchComments } from "./comments.component"
import AnimationWrapper from "../common/page-animation"


// Enhancement: use an index to track the deep of each comment, make sure if the comment is too deep it should not have any padding.
const CommentCard = ({ comment, _id: blog_id, blog_author }) => {

    const {
        _id: comment_id,
        commented_by: { personal_info: { username, fullname, profile_img } },
        commentedAt,
        comment: user_comment,
        children,
        isReply
    } = comment

    const [isReplying, setIsReplying] = useState(false)
    const [skip, setSkip] = useState(0)
    const [reply, setReply] = useState('')
    const [replyArray, setReplyArray] = useState([])

    const { userAuth: { access_token } } = useContext(UserContext)

    const handleComment = (e) => {
        e.preventDefault()

        if (!access_token) {
            toast.error('Please login to add a comment')

            return
        }

        if (!reply.length) {
            toast.error('Please enter a comment before publising your comment.')

            return
        }

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/add-comment`, {
            _id: blog_id, comment: reply, blog_author, replying_to: comment_id
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
            .then(({ data }) => {
                setReply('')
                fetchComments({ skip, blog_id, replyingTo: blog_id, setCommentArray: setReplyArray })
            })
            .catch((error) => console.error(error))

    }

    const handleReplyClick = () => {
        if (!access_token) {
            toast.error('Please login to add a reply.')

            return
        }

        setIsReplying(prev => !prev)

    }

    const loadMoreFunction = async () => {
        setSkip((prev) => {
            const updated = prev + 1
            fetchComments({ skip: (updated - 1) * 5, blog_id, replyingTo: comment_id, setCommentArray: setReplyArray })
            return updated
        })
    }

    return (
        <>
            <Toaster />
            <div className="w-full" style={{ paddingLeft: `${isReply ? '50px' : '10px'}` }}>
                <div className={`my-5 ${!isReply ? 'p-6' : 'pt-6'} rounded-md border-grey`}>
                    <div className="flex gap-4 items-center mb-8">
                        <img src={profile_img} className="w-6 h-6 rounded-full" />
                        <p className="line-clamp-1">{fullname} @{username}</p>
                        <p className="min-w-fit">{getDay(commentedAt)}</p>
                    </div>

                    <p className="font-gelasio text-xl ml-3">{user_comment}</p>

                    <div className="flex gap-5 items-center mt-5 ml-3 text-sm text-dark-grey">
                        <button onClick={handleReplyClick}>Reply</button>
                    </div>
                    <>
                        {
                            isReplying
                                ? <div className="ml-3">
                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(prev => prev = e.target.value)}
                                        placeholder="Leave a comment"
                                        className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
                                    />
                                    <button type="button" onClick={handleComment} className="btn-dark mt-5 px-10">Reply</button>
                                </div>
                                : <></>
                        }
                    </>

                    {
                        replyArray.length > 0
                            ? replyArray.map((reply, i) => {
                                return (
                                    <AnimationWrapper key={i}>
                                        <CommentCard
                                            comment={reply}
                                            _id={blog_id}
                                            blog_author={blog_author}
                                            index={i}
                                        />
                                    </AnimationWrapper>
                                )
                            })
                            : <></>
                    }


                    {
                        replyArray.length < children?.length
                            ? <div className="flex gap-5 items-center mt-5 ml-3 text-sm text-dark-grey">
                                <button onClick={loadMoreFunction}>Load more replies...</button>
                            </div>
                            : <></>
                    }
                </div>
            </div>
        </>
    )
}

export default CommentCard
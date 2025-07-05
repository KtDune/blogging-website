import { useContext, useState, useEffect } from "react"
import { UserContext, } from "../App"
import { Toaster, toast } from "react-hot-toast"
import { fetchComments } from "./comments.component"
import axios from "axios"
import AnimationWrapper from "../common/page-animation"
import CommentCard from "./comment-card.component"

const CommentField = ({ _id, action, blog_author, total_parent_comment, replyingTo = undefined }) => {

    const [comment, setComment] = useState('')
    const [commentArray, setCommentArray] = useState([])
    const [skip, setSkip] = useState(0)
    const { userAuth: { access_token } } = useContext(UserContext)

    useEffect(() => {
        setSkip(0)
        if (action !== 'reply') {
            fetchComments({ skip, blog_id: _id, setCommentArray })
        }
    }, [_id])

    const loadMoreFunction = async () => {
        setSkip(async (prev) => {
            const updated = prev + 5
            await fetchComments({ skip: updated, blog_id: _id, setCommentArray })
            return updated
        })
    }

    const handleComment = (e) => {
        e.preventDefault()

        if (!access_token) {
            toast.error('Please login to add a comment')

            return
        }

        if (!comment.length) {
            toast.error('Please enter a comment before publising your comment.')

            return
        }

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/add-comment`, {
            _id, comment, blog_author,
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
            .then(({ data }) => {
                setComment('')
                if (replyingTo) {
                    fetchComments({ skip: 0, blog_id: _id, replyingTo, setCommentArray: setParentCommentArray, index })
                }
                else {
                    fetchComments({ skip: 0, blog_id: _id, replyingTo, setCommentArray })
                }
            })
            .catch(({ error }) => console.error(error))

    }

    return (
        <>
            <Toaster />
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment"
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
            />
            <button type="button" onClick={handleComment} className="btn-dark mt-5 px-10">{action}</button>

            <>
                {
                    commentArray.map((item, i) => (
                        <AnimationWrapper key={i}>
                            <CommentCard
                                comment={item}
                                _id={_id}
                                blog_author={blog_author}
                                index={i}
                            />
                        </AnimationWrapper>
                    ))
                }
            </>

            <>
                {
                    total_parent_comment > commentArray.length
                        ? <button onClick={loadMoreFunction} className="text-dark-grey p-2 px-3 hover:bg-grey /30 rounded-md flex items-center gap-2">
                            Load more comments....
                        </button>
                        : <></>
                }
            </>
        </>
    )
}

export default CommentField
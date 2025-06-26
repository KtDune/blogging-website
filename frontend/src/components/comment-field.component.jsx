import { useContext, useState, useEffect } from "react"
import { UserContext, } from "../App"
import { Toaster, toast } from "react-hot-toast"
import { fetchComments } from "./comments.component"
import axios from "axios"

const CommentField = ({ _id, action, blog_author, setBlog }) => {

    const [comment, setComment] = useState('')
    const [commentArray, setCommentArray] = useState([])
    const { userAuth: { access_token } } = useContext(UserContext)

    useEffect(() => {
        fetchComments({ skip: 0, blog_id: _id, setCommentArray })
    }, [_id])

    const handleComment = (e) => {
        e.preventDefault()

        if (!access_token) {
            toast.error('Please login to add a comment')
        }

        if (!comment.length) {
            toast.error('Please enter a comment before publising your comment.')
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
                        <div key={i}>
                            {item?.comment}
                        </div>
                    ))
                }
            </>
        </>
    )
}

export default CommentField
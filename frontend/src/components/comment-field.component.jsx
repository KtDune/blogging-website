import { useContext, useState } from "react"
import { UserContext } from "../App"
import { Toaster, toast } from "react-hot-toast"

const CommentField = ({ action }) => {

    const [comment, setComment] = useState('')
    const { userAuth: { access_token }} = useContext(UserContext)

    const handleComment = () => {

        if (!access_token) {
            toast.error('Please login to add a comment')
        }

    }

    return (
        <>
            <Toaster />
            <textarea
                value={comment}
                onChange={(e) => setComment(EventTarget.value)}
                placeholder="Leave a comment"
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
            />
            <button type="button" onClick={handleComment} className="btn-dark mt-5 px-10">{action}</button>
        </>
    )
}

export default CommentField
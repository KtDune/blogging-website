import { useContext, useState } from "react"
import toast, { Toaster } from "react-hot-toast"
import { UserContext } from "../App"
import axios from "axios"

const NotificationCommentField = ({ blog_id, blog_author, index = undefined, replying_to = undefined, setReplying, notification_id, notification_data, setNotification }) => {

    const { _id: user_id } = blog_author
    const { userAuth: { access_token } } = useContext(UserContext)
    const [comment, setComment] = useState('')

    const handleComment = async () => {
        if (!access_token) {
            toast.error('Please login to add a comment');
            return;
        }

        if (!comment.trim()) {
            toast.error('Please enter a comment before publishing.');
            return;
        }

        const loading = toast.loading('Adding...')
        try {

            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_DOMAIN}/add-comment`,
                { _id: blog_id, comment, blog_author: user_id, replying_to, notification_id  },
                { headers: { 'Authorization': `Bearer ${access_token}` } }
            )

            const newObj = { ...notification_data.result[index], reply: { _id: data.id, comment } }
            setNotification(prev => {
                const updated = prev.result
                updated.splice(index, 1, newObj)

                return { result: updated, ...prev }
            })

            setReplying(false)
            setComment('')
        }
        catch (err) {
            console.error(err);
            toast.error('Failed to post comment.')
        }
        finally {
            toast.dismiss(loading)
        }
    };

    return (
        <>
            <Toaster />
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a reply"
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
            />
            <button type="button" onClick={handleComment} className="btn-dark my-5 px-10">Reply</button>

        </>
    )
}

export default NotificationCommentField

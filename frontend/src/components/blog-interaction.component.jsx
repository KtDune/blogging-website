import { useContext, useEffect } from "react"
import { Link } from "react-router-dom"
import { UserContext } from "../App"
import { Toaster, toast } from "react-hot-toast"
import axios from "axios"

const BlogInteraction = ({ blog, setBlog, isLikedByUser, setIsLikedByUser, setCommentWrapper }) => {

    const {
        _id,
        blog_id,
        activity: { total_likes, total_comments },
        author: { personal_info: { username: author_username } }
    } = blog

    const { userAuth: { username, access_token } } = useContext(UserContext)

    useEffect(() => {
        if (username && access_token) {
            axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/is-liked-by-user`, {
                _id
            }, {
                headers: {
                    'Authorization': `Bearer ${access_token}`
                }
            })
            .then(({  data: { result } }) => {
                if (result?._id) {
                    setIsLikedByUser(Boolean(result._id))
                }
            })
            .catch((error) => console.error(error))
        }
    }, [])

    const handleLikeFunction = () => {

        if (access_token) {
            setIsLikedByUser(prev => !prev)
            

            !isLikedByUser
                ? setBlog(prev => ({
                    ...prev,
                    activity: {
                        ...prev.activity,
                        total_likes: prev.activity.total_likes + 1
                    }
                }))
                : setBlog(prev => ({
                    ...prev,
                    activity: {
                        ...prev.activity,
                        total_likes: prev.activity.total_likes - 1
                    }
                }))

                axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/like-blog`, {
                    _id, isLikedByUser
                }, {
                     headers: {
                        'Authorization': `Bearer ${access_token}`
                     }
                })
                .then(({data}) => {  })
                .error(err => toast.error(err))
        }
        else {
            toast.error('Please log in to like this blog.')
        }

    }

    return (
        <>
            <Toaster />
            <hr className="border-grey my2" />
            <div className="flex gap-6">
                <div className="flex gap-2 items-center">
                    <button
                    type="button"
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${isLikedByUser ? 'bg-red/20 text-red' : 'bg-grey'}`}
                        onClick={handleLikeFunction}
                    >
                        <i className={`fi ${isLikedByUser ? 'fi-sr-heart' : 'fi-rr-heart'}`}></i>
                    </button>
                    <p className="text-xl text-dark-grey">{total_likes}</p>
                </div>

                <div className="flex gap-2 items-center">
                    <button onClick={() => setCommentWrapper(prev => !prev)} className="w-10 h-10 rounded-full flex items-center justify-center bg-grey">
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
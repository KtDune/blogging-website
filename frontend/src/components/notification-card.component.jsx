import { Link } from "react-router-dom"
import { getDay } from "../common/date"
import { useContext, useState } from "react"
import NotificationCommentField from "./notification-comment-field.component"
import { UserContext } from "../App"
import axios from "axios"

const NotificationCard = ({ data, index, notification, setNotification }) => {

    const {
        _id: notification_id,
        type,
        user,
        reply,
        user: { personal_info: { profile_img, fullname, username } },
        replied_on_comment,
        comment,
        blog: { _id, blog_id, title },
        createdAt,
    } = data

    const { userAuth: { access_token, username: author_username, profile_img: author_profile_img } } = useContext(UserContext)

    const [isReplying, setIsReplying] = useState(false)

    const handleReplyClick = () => {
        setIsReplying(prev => !prev)
    }

    const handleDelete = (comment_id, type, target) => {
        target.setAttribute('disabled', true)

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/delete-comment`,
            { _id: comment_id },
            { headers: { Authorization: `Bearer ${access_token}` } },
        )
            .then(() => {
                target.removeAttribute('disable')
                setNotification(prev => {
                    const updated = prev.result

                    if (type === 'comment') {
                        updated.splice(index, 1)
                    }
                    else {
                        delete updated[index].reply
                    }

                    return {
                        result: updated,
                        total: prev.total - 1,
                        deletedDocCount: prev?.deletedDocCount ? prev.deletedDocCount + 1 : 1
                    }
                })
            })
            .catch(err => console.error(err))
    }

    return (
        <>
            <div className="p-6 border-b border-grey border-l-black">

                <div className="flex gap-5 mb-3">
                    <img src={profile_img} className="w-14 h-14 flex-none rounded-full" />
                    <div className="w-full">
                        <h1 className="font-medium text-xl text-dark-grey">
                            <span className="lg:inline-block hidden capitalize">{fullname}</span>
                            <Link to={`/user/${username}`} className="mx-1 text-black underline">@{username}</Link>
                            <span className="font-normal">
                                {
                                    type === 'like' ? 'liked your blog' :
                                        type === 'comment' ? 'commented on' :
                                            'replied on'
                                }
                            </span>

                            {
                                type === 'reply'
                                    ? <div className="p-4 mt-4 rounded-md bg-grey">
                                        <p>{replied_on_comment?.comment}</p>
                                    </div>
                                    : <Link to={`/blog/${blog_id}`} className="font-medium text-dark-grey hover:underline line-clamp-1">{`"${title}"`}</Link>
                            }
                        </h1>
                    </div>
                </div>

                {
                    type !== 'like'
                        ? <p className="ml-14 pl-5 font-gelasio text-xl my-5">{comment?.comment}</p>
                        : <></>
                }

                <div className="ml-14 pl-5 mt-3 text-dark-grey flex gap-8">
                    <p>{getDay(createdAt)}</p>

                    {
                        type !== 'like'
                            ? <>
                                {
                                    !reply
                                        ? <button type="button" onClick={handleReplyClick} className="underline hover:text-black">Reply</button>
                                        : <></>
                                }
                                <button type="button" onClick={(e) => handleDelete(comment._id, "comment", e.target)} className="underline hover:text-black">Delete</button>
                            </>
                            : <></>
                    }
                </div>

                {
                    isReplying
                        ? <div className="mt-8">
                            <NotificationCommentField
                                blog_id={_id}
                                blog_author={user}
                                index={index}
                                replying_to={comment._id}
                                setReplying={setIsReplying}
                                notification_id={notification_id}
                                notification_data={notification}
                                setNotification={setNotification}
                            />
                        </div>
                        : <></>
                }

                {
                    reply
                        ? <div className="ml-20 p-5 bg-grey mt-5 rounded-md">
                            <div className="flex gap-3 mb-3">
                                <img src={author_profile_img} className="w-8 h-8 rounded-full" />

                                <div>
                                    <h1 className="ont-medium text-xl text-dark-grey">
                                        <Link to={`/user/${author_username}`} className="mx-1 text-black underline">@{author_username}</Link>

                                        <span className="font-normal ">replied to</span>

                                        <Link to={`/user/${username}`} className="mx-1 text-black underline">@{username}</Link>
                                    </h1>
                                </div>
                            </div>

                            <p className="ml-14 font-gelasio text-xl my-2">{reply.comment}</p>

                            <button type="button" onClick={(e) => handleDelete(reply._id, "reply", e.target)} className="underline hover:text-black ml-14 mt-2">Delete</button>
                        </div>
                        : <></>
                }

            </div>
        </>
    )
}

export default NotificationCard

import { useContext, useEffect, useState } from "react"
import { getDay } from "../common/date"
import { UserContext } from "../App"
import toast, { Toaster } from "react-hot-toast"
import axios from "axios"
import { fetchComments } from "./tools.component"
import AnimationWrapper from "../common/page-animation"


// TODO: use an index to track the deep of each comment, make sure if the comment is too deep it should not have any padding.
// TODO: instead of using load more replies button consider using a comment button with how many replies to load comment.
// TODO: Should tag which user the comment is replying to by default.
const CommentCard = ({ comment, _id: blog_id, username: blog_author_username, blog_author, setParentArray, setTotalParentComment }) => {

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
    const [childrenLength, setChildrenLength] = useState(0)

    useEffect(() => {
        setChildrenLength(children.length)
    }, [])

    const {
        userAuth:
        { access_token,
            username: logged_in_user,
            fullname: logged_in_user_fullname,
            profile_img: logged_in_user_profImg
        }
    } = useContext(UserContext)

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
                setIsReplying(false)
                data.commented_by = {
                    personal_info:
                    {
                        username: logged_in_user,
                        fullname: logged_in_user_fullname,
                        profile_img: logged_in_user_profImg

                    }
                }
                setReplyArray(prev => [data, ...prev])
                setChildrenLength(prev => prev + 1)
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
        const result = await fetchComments({ skip, blog_id, replyingTo: comment_id })
      
        setReplyArray(prevCmt => [...prevCmt, ...result])
        const newSkip = skip + 5
        setSkip(newSkip)
      }
      

    const deleteCommentsFunction = (e) => {
        e.target.setAttribute('disabled', true)
        let loadingToast = toast.loading('Deleting...')

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/delete-comment`, {
            _id: comment_id
        }, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        })
            .then(() => {
                e.target.removeAttribute('disabled', false)
                toast.dismiss(loadingToast)
                toast.success('Deleted!👍')

                children.map(item => item._id !== comment_id)
                setParentArray(prev => {
                    const updated = JSON.parse(JSON.stringify([...prev]))
                    
                    const deletedCmtPos = updated.findIndex((item) => item._id === comment_id)
                    updated.splice(deletedCmtPos, 1)
                    return updated
                })
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

                    <div className="flex gap-5 justify-between mt-5 ml-3 text-sm text-dark-grey">
                        <button onClick={handleReplyClick}>Reply</button>

                        {
                            access_token && (logged_in_user === username || logged_in_user === blog_author_username)
                                ? <button onClick={deleteCommentsFunction}>
                                    <i className="fi fi-rs-trash p-2 px-3 rounded-md border border-grey  hover:bg-red/30 hover:text-red pointer-events-none" />
                                </button>
                                : <></>
                        }
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
                                    <AnimationWrapper key={reply._id}>
                                        <CommentCard
                                            comment={reply}
                                            _id={blog_id}
                                            blog_author={blog_author}
                                            username={username}
                                            index={i}
                                            setParentArray={setReplyArray}
                                            setTotalParentComment={setChildrenLength}
                                        />
                                    </AnimationWrapper>
                                )
                            })
                            : <></>
                    }


                    {
                        childrenLength > replyArray.length
                            ? <div className="flex gap-5 items-center mt-5 ml-3 text-sm text-dark-grey">
                                <button onClick={loadMoreFunction}>{`View ${childrenLength - replyArray.length} more replies...`}</button>
                            </div>
                            : <></>
                    }
                </div>
            </div>
        </>
    )
}

export default CommentCard
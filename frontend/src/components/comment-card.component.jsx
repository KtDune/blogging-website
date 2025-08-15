import { useContext, useEffect, useState } from "react"
import { getDay } from "../common/date"
import { UserContext } from "../App"
import toast, { Toaster } from "react-hot-toast"
import axios from "axios"
import { fetchComments } from "./tools.component"
import AnimationWrapper from "../common/page-animation"
import { Link } from "react-router-dom"
import Loader from "./loader.component"


// DONE: use an index to track the deep of each comment, make sure if the comment is too deep it should not have any padding.
// DONE: instead of using load more replies button consider using a comment button with how many replies to load comment.
// DONE: Should tag which user the comment is replying to by default.
// DONE: Encode username before querying, if username cannot be found then just navigate to error page.
// DONE: Add loader while sending request to server.
const CommentCard = ({ comment, _id: blog_id, username: blog_author_username, blog_author, setParentArray, setTotalParentComment, isLoading, setIsLoading, setParentSkip }) => {

    const {
        _id: comment_id,
        commented_by: { personal_info: { username, fullname, profile_img } },
        commentedAt,
        comment: user_comment,
        children,
        parent,
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

    const handleComment = async (e) => {
        e.preventDefault()
        if (isLoading) return
        if (!access_token) {
            toast.error('Please login to add a comment')
            return
        }
        if (!reply.length) {
            toast.error('Please enter a comment before publishing your comment.')
            return
        }

        const loading = toast.loading('Adding...')
        setIsLoading(prev => true)
        try {
            const { data } = await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/add-comment`, {
                _id: blog_id, comment: reply, blog_author, replying_to: comment_id
            }, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            })

            setReply('')
            setIsReplying(false)
            data.commented_by = {
                personal_info: {
                    username: logged_in_user,
                    fullname: logged_in_user_fullname,
                    profile_img: logged_in_user_profImg
                }
            }
            setReplyArray(prev => [data, ...prev])
            setSkip(prev => prev + 1)
            setChildrenLength(prev => prev + 1)
        } catch (error) {
            console.error(error)
        } finally {
            toast.dismiss(loading)
            setIsLoading(prev => false) // ✅ only reset after request finishes
        }
    }


    const handleReplyClick = () => {
        if (!access_token) {
            toast.error('Please login to add a reply.')

            return
        }

        setIsReplying(prev => !prev)

    }

    const loadMoreFunction = async () => {
        if (isLoading) {
            return
        }

        const loading = toast.loading('Loading...')
        try {
            setIsLoading(prev => true)
            const result = await fetchComments({ skip, blog_id, replyingTo: comment_id })

            setReplyArray(prevCmt => [...prevCmt, ...result])
            const newSkip = skip + 5
            setSkip(newSkip)
        }
        catch (err) {
            console.error(err)
        }
        finally {
            toast.dismiss(loading)
            setIsLoading(prev => false)
        }
    }

    const deleteCommentsFunction = async (e) => {
        if (isLoading) return
        e.target.setAttribute('disabled', true)
        const loadingToast = toast.loading('Deleting...')

        setIsLoading(prev => true)
        try {
            await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/delete-comment`, {
                _id: comment_id
            }, {
                headers: { 'Authorization': `Bearer ${access_token}` }
            })

            toast.dismiss(loadingToast)
            toast.success('Deleted!👍')

            const payload = { skip: 0, blog_id, replyingTo: (isReply ? parent?._id : undefined) }
            const data = await fetchComments(payload)
            setParentArray(() => {
                setTotalParentComment(prev => prev - 1)
                setParentSkip(prev => prev - 1)
                return data
            })
        } catch (error) {
            console.error(error)
        } finally {
            toast.dismiss(loadingToast)
            e.target.removeAttribute('disabled')
            setIsLoading(prev => false) // ✅ moved here
        }
    }


    return (
        <>
            <Toaster />
            <div className={`w-full my-8`}>
                <div className={`my-5 rounded-md border-grey`}>
                    <div className="flex gap-4 items-center mb-8">
                        <img src={profile_img} className="w-6 h-6 rounded-full" />
                        <p className="line-clamp-1">{fullname} @{username}</p>
                        <p className="min-w-fit">{getDay(commentedAt)}</p>
                    </div>

                    <p className="font-gelasio text-xl ml-3">
                        {isReply && (
                            <>
                                Replying to <Link to={`/user/${encodeURIComponent(parent?.commented_by?.personal_info?.username)}`} className="text-dark-grey italic">@{parent?.commented_by?.personal_info?.username}</Link>:
                            </>
                        )}
                        {' '}
                        {user_comment}
                    </p>


                    <div className="flex gap-5 justify-between mt-5 ml-3 text-sm text-dark-grey">
                        <button onClick={handleReplyClick}>Reply</button>

                        {
                            access_token && (logged_in_user === username || logged_in_user === blog_author_username)
                                ? <button onClick={deleteCommentsFunction} disabled={isLoading}>
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
                                    <button type="button" onClick={handleComment} className="btn-dark mt-5 px-10" disabled={isLoading}>Reply</button>
                                </div>
                                : <></>
                        }
                    </>

                    {
                        replyArray.length > 0
                            ? replyArray.map((reply, i) => {
                                return (
                                    <AnimationWrapper key={reply._id}>
                                        <div className={!isReply ? "ml-10" : ""}>
                                            <CommentCard
                                                comment={reply}
                                                _id={blog_id}
                                                blog_author={blog_author}
                                                username={username}
                                                index={i}
                                                setParentArray={setReplyArray}
                                                setTotalParentComment={setChildrenLength}
                                                isLoading={isLoading}
                                                setIsLoading={setIsLoading}
                                                setParentSkip={setSkip}
                                            />
                                        </div>
                                    </AnimationWrapper>
                                )
                            })
                            : <></>
                    }


                    {
                        childrenLength > replyArray.length
                            ? <div className="flex gap-5 items-center mt-5 ml-3 text-sm text-dark-grey">
                                <button onClick={loadMoreFunction} disabled={isLoading}>{`View ${childrenLength - replyArray.length} more replies...`}</button>
                            </div>
                            : <></>
                    }
                </div>
            </div>
        </>
    )
}

export default CommentCard
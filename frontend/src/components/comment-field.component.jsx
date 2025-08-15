import { useContext, useState, useEffect } from "react"
import { UserContext, } from "../App"
import { Toaster, toast } from "react-hot-toast"
import { fetchComments } from "./tools.component"
import axios from "axios"
import AnimationWrapper from "../common/page-animation"
import CommentCard from "./comment-card.component"

const CommentField = ({ _id, action, blog_author, username, total_parent_comment, isLoading, setIsLoading }) => {

    const [comment, setComment] = useState('')
    const [commentArray, setCommentArray] = useState([])
    const [skip, setSkip] = useState(0)
    const { userAuth: { access_token, username: logged_in_user, fullname: logged_in_user_fullname, profile_img: logged_in_user_profImg } } = useContext(UserContext)
    const [totalParentComment, setTotalParentComment] = useState(0) // params are immutable, a state is required to track the changes

    useEffect(() => {
        setSkip(0)
        setTotalParentComment(total_parent_comment)
        const initialize = async () => {
            const result = await fetchComments({ skip, blog_id: _id })
            setCommentArray([...result])
        }

        if (action !== 'reply') {
            initialize()
        }
    }, [_id])

    const loadMoreFunction = async () => {
        if (isLoading) return;

        const loading = toast.loading('Loading...')
        try {
            setIsLoading(true);

            const newSkip = skip + 5;
            const result = await fetchComments({ skip: newSkip, blog_id: _id });

            setCommentArray(prevCmt => [...prevCmt, ...result]);
            setSkip(newSkip);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load more comments.');
        } finally {
            toast.dismiss(loading)
            setIsLoading(false);
        }
    }

    const handleComment = async (e) => {
        if (isLoading) return;

        e.preventDefault();

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
            setIsLoading(true);

            const { data } = await axios.post(
                `${import.meta.env.VITE_SERVER_DOMAIN}/add-comment`,
                { _id, comment, blog_author },
                { headers: { 'Authorization': `Bearer ${access_token}` } }
            );

            setComment('');

            data.commented_by = {
                personal_info: {
                    username: logged_in_user,
                    fullname: logged_in_user_fullname,
                    profile_img: logged_in_user_profImg,
                    children: data.children
                }
            };

            setCommentArray(prev => [data, ...prev]);
            setTotalParentComment(prev => prev + 1);
            setSkip(prev => prev + 1)

        } 
        catch (err) {
            console.error(err);
            toast.error('Failed to post comment.');
        } 
        finally {
            toast.dismiss(loading)
            setIsLoading(false);
        }
    };


    return (
        <>
            <Toaster />
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Leave a comment"
                className="input-box pl-5 placeholder:text-dark-grey resize-none h-[150px] overflow-auto"
            />
            <button type="button" onClick={handleComment} className="btn-dark my-5 px-10" disabled={isLoading}>{action}</button>

            <>
                {
                    commentArray &&
                    commentArray.map((item, i) => (
                        <AnimationWrapper key={item._id}>
                            <CommentCard
                                comment={item}
                                _id={_id}
                                blog_author={blog_author}
                                username={username}
                                index={i}
                                setParentArray={setCommentArray}
                                setTotalParentComment={setTotalParentComment}
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                                setParentSkip={setSkip}
                            />
                        </AnimationWrapper>
                    ))
                }
            </>

            <>
                {
                    totalParentComment > commentArray.length
                        ? <button onClick={loadMoreFunction} className="text-dark-grey p-2 px-3 hover:bg-grey /30 rounded-md flex items-center gap-2" disabled={isLoading}>
                            {`View ${totalParentComment - commentArray.length} more comments...`}
                        </button>
                        : <></>
                }
            </>
        </>
    )
}

export default CommentField
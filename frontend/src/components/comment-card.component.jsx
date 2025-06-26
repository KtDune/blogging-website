import { getDay } from "../common/date"

const CommentCard = ({ comment }) => {

    const { commented_by: { personal_info: { username, fullname, profile_img } }, commentedAt, comment: user_comment } = comment

    return (
        <div className="w-full" style={{ paddingLeft: `10px` }}>
            <div className="my-5 p-6 rounded-md border-grey">
                <div className="flex gap-4 items-center mb-8">
                    <img src={profile_img} className="w-6 h-6 rounded-full" />
                    <p className="line-clamp-1">{fullname} @{username}</p>
                    <p className="min-w-fit">{getDay(commentedAt)}</p>
                </div>

                <p className="font-gelasio text-xl ml-3">{user_comment}</p>
                <div>
                    
                </div>

            </div>
        </div>
    )
}

export default CommentCard
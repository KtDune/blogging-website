import { Link } from "react-router-dom"
import { getDay } from "../common/date"

const MinimalBlogPost = ({ blog, index }) => {

    const { title, blog_id: id, author: { personal_info: { fullname, username, profile_img } }, publishedAt } = blog

    return (
        <Link to={`/blog/${id}`} className="flex gap-5 mb-8">
            <span className="w-10 lg:w-12">
            <h1 className="text-3xl lg:text-4xl font-bold leading-none text-dark-grey">{index < 10 ? `0${index + 1}` : index + 1}</h1>
            </span>

            <div>
                <div className="flex items-center mb-7 gap-2">
                    <img src={profile_img} className="w-6 h-6 rounded-full" />
                    <p className="line-clamp-1">{fullname} @{username}</p>

                    <p className="min-w-fit">{getDay(publishedAt)}</p>
                </div>

                <h1 className="blog-title">{title}</h1>
            </div>
        </Link>
    )
}

export default MinimalBlogPost
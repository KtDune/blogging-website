import { useContext, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import axios from "axios"
import AnimationWrapper from "../common/page-animation"
import Loader from "../components/loader.component"
import { Link } from "react-router-dom"
import { UserContext } from "../App"
import AboutUser from "../components/about.component"
import InPageNavigation from "../components/inpage-navigation.component"
import LoadMoreDataBtn from "../components/load-more.component"
import BlogPostCard from "../components/blog-post.component"
import NodataMessage from "../components/nodata.component"
import toast, { Toaster } from "react-hot-toast"

export const profileDataStructure = {
    personal_info: {
        fullname: '',
        username: '',
        profile_img: '',
        bio: '',
    },
    account_info: {
        total_posts: 0,
        total_reads: 0,

    },
    _id: '',
    social_links: {},
    joinedAt: "",
}

const ProfilePage = () => {

    const { id: profile_id } = useParams()
    const navigateTo = useNavigate()
    const [profile, setProfile] = useState(profileDataStructure)
    let [blogs, setBlogs] = useState(null)
    const [navPage, setNavPage] = useState('Blogs Published')
    const [curPage, setCurPage] = useState(1)

    const {
        personal_info: { fullname, username: profile_username, profile_img, bio },
        account_info: { total_posts, total_reads },
        social_links,
        _id,
        joinedAt,
    } = profile
    const { userAuth: { username } } = useContext(UserContext)

    useEffect(() => {
        setProfile(profileDataStructure)
        fetchUserProfile()
    }, [profile_id])

    useEffect(() => {
        if (profile._id) {
            setBlogs(null)
            getBlogs(curPage, _id)
        }
    }, [curPage, profile])

    const getBlogs = (page = 1, user_id) => {

        user_id = user_id ? user_id : profile._id

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/search-blog`, {
            page,
            author: user_id
        })
            .then(({ data }) => { setBlogs(data) })
            .catch(err => console.error(err.message))

    }

    const fetchUserProfile = () => {
        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-profile`, {
            username: profile_id,
        })
            .then(({ data }) => {
                if (data !== null) {
                    setProfile(data)
                }
                else {
                    navigateTo('/error')
                }
            })
            .catch(err => {
                toast.error('User not found.')
                navigateTo('/error')
            })
    }

    return (
        <>
            <Toaster /><AnimationWrapper>
                {Boolean(fullname && profile_username)
                    ? <section className="h-cover md:flex flex-row-reverse items-start gap-5 min-[1100px]:gap-12">
                        <div className="flex flex-col max-md:items-center gap-5 min-w-[250px] md:w-[50%] md:pl-8 md:border-l md:border-dark-grey md:sticky md:top-[100px] md:py-10">
                            <img src={profile_img} className="w-48 h-48 bg-grey rounded-full md:w-32 md:h-32" />

                            <h1 className="text-2xl font-medium">@{profile_username}</h1>
                            <p className="text-xl capitalize h-6">{fullname}</p>
                            <p className="">{total_posts.toLocaleString()} Blogs / {total_reads.toLocaleString()} Reads`</p>

                            <div className="flex gap-4 mt-2">
                                {profile_id === username
                                    ? <Link to={`/settings/edit-profile`} className="btn-light rounded-md">
                                        Edit Profile
                                    </Link>
                                    : <></>}
                            </div>

                            <AboutUser className={'max-md:hidden'} bio={bio} social_links={social_links} join_at={joinedAt} />
                        </div>

                        <div className="max-md:mt-12 w-full">
                            <InPageNavigation routes={['Blogs Published', 'About']} setNavPage={setNavPage} defaultHidden={['About']}>

                                <>
                                    {blogs === null
                                        ? <Loader />
                                        : navPage === 'Blogs Published'
                                            ? blogs?.blogs.length === 0
                                                ? <NodataMessage message={'No blogs published'} />
                                                : blogs?.blogs.map((blog, i) => (
                                                    <AnimationWrapper key={i} transition={{ duration: 1, delay: i * 0.1 }}>
                                                        <BlogPostCard content={blog} author={blog.author.personal_info} />
                                                    </AnimationWrapper>
                                                ))
                                            : <AboutUser bio={bio} social_links={social_links} join_at={joinedAt} />}
                                    {navPage === 'Blogs Published' && <LoadMoreDataBtn state={blogs} setCurPage={setCurPage} curPage={curPage} />}
                                </>

                            </InPageNavigation>
                        </div>

                    </section>
                    : <Loader />}
            </AnimationWrapper>
        </>
    )
}

export default ProfilePage
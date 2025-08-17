import { useContext, useEffect, useState } from "react"
import axios from "axios"
import { UserContext } from "../App"
import Loader from "../components/loader.component"
import AnimationWrapper from "../common/page-animation"
import NotificationCard from "../components/notification-card.component"
import NodataMessage from "../components/nodata.component"
import LoadMoreDataBtn from "../components/load-more.component"

const NotificationPage = () => {

    const { userAuth: { access_token } } = useContext(UserContext)
    const [filter, setFilter] = useState('all')
    const [notification, setNotification] = useState(null)
    const [page, setPage] = useState(1)

    useEffect(() => {
        if (access_token) {
            fetchNotifications(1, 'all') // fetch all data on initial load
        }
    }, [access_token])

    const filters = ['all', 'like', 'comment', 'reply']

    const fetchNotifications = ({ page, deletedDocCount = 0 }) => {
        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/notifications`,
            { page, filter, deletedDocCount },
            {
                headers: {
                    Authorization: `Bearer ${access_token}`
                }
            })
            .then(async ({ data }) => {

                setNotification(data)
            })
            .catch(({ response: { data: { error } } }) => console.error(error))
    }

    const handleFilter = (e) => {
        const btn = e.target

        setFilter(prev => btn.innerHTML)
    }

    return (
        <>
            <h1 className="max-md:hidden">Recent Notification</h1>

            <div className="my-8 flex gap-6">
                {
                    filters.map((name, i) => <button key={i} className={`py-2 ${filter === name ? 'btn-dark' : 'btn-light'}`} onClick={handleFilter}>{name}</button>)
                }
            </div>

            {
                notification === null
                    ? <Loader />
                    : notification?.result?.length > 0
                        ? notification?.result?.map((item, i) => (
                            <AnimationWrapper key={i} transition={{ delay: i * 0.08 }}>
                                <NotificationCard data={item} index={i} notification={notification} setNotification={setNotification} />
                            </AnimationWrapper>
                        ))
                        : <NodataMessage message="Nothing available" />
            }
            <LoadMoreDataBtn state={notification} curPage={page} setCurPage={setPage} />
        </>
    )
}

export default NotificationPage

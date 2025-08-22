import React, { useContext, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDay } from '../common/date'
import axios from 'axios'
import { UserContext } from '../App'
import { fetchBlogInManage } from './tools.component'

const ManageBlogCard = ({ item, page, query, setArray }) => {

    const {
        banner,
        blog_id,
        title,
        publishedAt,
        activity,
        draft,
    } = item

    const [stats, setStats] = useState(false)
    const { userAuth: { access_token } } = useContext(UserContext)

    const handleDelete = async (e) => {

        e.target.setAttribute('disabled', true)

        try {

            await axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/delete-blog`,
                { blog_id },
                { headers: { Authorization: `Bearer ${access_token}` } }
            )

            const result = await fetchBlogInManage({ page, query, draft, access_token })
            setArray(result)

        }
        catch (err) {
            console.error(err)
        }
        finally {
            e.target.removeAttribute('disabled', false)
        }

    }

    return (
        <>
            <div className='flex gap-10 border-b mb-6 max-md:px-4 border-grey pb-6 items-center'>

                {
                    !draft && <img src={banner} className='max-md:hidden lg:hidden xl:block w-28 h-28 flex-none bg-grey object-cover' />
                }

                <div className='flex flex-col justify-between p-5 w-full min-w-[300px]'>
                    <div>
                        {
                            !draft
                                ? <Link to={`/blog/${blog_id}`} className='blog-title mb-4 hover:underline'>{title}</Link>
                                : <p className='blog-title mb-4'>{title}</p>
                        }

                        {!draft && <p className='line-clamp-1'>Published on {getDay(publishedAt)}</p>}

                        <div className='flex gap-6 mt-3'>
                            <Link to={`/editor/${blog_id}`} className='pr-4 py-4 underline'>Edit</Link>

                            {
                                !draft && <button className='lg:hidden pr-4 py-2 underline' onClick={() => setStats(prev => !prev)}>Stats</button>
                            }

                            <button type='button' className='pr-4 py-2 underline text-red' onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>

                <div className='max-lg:hidden'>

                    <div className='flex gap-2 max-lg:mb-6 max-lg:pb-4 border-grey max-lg:border-b'>
                        {
                            Object.keys(activity).filter(item => !item.includes('parent')).map((keys, i) => {
                                return (
                                    <div key={i} className={`flex flex-col items-center w-full h-full justify-center p-4 px-6 ${i !== 0 ? 'border-grey border-l' : ''}`}>
                                        <h1 className='text-xl lg:text-2xl mb-2'>{activity[keys].toLocaleString()}</h1>
                                        <p className='max-lg:text-dark-grey capitalize'>{keys.split('_')[1]}</p>
                                    </div>
                                )
                            })
                        }
                    </div>

                </div>

            </div>

            {
                stats
                    ? <div className='lg:hidden'>

                        <div className='flex gap-2 max-lg:mb-6 max-lg:pb-4 border-grey max-lg:border-b'>
                            {
                                Object.keys(activity).filter(item => !item.includes('parent')).map((keys, i) => {
                                    return (
                                        <div key={i} className={`flex flex-col items-center w-full h-full justify-center p-4 px-6 ${i !== 0 ? 'border-grey border-l' : ''}`}>
                                            <h1 className='text-xl lg:text-2xl mb-2'>{activity[keys].toLocaleString()}</h1>
                                            <p className='max-lg:text-dark-grey capitalize'>{keys.split('_')[1]}</p>
                                        </div>
                                    )
                                })
                            }
                        </div>

                    </div>
                    : <></>
            }
        </>
    )
}

export default ManageBlogCard

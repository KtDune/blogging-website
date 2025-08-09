import { createContext, useContext, useEffect } from "react"
import { UserContext } from "../App"
import { Navigate, useParams } from "react-router-dom"
import { useState } from "react"
import BlogEditor from "../components/blog-editor.component"
import PublishForm from "../components/publish-form.component"
import axios from "axios"
import Loader from "../components/loader.component"

const blogStructure = {
    title: '',
    banner: '',
    content: [],
    tags: [],
    des: '',
    author: { personal_info: {} }
}

export const EditorContext = createContext({})

const Editor = () => {
    const { userAuth: { access_token } } = useContext(UserContext)

    const { blog_id } = useParams()
    const [blog, setBlog] = useState(blogStructure)
    const [editorState, setEditorState] = useState('editor')
    const [textEditor, setTextEditor] = useState({ isReady: false })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!blog_id) {
            return
        }

        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-blog`, {
            blog_id,
            draft: true,
            mode: 'edit',
        })
            .then(({ data: { blog } }) => {
                setBlog(blog)
                setLoading(false)
            })
            .catch(err => {
                setBlog(null)
                setLoading(false)
            })

    }, [])

    return (
        <EditorContext.Provider value={{ blog, setBlog, editorState, setEditorState, textEditor, setTextEditor }}>
            {
                access_token === null
                    ? <Navigate to='/signin' />
                    : blog_id
                        ? loading ? <Loader /> : editorState === 'editor' ? <BlogEditor /> : <PublishForm />
                        : editorState === 'editor' ? <BlogEditor /> : <PublishForm />
            }
        </EditorContext.Provider>
    )
}

export default Editor
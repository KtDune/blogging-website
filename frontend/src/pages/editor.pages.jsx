import { createContext, useContext, useEffect, useState } from "react"
import { UserContext } from "../App"
import { Navigate, useParams } from "react-router-dom"
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
    const [loading, setLoading] = useState(!!blog_id) // only true if editing an existing blog

    useEffect(() => {
        if (!blog_id || editorState === 'publish') return

        setLoading(true)
        axios.post(`${import.meta.env.VITE_SERVER_DOMAIN}/get-blog`, {
            blog_id,
            draft: true,
            mode: 'edit',
        })
            .then(({ data: { blog } }) => {
                setBlog(blog)
                setLoading(false)
            })
            .catch(() => {
                setBlog(null)
                setLoading(false)
            })
    }, [blog_id, editorState])

    if (access_token === null) {
        return <Navigate to="/signin" />
    }

    // Wait until blog is fetched before rendering children
    if (loading) {
        return <Loader />
    }

    return (
        Boolean(blog?.title !== undefined || blog?.title !== null)
            ? <EditorContext.Provider value={{ blog, setBlog, editorState, setEditorState, textEditor, setTextEditor }}>
                {editorState === "editor" ? <BlogEditor /> : <PublishForm />}
            </EditorContext.Provider>
            : <></>
    )
}

export default Editor

import { createContext, useContext } from "react"
import { UserContext } from "../App"
import { Navigate } from "react-router-dom"
import { useState } from "react"
import BlogEditor from "../components/blog-editor.component"
import PublishForm from "../components/publish-form.component"

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
    const { userAuth: { access_token }, setUserAuth } = useContext(UserContext)

    const [blog, setBlog] = useState(blogStructure)
    const [editorState, setEditorState] = useState('editor')
    const [textEditor, setTextEditor] = useState({ isReady: false })

    return (
        <EditorContext.Provider value={{blog, setBlog, editorState, setEditorState, textEditor, setTextEditor}}>
            {
                access_token === null
                    ? <Navigate to='/signin' />
                    : editorState === 'editor' ? <BlogEditor /> : <PublishForm />
            }
        </EditorContext.Provider>
    )
}

export default Editor
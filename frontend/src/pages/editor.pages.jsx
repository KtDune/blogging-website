import { useContext } from "react"
import { UserContext } from "../App"
import { Navigate } from "react-router-dom"
import { useState } from "react"
import BlogEditor from "../components/blog-editor.component"
import PublishForm from "../components/publish-form.component"

 const Editor = () => {
    const { userAuth: { access_token }, setUserAuth } = useContext(UserContext)

    const [editorState, setEditorState] = useState('editor')

    return (
        access_token === null
        ? <Navigate to='/signin' />
        : editorState === 'editor' ? <BlogEditor /> : <PublishForm />
    )
 }

 export default Editor
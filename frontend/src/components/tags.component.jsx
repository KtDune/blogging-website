import { useContext } from "react"
import { EditorContext } from "../pages/editor.pages"

const Tag = ({ tag }) => {
    const { blog, blog: { tags }, setBlog } = useContext(EditorContext)

    const handleTagDelete = () => {

        setBlog(prev => ({ ...prev, tags: tags.filter(t => t != tag) })) 

    }
    return (
        <div className="relative p-2 mt-2 mr-2 px-5 bg-white rounded-full inline-block hover:bg-opacity-50 pe-10">
            <p className="outline-none">{tag}</p>
            <button
            type="button"
                className="mt-[2px] rounded-full absolute right-1 top-1/2 -translate-y-1/2"
                onClick={handleTagDelete}
            >
                <i className="fi fi-br-cross pointer-events-none text-sm pe-3" />
            </button>
        </div>
    )
}

export default Tag
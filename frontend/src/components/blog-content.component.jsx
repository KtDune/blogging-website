const BlogContent = ({ block }) => {

    const { type, data } = block

    return (
        <>
        {
            type === 'paragraph' && <p>{data?.text}</p>
        }
        </>
    )
}

export default BlogContent
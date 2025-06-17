import { parseHTMLString } from "./tools.component"

const BlogContent = ({ block }) => {

    const { type, data } = block

    return (
        <>
            {
                type === 'paragraph'
                    ? data?.text
                        ? parseHTMLString(data.text)
                        : <></>
                    : <></>
            }
            {
                type === 'header'
                    ? data?.level === 3
                        ? <h3 className="text-3xl font-bold">{parseHTMLString(data?.text)}</h3>
                        : <h2 className="text-4xl font-bold">{parseHTMLString(data?.text)}</h2>
                    : <></>
            }
            {
                type === 'image'
                    ? <div>
                        <img src={data?.file?.url} />
                        {
                            data?.caption
                                ? <p className="w-full text-center my-3 md:mb-12 text-base text-dark-grey">{parseHTMLString(data?.caption)}</p>
                                : <></>
                        }
                    </div>
                    : <></>
            }
            {
                type === 'quote'
                    ? <div className="bg-purple/10 p-3 pl-5 border-l-4 border-purple">
                        <p className="text-xl leading-10 md:text02xl">{parseHTMLString(data?.text)}</p>
                        {
                            data?.caption
                                ? <p className="w-full text-purple text-base">{parseHTMLString(data?.caption)}</p>
                                : <></>
                        }
                    </div>
                    : <></>
            }
            {
                type === 'list'
                    ? <ol className={`pl-5 ${data?.style === 'ordered' ? 'list-decimal' : 'list-disc'}`}>
                        {
                            data?.items?.map((item, index) => (
                                <li key={index} className="my-4">{parseHTMLString(item)}</li>
                            ))
                        }
                    </ol>
                    : <></>
            }
        </>
    )
}

export default BlogContent
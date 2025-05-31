import { useEffect, useRef, useState } from "react"

const InPageNavigation = ({ routes, defaultIActiveIndex = 0, defaultHidden = [] , children}) => {
    const [inPageNavIndex, setInPageNavIndex] = useState(defaultIActiveIndex)
    const activeTabLineRef = useRef()
    const activeTabRef = useRef()

    useEffect(() => {
        changePageState(activeTabRef.current, defaultIActiveIndex)
    }, [])

    const changePageState = (btn, i) => {
            const { offsetWidth, offsetLeft } = btn

            activeTabLineRef.current.style.width = `${offsetWidth}px`
            activeTabLineRef.current.style.left = `${offsetLeft}px`

            setInPageNavIndex(i)
    }

    return (
        <>
            <div className="relative mb-8 bg-white border-b border-grey flex flex-nowrap overflow-x-auto">
                {
                    routes.map((item, i) => (
                        <button
                            ref={i === defaultIActiveIndex ? activeTabRef: null}
                            key={i}
                            className={`p-4 mx-5 capitalize ${inPageNavIndex === i ? 'text-black' : 'text-dark-grey'} ${  defaultHidden.includes(item) ? 'md:hidden' : '' }`}
                            onClick={(e) => changePageState(e.target, i)}
                        >
                            {item}
                        </button>
                    ))

                }

                <hr ref={activeTabLineRef} className="absolute bottom-0 duration-300" />
            </div>

                { Array.isArray(children) ? children[inPageNavIndex] : children }
        </>
    )
}

export default InPageNavigation 
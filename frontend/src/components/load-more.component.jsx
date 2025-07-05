const LoadMoreDataBtn = ({ state, setCurPage, curPage }) => {

    const maxLimit = 5 // max data backend pass back everytime

    if (state !== null && state.total > 0)

        return (
            <span className="flex justify-end">
                <button
                    type="button"
                    className={`text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md ${curPage > 1 ? `flex items-center gap-2` : `hidden`}`}
                    onClick={() => setCurPage(prev => prev - 1)}
                >
                    Previous
                </button>
                <button
                    type="button"
                    className={`text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md ${state.total > curPage * maxLimit ? `flex items-center gap-2` : `hidden`}`}
                    onClick={() => setCurPage(prev => prev + 1)}
                >
                    Next
                </button>
            </span>
        )
}

export default LoadMoreDataBtn
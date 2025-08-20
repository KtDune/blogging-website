const LoadMoreDataBtn = ({ state, setCurPage, curPage }) => {
    const maxLimit = 5; // max data backend sends each time
  
    // Guard clause: render nothing if state is null or total is 0
    // TODO: This component should not accept all items, rewrite it to only accept total amount of data left.
    // TODO: maxLimit should be passed as prop instead of hardcoded to 5.
    if (!state || state.total === 0) {
      return null;
    }
  
    const hasPrev = curPage > 1;
    const hasNext = state.total > curPage * maxLimit
  
    return (
      <span className="flex justify-end gap-2">
        {hasPrev && (
          <button
            type="button"
            className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
            onClick={() => setCurPage(prev => prev - 1)}
          >
            Previous
          </button>
        )}
  
        {hasNext && (
          <button
            type="button"
            className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
            onClick={() => setCurPage(prev => prev + 1)}
          >
            Next
          </button>
        )}
      </span>
    );
  };
  
  export default LoadMoreDataBtn;
  
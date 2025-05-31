import AnimationWrapper from "../common/page-animation"
import InPageNavigation from "../components/inpage-navigation.component"

const HomePage = () => {
    return (
        <AnimationWrapper>
            <section className="h-cover flex justify0center gap-10">
                <div className="w-full">
                    <InPageNavigation routes={['Home', 'Trending Blogs']} defaultHidden={['Trending Blogs']}>

                        <h1>Latest blog here</h1>

                        <h1>Trending blog here</h1>

                    </InPageNavigation>
                </div>

                <div>

                </div>
            </section>
        </AnimationWrapper>
    )
}
export default HomePage
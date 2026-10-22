import SceneTour from './tour/SceneTour'
import { TOUR_PAGE_REGISTRY, PLATFORM_TOUR_PAGES } from '../data/tourPageRegistry'
export { buildTourSteps } from './tour/tourSteps'

// A new tour is a wrapper like this one: its own registry subset and default pages.
function PlatformTourScene({ metadata = {} }) {
  return <SceneTour metadata={metadata} registry={TOUR_PAGE_REGISTRY} defaultPages={PLATFORM_TOUR_PAGES} eyebrow="Elastic · Platform Tour" />
}

export default PlatformTourScene

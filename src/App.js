import React, { Suspense } from 'react'
import { Routes, Route } from "react-router-dom"
import "./index.css";
import Nav from './components/navigation/index';
import Header from './components/header/Header';
import Loader from './components/share/loader/Loader';

const DashboardHome = React.lazy(() => import('./components/body-main/dashboard-home/DashboardHome'));
const SeoOptimization = React.lazy(() => import('./components/body-main/SeoEvent/SeoOptimization'));
const SeoOptimizationNew = React.lazy(() => import('./components/body-main/SeoEvent/SeoOptimizationNew'));
const OptimizationEditing = React.lazy(() => import('./components/body-main/SeoEvent/OptimizationEditing'));
const ProjectMaking = React.lazy(() => import('./components/body-main/suggetions/index'));
const Signin = React.lazy(() => import('./components/body-main/auth/signin'));
const SignUp = React.lazy(() => import('./components/body-main/auth/signup'));
const ForgotPassword = React.lazy(() => import('./components/body-main/auth/forgotpassword'));
const SEOranking = React.lazy(() => import('./components/body-main/analytics/SEOranking'));

const Keywordanalyze = React.lazy(() => import('./components/body-main/analytics/keywordanalyze/Keywordanalyze')) ;
const KeywordanalyzeOverview = React.lazy(() => import('./components/body-main/analytics/keywordanalyze/overview')) ;
const WebsiteKeyword = React.lazy(() => import('./components/body-main/analytics/websitekeyword/WebsiteKeyword')) ;
const WebsiteKeywordOverview = React.lazy(() => import('./components/body-main/analytics/websitekeyword/overview')) ;
const KeywordGeneretor = React.lazy(() => import('./components/body-main/analytics/keywordgeneretor/KeywordGeneretor')) ;
const KeywordGeneretorOverview = React.lazy(() => import('./components/body-main/analytics/keywordgeneretor/overview'));

const KeywordGap = React.lazy(() => import('./components/body-main/analytics/keywordgap/keywordgap'));
const KeywordGapOverview = React.lazy(() => import('./components/body-main/analytics/keywordgap/overview'));
const KeywordMannager = React.lazy(() => import('./components/body-main/analytics/keywordmanager/keywordmannager'));
const KeywordOverview = React.lazy(() => import('./components/body-main/analytics/keywordmanager/overview'));
const Organicsearch = React.lazy(() => import('./components/body-main/analytics/organicresearch/organicsearch'));
const OrganicsearchOverview  = React.lazy(() => import('./components/body-main/analytics/organicresearch/overview'));
const TrafficsAnalytics = React.lazy(() => import('./components/body-main/analytics/traffic-analytics/trafficsAnalytics'));
const TrafficsAnalyticsOverview  = React.lazy(() => import('./components/body-main/analytics/traffic-analytics/TrafficOverview'));
const KeywordOverviewHome = React.lazy(() => import('./components/body-main/analytics/keywordoverview/KeywordOverviewHome'));
const KeywordOverviewDetailsOverview  = React.lazy(() => import('./components/body-main/analytics/keywordoverview/KeywordOverviewDetails'));
const DomainOverviewHome = React.lazy(() => import('./components/body-main/analytics/domainOverview/DomainOverviewHome'));
const DomainOverviewDetails  = React.lazy(() => import('./components/body-main/analytics/domainOverview/DomainOverviewDetails'));
const BacklinkAnalyticHome = React.lazy(() => import('./components/body-main/analytics/backlinkAnalytics/BacklinkAnalyticsHome'));
const BacklinkAnalyticOverview  = React.lazy(() => import('./components/body-main/analytics/backlinkAnalytics/BacklinkAnalyticsOverview'));

const AnalyticsOverview = React.lazy(() => import('./components/body-main/analytics/AnalyticsOverview'));
const UserProfile = React.lazy(() => import('./components/body-main/analytics/UserProfile'));
const FeaturesAI = React.lazy(() => import('./components/body-main/openAI/FeaturesAI'));
const GenerateAI = React.lazy(() => import('./components/body-main/openAI/GenerateAI'));
const NewsCenter = React.lazy(() => import('./components/body-main/openAI/NewsCenter'));

const App = () => {

  return (
    <Suspense fallback={<Loader />}>
    <main className='main-wrapper-box'>
      <Header />
      <div className="app-body">
        <div className="app-body-navigation">
          <div className="navigation">
            <Nav />
          </div>
        </div>

        <div className="app-body-main-content">
            <Routes>
              <Route path="/" element={<Signin />} />
            </Routes>
            <Routes>
              <Route path="/seooptimization" element={<SeoOptimization />} />
            </Routes>
            <Routes>
              <Route path="/seooptimization/new" element={<SeoOptimizationNew />} />
            </Routes>
            <Routes>
              <Route path="/optimizationediting" element={<OptimizationEditing />} />
            </Routes>
            <Routes>
              <Route path="/projectmaking" element={<ProjectMaking />} />
            </Routes>
            <Routes>
              <Route path="/works" element={<DashboardHome />} />
            </Routes>
            <Routes>
              <Route path="/SEOranking" element={<SEOranking />} />
            </Routes>
            <Routes>
              <Route path="/dashboard" element={<AnalyticsOverview />} />
            </Routes>
            <Routes>
            <Route path="/keywordanalyze/home" element={<Keywordanalyze />} />
          </Routes>
          <Routes>
            <Route path="/keywordanalyze/overview" element={<KeywordanalyzeOverview />} />
          </Routes>
          <Routes>
            <Route path="/websitekeyword/home" element={<WebsiteKeyword />} />
          </Routes>
          <Routes>
            <Route path="/websitekeyword/overview" element={<WebsiteKeywordOverview />} />
          </Routes>

          <Routes>
            <Route path="/keywordgeneretor/home" element={<KeywordGeneretor />} />
          </Routes>
          <Routes>
            <Route path="/keywordgeneretor/overview" element={<KeywordGeneretorOverview />} />
          </Routes>
            <Routes>
              <Route path="/dashboard" element={<AnalyticsOverview />} />
            </Routes>

            <Routes>
            <Route path="/keywordgap/home" element={<KeywordGap />} />
          </Routes>
          <Routes>
            <Route path="/keywordgap/overview" element={<KeywordGapOverview />} />
          </Routes>

          <Routes>
            <Route path="/keywordmannager/home" element={<KeywordMannager />} />
          </Routes>
          <Routes>
            <Route path="/keywordmannager/overview" element={<KeywordOverview />} />
          </Routes>

          <Routes>
            <Route path="/organicsearch/home" element={<Organicsearch />} />
          </Routes>
          <Routes>
            <Route path="/organicsearch/overview" element={<OrganicsearchOverview />} />
          </Routes>


          <Routes>
            <Route path="/trafficsAnalytics/home" element={<TrafficsAnalytics />} />
          </Routes>
          <Routes>
            <Route path="/trafficsAnalytics/overview" element={<TrafficsAnalyticsOverview />} />
          </Routes>
          <Routes>
            <Route path="/keywordoverview/home" element={<KeywordOverviewHome />} />
          </Routes>
          <Routes>
            <Route path="/keywordoverview/overview" element={<KeywordOverviewDetailsOverview />} />
          </Routes>
          <Routes>
          <Route path="/domainoverview/home" element={<DomainOverviewHome />} />
          </Routes>
          <Routes>
            <Route path="/domainoverview/overview" element={<DomainOverviewDetails />} />
          </Routes>

          <Routes>
         <Route path="/backlink/home" element={<BacklinkAnalyticHome />} />
          </Routes>
          <Routes>
            <Route path="/backlink/overview" element={<BacklinkAnalyticOverview />} />
          </Routes>

            <Routes>
              <Route path="/UserProfile" element={<UserProfile />} />
            </Routes> 
            <Routes>
              <Route path="/features" element={<FeaturesAI />} />
            </Routes>
            <Routes>
              <Route path="/text-generator/:id" element={<GenerateAI />} />
            </Routes>
            <Routes>
              <Route path="/news" element={<NewsCenter />} />
            </Routes>

        </div>
      </div>

        <Routes>
          <Route path="/signin" element={<Signin />} />
        </Routes>
        <Routes>
          <Route path="/signup" element={<SignUp />} />
        </Routes><Routes>
          <Route path="/forgotpassword" element={<ForgotPassword />} />
        </Routes>
    </main>
    </Suspense>
  )
}

export default App
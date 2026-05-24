import { Suspense, lazy, ComponentType } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useVisitorTracker } from "./hooks/useVisitorTracker";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import Article from "./pages/Article";
import Archive from "./pages/Archive";
import ArchiveDetail from "./pages/ArchiveDetail";
import About from "./pages/About";
import AdminLayout from "./pages/admin/AdminLayout";

// Admin 路由懒加载
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminArticles = lazy(() => import("./pages/admin/AdminArticles"));
const AdminArticleEdit = lazy(() => import("./pages/admin/AdminArticleEdit"));
const AdminArchives = lazy(() => import("./pages/admin/AdminArchives"));
const AdminArchiveEdit = lazy(() => import("./pages/admin/AdminArchiveEdit"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminAbout = lazy(() => import("./pages/admin/AdminAbout"));
const AdminAIConfig = lazy(() => import("./pages/admin/AdminAIConfig"));
const AdminVisitors = lazy(() => import("./pages/admin/AdminVisitors"));

function AdminLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-muted-foreground text-sm">加载中...</div>
    </div>
  );
}

function wrapAdmin(Comp: ComponentType) {
  return (
    <AdminLayout>
      <Suspense fallback={<AdminLoading />}>
        <Comp />
      </Suspense>
    </AdminLayout>
  );
}

function Router() {
  useVisitorTracker();

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blog" component={Blog} />
      <Route path="/article/:slug" component={Article} />
      <Route path="/archive" component={Archive} />
      <Route path="/archive/:slug" component={ArchiveDetail} />
      <Route path="/about" component={About} />

      {/* Admin 路由 */}
      <Route path="/admin">{wrapAdmin(AdminDashboard)}</Route>
      <Route path="/admin/articles">{wrapAdmin(AdminArticles)}</Route>
      <Route path="/admin/articles/new">{wrapAdmin(AdminArticleEdit)}</Route>
      <Route path="/admin/articles/:id">{wrapAdmin(AdminArticleEdit)}</Route>
      <Route path="/admin/archives">{wrapAdmin(AdminArchives)}</Route>
      <Route path="/admin/archives/new">{wrapAdmin(AdminArchiveEdit)}</Route>
      <Route path="/admin/archives/:id">{wrapAdmin(AdminArchiveEdit)}</Route>
      <Route path="/admin/subscribers">{wrapAdmin(AdminSubscribers)}</Route>
      <Route path="/admin/visitors">{wrapAdmin(AdminVisitors)}</Route>
      <Route path="/admin/ai">{wrapAdmin(AdminAIConfig)}</Route>
      <Route path="/admin/settings">{wrapAdmin(AdminSettings)}</Route>
      <Route path="/admin/about">{wrapAdmin(AdminAbout)}</Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

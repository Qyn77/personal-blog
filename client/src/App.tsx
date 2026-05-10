import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import Article from "./pages/Article";
import Archive from "./pages/Archive";
import ArchiveDetail from "./pages/ArchiveDetail";
import About from "./pages/About";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminArticles from "./pages/admin/AdminArticles";
import AdminArticleEdit from "./pages/admin/AdminArticleEdit";
import AdminArchives from "./pages/admin/AdminArchives";
import AdminArchiveEdit from "./pages/admin/AdminArchiveEdit";
import AdminSubscribers from "./pages/admin/AdminSubscribers";
import AdminSettings from "./pages/admin/AdminSettings";

function wrapAdmin(child: React.ReactNode) {
  return <AdminLayout>{child}</AdminLayout>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/blog" component={Blog} />
      <Route path="/article/:slug" component={Article} />
      <Route path="/archive" component={Archive} />
      <Route path="/archive/:slug" component={ArchiveDetail} />
      <Route path="/about" component={About} />

      {/* Admin 路由 */}
      <Route path="/admin">{wrapAdmin(<AdminDashboard />)}</Route>
      <Route path="/admin/articles">{wrapAdmin(<AdminArticles />)}</Route>
      <Route path="/admin/articles/new">{wrapAdmin(<AdminArticleEdit />)}</Route>
      <Route path="/admin/articles/:id">{wrapAdmin(<AdminArticleEdit />)}</Route>
      <Route path="/admin/archives">{wrapAdmin(<AdminArchives />)}</Route>
      <Route path="/admin/archives/new">{wrapAdmin(<AdminArchiveEdit />)}</Route>
      <Route path="/admin/archives/:id">{wrapAdmin(<AdminArchiveEdit />)}</Route>
      <Route path="/admin/subscribers">{wrapAdmin(<AdminSubscribers />)}</Route>
      <Route path="/admin/settings">{wrapAdmin(<AdminSettings />)}</Route>

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

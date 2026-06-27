import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import OverviewPage from "@/pages/overview";
import ServicesPage from "@/pages/services";
import MetricsPage from "@/pages/metrics";
import LogsPage from "@/pages/logs";
import IncidentsPage from "@/pages/incidents";
import DeploymentsPage from "@/pages/deployments";
import CopilotPage from "@/pages/copilot";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-6 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={OverviewPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/metrics" component={MetricsPage} />
        <Route path="/logs" component={LogsPage} />
        <Route path="/incidents" component={IncidentsPage} />
        <Route path="/deployments" component={DeploymentsPage} />
        <Route path="/copilot" component={CopilotPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;

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
import TracingPage from "@/pages/tracing";
import InsightsPage from "@/pages/insights";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#06080B" }}>
      <Sidebar />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
        <Topbar />
        <main style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
          {children}
        </main>
      </div>
    </div>
  );
}

function AppRouter() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={OverviewPage} />
        <Route path="/services" component={ServicesPage} />
        <Route path="/logs" component={LogsPage} />
        <Route path="/metrics" component={MetricsPage} />
        <Route path="/incidents" component={IncidentsPage} />
        <Route path="/deployments" component={DeploymentsPage} />
        <Route path="/tracing" component={TracingPage} />
        <Route path="/insights" component={InsightsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <AppRouter />
      </WouterRouter>
    </QueryClientProvider>
  );
}

/**
 * API client for SyncOps AI backend.
 * Provides typed methods for all backend operations.
 */

const API_BASE = "http://localhost:8000/api";

export interface Service {
  id: string;
  project_id: string;
  name: string;
  language: string | null;
  owner_team: string | null;
  tier: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceInput {
  name: string;
  language?: string | null;
  owner_team?: string | null;
  tier?: string;
  description?: string | null;
}

export interface UpdateServiceInput {
  name?: string;
  language?: string | null;
  owner_team?: string | null;
  tier?: string;
  description?: string | null;
}

export interface Metric {
  id: string;
  service_id: string;
  metric_type: string;
  value: number;
  timestamp: string;
}

export interface MetricSummary {
  avg_latency: number;
  avg_error_rate: number;
  avg_throughput: number;
  total_services: number;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public override message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse(response: Response) {
  if (!response.ok) {
    const contentType = response.headers.get("content-type");
    let errorMessage = `HTTP ${response.status}`;

    if (contentType?.includes("application/json")) {
      try {
        const data = (await response.json()) as { detail?: string };
        errorMessage = data.detail || errorMessage;
      } catch {
        // Use default error message
      }
    }

    throw new ApiError(response.status, errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export const api = {
  /**
   * List all services
   */
  async getServices(): Promise<Service[]> {
    const response = await fetch(`${API_BASE}/services`);
    return handleResponse(response);
  },

  /**
   * Get a single service by ID
   */
  async getService(id: string): Promise<Service> {
    const response = await fetch(`${API_BASE}/services/${id}`);
    return handleResponse(response);
  },

  /**
   * Create a new service
   */
  async createService(input: CreateServiceInput): Promise<Service> {
    const response = await fetch(`${API_BASE}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse(response);
  },

  /**
   * Update a service
   */
  async updateService(id: string, input: UpdateServiceInput): Promise<Service> {
    const response = await fetch(`${API_BASE}/services/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return handleResponse(response);
  },

  /**
   * Delete a service
   */
  async deleteService(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/services/${id}`, {
      method: "DELETE",
    });
    await handleResponse(response);
  },

  /**
   * Get all metrics
   */
  async getMetrics(): Promise<Metric[]> {
    const response = await fetch(`${API_BASE}/metrics`);
    return handleResponse(response);
  },

  /**
   * Get metrics for a specific service
   */
  async getServiceMetrics(serviceId: string): Promise<Metric[]> {
    const response = await fetch(`${API_BASE}/metrics/service/${serviceId}`);
    return handleResponse(response);
  },

  /**
   * Get metrics summary
   */
  async getMetricsSummary(): Promise<MetricSummary> {
    const response = await fetch(`${API_BASE}/metrics/summary`);
    return handleResponse(response);
  },

  /**
   * Generate demo metrics
   */
  async generateDemoMetrics(): Promise<{ metrics_generated: number; services_count: number }> {
    const response = await fetch(`${API_BASE}/metrics/generate-demo-data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(response);
  },
};

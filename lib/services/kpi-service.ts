import { KPI, KPICategory, UserDashboardKPI, KPISuggestion } from '@/app/api/kpis/route';

export class KPIService {
  private static baseUrl = '/api/kpis';

  // KPI Library Management
  static async getKPIs(params?: {
    category?: string;
    platform?: string;
    search?: string;
    popular?: boolean;
    limit?: number;
  }): Promise<{ kpis: KPI[] }> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.platform) searchParams.set('platform', params.platform);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.popular) searchParams.set('popular', 'true');
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch KPIs');
    return response.json();
  }

  static async getKPI(kpiId: string): Promise<{ kpi: KPI }> {
    const response = await fetch(`${this.baseUrl}/${kpiId}`);
    if (!response.ok) throw new Error('Failed to fetch KPI');
    return response.json();
  }

  static async createKPI(kpiData: Partial<KPI>): Promise<{ kpi: KPI }> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kpiData)
    });
    if (!response.ok) throw new Error('Failed to create KPI');
    return response.json();
  }

  static async updateKPI(kpiId: string, kpiData: Partial<KPI>): Promise<{ kpi: KPI }> {
    const response = await fetch(`${this.baseUrl}/${kpiId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kpiData)
    });
    if (!response.ok) throw new Error('Failed to update KPI');
    return response.json();
  }

  static async deleteKPI(kpiId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/${kpiId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete KPI');
    return response.json();
  }

  // Categories
  static async getCategories(): Promise<{ categories: KPICategory[] }> {
    const response = await fetch(`${this.baseUrl}/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  }

  // Dashboard KPIs
  static async getDashboardKPIs(params?: {
    visible?: boolean;
    favorites?: boolean;
  }): Promise<{ dashboardKPIs: UserDashboardKPI[] }> {
    const searchParams = new URLSearchParams();
    if (params?.visible !== undefined) searchParams.set('visible', params.visible.toString());
    if (params?.favorites) searchParams.set('favorites', 'true');

    const response = await fetch(`${this.baseUrl}/dashboard?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch dashboard KPIs');
    return response.json();
  }

  static async addKPIToDashboard(kpiData: {
    kpi_id: string;
    position_x?: number;
    position_y?: number;
    size_width?: number;
    size_height?: number;
    custom_name?: string;
    custom_target?: number;
    custom_color?: string;
    date_range?: '7d' | '30d' | '90d' | '1y' | 'custom';
    platform_filter?: string[];
    is_favorite?: boolean;
  }): Promise<{ dashboardKPI: UserDashboardKPI }> {
    const response = await fetch(`${this.baseUrl}/dashboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(kpiData)
    });
    if (!response.ok) throw new Error('Failed to add KPI to dashboard');
    return response.json();
  }

  static async getDashboardKPI(dashboardKpiId: string): Promise<{ dashboardKPI: UserDashboardKPI }> {
    const response = await fetch(`${this.baseUrl}/dashboard/${dashboardKpiId}`);
    if (!response.ok) throw new Error('Failed to fetch dashboard KPI');
    return response.json();
  }

  static async updateDashboardKPI(
    dashboardKpiId: string, 
    updateData: Partial<UserDashboardKPI>
  ): Promise<{ dashboardKPI: UserDashboardKPI }> {
    const response = await fetch(`${this.baseUrl}/dashboard/${dashboardKpiId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!response.ok) throw new Error('Failed to update dashboard KPI');
    return response.json();
  }

  static async removeKPIFromDashboard(dashboardKpiId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/dashboard/${dashboardKpiId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to remove KPI from dashboard');
    return response.json();
  }

  // KPI Suggestions
  static async getSuggestions(params?: {
    active?: boolean;
    limit?: number;
  }): Promise<{ suggestions: KPISuggestion[] }> {
    const searchParams = new URLSearchParams();
    if (params?.active !== undefined) searchParams.set('active', params.active.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/suggestions?${searchParams}`);
    if (!response.ok) throw new Error('Failed to fetch suggestions');
    return response.json();
  }

  static async generateSuggestions(): Promise<{ 
    message: string; 
    suggestions: KPISuggestion[] 
  }> {
    const response = await fetch(`${this.baseUrl}/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) throw new Error('Failed to generate suggestions');
    return response.json();
  }

  static async actOnSuggestion(
    suggestionId: string, 
    action: 'accepted' | 'dismissed' | 'ignored'
  ): Promise<{ suggestion: KPISuggestion; message: string }> {
    const response = await fetch(`${this.baseUrl}/suggestions/${suggestionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    if (!response.ok) throw new Error('Failed to act on suggestion');
    return response.json();
  }

  static async deleteSuggestion(suggestionId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${this.baseUrl}/suggestions/${suggestionId}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete suggestion');
    return response.json();
  }

  // Utility methods
  static formatKPIValue(value: number, kpi: KPI | UserDashboardKPI['kpi']): string {
    if (value == null) return 'N/A';

    const format = kpi.format_type;
    const decimals = (kpi as any).decimal_places || 2;
    const prefix = (kpi as any).prefix || '';
    const suffix = (kpi as any).suffix || '';

    let formattedValue: string;

    switch (format) {
      case 'currency':
        formattedValue = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        }).format(value);
        break;
      case 'percentage':
        formattedValue = `${value.toFixed(decimals)}%`;
        break;
      case 'duration':
        formattedValue = value.toFixed(decimals);
        break;
      case 'ratio':
        formattedValue = `${value.toFixed(decimals)}x`;
        break;
      default:
        formattedValue = value.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals
        });
    }

    return `${prefix}${formattedValue}${suffix}`;
  }

  static getKPIPerformanceStatus(
    value: number, 
    kpi: KPI, 
    customTarget?: number
  ): 'excellent' | 'good' | 'average' | 'poor' | 'unknown' {
    const target = customTarget || kpi.benchmark_value;
    if (!target) return 'unknown';

    const ratio = value / target;

    if (kpi.target_direction === 'higher') {
      if (ratio >= 1.2) return 'excellent';
      if (ratio >= 1.0) return 'good';
      if (ratio >= 0.8) return 'average';
      return 'poor';
    } else if (kpi.target_direction === 'lower') {
      if (ratio <= 0.8) return 'excellent';
      if (ratio <= 1.0) return 'good';
      if (ratio <= 1.2) return 'average';
      return 'poor';
    } else { // optimal
      if (kpi.optimal_range_min && kpi.optimal_range_max) {
        if (value >= kpi.optimal_range_min && value <= kpi.optimal_range_max) return 'excellent';
        if (Math.abs(value - target) / target <= 0.1) return 'good';
        if (Math.abs(value - target) / target <= 0.2) return 'average';
        return 'poor';
      }
    }

    return 'unknown';
  }
}
class ApiClient {
  constructor(baseURL = 'https://ikosher.me/iFilterDashboard') {
    this.baseURL = baseURL;
    this.apiURL = `${baseURL}/api`;
    this.token = localStorage.getItem('authToken');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  getToken() {
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}/${endpoint}`;
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken();
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  async post(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      headers,
      body: data,
    });
  }

  async put(endpoint, data, headers = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      headers,
      body: data,
    });
  }

  async delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }

  // Authentication methods
  async login(username, password) {
    const response = await this.post('auth.php', {
      action: 'login',
      username,
      password,
    });
    
    if (response.success && response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async logout() {
    try {
      await this.post('auth.php', { action: 'logout' });
    } finally {
      this.clearToken();
    }
  }

  async getCurrentUser() {
    return this.get('auth.php?action=profile');
  }

  isAuthenticated() {
    return !!this.token;
  }

  // API endpoints
  async apiRequest(endpoint, options = {}) {
    const url = `${this.apiURL}/${endpoint}`;
    
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Apps API
  async getAppsWithCategories() {
    return this.apiRequest('apps?action=with_categories');
  }

  async getAppsByCategory(categoryId) {
    return this.apiRequest(`apps?action=by_category&category_id=${categoryId}`);
  }

  async updateAppCategory(appId, categoryId) {
    return this.apiRequest('apps?action=update_category', {
      method: 'PUT',
      body: { app_id: appId, category_id: categoryId }
    });
  }

  async getAllApps(filters = {}) {
    const params = new URLSearchParams();
    params.append('action', 'get_all_paginated');

    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('category_id', filters.categoryId);

    return this.apiRequest(`apps?${params.toString()}`);
  }

  async getCategorySelectedApps(categoryId) {
    return this.apiRequest(`apps?action=by_category&category_id=${categoryId}`);
  }

  async bulkUpdateAppCategories(appIds, categoryId) {
    return this.apiRequest('apps?action=bulk_update_category', {
      method: 'PUT',
      body: { app_ids: appIds, category_id: categoryId }
    });
  }

  async searchApps(query, categoryId = null) {
    let url = `apps?action=search&q=${encodeURIComponent(query)}`;
    if (categoryId) {
      url += `&category_id=${categoryId}`;
    }
    return this.apiRequest(url);
  }

  // Categories API
  async getCategories() {
    return this.apiRequest('categories');
  }

  async getCategoriesWithCounts() {
    return this.apiRequest('categories?action=with_counts');
  }

  async createCategory(categoryData) {
    return this.apiRequest('categories', {
      method: 'POST',
      body: categoryData
    });
  }

  async updateCategory(categoryId, categoryData) {
    return this.apiRequest(`categories/${categoryId}`, {
      method: 'PUT',
      body: categoryData
    });
  }

  async deleteCategory(categoryId) {
    return this.apiRequest(`categories/${categoryId}`, {
      method: 'DELETE'
    });
  }

  // Stats API
  async getDashboardStats() {
    return this.apiRequest('stats?action=dashboard');
  }

  async getAppStats() {
    return this.apiRequest('stats?action=apps');
  }

  // Filtering Plans API
  async getFilteringPlans() {
    return this.apiRequest('filtering-plans');
  }

  async getPlansWithCategories() {
    return this.apiRequest('filtering-plans?action=with_categories');
  }

  async updatePlan(planId, planData) {
    return this.apiRequest(`filtering-plans/${planId}`, {
      method: 'PUT',
      body: planData
    });
  }

  // Community Plans API
  async getCommunityPlans(filters = {}) {
    let url = 'filtering-plans?action=community_plans';

    // Add filter parameters if provided
    const params = [];
    if (filters.page) params.push(`page=${filters.page}`);
    if (filters.limit) params.push(`limit=${filters.limit}`);
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.is_public !== undefined) params.push(`is_public=${filters.is_public}`);

    if (params.length > 0) {
      url += '&' + params.join('&');
    }

    return this.apiRequest(url);
  }

  async getCommunityPlanDetails(planId) {
    return this.apiRequest(`filtering-plans/${planId}?action=community_details`);
  }

  async getCommunityPlanApps(planId) {
    return this.apiRequest(`community-plan-selected-apps?plan_unique_id=${planId}`);
  }

  // Unified Plan Selected Apps API (works for both custom personal and community plans)
  async getPlanSelectedApps(planId = null, clientId = null) {
    const params = new URLSearchParams();
    params.append('action', 'get_selected_apps');

    if (planId) {
      params.append('plan_unique_id', planId);
    } else if (clientId) {
      params.append('client_unique_id', clientId);
    } else {
      throw new Error('Either planId or clientId must be provided');
    }

    return this.apiRequest(`plan-selected-apps?${params.toString()}`);
  }

  async getPlanAvailableApps(filters = {}) {
    const params = new URLSearchParams();
    params.append('action', 'get_available_apps');

    // Handle both plan types
    if (filters.planId || filters.plan_unique_id) {
      params.append('plan_unique_id', filters.planId || filters.plan_unique_id);
    } else if (filters.clientId || filters.client_unique_id) {
      params.append('client_unique_id', filters.clientId || filters.client_unique_id);
    } else {
      throw new Error('Either planId or clientId must be provided');
    }

    // Add other filters
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.categoryId) params.append('category_id', filters.categoryId);

    return this.apiRequest(`plan-selected-apps?${params.toString()}`);
  }

  async updatePlanSelectedApps(planId = null, clientId = null, selectedAppIds = []) {
    // Build URL with action parameter
    const params = new URLSearchParams();
    params.append('action', 'update_selected_apps');

    const data = {
      selected_app_ids: selectedAppIds
    };

    if (planId) {
      data.plan_unique_id = planId;
    } else if (clientId) {
      data.client_unique_id = clientId;
    } else {
      throw new Error('Either planId or clientId must be provided');
    }

    return this.apiRequest(`plan-selected-apps?${params.toString()}`, {
      method: 'POST',
      body: data
    });
  }

  // Category Plan Availability API
  async getCategoryPlanAvailability() {
    return this.apiRequest('category-plan-availability');
  }

  async getCategoryPlanAvailabilityWithDetails() {
    return this.apiRequest('category-plan-availability?action=with_details');
  }

  async assignCategoryToPlan(categoryId, planId) {
    return this.apiRequest('category-plan-availability', {
      method: 'POST',
      body: { category_id: categoryId, plan_unique_id: planId }
    });
  }

  async removeCategoryFromPlan(categoryId, planId) {
    return this.apiRequest('category-plan-availability?action=remove', {
      method: 'DELETE',
      body: { category_id: categoryId, plan_unique_id: planId }
    });
  }

  // Tickets API
  async getTickets() {
    return this.apiRequest('tickets');
  }

  async getTicketsWithDetails(page = 1, limit = 25, filters = {}) {
    let url = `tickets?action=with_details&page=${page}&limit=${limit}`;

    // Add filter parameters if provided
    if (filters.status && filters.status !== 'all') {
      if (filters.status === 'unassigned') {
        url += '&status=open&unassigned=1';
      } else {
        url += `&status=${filters.status}`;
      }
    }

    if (filters.search) {
      url += `&search=${encodeURIComponent(filters.search)}`;
    }

    // Add sorting parameters
    if (filters.sort) {
      url += `&sort=${filters.sort}`;
    }

    if (filters.order) {
      url += `&order=${filters.order}`;
    }

    return this.apiRequest(url);
  }

  async getTicketsByStatus(status) {
    return this.apiRequest(`tickets?action=by_status&status=${status}`);
  }

  async getTicketUpdates(ticketId) {
    return this.apiRequest(`tickets?action=updates&ticket_id=${ticketId}`);
  }

  async addTicketUpdate(ticketId, message, updatedBy, userType = 'user') {
    console.log('API Client - addTicketUpdate called with:', {
      ticketId, message, updatedBy, userType
    });

    try {
      const result = await this.apiRequest('tickets?action=add_update', {
        method: 'POST',
        body: {
          ticket_id: ticketId,
          message,
          updated_by: updatedBy,
          user_type: userType
        }
      });

      console.log('API Client - addTicketUpdate result:', result);
      return result;
    } catch (error) {
      console.error('API Client - addTicketUpdate error:', error);
      throw error;
    }
  }

  async editTicketUpdate(updateId, message, userId) {
    return this.apiRequest('tickets?action=edit_update', {
      method: 'PUT',
      body: {
        update_id: updateId,
        message,
        user_id: userId
      }
    });
  }

  async closeTicket(ticketId) {
    return this.apiRequest('tickets?action=close', {
      method: 'PUT',
      body: { ticket_id: ticketId }
    });
  }

  async assignTicket(ticketId, assignedTo) {
    return this.apiRequest('tickets?action=assign', {
      method: 'PUT',
      body: { ticket_id: ticketId, assigned_to: assignedTo }
    });
  }

  async getTicketStatistics() {
    return this.apiRequest('tickets?action=statistics');
  }

  async createTicket(ticketData) {
    return this.apiRequest('tickets', {
      method: 'POST',
      body: ticketData
    });
  }

  async updateTicket(ticketId, ticketData) {
    return this.apiRequest(`tickets/${ticketId}`, {
      method: 'PUT',
      body: ticketData
    });
  }

  async deleteTicket(ticketId) {
    return this.apiRequest(`tickets/${ticketId}`, {
      method: 'DELETE'
    });
  }

  async markTicketAsRead(ticketId) {
    return this.apiRequest('tickets?action=mark_as_read', {
      method: 'PUT',
      body: { ticket_id: ticketId }
    });
  }

  async getUnreadCounts() {
    return this.apiRequest('tickets?action=unread_counts');
  }

  // Users API (for ticket assignment)
  async getUsers() {
    return this.apiRequest('users');
  }

  // Clients API
  async getClientsWithDetails(page = 1, limit = 25, filters = {}) {
    let url = `clients?action=with_details&page=${page}&limit=${limit}`;

    // Add filter parameters if provided
    if (filters.plan_status && filters.plan_status !== 'all') {
      url += `&plan_status=${filters.plan_status}`;
    }

    if (filters.trial_status && filters.trial_status !== 'all') {
      url += `&trial_status=${filters.trial_status}`;
    }

    if (filters.sync_status && filters.sync_status !== 'all') {
      url += `&sync_status=${filters.sync_status}`;
    }

    if (filters.search) {
      url += `&search=${encodeURIComponent(filters.search)}`;
    }

    if (filters.plan_unique_id) {
      url += `&plan_unique_id=${filters.plan_unique_id}`;
    }

    if (filters.expiring_soon) {
      url += `&expiring_soon=1`;
    }

    // Add sorting parameters
    if (filters.sort) {
      url += `&sort=${filters.sort}`;
    }

    if (filters.order) {
      url += `&order=${filters.order}`;
    }

    return this.apiRequest(url);
  }

  async getClientStatistics() {
    return this.apiRequest('clients?action=statistics');
  }

  async updateClientStatus(clientUniqueId, status) {
    return this.apiRequest('clients?action=update_status', {
      method: 'PUT',
      body: { client_unique_id: clientUniqueId, status: status }
    });
  }

  async deleteClient(clientUniqueId) {
    return this.apiRequest(`clients/${clientUniqueId}`, {
      method: 'DELETE'
    });
  }

  // Payments API methods
  async getPaymentsByClient(clientUniqueId, page = 1, limit = 20, sortBy = 'payment_date', sortOrder = 'DESC') {
    const params = new URLSearchParams({
      action: 'by_client',
      client_unique_id: clientUniqueId,
      page: page.toString(),
      limit: limit.toString(),
      sort_by: sortBy,
      sort_order: sortOrder
    });
    
    return this.apiRequest(`payments?${params.toString()}`);
  }

  async getClientPaymentSummary(clientUniqueId) {
    const params = new URLSearchParams({
      action: 'client_summary',
      client_unique_id: clientUniqueId
    });
    
    return this.apiRequest(`payments?${params.toString()}`);
  }

  async updateClientPlan(clientUniqueId, planId, startDate, expiryDate) {
    return this.apiRequest('clients?action=update_plan', {
      method: 'PUT',
      body: { 
        client_unique_id: clientUniqueId, 
        plan_unique_id: planId,
        start_date: startDate,
        expiry_date: expiryDate
      }
    });
  }

  async updateClientSyncStatus(clientUniqueId) {
    return this.apiRequest('clients?action=sync_status', {
      method: 'PUT',
      body: { client_unique_id: clientUniqueId }
    });
  }

  async getClientByUniqueId(clientUniqueId) {
    return this.apiRequest(`clients/${clientUniqueId}`);
  }

  async updateClient(clientUniqueId, clientData) {
    return this.apiRequest(`clients/${clientUniqueId}`, {
      method: 'PUT',
      body: clientData
    });
  }

  // Subscription Management
  async extendSubscription(clientUniqueId, extendBy) {
    return this.apiRequest('clients?action=extend_subscription', {
      method: 'POST',
      body: {
        client_unique_id: clientUniqueId,
        extend_by: extendBy
      }
    });
  }

  // Device Data Management
  async getClientDeviceData(clientUniqueId) {
    return this.apiRequest(`clients?action=device_data&client_unique_id=${clientUniqueId}`);
  }

  // Custom Plan Apps Management
  async getClientSelectedApps(clientUniqueId) {
    return this.apiRequest(`custom-plan-apps?action=get_client_apps&client_unique_id=${clientUniqueId}`);
  }

  async getAvailableAppsForCustomPlan(clientUniqueId, filters = {}) {
    let url = `custom-plan-apps?action=get_available_apps&client_unique_id=${clientUniqueId}`;
    
    if (filters.categoryId) {
      url += `&category_id=${filters.categoryId}`;
    }
    
    if (filters.search) {
      url += `&search=${encodeURIComponent(filters.search)}`;
    }
    
    if (filters.page) {
      url += `&page=${filters.page}`;
    }
    
    if (filters.limit) {
      url += `&limit=${filters.limit}`;
    }
    
    return this.apiRequest(url);
  }

  async updateClientSelectedApps(clientUniqueId, selectedAppIds) {
    return this.apiRequest('custom-plan-apps?action=update_client_apps', {
      method: 'POST',
      body: {
        client_unique_id: clientUniqueId,
        selected_app_ids: selectedAppIds
      }
    });
  }
}

// Create a singleton instance
const apiClient = new ApiClient();

export default apiClient;
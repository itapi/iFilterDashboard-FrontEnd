<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';
require_once __DIR__ . '/../core/FilterBuilder.php';

class ClientsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('clients', 'client_unique_id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        // Handle URL path for individual client operations
        $request = $_SERVER['REQUEST_URI'];
        $path = parse_url($request, PHP_URL_PATH);
        $pathSegments = explode('/', trim($path, '/'));
        
        // Find the clients segment and get the client ID
        $clientsIndex = array_search('clients', $pathSegments);
        $clientId = ($clientsIndex !== false && isset($pathSegments[$clientsIndex + 1])) ? $pathSegments[$clientsIndex + 1] : null;
        
        // Set PATH_INFO for BaseAPI if we have a client ID
        if ($clientId && empty($action)) {
            $_SERVER['PATH_INFO'] = '/' . $clientId;
        }
        
        switch ($action) {
            case 'with_details':
                $this->getClientsWithDetails();
                break;
            case 'by_status':
                $this->getClientsByStatus();
                break;
            case 'statistics':
                $this->getClientStatistics();
                break;
            case 'update_status':
                $this->updateClientStatus();
                break;
            case 'update_plan':
                $this->updateClientPlan();
                break;
            case 'sync_status':
                $this->updateSyncStatus();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getClientsWithDetails() {
        try {
            // Initialize filter builder
            $filterBuilder = new FilterBuilder();
            
            // Set searchable fields
            $filterBuilder->setSearchableFields([
                'c.first_name',
                'c.last_name',
                'c.email',
                'c.phone',
                'c.imei',
                'c.deviceID',
                'fp.plan_name',
                'cl.level_name'
            ]);
            
            // Set sort options
            $filterBuilder->addSortOption('name', "CONCAT(c.first_name, ' ', c.last_name)")
                         ->addSortOption('email', 'c.email')
                         ->addSortOption('phone', 'c.phone')
                         ->addSortOption('plan_status', 'c.plan_status')
                         ->addSortOption('trial_status', 'c.trial_status')
                         ->addSortOption('registration_date', 'c.registration_date')
                         ->addSortOption('last_sync', 'c.last_sync')
                         ->addSortOption('plan_expiry', 'c.plan_expiry_date')
                         ->addSortOption('plan_name', 'fp.plan_name')
                         ->addSortOption('level_name', 'cl.level_name')
                         ->setDefaultSort('c.registration_date', 'DESC');
            
            // Parse filters from request with proper field mapping
            $filters = $_GET;
            
            // Map plan_status filter
            if (isset($filters['plan_status']) && !empty($filters['plan_status'])) {
                if (is_array($filters['plan_status'])) {
                    $filterBuilder->addFilter('c.plan_status', $filters['plan_status'], 'in');
                } else {
                    $filterBuilder->addFilter('c.plan_status', $filters['plan_status']);
                }
                unset($filters['plan_status']);
            }
            
            // Map trial_status filter
            if (isset($filters['trial_status']) && !empty($filters['trial_status'])) {
                if (is_array($filters['trial_status'])) {
                    $filterBuilder->addFilter('c.trial_status', $filters['trial_status'], 'in');
                } else {
                    $filterBuilder->addFilter('c.trial_status', $filters['trial_status']);
                }
                unset($filters['trial_status']);
            }
            
            // Map plan_id filter
            if (isset($filters['plan_id']) && !empty($filters['plan_id'])) {
                if (is_array($filters['plan_id'])) {
                    $filterBuilder->addFilter('c.plan_id', $filters['plan_id'], 'in');
                } else {
                    $filterBuilder->addFilter('c.plan_id', $filters['plan_id']);
                }
                unset($filters['plan_id']);
            }
            
            // Handle expiry filters
            if (isset($filters['expiring_soon']) && $filters['expiring_soon'] == '1') {
                $filterBuilder->addFilter('c.plan_expiry_date', date('Y-m-d', strtotime('+7 days')), 'lte');
                $filterBuilder->addFilter('c.plan_expiry_date', date('Y-m-d'), 'gte');
                unset($filters['expiring_soon']);
            }
            
            // Handle sync status
            if (isset($filters['sync_status'])) {
                if ($filters['sync_status'] === 'recent') {
                    $filterBuilder->addFilter('c.last_sync', date('Y-m-d H:i:s', strtotime('-1 day')), 'gte');
                } elseif ($filters['sync_status'] === 'stale') {
                    $filterBuilder->addFilter('c.last_sync', date('Y-m-d H:i:s', strtotime('-7 day')), 'lt');
                } elseif ($filters['sync_status'] === 'never') {
                    $filterBuilder->addFilter('c.last_sync', null, 'is_null');
                }
                unset($filters['sync_status']);
            }
            
            // Parse remaining filters
            $filterBuilder->parseFilters($filters);
            
            // Base count query
            $baseCountQuery = "
                SELECT COUNT(DISTINCT c.client_unique_id) as total
                FROM clients c
                LEFT JOIN filtering_plans fp ON c.plan_id = fp.plan_id
                LEFT JOIN client_levels cl ON c.client_level_id = cl.id
            ";
            
            // Build count query with filters
            $countQuery = $filterBuilder->buildCountQuery($baseCountQuery);
            
            // Execute count query
            if (!empty($countQuery['params'])) {
                $countStmt = $this->conn->prepare($countQuery['query']);
                if (!empty($countQuery['types'])) {
                    $countStmt->bind_param($countQuery['types'], ...$countQuery['params']);
                }
                $countStmt->execute();
                $totalCount = $countStmt->get_result()->fetch_assoc()['total'];
            } else {
                $countResult = $this->conn->query($countQuery['query']);
                $totalCount = $countResult->fetch_assoc()['total'];
            }
            
            // Base clients query
    // Base clients query 
$baseQuery = " 
    SELECT  
        c.*, 
        CONCAT(c.first_name, ' ', c.last_name) as full_name, 
        fp.plan_name, 
 
        cl.level_name, 
        CASE  
            WHEN c.last_sync > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'recent' 
            WHEN c.last_sync > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'normal' 
            WHEN c.last_sync IS NOT NULL THEN 'stale' 
            ELSE 'never' 
        END as sync_status, 
        CASE  
            WHEN c.plan_expiry_date < NOW() THEN 'expired' 
            WHEN c.plan_expiry_date < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'expiring_soon' 
            WHEN c.plan_expiry_date < DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'expiring_month' 
            ELSE 'active' 
        END as expiry_status, 
        DATEDIFF(c.plan_expiry_date, NOW()) as days_until_expiry 
    FROM clients c 
    LEFT JOIN filtering_plans fp ON c.plan_id = fp.plan_id 
    LEFT JOIN client_levels cl ON c.client_level_id = cl.id 
"; 

            
            // Build main query with filters and pagination
            $queryData = $filterBuilder->buildQuery($baseQuery, $_GET);
            
            // Execute main query
            if (!empty($queryData['params'])) {
                $stmt = $this->conn->prepare($queryData['query']);
                if (!empty($queryData['types'])) {
                    $stmt->bind_param($queryData['types'], ...$queryData['params']);
                }
                $stmt->execute();
                $clients = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            } else {
                $result = $this->conn->query($queryData['query']);
                $clients = $result->fetch_all(MYSQLI_ASSOC);
            }
            
            // Calculate pagination info
            $pagination = $queryData['pagination'];
            $totalPages = ceil($totalCount / $pagination['limit']);
            $hasMore = $pagination['page'] < $totalPages;
            
            APIResponse::success([
                'data' => $clients,
                'pagination' => [
                    'current_page' => $pagination['page'],
                    'per_page' => $pagination['limit'],
                    'total' => (int)$totalCount,
                    'total_pages' => $totalPages,
                    'has_more' => $hasMore
                ]
            ], 'Clients with details fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch clients: ' . $e->getMessage(), 500);
        }
    }
    
    private function getClientStatistics() {
        try {
            $stats = [];
            
            // Plan status distribution
            $planStatusSql = "
                SELECT 
                    plan_status,
                    COUNT(*) as count
                FROM clients
                GROUP BY plan_status
            ";
            $planStatusResult = $this->conn->query($planStatusSql);
            $stats['plan_status'] = [];
            while ($row = $planStatusResult->fetch_assoc()) {
                $stats['plan_status'][$row['plan_status']] = (int)$row['count'];
            }
            
            // Trial status distribution
            $trialStatusSql = "
                SELECT 
                    trial_status,
                    COUNT(*) as count
                FROM clients
                GROUP BY trial_status
            ";
            $trialStatusResult = $this->conn->query($trialStatusSql);
            $stats['trial_status'] = [];
            while ($row = $trialStatusResult->fetch_assoc()) {
                $stats['trial_status'][$row['trial_status']] = (int)$row['count'];
            }
            
            // Sync status
            $syncSql = "
                SELECT 
                    CASE 
                        WHEN last_sync > DATE_SUB(NOW(), INTERVAL 1 DAY) THEN 'recent'
                        WHEN last_sync > DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 'normal'
                        WHEN last_sync IS NOT NULL THEN 'stale'
                        ELSE 'never'
                    END as sync_status,
                    COUNT(*) as count
                FROM clients
                GROUP BY sync_status
            ";
            $syncResult = $this->conn->query($syncSql);
            $stats['sync_status'] = [];
            while ($row = $syncResult->fetch_assoc()) {
                $stats['sync_status'][$row['sync_status']] = (int)$row['count'];
            }
            
            // Expiry status
            $expirySql = "
                SELECT 
                    CASE 
                        WHEN plan_expiry_date < NOW() THEN 'expired'
                        WHEN plan_expiry_date < DATE_ADD(NOW(), INTERVAL 7 DAY) THEN 'expiring_soon'
                        WHEN plan_expiry_date < DATE_ADD(NOW(), INTERVAL 30 DAY) THEN 'expiring_month'
                        ELSE 'active'
                    END as expiry_status,
                    COUNT(*) as count
                FROM clients
                WHERE plan_expiry_date IS NOT NULL
                GROUP BY expiry_status
            ";
            $expiryResult = $this->conn->query($expirySql);
            $stats['expiry_status'] = [];
            while ($row = $expiryResult->fetch_assoc()) {
                $stats['expiry_status'][$row['expiry_status']] = (int)$row['count'];
            }
            
            // Total counts
            $totalSql = "SELECT COUNT(*) as total FROM clients";
            $totalResult = $this->conn->query($totalSql);
            $stats['totals'] = [
                'all_clients' => (int)$totalResult->fetch_assoc()['total']
            ];
            
            APIResponse::success($stats, 'Client statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch client statistics: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateClientStatus() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $clientUniqueId = $input['client_unique_id'] ?? null;
        $status = $input['status'] ?? null;
        
        if (!$clientUniqueId || !$status) {
            APIResponse::error('Client unique ID and status are required', 400);
        }
        
        $validStatuses = ['active', 'trial', 'inactive'];
        if (!in_array($status, $validStatuses)) {
            APIResponse::error('Invalid status provided', 400);
        }
        
        try {
            $sql = "UPDATE clients SET plan_status = ? WHERE client_unique_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("si", $status, $clientUniqueId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'client_unique_id' => $clientUniqueId,
                        'new_status' => $status
                    ], 'Client status updated successfully');
                } else {
                    APIResponse::error('Client not found or no changes made', 404);
                }
            } else {
                APIResponse::error('Failed to update client status', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update client status: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateClientPlan() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $clientUniqueId = $input['client_unique_id'] ?? null;
        $planId = $input['plan_id'] ?? null;
        $startDate = $input['start_date'] ?? date('Y-m-d H:i:s');
        $expiryDate = $input['expiry_date'] ?? null;
        
        if (!$clientUniqueId || !$planId) {
            APIResponse::error('Client unique ID and Plan ID are required', 400);
        }
        
        try {
            $sql = "
                UPDATE clients 
                SET 
                    plan_id = ?,
                    plan_start_date = ?,
                    plan_expiry_date = ?,
                    plan_status = 'active'
                WHERE client_unique_id = ?
            ";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("issi", $planId, $startDate, $expiryDate, $clientUniqueId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'client_unique_id' => $clientUniqueId,
                        'plan_id' => $planId,
                        'start_date' => $startDate,
                        'expiry_date' => $expiryDate
                    ], 'Client plan updated successfully');
                } else {
                    APIResponse::error('Client not found or no changes made', 404);
                }
            } else {
                APIResponse::error('Failed to update client plan', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update client plan: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateSyncStatus() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $clientUniqueId = $input['client_unique_id'] ?? null;
        
        if (!$clientUniqueId) {
            APIResponse::error('Client unique ID is required', 400);
        }
        
        try {
            $sql = "UPDATE clients SET last_sync = NOW() WHERE client_unique_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $clientUniqueId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'client_unique_id' => $clientUniqueId,
                        'last_sync' => date('Y-m-d H:i:s')
                    ], 'Client sync status updated successfully');
                } else {
                    APIResponse::error('Client not found', 404);
                }
            } else {
                APIResponse::error('Failed to update sync status', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update sync status: ' . $e->getMessage(), 500);
        }
    }
}

$api = new ClientsAPI();
$api->handleRequest();
?>
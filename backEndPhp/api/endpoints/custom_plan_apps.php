<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class CustomPlanAppsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('custom_plan_selected_apps', 'id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $pathInfo = $_SERVER['PATH_INFO'] ?? '';
        $segments = array_filter(explode('/', $pathInfo));
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'get_client_apps':
                $this->getClientSelectedApps();
                break;
            case 'update_client_apps':
                $this->updateClientSelectedApps();
                break;
            case 'get_available_apps':
                $this->getAvailableApps();
                break;
            default:
                if ($method === 'GET' && !empty($segments)) {
                    $this->getClientSelectedApps($segments[0]);
                } else {
                    parent::handleRequest();
                }
        }
    }
    
    private function getClientSelectedApps($clientUniqueId = null) {
        $clientUniqueId = $clientUniqueId ?: ($_GET['client_unique_id'] ?? null);
        
        if (!$clientUniqueId) {
            APIResponse::error('Client unique ID is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    cpa.id,
                    cpa.client_unique_id,
                    cpa.app_id,
                    cpa.selected_date,
                    a.app_name,
                    a.package_name,
                    a.icon_url,
                    a.description,
                    a.size,
                    a.score,
                    c.category_name,
                    c.category_icon
                FROM custom_plan_selected_apps cpa
                JOIN app_store_apps a ON cpa.app_id = a.app_id
                LEFT JOIN apps_categories c ON a.category_id = c.category_id
                WHERE cpa.client_unique_id = ?
                ORDER BY c.category_name, a.app_name
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $clientUniqueId);
            $stmt->execute();
            
            $selectedApps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($selectedApps, 'Client selected apps fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch client selected apps: ' . $e->getMessage(), 500);
        }
    }
    
    private function getAvailableApps() {
        try {
            $clientUniqueId = $_GET['client_unique_id'] ?? null;
            $categoryId = $_GET['category_id'] ?? null;
            $search = $_GET['search'] ?? null;
            $page = (int)($_GET['page'] ?? 1);
            $limit = (int)($_GET['limit'] ?? 50);
            $offset = ($page - 1) * $limit;
            
            $whereConditions = ["(c.is_active = 1 OR c.is_active IS NULL)"];
            $params = [];
            $types = '';
            
            if ($categoryId) {
                $whereConditions[] = "a.category_id = ?";
                $params[] = $categoryId;
                $types .= 'i';
            }
            
            if ($search) {
                $whereConditions[] = "(a.app_name LIKE ? OR a.package_name LIKE ? OR a.description LIKE ?)";
                $searchParam = '%' . $search . '%';
                $params = array_merge($params, [$searchParam, $searchParam, $searchParam]);
                $types .= 'sss';
            }
            
            $whereClause = implode(' AND ', $whereConditions);
            
            // Count total apps
            $countSql = "
                SELECT COUNT(DISTINCT a.app_id) as total
                FROM app_store_apps a
                LEFT JOIN apps_categories c ON a.category_id = c.category_id
                WHERE {$whereClause}
            ";
            
            $countStmt = $this->conn->prepare($countSql);
            if ($params) {
                $countStmt->bind_param($types, ...$params);
            }
            $countStmt->execute();
            $totalCount = $countStmt->get_result()->fetch_assoc()['total'];
            
            // Get apps with selection status
            $sql = "
                SELECT 
                    a.app_id,
                    a.app_name,
                    a.package_name,
                    a.icon_url,
                    a.description,
                    a.size,
                    a.score,
                    a.category_id,
                    c.category_name,
                    c.category_icon,
                    CASE 
                        WHEN cpa.app_id IS NOT NULL THEN 1 
                        ELSE 0 
                    END as is_selected
                FROM app_store_apps a
                LEFT JOIN apps_categories c ON a.category_id = c.category_id
                LEFT JOIN custom_plan_selected_apps cpa ON a.app_id = cpa.app_id AND cpa.client_unique_id = ?
                WHERE {$whereClause}
                ORDER BY c.category_name, a.app_name
                LIMIT ? OFFSET ?
            ";
            
            // Add client_unique_id to params
            $finalParams = [$clientUniqueId];
            $finalTypes = 'i';
            
            if ($params) {
                $finalParams = array_merge($finalParams, $params);
                $finalTypes .= $types;
            }
            
            $finalParams[] = $limit;
            $finalParams[] = $offset;
            $finalTypes .= 'ii';
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param($finalTypes, ...$finalParams);
            $stmt->execute();
            
            $apps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            $totalPages = ceil($totalCount / $limit);
            
            $response = [
                'data' => $apps,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => (int)$totalCount,
                    'total_pages' => $totalPages,
                    'has_more' => $page < $totalPages
                ]
            ];
            
            APIResponse::success($response, 'Available apps fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch available apps: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateClientSelectedApps() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $clientUniqueId = $input['client_unique_id'] ?? null;
        $selectedAppIds = $input['selected_app_ids'] ?? [];
        
        if (!$clientUniqueId) {
            APIResponse::error('Client unique ID is required', 400);
        }
        
        if (!is_array($selectedAppIds)) {
            APIResponse::error('Selected app IDs must be an array', 400);
        }
        
        try {
            // Start transaction
            $this->conn->begin_transaction();
            
            // First, remove all existing selections for this client
            $deleteSql = "DELETE FROM custom_plan_selected_apps WHERE client_unique_id = ?";
            $deleteStmt = $this->conn->prepare($deleteSql);
            $deleteStmt->bind_param("i", $clientUniqueId);
            $deleteStmt->execute();
            
            // Insert new selections
            if (!empty($selectedAppIds)) {
                $insertSql = "INSERT INTO custom_plan_selected_apps (client_unique_id, app_id, selected_date) VALUES (?, ?, NOW())";
                $insertStmt = $this->conn->prepare($insertSql);
                
                foreach ($selectedAppIds as $appId) {
                    $insertStmt->bind_param("ii", $clientUniqueId, $appId);
                    $insertStmt->execute();
                }
            }
            
            // Commit transaction
            $this->conn->commit();
            
            APIResponse::success([
                'client_unique_id' => $clientUniqueId,
                'selected_apps_count' => count($selectedAppIds),
                'selected_app_ids' => $selectedAppIds
            ], 'Client selected apps updated successfully');
            
        } catch (Exception $e) {
            // Rollback transaction
            $this->conn->rollback();
            APIResponse::error('Failed to update client selected apps: ' . $e->getMessage(), 500);
        }
    }
}

$api = new CustomPlanAppsAPI();
$api->handleRequest();
?>
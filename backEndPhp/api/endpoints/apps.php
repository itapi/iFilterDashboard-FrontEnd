<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';
require_once __DIR__ . '/../core/FilterBuilder.php';

class AppsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('app_store_apps', 'app_id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $pathInfo = $_SERVER['PATH_INFO'] ?? '';
        $segments = array_filter(explode('/', $pathInfo));
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'with_categories':
                $this->getAppsWithCategories();
                break;
            case 'by_category':
                $this->getAppsByCategory();
                break;
            case 'update_category':
                $this->updateAppCategory();
                break;
            case 'search':
                $this->searchApps();
                break;
            case 'filtered':
                $this->getFilteredApps();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getAppsWithCategories() {
        try {
            // Check if filtering is requested
            if (!empty($_GET['search']) || !empty($_GET['category_id']) || !empty($_GET['sort'])) {
                $this->getFilteredApps(true);
                return;
            }
            
            $sql = "
                SELECT 
                    a.app_id,
                    a.app_name,
                    a.package_name,
                    a.version_name,
                    a.version_code,
                    a.category_id,
                    a.description,
                    a.icon_url,
                    a.size,
                    a.score,
                    a.update_date,
                    a.created_at,
                    a.updated_at,
                    c.category_name,
                    c.category_icon,
                    c.category_description
                FROM app_store_apps a
                LEFT JOIN apps_categories c ON a.category_id = c.category_id
                WHERE c.is_active = 1 OR c.is_active IS NULL
                ORDER BY c.display_order, a.app_name
            ";
            
            $result = $this->conn->query($sql);
            $apps = $result->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($apps, 'Apps with categories fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch apps with categories: ' . $e->getMessage(), 500);
        }
    }
    
    private function getFilteredApps($includeCategories = false) {
        try {
            // Initialize filter builder
            $filterBuilder = new FilterBuilder();
            
            // Set searchable fields
            $filterBuilder->setSearchableFields([
                'a.app_name',
                'a.package_name',
                'a.description',
                'c.category_name'
            ]);
            
            // Set sort options
            $filterBuilder->addSortOption('name', 'a.app_name')
                         ->addSortOption('score', 'a.score')
                         ->addSortOption('size', 'a.size')
                         ->addSortOption('updated', 'a.update_date')
                         ->addSortOption('created', 'a.created_at')
                         ->addSortOption('category', 'c.category_name')
                         ->setDefaultSort('a.app_name', 'ASC');
            
            // Parse filters from request
            $filterBuilder->parseFilters($_GET);
            
            // Base count query
            $baseCountQuery = "
                SELECT COUNT(DISTINCT a.app_id) as total
                FROM app_store_apps a
                LEFT JOIN apps_categories c ON a.category_id = c.category_id
                WHERE (c.is_active = 1 OR c.is_active IS NULL)
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
            
            // Base apps query
            $baseQuery = "
                SELECT 
                    a.app_id,
                    a.app_name,
                    a.package_name,
                    a.version_name,
                    a.version_code,
                    a.category_id,
                    a.description,
                    a.icon_url,
                    a.size,
                    a.score,
                    a.update_date,
                    a.created_at,
                    a.updated_at,
                    c.category_name,
                    c.category_icon,
                    c.category_description
                FROM app_store_apps a
                LEFT JOIN apps_categories c ON a.category_id = c.category_id
                WHERE (c.is_active = 1 OR c.is_active IS NULL)
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
                $apps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            } else {
                $result = $this->conn->query($queryData['query']);
                $apps = $result->fetch_all(MYSQLI_ASSOC);
            }
            
            // Calculate pagination info
            $pagination = $queryData['pagination'];
            $totalPages = ceil($totalCount / $pagination['limit']);
            $hasMore = $pagination['page'] < $totalPages;
            
            $response = [
                'data' => $apps,
                'pagination' => [
                    'current_page' => $pagination['page'],
                    'per_page' => $pagination['limit'],
                    'total' => (int)$totalCount,
                    'total_pages' => $totalPages,
                    'has_more' => $hasMore
                ]
            ];
            
            $message = $includeCategories ? 'Filtered apps with categories fetched successfully' : 'Filtered apps fetched successfully';
            APIResponse::success($response, $message);
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch filtered apps: ' . $e->getMessage(), 500);
        }
    }
    
    private function getAppsByCategory() {
        $categoryId = $_GET['category_id'] ?? null;
        
        if (!$categoryId) {
            APIResponse::error('Category ID is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    a.*,
                    c.category_name,
                    c.category_icon
                FROM app_store_apps a
                LEFT JOIN apps_categories c ON a.category_id = c.category_id
                WHERE a.category_id = ?
                ORDER BY a.app_name
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $categoryId);
            $stmt->execute();
            
            $apps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($apps, 'Apps by category fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch apps by category: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateAppCategory() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $appId = $input['app_id'] ?? null;
        $categoryId = $input['category_id'] ?? null;
        
        if (!$appId || !$categoryId) {
            APIResponse::error('App ID and Category ID are required', 400);
        }
        
        try {
            $sql = "UPDATE app_store_apps SET category_id = ?, updated_at = CURRENT_TIMESTAMP WHERE app_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ii", $categoryId, $appId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'app_id' => $appId,
                        'new_category_id' => $categoryId
                    ], 'App category updated successfully');
                } else {
                    APIResponse::error('App not found or no changes made', 404);
                }
            } else {
                APIResponse::error('Failed to update app category', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update app category: ' . $e->getMessage(), 500);
        }
    }
    
    private function searchApps() {
        // Redirect to filtered apps for better functionality
        $this->getFilteredApps();
    }
}

$api = new AppsAPI();
$api->handleRequest();
?>
<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class FilteringPlansAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('filtering_plans', 'plan_unique_id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'with_categories':
                $this->getPlansWithCategories();
                break;
            case 'available_categories':
                $this->getAvailableCategories();
                break;
            case 'community_plans':
                $this->getCommunityPlans();
                break;
            case 'community_details':
                $this->getCommunityDetails();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getPlansWithCategories() {
        try {
            $sql = "
                SELECT
                    fp.plan_unique_id,
                    fp.plan_name,
                    fp.image_url,
                    fp.price,
                    fp.feature1,
                    fp.feature2,
                    fp.feature3,
                    fp.plan_key,
                    GROUP_CONCAT(
                        CONCAT(ac.category_id, ':', ac.category_name)
                        SEPARATOR '|'
                    ) as available_categories
                FROM filtering_plans fp
                LEFT JOIN category_plan_availability cpa ON fp.plan_unique_id = cpa.plan_unique_id
                LEFT JOIN apps_categories ac ON cpa.category_id = ac.category_id
                GROUP BY fp.plan_unique_id
                ORDER BY fp.plan_name
            ";
            
            $result = $this->conn->query($sql);
            $plans = $result->fetch_all(MYSQLI_ASSOC);
            
            // Format categories data
            foreach ($plans as &$plan) {
                if ($plan['available_categories']) {
                    $categories = [];
                    $categoryPairs = explode('|', $plan['available_categories']);
                    
                    foreach ($categoryPairs as $pair) {
                        list($id, $name) = explode(':', $pair);
                        $categories[] = [
                            'category_id' => (int)$id,
                            'category_name' => $name
                        ];
                    }
                    
                    $plan['categories'] = $categories;
                }
                unset($plan['available_categories']);
            }
            
            APIResponse::success($plans, 'Filtering plans with categories fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch filtering plans: ' . $e->getMessage(), 500);
        }
    }
    
    private function getAvailableCategories() {
        $planUniqueId = $_GET['plan_unique_id'] ?? null;

        if (!$planUniqueId) {
            APIResponse::error('Plan unique ID is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    ac.category_id,
                    ac.category_name,
                    ac.category_icon,
                    cpa.created_at
                FROM category_plan_availability cpa
                JOIN apps_categories ac ON cpa.category_id = ac.category_id
                WHERE cpa.plan_unique_id = ? AND ac.is_active = 1
                ORDER BY ac.category_name
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $planUniqueId);
            $stmt->execute();
            
            $categories = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($categories, 'Available categories fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch available categories: ' . $e->getMessage(), 500);
        }
    }

    private function getCommunityPlans() {
        try {
            // Get pagination parameters
            $page = isset($_GET['page']) ? max(1, (int)$_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? min(100, max(1, (int)$_GET['limit'])) : 20;
            $search = $_GET['search'] ?? '';
            $isPublic = isset($_GET['is_public']) ? (bool)$_GET['is_public'] : null;

            $offset = ($page - 1) * $limit;

            // Build the base query
            $whereConditions = ["fp.plan_type = 'custom_community'"];
            $params = [];
            $paramTypes = '';

            // Add search condition
            if (!empty($search)) {
                $whereConditions[] = "(fp.plan_name LIKE ? OR fp.feature1 LIKE ? OR fp.feature2 LIKE ? OR fp.feature3 LIKE ?)";
                $searchParam = "%{$search}%";
                $params = array_merge($params, [$searchParam, $searchParam, $searchParam, $searchParam]);
                $paramTypes .= 'ssss';
            }

            // Add public filter
            if ($isPublic !== null) {
                $whereConditions[] = "fp.is_public = ?";
                $params[] = $isPublic ? 1 : 0;
                $paramTypes .= 'i';
            }

            $whereClause = implode(' AND ', $whereConditions);

            // Get total count
            $countSql = "SELECT COUNT(*) as total FROM filtering_plans fp WHERE {$whereClause}";
            $countStmt = $this->conn->prepare($countSql);
            if (!empty($params)) {
                $countStmt->bind_param($paramTypes, ...$params);
            }
            $countStmt->execute();
            $totalCount = $countStmt->get_result()->fetch_assoc()['total'];

            // Get community plans with app counts
            $sql = "
                SELECT
                    fp.plan_unique_id,
                    fp.plan_name,
                    fp.price_monthly,
                    fp.price_yearly,
                    fp.image_url,
                    fp.feature1,
                    fp.feature2,
                    fp.feature3,
                    fp.plan_type,
                    fp.is_public,
                    COALESCE(app_counts.selected_apps_count, 0) as selected_apps_count
                FROM filtering_plans fp
                LEFT JOIN (
                    SELECT
                        plan_unique_id,
                        COUNT(*) as selected_apps_count
                    FROM community_plan_selected_apps
                    GROUP BY plan_unique_id
                ) app_counts ON fp.plan_unique_id = app_counts.plan_unique_id
                WHERE {$whereClause}
                ORDER BY fp.plan_name
                LIMIT ? OFFSET ?
            ";

            // Add limit and offset to params
            $params[] = $limit;
            $params[] = $offset;
            $paramTypes .= 'ii';

            $stmt = $this->conn->prepare($sql);
            if (!empty($params)) {
                $stmt->bind_param($paramTypes, ...$params);
            }
            $stmt->execute();

            $communities = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            // Convert numeric strings to proper types
            foreach ($communities as &$community) {
                $community['selected_apps_count'] = (int)$community['selected_apps_count'];
                $community['price_monthly'] = (float)$community['price_monthly'];
                $community['price_yearly'] = (float)$community['price_yearly'];
                $community['is_public'] = (bool)$community['is_public'];
            }

            // Calculate pagination info
            $totalPages = ceil($totalCount / $limit);

            $response = [
                'data' => $communities,
                'pagination' => [
                    'current_page' => $page,
                    'total_pages' => $totalPages,
                    'total' => (int)$totalCount,
                    'per_page' => $limit,
                    'has_more' => $page < $totalPages
                ]
            ];

            APIResponse::success($response, 'Community plans fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch community plans: ' . $e->getMessage(), 500);
        }
    }

    private function getCommunityDetails() {
        // Get plan ID from URL path
        $uri = $_SERVER['REQUEST_URI'];
        $pathParts = explode('/', parse_url($uri, PHP_URL_PATH));
        $planId = end($pathParts);

        // Remove any query string
        $planId = explode('?', $planId)[0];

        if (empty($planId)) {
            APIResponse::error('Plan ID is required', 400);
        }

        try {
            $sql = "
                SELECT
                    fp.plan_unique_id,
                    fp.plan_name,
                    fp.price_monthly,
                    fp.price_yearly,
                    fp.image_url,
                    fp.feature1,
                    fp.feature2,
                    fp.feature3,
                    fp.plan_type,
                    fp.is_public,
                    COALESCE(app_counts.selected_apps_count, 0) as selected_apps_count
                FROM filtering_plans fp
                LEFT JOIN (
                    SELECT
                        plan_unique_id,
                        COUNT(*) as selected_apps_count
                    FROM community_plan_selected_apps
                    GROUP BY plan_unique_id
                ) app_counts ON fp.plan_unique_id = app_counts.plan_unique_id
                WHERE fp.plan_unique_id = ? AND fp.plan_type = 'custom_community'
            ";

            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $planId);
            $stmt->execute();

            $community = $stmt->get_result()->fetch_assoc();

            if (!$community) {
                APIResponse::error('Community not found', 404);
            }

            // Convert numeric strings to proper types
            $community['selected_apps_count'] = (int)$community['selected_apps_count'];
            $community['price_monthly'] = (float)$community['price_monthly'];
            $community['price_yearly'] = (float)$community['price_yearly'];
            $community['is_public'] = (bool)$community['is_public'];

            APIResponse::success($community, 'Community details fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch community details: ' . $e->getMessage(), 500);
        }
    }
}

$api = new FilteringPlansAPI();
$api->handleRequest();
?>
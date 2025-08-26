<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class FilteringPlansAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('filtering_plans', 'plan_id');
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
            default:
                parent::handleRequest();
        }
    }
    
    private function getPlansWithCategories() {
        try {
            $sql = "
                SELECT 
                    fp.plan_id,
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
                LEFT JOIN category_plan_availability cpa ON fp.plan_id = cpa.plan_id
                LEFT JOIN apps_categories ac ON cpa.category_id = ac.category_id
                GROUP BY fp.plan_id
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
        $planId = $_GET['plan_id'] ?? null;
        
        if (!$planId) {
            APIResponse::error('Plan ID is required', 400);
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
                WHERE cpa.plan_id = ? AND ac.is_active = 1
                ORDER BY ac.category_name
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $planId);
            $stmt->execute();
            
            $categories = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($categories, 'Available categories fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch available categories: ' . $e->getMessage(), 500);
        }
    }
}

$api = new FilteringPlansAPI();
$api->handleRequest();
?>
<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class CategoryPlanAvailabilityAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('category_plan_availability', 'id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'remove':
                $this->removeAssignment();
                break;
            case 'by_plan':
                $this->getByPlan();
                break;
            case 'by_category':
                $this->getByCategory();
                break;
            case 'with_details':
                $this->getWithDetails();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function removeAssignment() {
        if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $categoryId = $input['category_id'] ?? null;
        $planUniqueId = $input['plan_unique_id'] ?? null;

        if (!$categoryId || !$planUniqueId) {
            APIResponse::error('Category ID and Plan unique ID are required', 400);
        }
        
        try {
            $sql = "DELETE FROM category_plan_availability WHERE category_id = ? AND plan_unique_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("is", $categoryId, $planUniqueId);
            
            if ($stmt->execute()) {
                APIResponse::success([
                    'category_id' => $categoryId,
                    'plan_unique_id' => $planUniqueId
                ], 'Assignment removed successfully');
            } else {
                APIResponse::error('Failed to remove assignment', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to remove assignment: ' . $e->getMessage(), 500);
        }
    }
    
    private function getByPlan() {
        $planUniqueId = $_GET['plan_unique_id'] ?? null;

        if (!$planUniqueId) {
            APIResponse::error('Plan unique ID is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    cpa.*,
                    c.category_name,
                    c.category_icon,
                    c.category_description
                FROM category_plan_availability cpa
                JOIN apps_categories c ON cpa.category_id = c.category_id
                WHERE cpa.plan_unique_id = ? AND c.is_active = 1
                ORDER BY c.category_name
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $planUniqueId);
            $stmt->execute();
            
            $assignments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($assignments, 'Plan assignments fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch plan assignments: ' . $e->getMessage(), 500);
        }
    }
    
    private function getByCategory() {
        $categoryId = $_GET['category_id'] ?? null;
        
        if (!$categoryId) {
            APIResponse::error('Category ID is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    cpa.*,
                    fp.plan_name,
                    fp.price_monthly,
                    fp.price_yearly,
                    fp.image_url
                FROM category_plan_availability cpa
                JOIN filtering_plans fp ON cpa.plan_unique_id = fp.plan_unique_id
                WHERE cpa.category_id = ?
                ORDER BY fp.plan_name
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $categoryId);
            $stmt->execute();
            
            $assignments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($assignments, 'Category assignments fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch category assignments: ' . $e->getMessage(), 500);
        }
    }
    
    private function getWithDetails() {
        try {
            $sql = "
                SELECT 
                    cpa.id,
                    cpa.category_id,
                    cpa.plan_unique_id,
                    cpa.created_at,
                    c.category_name,
                    c.category_icon,
                    c.category_description
                FROM category_plan_availability cpa
                JOIN apps_categories c ON cpa.category_id = c.category_id
                JOIN filtering_plans fp ON cpa.plan_unique_id = fp.plan_unique_id
                WHERE c.is_active = 1
                ORDER BY fp.plan_name, c.category_name
            ";
            
            $result = $this->conn->query($sql);
            $assignments = $result->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($assignments, 'Detailed assignments fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch detailed assignments: ' . $e->getMessage(), 500);
        }
    }
    
    protected function create() {
        $input = $this->getJsonInput();
        
        if (!$input) {
            APIResponse::error('Invalid JSON input', 400);
        }
        
        // Validate required fields
        if (!isset($input['category_id']) || !isset($input['plan_unique_id'])) {
            APIResponse::error('Category ID and Plan unique ID are required', 400);
        }
        
        try {
            // Check if assignment already exists
            $checkSql = "SELECT id FROM category_plan_availability WHERE category_id = ? AND plan_unique_id = ?";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bind_param("is", $input['category_id'], $input['plan_unique_id']);
            $checkStmt->execute();
            
            if ($checkStmt->get_result()->fetch_assoc()) {
                APIResponse::error('Assignment already exists', 409);
            }
            
            // Create new assignment
            $sql = "INSERT INTO category_plan_availability (category_id, plan_unique_id, created_at) VALUES (?, ?, NOW())";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("is", $input['category_id'], $input['plan_unique_id']);
            
            if ($stmt->execute()) {
                $newId = $this->conn->insert_id;
                APIResponse::success([
                    'id' => $newId,
                    'category_id' => $input['category_id'],
                    'plan_unique_id' => $input['plan_unique_id']
                ], 'Assignment created successfully', 201);
            } else {
                APIResponse::error('Failed to create assignment', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to create assignment: ' . $e->getMessage(), 500);
        }
    }
}

$api = new CategoryPlanAvailabilityAPI();
$api->handleRequest();
?>
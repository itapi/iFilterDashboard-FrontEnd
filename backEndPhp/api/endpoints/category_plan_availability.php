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
        $planId = $input['plan_id'] ?? null;
        
        if (!$categoryId || !$planId) {
            APIResponse::error('Category ID and Plan ID are required', 400);
        }
        
        try {
            $sql = "DELETE FROM category_plan_availability WHERE category_id = ? AND plan_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ii", $categoryId, $planId);
            
            if ($stmt->execute()) {
                APIResponse::success([
                    'category_id' => $categoryId,
                    'plan_id' => $planId
                ], 'Assignment removed successfully');
            } else {
                APIResponse::error('Failed to remove assignment', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to remove assignment: ' . $e->getMessage(), 500);
        }
    }
    
    private function getByPlan() {
        $planId = $_GET['plan_id'] ?? null;
        
        if (!$planId) {
            APIResponse::error('Plan ID is required', 400);
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
                WHERE cpa.plan_id = ? AND c.is_active = 1
                ORDER BY c.category_name
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $planId);
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
                JOIN filtering_plans fp ON cpa.plan_id = fp.plan_id
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
                    cpa.plan_id,
                    cpa.created_at,
                    c.category_name,
                    c.category_icon,
                    c.category_description,
                    fp.plan_name,
                    fp.price_monthly,
                    fp.price_yearly,
                    fp.image_url,
                    fp.feature1,
                    fp.feature2,
                    fp.feature3,
                    fp.plan_key
                FROM category_plan_availability cpa
                JOIN apps_categories c ON cpa.category_id = c.category_id
                JOIN filtering_plans fp ON cpa.plan_id = fp.plan_id
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
        if (!isset($input['category_id']) || !isset($input['plan_id'])) {
            APIResponse::error('Category ID and Plan ID are required', 400);
        }
        
        try {
            // Check if assignment already exists
            $checkSql = "SELECT id FROM category_plan_availability WHERE category_id = ? AND plan_id = ?";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bind_param("ii", $input['category_id'], $input['plan_id']);
            $checkStmt->execute();
            
            if ($checkStmt->get_result()->fetch_assoc()) {
                APIResponse::error('Assignment already exists', 409);
            }
            
            // Create new assignment
            $sql = "INSERT INTO category_plan_availability (category_id, plan_id, created_at) VALUES (?, ?, NOW())";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ii", $input['category_id'], $input['plan_id']);
            
            if ($stmt->execute()) {
                $newId = $this->conn->insert_id;
                APIResponse::success([
                    'id' => $newId,
                    'category_id' => $input['category_id'],
                    'plan_id' => $input['plan_id']
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
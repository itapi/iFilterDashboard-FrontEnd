<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class UsersAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('users', 'id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'profile':
                $this->getUserProfile();
                break;
            case 'change_password':
                $this->changePassword();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getUserProfile() {
        $userId = $_GET['user_id'] ?? null;
        if (!$userId) {
            APIResponse::error('User ID is required', 400);
        }
        
        try {
            $sql = "SELECT id, username, first_name, last_name, user_type, created_at, updated_at FROM users WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            
            $user = $stmt->get_result()->fetch_assoc();
            
            if ($user) {
                APIResponse::success($user, 'User profile fetched successfully');
            } else {
                APIResponse::error('User not found', 404);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch user profile: ' . $e->getMessage(), 500);
        }
    }
    
    private function changePassword() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $userId = $input['user_id'] ?? null;
        $currentPassword = $input['current_password'] ?? null;
        $newPassword = $input['new_password'] ?? null;
        
        if (!$userId || !$currentPassword || !$newPassword) {
            APIResponse::error('User ID, current password, and new password are required', 400);
        }
        
        try {
            // Verify current password
            $sql = "SELECT password FROM users WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $userId);
            $stmt->execute();
            
            $result = $stmt->get_result()->fetch_assoc();
            
            if (!$result || !password_verify($currentPassword, $result['password'])) {
                APIResponse::error('Current password is incorrect', 401);
            }
            
            // Update password
            $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
            $sql = "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("si", $hashedPassword, $userId);
            
            if ($stmt->execute()) {
                APIResponse::success([], 'Password changed successfully');
            } else {
                APIResponse::error('Failed to change password', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to change password: ' . $e->getMessage(), 500);
        }
    }
    
    protected function getAll($conditions = '', $params = []) {
        try {
            $sql = "SELECT id, username, first_name, last_name, user_type, created_at, updated_at FROM users ORDER BY created_at DESC";
            $result = $this->conn->query($sql);
            $users = $result->fetch_all(MYSQLI_ASSOC);
            
            $this->sendSuccess(['data' => $users, 'count' => count($users)]);
        } catch (Exception $e) {
            $this->sendError('Failed to fetch users: ' . $e->getMessage(), 500);
        }
    }
    
    protected function create() {
        $input = $this->getJsonInput();
        
        if (!$input) {
            APIResponse::error('Invalid JSON input', 400);
        }
        
        // Hash password if provided
        if (isset($input['password'])) {
            $input['password'] = password_hash($input['password'], PASSWORD_DEFAULT);
        }
        
        // Remove sensitive fields from response
        $responseData = $input;
        unset($responseData['password']);
        
        try {
            $fields = array_keys($input);
            $placeholders = str_repeat('?,', count($fields) - 1) . '?';
            
            $sql = "INSERT INTO {$this->table} (" . implode(',', $fields) . ") VALUES ($placeholders)";
            $stmt = $this->conn->prepare($sql);
            
            $types = str_repeat('s', count($input));
            $stmt->bind_param($types, ...array_values($input));
            
            if ($stmt->execute()) {
                $newId = $this->conn->insert_id;
                APIResponse::success([
                    'id' => $newId,
                    'data' => $responseData
                ], 'User created successfully', 201);
            } else {
                APIResponse::error('Failed to create user', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to create user: ' . $e->getMessage(), 500);
        }
    }
}

$api = new UsersAPI();
$api->handleRequest();
?>
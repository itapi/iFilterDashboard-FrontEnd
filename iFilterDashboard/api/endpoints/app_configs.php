<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class AppConfigsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('app_configs', 'id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'by_package':
                $this->getConfigsByPackage();
                break;
            case 'by_type':
                $this->getConfigsByType();
                break;
            case 'latest_version':
                $this->getLatestVersion();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getConfigsByPackage() {
        $packageName = $_GET['package_name'] ?? null;
        
        if (!$packageName) {
            APIResponse::error('Package name is required', 400);
        }
        
        try {
            $sql = "SELECT * FROM app_configs WHERE package_name = ? ORDER BY version DESC, created_at DESC";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $packageName);
            $stmt->execute();
            
            $configs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            // Parse JSON content for each config
            foreach ($configs as &$config) {
                if ($config['config_content']) {
                    $config['config_content'] = json_decode($config['config_content'], true);
                }
            }
            
            APIResponse::success($configs, 'App configurations fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch app configurations: ' . $e->getMessage(), 500);
        }
    }
    
    private function getConfigsByType() {
        $configType = $_GET['config_type'] ?? null;
        $packageName = $_GET['package_name'] ?? null;
        
        if (!$configType) {
            APIResponse::error('Config type is required', 400);
        }
        
        try {
            $sql = "SELECT * FROM app_configs WHERE config_type = ?";
            $params = [$configType];
            $types = "s";
            
            if ($packageName) {
                $sql .= " AND package_name = ?";
                $params[] = $packageName;
                $types .= "s";
            }
            
            $sql .= " ORDER BY package_name, version DESC";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param($types, ...$params);
            $stmt->execute();
            
            $configs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            // Parse JSON content
            foreach ($configs as &$config) {
                if ($config['config_content']) {
                    $decoded = json_decode($config['config_content'], true);
                    $config['config_content'] = $decoded ?: $config['config_content'];
                }
            }
            
            APIResponse::success($configs, 'Configurations by type fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch configurations: ' . $e->getMessage(), 500);
        }
    }
    
    private function getLatestVersion() {
        $packageName = $_GET['package_name'] ?? null;
        $configType = $_GET['config_type'] ?? null;
        
        if (!$packageName || !$configType) {
            APIResponse::error('Package name and config type are required', 400);
        }
        
        try {
            $sql = "
                SELECT * FROM app_configs 
                WHERE package_name = ? AND config_type = ? 
                ORDER BY version DESC, created_at DESC 
                LIMIT 1
            ";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ss", $packageName, $configType);
            $stmt->execute();
            
            $config = $stmt->get_result()->fetch_assoc();
            
            if ($config) {
                if ($config['config_content']) {
                    $config['config_content'] = json_decode($config['config_content'], true);
                }
                APIResponse::success($config, 'Latest configuration fetched successfully');
            } else {
                APIResponse::error('Configuration not found', 404);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch latest configuration: ' . $e->getMessage(), 500);
        }
    }
    
    protected function create() {
        $input = $this->getJsonInput();
        
        if (!$input) {
            APIResponse::error('Invalid JSON input', 400);
        }
        
        // Validate required fields
        $required = ['package_name', 'config_type', 'client_level_id'];
        foreach ($required as $field) {
            if (!isset($input[$field])) {
                APIResponse::error("Field '$field' is required", 400);
            }
        }
        
        // Encode config_content as JSON if it's an array
        if (isset($input['config_content']) && is_array($input['config_content'])) {
            $input['config_content'] = json_encode($input['config_content']);
        }
        
        try {
            // Get next version number
            $versionSql = "SELECT MAX(version) as max_version FROM app_configs WHERE package_name = ? AND config_type = ?";
            $versionStmt = $this->conn->prepare($versionSql);
            $versionStmt->bind_param("ss", $input['package_name'], $input['config_type']);
            $versionStmt->execute();
            
            $versionResult = $versionStmt->get_result()->fetch_assoc();
            $nextVersion = ($versionResult['max_version'] ?? 0) + 1;
            $input['version'] = $nextVersion;
            
            parent::create();
        } catch (Exception $e) {
            APIResponse::error('Failed to create configuration: ' . $e->getMessage(), 500);
        }
    }
}

$api = new AppConfigsAPI();
$api->handleRequest();
?>
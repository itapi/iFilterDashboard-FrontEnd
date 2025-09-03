<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class StatsAPI extends BaseAPI {
    public function __construct() {
        // Stats doesn't have a specific table, just using the base connection
        $this->conn = getDBConnection();
        if (!$this->conn) {
            APIResponse::error('Database connection failed', 500);
        }
        $this->setHeaders();
    }
    
    private function setHeaders() {
        header('Content-Type: application/json');
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit(0);
        }
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? 'dashboard';
        
        switch ($action) {
            case 'dashboard':
                $this->getDashboardStats();
                break;
            case 'apps':
                $this->getAppStats();
                break;
            case 'clients':
                $this->getClientStats();
                break;
            case 'devices':
                $this->getDeviceStats();
                break;
            default:
                APIResponse::error('Invalid action', 400);
        }
    }
    
    private function getDashboardStats() {
        try {
            // Get various system statistics
            $stats = [];
            
            // Total apps
            $result = $this->conn->query("SELECT COUNT(*) as total FROM app_store_apps");
            $stats['total_apps'] = $result->fetch_assoc()['total'];
            
            // Active clients
            $result = $this->conn->query("SELECT COUNT(*) as total FROM clients WHERE is_active = 1");
            $stats['active_clients'] = $result->fetch_assoc()['total'];
            
            // Total devices
            $result = $this->conn->query("SELECT COUNT(*) as total FROM devices");
            $stats['total_devices'] = $result->fetch_assoc()['total'];
            
            // Online devices (devices seen in last hour)
            $result = $this->conn->query("SELECT COUNT(*) as total FROM devices WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 1 HOUR)");
            $stats['online_devices'] = $result->fetch_assoc()['total'];
            
            // Categories count
            $result = $this->conn->query("SELECT COUNT(*) as total FROM apps_categories WHERE is_active = 1");
            $stats['total_categories'] = $result->fetch_assoc()['total'];
            
            // Open tickets
            $result = $this->conn->query("SELECT COUNT(*) as total FROM tickets WHERE status IN ('open', 'in_progress')");
            $stats['open_tickets'] = $result->fetch_assoc()['total'];
            
            // Apps by category
            $result = $this->conn->query("
                SELECT 
                    c.category_name, 
                    COUNT(a.app_id) as app_count
                FROM apps_categories c
                LEFT JOIN app_store_apps a ON c.category_id = a.category_id
                WHERE c.is_active = 1
                GROUP BY c.category_id, c.category_name
                ORDER BY app_count DESC
                LIMIT 5
            ");
            $stats['apps_by_category'] = $result->fetch_all(MYSQLI_ASSOC);
            
            // Recent activity (last 10 entries across multiple tables)
            $activities = [];
            
            // Recent app additions
            $result = $this->conn->query("
                SELECT 
                    'app_added' as type,
                    app_name as description,
                    created_at as timestamp
                FROM app_store_apps 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY created_at DESC 
                LIMIT 5
            ");
            $activities = array_merge($activities, $result->fetch_all(MYSQLI_ASSOC));
            
            // Recent client registrations
            $result = $this->conn->query("
                SELECT 
                    'client_added' as type,
                    client_name as description,
                    created_at as timestamp
                FROM clients 
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY created_at DESC 
                LIMIT 5
            ");
            $activities = array_merge($activities, $result->fetch_all(MYSQLI_ASSOC));
            
            // Sort activities by timestamp
            usort($activities, function($a, $b) {
                return strtotime($b['timestamp']) - strtotime($a['timestamp']);
            });
            
            $stats['recent_activities'] = array_slice($activities, 0, 10);
            
            APIResponse::success($stats, 'Dashboard statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch dashboard statistics: ' . $e->getMessage(), 500);
        }
    }
    
    private function getAppStats() {
        try {
            $stats = [];
            
            // Apps by category with detailed info
            $result = $this->conn->query("
                SELECT 
                    c.category_id,
                    c.category_name,
                    c.category_icon,
                    COUNT(a.app_id) as app_count,
                    AVG(a.rating) as avg_rating,
                    SUM(CASE WHEN a.is_active = 1 THEN 1 ELSE 0 END) as active_apps
                FROM apps_categories c
                LEFT JOIN app_store_apps a ON c.category_id = a.category_id
                WHERE c.is_active = 1
                GROUP BY c.category_id
                ORDER BY app_count DESC
            ");
            $stats['categories'] = $result->fetch_all(MYSQLI_ASSOC);
            
            // Top rated apps (using score instead of rating)
            $result = $this->conn->query("
                SELECT app_name, package_name, score, size
                FROM app_store_apps 
                WHERE score IS NOT NULL
                ORDER BY score DESC
                LIMIT 10
            ");
            $stats['top_rated_apps'] = $result->fetch_all(MYSQLI_ASSOC);
            
            // Largest apps
            $result = $this->conn->query("
                SELECT app_name, package_name, size, score
                FROM app_store_apps 
                WHERE size IS NOT NULL
                ORDER BY size DESC
                LIMIT 10
            ");
            $stats['largest_apps'] = $result->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($stats, 'App statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch app statistics: ' . $e->getMessage(), 500);
        }
    }
    
    private function getClientStats() {
        try {
            $stats = [];
            
            // Client distribution by level
            $result = $this->conn->query("
                SELECT 
                    cl.level_name,
                    COUNT(c.client_id) as client_count
                FROM client_levels cl
                LEFT JOIN clients c ON cl.level_id = c.client_level_id AND c.is_active = 1
                GROUP BY cl.level_id
                ORDER BY client_count DESC
            ");
            $stats['clients_by_level'] = $result->fetch_all(MYSQLI_ASSOC);
            
            // Clients with most apps
            $result = $this->conn->query("
                SELECT 
                    c.client_name,
                    COUNT(ca.app_id) as assigned_apps,
                    COUNT(DISTINCT d.device_id) as device_count
                FROM clients c
                LEFT JOIN client_apps ca ON c.client_id = ca.client_id AND ca.is_active = 1
                LEFT JOIN devices d ON c.client_id = d.client_id
                WHERE c.is_active = 1
                GROUP BY c.client_id
                ORDER BY assigned_apps DESC
                LIMIT 10
            ");
            $stats['top_clients'] = $result->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($stats, 'Client statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch client statistics: ' . $e->getMessage(), 500);
        }
    }
    
    private function getDeviceStats() {
        try {
            $stats = [];
            
            // Device status distribution
            $result = $this->conn->query("
                SELECT 
                    status,
                    COUNT(*) as count
                FROM devices
                GROUP BY status
                ORDER BY count DESC
            ");
            $stats['device_status'] = $result->fetch_all(MYSQLI_ASSOC);
            
            // Devices by platform
            $result = $this->conn->query("
                SELECT 
                    device_os,
                    COUNT(*) as count,
                    AVG(CASE 
                        WHEN last_seen >= DATE_SUB(NOW(), INTERVAL 1 HOUR) THEN 1 
                        ELSE 0 
                    END) * 100 as online_percentage
                FROM devices
                WHERE device_os IS NOT NULL
                GROUP BY device_os
                ORDER BY count DESC
            ");
            $stats['devices_by_platform'] = $result->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($stats, 'Device statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch device statistics: ' . $e->getMessage(), 500);
        }
    }
}

$api = new StatsAPI();
$api->handleRequest();
?>
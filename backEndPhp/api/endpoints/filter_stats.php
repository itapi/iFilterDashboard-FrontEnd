<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class FilterStatsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('', ''); // No table needed for this utility endpoint
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        if ($method !== 'GET') {
            APIResponse::error('Method not allowed', 405);
        }
        
        switch ($action) {
            case 'tickets':
                $this->getTicketFilterStats();
                break;
            case 'apps':
                $this->getAppFilterStats();
                break;
            case 'users':
                $this->getUserFilterStats();
                break;
            default:
                APIResponse::error('Action not specified or not supported', 400);
        }
    }
    
    private function getTicketFilterStats() {
        try {
            $stats = [];
            
            // Status distribution
            $statusSql = "
                SELECT 
                    status,
                    COUNT(*) as count
                FROM tickets
                GROUP BY status
            ";
            $statusResult = $this->conn->query($statusSql);
            $stats['status'] = [];
            while ($row = $statusResult->fetch_assoc()) {
                $stats['status'][$row['status']] = (int)$row['count'];
            }
            
            // Assignment distribution
            $assignmentSql = "
                SELECT 
                    CASE 
                        WHEN assigned_to IS NULL THEN 'unassigned'
                        ELSE 'assigned'
                    END as assignment_status,
                    COUNT(*) as count
                FROM tickets
                WHERE status = 'open'
                GROUP BY assignment_status
            ";
            $assignmentResult = $this->conn->query($assignmentSql);
            $stats['assignment'] = [];
            while ($row = $assignmentResult->fetch_assoc()) {
                $stats['assignment'][$row['assignment_status']] = (int)$row['count'];
            }
            
            // Priority distribution (if priority field exists)
            $prioritySql = "
                SELECT 
                    COALESCE(priority, 'normal') as priority,
                    COUNT(*) as count
                FROM tickets
                GROUP BY priority
            ";
            try {
                $priorityResult = $this->conn->query($prioritySql);
                $stats['priority'] = [];
                while ($row = $priorityResult->fetch_assoc()) {
                    $stats['priority'][$row['priority']] = (int)$row['count'];
                }
            } catch (Exception $e) {
                // Priority field might not exist
                $stats['priority'] = [];
            }
            
            // Date range stats
            $dateSql = "
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM tickets
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            ";
            $dateResult = $this->conn->query($dateSql);
            $stats['daily_counts'] = [];
            while ($row = $dateResult->fetch_assoc()) {
                $stats['daily_counts'][$row['date']] = (int)$row['count'];
            }
            
            // Assigned users
            $usersSql = "
                SELECT 
                    u.id,
                    u.username,
                    COUNT(t.id) as ticket_count
                FROM users u
                LEFT JOIN tickets t ON u.id = t.assigned_to AND t.status = 'open'
                GROUP BY u.id, u.username
                ORDER BY u.username
            ";
            $usersResult = $this->conn->query($usersSql);
            $stats['assigned_users'] = [];
            while ($row = $usersResult->fetch_assoc()) {
                $stats['assigned_users'][] = [
                    'id' => (int)$row['id'],
                    'username' => $row['username'],
                    'ticket_count' => (int)$row['ticket_count']
                ];
            }
            
            // Total counts
            $totalSql = "SELECT COUNT(*) as total FROM tickets";
            $totalResult = $this->conn->query($totalSql);
            $stats['totals'] = [
                'all_tickets' => (int)$totalResult->fetch_assoc()['total']
            ];
            
            APIResponse::success($stats, 'Ticket filter statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch ticket filter stats: ' . $e->getMessage(), 500);
        }
    }
    
    private function getAppFilterStats() {
        try {
            $stats = [];
            
            // Category distribution
            $categorySql = "
                SELECT 
                    c.category_id,
                    c.category_name,
                    COUNT(a.app_id) as app_count
                FROM apps_categories c
                LEFT JOIN app_store_apps a ON c.category_id = a.category_id
                WHERE c.is_active = 1
                GROUP BY c.category_id, c.category_name
                ORDER BY c.display_order, c.category_name
            ";
            $categoryResult = $this->conn->query($categorySql);
            $stats['categories'] = [];
            while ($row = $categoryResult->fetch_assoc()) {
                $stats['categories'][] = [
                    'id' => (int)$row['category_id'],
                    'name' => $row['category_name'],
                    'count' => (int)$row['app_count']
                ];
            }
            
            // Score distribution
            $scoreSql = "
                SELECT 
                    CASE 
                        WHEN score >= 4.5 THEN 'excellent'
                        WHEN score >= 4.0 THEN 'good'
                        WHEN score >= 3.0 THEN 'average'
                        WHEN score >= 2.0 THEN 'poor'
                        ELSE 'very_poor'
                    END as score_range,
                    COUNT(*) as count
                FROM app_store_apps
                WHERE score IS NOT NULL
                GROUP BY score_range
            ";
            try {
                $scoreResult = $this->conn->query($scoreSql);
                $stats['score_distribution'] = [];
                while ($row = $scoreResult->fetch_assoc()) {
                    $stats['score_distribution'][$row['score_range']] = (int)$row['count'];
                }
            } catch (Exception $e) {
                $stats['score_distribution'] = [];
            }
            
            // Size distribution
            $sizeSql = "
                SELECT 
                    CASE 
                        WHEN size < 10485760 THEN 'small'      -- < 10MB
                        WHEN size < 52428800 THEN 'medium'     -- < 50MB
                        WHEN size < 104857600 THEN 'large'     -- < 100MB
                        ELSE 'very_large'                      -- >= 100MB
                    END as size_range,
                    COUNT(*) as count
                FROM app_store_apps
                WHERE size IS NOT NULL
                GROUP BY size_range
            ";
            try {
                $sizeResult = $this->conn->query($sizeSql);
                $stats['size_distribution'] = [];
                while ($row = $sizeResult->fetch_assoc()) {
                    $stats['size_distribution'][$row['size_range']] = (int)$row['count'];
                }
            } catch (Exception $e) {
                $stats['size_distribution'] = [];
            }
            
            // Total counts
            $totalSql = "SELECT COUNT(*) as total FROM app_store_apps";
            $totalResult = $this->conn->query($totalSql);
            $stats['totals'] = [
                'all_apps' => (int)$totalResult->fetch_assoc()['total']
            ];
            
            APIResponse::success($stats, 'App filter statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch app filter stats: ' . $e->getMessage(), 500);
        }
    }
    
    private function getUserFilterStats() {
        try {
            $stats = [];
            
            // User role distribution (if roles exist)
            $roleSql = "
                SELECT 
                    COALESCE(role, 'user') as role,
                    COUNT(*) as count
                FROM users
                GROUP BY role
            ";
            try {
                $roleResult = $this->conn->query($roleSql);
                $stats['roles'] = [];
                while ($row = $roleResult->fetch_assoc()) {
                    $stats['roles'][$row['role']] = (int)$row['count'];
                }
            } catch (Exception $e) {
                $stats['roles'] = [];
            }
            
            // Active vs inactive users
            $statusSql = "
                SELECT 
                    CASE 
                        WHEN is_active = 1 THEN 'active'
                        ELSE 'inactive'
                    END as status,
                    COUNT(*) as count
                FROM users
                GROUP BY is_active
            ";
            try {
                $statusResult = $this->conn->query($statusSql);
                $stats['status'] = [];
                while ($row = $statusResult->fetch_assoc()) {
                    $stats['status'][$row['status']] = (int)$row['count'];
                }
            } catch (Exception $e) {
                $stats['status'] = [];
            }
            
            // Registration date distribution (last 30 days)
            $registrationSql = "
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM users
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY DATE(created_at)
                ORDER BY date DESC
                LIMIT 30
            ";
            try {
                $registrationResult = $this->conn->query($registrationSql);
                $stats['daily_registrations'] = [];
                while ($row = $registrationResult->fetch_assoc()) {
                    $stats['daily_registrations'][$row['date']] = (int)$row['count'];
                }
            } catch (Exception $e) {
                $stats['daily_registrations'] = [];
            }
            
            // Total counts
            $totalSql = "SELECT COUNT(*) as total FROM users";
            $totalResult = $this->conn->query($totalSql);
            $stats['totals'] = [
                'all_users' => (int)$totalResult->fetch_assoc()['total']
            ];
            
            APIResponse::success($stats, 'User filter statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch user filter stats: ' . $e->getMessage(), 500);
        }
    }
}

$api = new FilterStatsAPI();
$api->handleRequest();
?>
<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class PlanSelectedAppsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('plan_selected_apps', 'id');
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';

        switch ($action) {
            case 'get_selected_apps':
                $this->getSelectedApps();
                break;
            case 'get_available_apps':
                $this->getAvailableApps();
                break;
            case 'update_selected_apps':
                $this->updateSelectedApps();
                break;
            default:
                APIResponse::error('Action not specified', 400);
        }
    }

    private function getSelectedApps() {
        $planId = $_GET['plan_id'] ?? $_GET['plan_unique_id'] ?? null;
        $clientId = $_GET['client_unique_id'] ?? null;

        // Determine plan type and set appropriate identifiers
        if ($planId) {
            // This is for community plans - use plan_unique_id
            $planType = $this->getPlanType($planId);
            if ($planType !== 'custom_community') {
                APIResponse::error('Plan not found or not a community plan', 404);
            }
            $this->getCommunitySelectedApps($planId);
        } elseif ($clientId) {
            // This is for custom personal plans - use client_unique_id
            $this->getCustomSelectedApps($clientId);
        } else {
            APIResponse::error('Plan ID or Client ID is required', 400);
        }
    }

    private function getAvailableApps() {
        $planId = $_GET['plan_id'] ?? $_GET['plan_unique_id'] ?? null;
        $clientId = $_GET['client_unique_id'] ?? null;

        if ($planId) {
            // Community plan - get available apps for community
            $planType = $this->getPlanType($planId);
            if ($planType !== 'custom_community') {
                APIResponse::error('Plan not found or not a community plan', 404);
            }
            $this->getCommunityAvailableApps($planId);
        } elseif ($clientId) {
            // Custom personal plan - get available apps for client
            $this->getCustomAvailableApps($clientId);
        } else {
            APIResponse::error('Plan ID or Client ID is required', 400);
        }
    }

    private function updateSelectedApps() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            APIResponse::error('Method not allowed', 405);
        }

        $input = json_decode(file_get_contents('php://input'), true);
        $planId = $input['plan_id'] ?? $input['plan_unique_id'] ?? null;
        $clientId = $input['client_unique_id'] ?? null;
        $selectedAppIds = $input['selected_app_ids'] ?? [];

        if ($planId) {
            // Community plan update
            $this->updateCommunitySelectedApps($planId, $selectedAppIds);
        } elseif ($clientId) {
            // Custom personal plan update
            $this->updateCustomSelectedApps($clientId, $selectedAppIds);
        } else {
            APIResponse::error('Plan ID or Client ID is required', 400);
        }
    }

    private function getPlanType($planId) {
        try {
            $sql = "SELECT plan_type FROM filtering_plans WHERE plan_unique_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $planId);
            $stmt->execute();
            $result = $stmt->get_result()->fetch_assoc();
            return $result ? $result['plan_type'] : null;
        } catch (Exception $e) {
            return null;
        }
    }

    private function getCommunitySelectedApps($planId) {
        try {
            $sql = "
                SELECT
                    cpsa.id,
                    cpsa.plan_unique_id,
                    cpsa.app_id,
                    cpsa.selected_date,
                    asa.app_name,
                    asa.package_name,
                    asa.icon_url,
                    asa.version_name,
                    asa.version_code,
                    asa.size,
                    asa.description,
                    ac.category_name
                FROM community_plan_selected_apps cpsa
                JOIN app_store_apps asa ON cpsa.app_id = asa.app_id
                LEFT JOIN apps_categories ac ON asa.category_id = ac.category_id
                WHERE cpsa.plan_unique_id = ?
                ORDER BY cpsa.selected_date DESC, asa.app_name ASC
            ";

            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $planId);
            $stmt->execute();

            $apps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            // Convert data types
            foreach ($apps as &$app) {
                $app['app_id'] = (int)$app['app_id'];
                $app['id'] = (int)$app['id'];
            }

            APIResponse::success($apps, 'Community selected apps fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch community selected apps: ' . $e->getMessage(), 500);
        }
    }

    private function getCustomSelectedApps($clientId) {
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
            $stmt->bind_param("i", $clientId);
            $stmt->execute();

            $selectedApps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            APIResponse::success($selectedApps, 'Client selected apps fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch client selected apps: ' . $e->getMessage(), 500);
        }
    }

    private function getCommunityAvailableApps($planId) {
        try {
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

            // Get apps with selection status for community
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
                        WHEN cpsa.app_id IS NOT NULL THEN 1
                        ELSE 0
                    END as is_selected
                FROM app_store_apps a
                LEFT JOIN apps_categories c ON a.category_id = c.category_id
                LEFT JOIN community_plan_selected_apps cpsa ON a.app_id = cpsa.app_id AND cpsa.plan_unique_id = ?
                WHERE {$whereClause}
                ORDER BY c.category_name, a.app_name
                LIMIT ? OFFSET ?
            ";

            // Add plan_unique_id to params
            $finalParams = [$planId];
            $finalTypes = 's';

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

            APIResponse::success($response, 'Available apps for community fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch available apps for community: ' . $e->getMessage(), 500);
        }
    }

    private function getCustomAvailableApps($clientId) {
        // Use the same logic as the existing custom_plan_apps.php
        try {
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

            // Get apps with selection status for client
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
            $finalParams = [$clientId];
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

            APIResponse::success($response, 'Available apps for client fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch available apps for client: ' . $e->getMessage(), 500);
        }
    }

    private function updateCommunitySelectedApps($planId, $selectedAppIds) {
        try {
            // Start transaction
            $this->conn->begin_transaction();

            // First, remove all existing selections for this community plan
            $deleteSql = "DELETE FROM community_plan_selected_apps WHERE plan_unique_id = ?";
            $deleteStmt = $this->conn->prepare($deleteSql);
            $deleteStmt->bind_param("s", $planId);
            $deleteStmt->execute();

            // Insert new selections
            if (!empty($selectedAppIds)) {
                $insertSql = "INSERT INTO community_plan_selected_apps (plan_unique_id, app_id, selected_date) VALUES (?, ?, NOW())";
                $insertStmt = $this->conn->prepare($insertSql);

                foreach ($selectedAppIds as $appId) {
                    $insertStmt->bind_param("si", $planId, $appId);
                    $insertStmt->execute();
                }
            }

            // Commit transaction
            $this->conn->commit();

            APIResponse::success([
                'plan_unique_id' => $planId,
                'selected_apps_count' => count($selectedAppIds),
                'selected_app_ids' => $selectedAppIds
            ], 'Community selected apps updated successfully');

        } catch (Exception $e) {
            // Rollback transaction
            $this->conn->rollback();
            APIResponse::error('Failed to update community selected apps: ' . $e->getMessage(), 500);
        }
    }

    private function updateCustomSelectedApps($clientId, $selectedAppIds) {
        try {
            // Start transaction
            $this->conn->begin_transaction();

            // First, remove all existing selections for this client
            $deleteSql = "DELETE FROM custom_plan_selected_apps WHERE client_unique_id = ?";
            $deleteStmt = $this->conn->prepare($deleteSql);
            $deleteStmt->bind_param("i", $clientId);
            $deleteStmt->execute();

            // Insert new selections
            if (!empty($selectedAppIds)) {
                $insertSql = "INSERT INTO custom_plan_selected_apps (client_unique_id, app_id, selected_date) VALUES (?, ?, NOW())";
                $insertStmt = $this->conn->prepare($insertSql);

                foreach ($selectedAppIds as $appId) {
                    $insertStmt->bind_param("ii", $clientId, $appId);
                    $insertStmt->execute();
                }
            }

            // Commit transaction
            $this->conn->commit();

            APIResponse::success([
                'client_unique_id' => $clientId,
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

$api = new PlanSelectedAppsAPI();
$api->handleRequest();
?>
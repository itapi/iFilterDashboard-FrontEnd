<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class CommunityPlanSelectedAppsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('community_plan_selected_apps', 'id');
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'GET':
                $this->getCommunityApps();
                break;
            case 'POST':
                $this->addAppToCommunity();
                break;
            case 'DELETE':
                $this->removeAppFromCommunity();
                break;
            default:
                APIResponse::error('Method not allowed', 405);
        }
    }

    private function getCommunityApps() {
        $planUniqueId = $_GET['plan_unique_id'] ?? null;

        if (!$planUniqueId) {
            APIResponse::error('Plan unique ID is required', 400);
        }

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
            $stmt->bind_param("s", $planUniqueId);
            $stmt->execute();

            $apps = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

            // Convert data types
            foreach ($apps as &$app) {
                $app['app_id'] = (int)$app['app_id'];
                $app['id'] = (int)$app['id'];
            }

            APIResponse::success($apps, 'Community apps fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch community apps: ' . $e->getMessage(), 500);
        }
    }

    private function addAppToCommunity() {
        $data = json_decode(file_get_contents('php://input'), true);

        $planUniqueId = $data['plan_unique_id'] ?? null;
        $appId = $data['app_id'] ?? null;

        if (!$planUniqueId || !$appId) {
            APIResponse::error('Plan unique ID and app ID are required', 400);
        }

        try {
            // Check if app is already in community
            $checkSql = "SELECT id FROM community_plan_selected_apps WHERE plan_unique_id = ? AND app_id = ?";
            $checkStmt = $this->conn->prepare($checkSql);
            $checkStmt->bind_param("si", $planUniqueId, $appId);
            $checkStmt->execute();

            if ($checkStmt->get_result()->num_rows > 0) {
                APIResponse::error('App is already in this community', 409);
            }

            // Add app to community
            $sql = "INSERT INTO community_plan_selected_apps (plan_unique_id, app_id, selected_date) VALUES (?, ?, NOW())";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("si", $planUniqueId, $appId);

            if ($stmt->execute()) {
                APIResponse::success(['id' => $this->conn->insert_id], 'App added to community successfully');
            } else {
                APIResponse::error('Failed to add app to community', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to add app to community: ' . $e->getMessage(), 500);
        }
    }

    private function removeAppFromCommunity() {
        $data = json_decode(file_get_contents('php://input'), true);

        $planUniqueId = $data['plan_unique_id'] ?? null;
        $appId = $data['app_id'] ?? null;

        if (!$planUniqueId || !$appId) {
            APIResponse::error('Plan unique ID and app ID are required', 400);
        }

        try {
            $sql = "DELETE FROM community_plan_selected_apps WHERE plan_unique_id = ? AND app_id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("si", $planUniqueId, $appId);

            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([], 'App removed from community successfully');
                } else {
                    APIResponse::error('App not found in community', 404);
                }
            } else {
                APIResponse::error('Failed to remove app from community', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to remove app from community: ' . $e->getMessage(), 500);
        }
    }
}

$api = new CommunityPlanSelectedAppsAPI();
$api->handleRequest();
?>
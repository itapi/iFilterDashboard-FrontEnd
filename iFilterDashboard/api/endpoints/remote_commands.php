<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class RemoteCommandsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('remote_commands', 'command_id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'by_device':
                $this->getCommandsByDevice();
                break;
            case 'pending':
                $this->getPendingCommands();
                break;
            case 'update_status':
                $this->updateCommandStatus();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getCommandsByDevice() {
        $deviceId = $_GET['device_id'] ?? null;
        
        if (!$deviceId) {
            APIResponse::error('Device ID is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    rc.*,
                    d.device_name,
                    d.device_os
                FROM remote_commands rc
                LEFT JOIN devices d ON rc.device_id = d.device_id
                WHERE rc.device_id = ?
                ORDER BY rc.created_at DESC
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $deviceId);
            $stmt->execute();
            
            $commands = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            // Decode JSON command data
            foreach ($commands as &$command) {
                if ($command['command_data']) {
                    $command['command_data'] = json_decode($command['command_data'], true);
                }
            }
            
            APIResponse::success($commands, 'Device commands fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch device commands: ' . $e->getMessage(), 500);
        }
    }
    
    private function getPendingCommands() {
        $deviceId = $_GET['device_id'] ?? null;
        
        try {
            $sql = "
                SELECT 
                    rc.*,
                    d.device_name
                FROM remote_commands rc
                LEFT JOIN devices d ON rc.device_id = d.device_id
                WHERE rc.status = 'pending'
            ";
            
            $params = [];
            $types = '';
            
            if ($deviceId) {
                $sql .= " AND rc.device_id = ?";
                $params[] = $deviceId;
                $types = 'i';
            }
            
            $sql .= " ORDER BY rc.created_at ASC";
            
            $stmt = $this->conn->prepare($sql);
            if (!empty($params)) {
                $stmt->bind_param($types, ...$params);
            }
            $stmt->execute();
            
            $commands = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            // Decode JSON command data
            foreach ($commands as &$command) {
                if ($command['command_data']) {
                    $command['command_data'] = json_decode($command['command_data'], true);
                }
            }
            
            APIResponse::success($commands, 'Pending commands fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch pending commands: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateCommandStatus() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $commandId = $input['command_id'] ?? null;
        $status = $input['status'] ?? null;
        $response = $input['response'] ?? null;
        
        if (!$commandId || !$status) {
            APIResponse::error('Command ID and status are required', 400);
        }
        
        try {
            $sql = "
                UPDATE remote_commands 
                SET status = ?, response_data = ?, executed_at = NOW() 
                WHERE command_id = ?
            ";
            $stmt = $this->conn->prepare($sql);
            $responseData = $response ? json_encode($response) : null;
            $stmt->bind_param("ssi", $status, $responseData, $commandId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'command_id' => $commandId,
                        'status' => $status
                    ], 'Command status updated successfully');
                } else {
                    APIResponse::error('Command not found', 404);
                }
            } else {
                APIResponse::error('Failed to update command status', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update command status: ' . $e->getMessage(), 500);
        }
    }
}

$api = new RemoteCommandsAPI();
$api->handleRequest();
?>
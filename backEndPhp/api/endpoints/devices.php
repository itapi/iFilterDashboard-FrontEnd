<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class DevicesAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('devices', 'device_id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'by_client':
                $this->getDevicesByClient();
                break;
            case 'send_command':
                $this->sendRemoteCommand();
                break;
            case 'status_update':
                $this->updateDeviceStatus();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getDevicesByClient() {
        $clientId = $_GET['client_id'] ?? null;
        
        if (!$clientId) {
            APIResponse::error('Client ID is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    d.*,
                    c.client_name,
                    COUNT(rc.command_id) as pending_commands
                FROM devices d
                LEFT JOIN clients c ON d.client_id = c.client_id
                LEFT JOIN remote_commands rc ON d.device_id = rc.device_id AND rc.status = 'pending'
                WHERE d.client_id = ?
                GROUP BY d.device_id
                ORDER BY d.last_seen DESC
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $clientId);
            $stmt->execute();
            
            $devices = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($devices, 'Devices by client fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch devices: ' . $e->getMessage(), 500);
        }
    }
    
    private function sendRemoteCommand() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $deviceId = $input['device_id'] ?? null;
        $command = $input['command'] ?? null;
        $parameters = $input['parameters'] ?? null;
        
        if (!$deviceId || !$command) {
            APIResponse::error('Device ID and command are required', 400);
        }
        
        try {
            $sql = "
                INSERT INTO remote_commands (device_id, command_type, command_data, status, created_at) 
                VALUES (?, ?, ?, 'pending', NOW())
            ";
            $stmt = $this->conn->prepare($sql);
            $commandData = $parameters ? json_encode($parameters) : null;
            $stmt->bind_param("iss", $deviceId, $command, $commandData);
            
            if ($stmt->execute()) {
                $commandId = $this->conn->insert_id;
                APIResponse::success([
                    'command_id' => $commandId,
                    'device_id' => $deviceId,
                    'command' => $command
                ], 'Remote command sent successfully', 201);
            } else {
                APIResponse::error('Failed to send remote command', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to send command: ' . $e->getMessage(), 500);
        }
    }
    
    private function updateDeviceStatus() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $deviceId = $input['device_id'] ?? null;
        $status = $input['status'] ?? null;
        $lastSeen = $input['last_seen'] ?? date('Y-m-d H:i:s');
        
        if (!$deviceId || !$status) {
            APIResponse::error('Device ID and status are required', 400);
        }
        
        try {
            $sql = "
                UPDATE devices 
                SET status = ?, last_seen = ?, updated_at = NOW() 
                WHERE device_id = ?
            ";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ssi", $status, $lastSeen, $deviceId);
            
            if ($stmt->execute()) {
                if ($stmt->affected_rows > 0) {
                    APIResponse::success([
                        'device_id' => $deviceId,
                        'status' => $status,
                        'last_seen' => $lastSeen
                    ], 'Device status updated successfully');
                } else {
                    APIResponse::error('Device not found', 404);
                }
            } else {
                APIResponse::error('Failed to update device status', 500);
            }
        } catch (Exception $e) {
            APIResponse::error('Failed to update device status: ' . $e->getMessage(), 500);
        }
    }
}

$api = new DevicesAPI();
$api->handleRequest();
?>
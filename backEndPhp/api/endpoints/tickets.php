<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';
require_once __DIR__ . '/../core/FilterBuilder.php';

class TicketsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('tickets', 'id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'with_details':
                $this->getTicketsWithDetails();
                break;
            case 'updates':
                $this->getTicketUpdates();
                break;
            case 'add_update':
                $this->addTicketUpdate();
                break;
            case 'by_status':
                $this->getTicketsByStatus();
                break;
            case 'statistics':
                $this->getTicketStatistics();
                break;
            case 'close':
                $this->closeTicket();
                break;
            case 'assign':
                $this->assignTicket();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getTicketsWithDetails() {
        try {
            // Initialize filter builder
            $filterBuilder = new FilterBuilder();
            
            // Set searchable fields
            $filterBuilder->setSearchableFields([
                't.subject',
                't.description', 
                "CONCAT(c.first_name, ' ', c.last_name)",
                'c.first_name',
                'c.last_name'
            ]);
            
            // Set sort options
            $filterBuilder->addSortOption('created_at', 't.created_at')
                         ->addSortOption('updated_at', 't.updated_at')
                         ->addSortOption('status', 't.status')
                         ->addSortOption('priority', 't.priority')
                         ->addSortOption('subject', 't.subject')
                         ->addSortOption('client_name', "CONCAT(c.first_name, ' ', c.last_name)")
                         ->setDefaultSort('t.created_at', 'DESC');
            
            // Parse filters from request with proper field mapping
            $filters = $_GET;
            // Map status to the correct table field
            if (isset($filters['status'])) {
                if ($filters['status'] === 'unassigned') {
                    $filterBuilder->addFilter('t.status', 'open');
                    $filterBuilder->addFilter('t.assigned_to', null, 'is_null');
                } else {
                    $filterBuilder->addFilter('t.status', $filters['status']);
                }
                unset($filters['status']); // Remove to prevent double processing
            }
            
            if (isset($filters['unassigned']) && $filters['unassigned'] == '1') {
                $filterBuilder->addFilter('t.assigned_to', null, 'is_null');
                unset($filters['unassigned']);
            }
            
            if (isset($filters['assigned_to']) && !empty($filters['assigned_to'])) {
                if (is_array($filters['assigned_to'])) {
                    $filterBuilder->addFilter('t.assigned_to', $filters['assigned_to'], 'in');
                } else {
                    $filterBuilder->addFilter('t.assigned_to', $filters['assigned_to']);
                }
                unset($filters['assigned_to']);
            }
            
            // Parse remaining filters
            $filterBuilder->parseFilters($filters);
            
            // Base count query
            $baseCountQuery = "
                SELECT COUNT(DISTINCT t.id) as total
                FROM tickets t
                LEFT JOIN clients c ON t.client_unique_id = c.client_unique_id
                LEFT JOIN users u ON t.assigned_to = u.id
            ";
            
            // Build count query with filters
            $countQuery = $filterBuilder->buildCountQuery($baseCountQuery);
            
            // Execute count query
            if (!empty($countQuery['params'])) {
                $countStmt = $this->conn->prepare($countQuery['query']);
                if (!empty($countQuery['types'])) {
                    $countStmt->bind_param($countQuery['types'], ...$countQuery['params']);
                }
                $countStmt->execute();
                $totalCount = $countStmt->get_result()->fetch_assoc()['total'];
            } else {
                $countResult = $this->conn->query($countQuery['query']);
                $totalCount = $countResult->fetch_assoc()['total'];
            }
            
            // Base tickets query
            $baseQuery = "
                SELECT 
                    t.*,
                    CONCAT(c.first_name, ' ', c.last_name) as client_name,
                    u.username as assigned_user_name,
                    COUNT(tu.id) as update_count,
                    MAX(tu.created_at) as last_update
                FROM tickets t
                LEFT JOIN clients c ON t.client_unique_id = c.client_unique_id
                LEFT JOIN users u ON t.assigned_to = u.id
                LEFT JOIN ticket_updates tu ON t.id = tu.ticket_id
            ";
            
            // Build main query with filters and pagination
            $queryData = $filterBuilder->buildQuery($baseQuery, $_GET, 't.id');
            
            // Execute main query
            if (!empty($queryData['params'])) {
                $stmt = $this->conn->prepare($queryData['query']);
                if (!empty($queryData['types'])) {
                    $stmt->bind_param($queryData['types'], ...$queryData['params']);
                }
                $stmt->execute();
                $tickets = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            } else {
                $result = $this->conn->query($queryData['query']);
                $tickets = $result->fetch_all(MYSQLI_ASSOC);
            }
            
            // Calculate pagination info
            $pagination = $queryData['pagination'];
            $totalPages = ceil($totalCount / $pagination['limit']);
            $hasMore = $pagination['page'] < $totalPages;
            
            APIResponse::success([
                'data' => $tickets,
                'pagination' => [
                    'current_page' => $pagination['page'],
                    'per_page' => $pagination['limit'],
                    'total' => (int)$totalCount,
                    'total_pages' => $totalPages,
                    'has_more' => $hasMore
                ]
            ], 'Tickets with details fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch tickets: ' . $e->getMessage(), 500);
        }
    }
    
    private function getTicketUpdates() {
        $ticketId = $_GET['ticket_id'] ?? null;
        
        if (!$ticketId) {
            APIResponse::error('Ticket ID is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    tu.*,
                    CASE 
                        WHEN tu.user_type = 'user' THEN u.username
                        WHEN tu.user_type = 'client' THEN CONCAT(c.first_name, ' ', c.last_name)
                        ELSE 'Unknown'
                    END as sender_name
                FROM ticket_updates tu
                LEFT JOIN users u ON tu.updated_by = u.id AND tu.user_type = 'user'
                LEFT JOIN clients c ON tu.updated_by = c.client_unique_id AND tu.user_type = 'client'
                WHERE tu.ticket_id = ?
                ORDER BY tu.created_at ASC
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $ticketId);
            $stmt->execute();
            
            $updates = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($updates, 'Ticket updates fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch ticket updates: ' . $e->getMessage(), 500);
        }
    }
    
    private function addTicketUpdate() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $ticketId = $input['ticket_id'] ?? null;
        $message = $input['message'] ?? null;
        $updatedBy = $input['updated_by'] ?? null;
        $userType = $input['user_type'] ?? 'user';
        
        if (!$ticketId || !$message || !$updatedBy) {
            APIResponse::error('Ticket ID, message, and updated_by are required', 400);
        }
        
        try {
            $this->conn->autocommit(false);
            
            // Add ticket update
            $sql = "INSERT INTO ticket_updates (ticket_id, updated_by, message, user_type, created_at) VALUES (?, ?, ?, ?, NOW())";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("iiss", $ticketId, $updatedBy, $message, $userType);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to add ticket update');
            }
            
            $updateId = $this->conn->insert_id;
            
            $this->conn->commit();
            $this->conn->autocommit(true);
            
            // Get the update with sender info for response
            $sql = "
                SELECT 
                    tu.*,
                    CASE 
                        WHEN tu.user_type = 'user' THEN u.username
                        WHEN tu.user_type = 'client' THEN CONCAT(c.first_name, ' ', c.last_name)
                        ELSE 'Unknown'
                    END as sender_name
                FROM ticket_updates tu
                LEFT JOIN users u ON tu.updated_by = u.id AND tu.user_type = 'user'
                LEFT JOIN clients c ON tu.updated_by = c.client_unique_id AND tu.user_type = 'client'
                WHERE tu.id = ?
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $updateId);
            $stmt->execute();
            $update = $stmt->get_result()->fetch_assoc();
            
            APIResponse::success($update, 'Ticket update added successfully', 201);
        } catch (Exception $e) {
            $this->conn->rollback();
            $this->conn->autocommit(true);
            APIResponse::error('Failed to add ticket update: ' . $e->getMessage(), 500);
        }
    }
    
    private function closeTicket() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $ticketId = $input['ticket_id'] ?? null;
        
        if (!$ticketId) {
            APIResponse::error('Ticket ID is required', 400);
        }
        
        try {
            $sql = "UPDATE tickets SET status = 'closed', closed_at = NOW() WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("i", $ticketId);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to close ticket');
            }
            
            APIResponse::success(['ticket_id' => $ticketId], 'Ticket closed successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to close ticket: ' . $e->getMessage(), 500);
        }
    }
    
    private function assignTicket() {
        if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
            APIResponse::error('Method not allowed', 405);
        }
        
        $input = $this->getJsonInput();
        $ticketId = $input['ticket_id'] ?? null;
        $assignedTo = $input['assigned_to'] ?? null;
        
        if (!$ticketId || !$assignedTo) {
            APIResponse::error('Ticket ID and assigned_to are required', 400);
        }
        
        try {
            $sql = "UPDATE tickets SET assigned_to = ? WHERE id = ?";
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("ii", $assignedTo, $ticketId);
            
            if (!$stmt->execute()) {
                throw new Exception('Failed to assign ticket');
            }
            
            APIResponse::success(['ticket_id' => $ticketId, 'assigned_to' => $assignedTo], 'Ticket assigned successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to assign ticket: ' . $e->getMessage(), 500);
        }
    }
    
    private function getTicketsByStatus() {
        $status = $_GET['status'] ?? null;
        
        if (!$status) {
            APIResponse::error('Status is required', 400);
        }
        
        try {
            $sql = "
                SELECT 
                    t.*,
                    CONCAT(c.first_name, ' ', c.last_name) as client_name,
                    u.username as assigned_user_name
                FROM tickets t
                LEFT JOIN clients c ON t.client_unique_id = c.client_unique_id
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.status = ?
                ORDER BY t.created_at DESC
            ";
            
            $stmt = $this->conn->prepare($sql);
            $stmt->bind_param("s", $status);
            $stmt->execute();
            
            $tickets = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            APIResponse::success($tickets, "Tickets with status '$status' fetched successfully");
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch tickets by status: ' . $e->getMessage(), 500);
        }
    }
    
    private function getTicketStatistics() {
        try {
            $sql = "
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(CASE WHEN status = 'closed' AND closed_at IS NOT NULL THEN 
                        TIMESTAMPDIFF(HOUR, created_at, closed_at) 
                    END) as avg_resolution_hours
                FROM tickets
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                GROUP BY status
                
                UNION ALL
                
                SELECT 
                    'total' as status,
                    COUNT(*) as count,
                    NULL as avg_resolution_hours
                FROM tickets
                WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            ";
            
            $result = $this->conn->query($sql);
            $stats = $result->fetch_all(MYSQLI_ASSOC);
            
            // Format the statistics
            $formattedStats = [];
            foreach ($stats as $stat) {
                $formattedStats[$stat['status']] = [
                    'count' => (int)$stat['count'],
                    'avg_resolution_hours' => $stat['avg_resolution_hours'] ? round($stat['avg_resolution_hours'], 2) : null
                ];
            }
            
            APIResponse::success($formattedStats, 'Ticket statistics fetched successfully');
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch ticket statistics: ' . $e->getMessage(), 500);
        }
    }
    
    protected function getJsonInput() {
        return json_decode(file_get_contents('php://input'), true) ?? [];
    }
}

$api = new TicketsAPI();
$api->handleRequest();
?>
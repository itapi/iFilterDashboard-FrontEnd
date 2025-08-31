<?php
require_once __DIR__ . '/../core/BaseAPI.php';
require_once __DIR__ . '/../core/APIResponse.php';

class PaymentsAPI extends BaseAPI {
    public function __construct() {
        parent::__construct('payments', 'payment_id');
    }
    
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        switch ($action) {
            case 'by_client':
                $this->getPaymentsByClient();
                break;
            case 'client_summary':
                $this->getClientPaymentSummary();
                break;
            default:
                parent::handleRequest();
        }
    }
    
    private function getPaymentsByClient() {
        $clientUniqueId = $_GET['client_unique_id'] ?? null;
        
        if (!$clientUniqueId) {
            APIResponse::error('Client unique ID is required', 400);
        }
        
        try {
            // Get pagination parameters
            $page = max(1, (int)($_GET['page'] ?? 1));
            $limit = min(100, max(1, (int)($_GET['limit'] ?? 20)));
            $offset = ($page - 1) * $limit;
            
            // Get sort parameters
            $sortBy = $_GET['sort_by'] ?? 'payment_date';
            $sortOrder = strtoupper($_GET['sort_order'] ?? 'DESC');
            
            // Validate sort parameters
            $allowedSortFields = ['payment_date', 'amount', 'status', 'period_start', 'period_end'];
            if (!in_array($sortBy, $allowedSortFields)) {
                $sortBy = 'payment_date';
            }
            if (!in_array($sortOrder, ['ASC', 'DESC'])) {
                $sortOrder = 'DESC';
            }
            
            // Build base query
            $baseQuery = "
                SELECT 
                    p.*,
                    DATEDIFF(p.period_end, p.period_start) + 1 as period_days,
                    CASE 
                        WHEN p.status = 'paid' THEN 'success'
                        WHEN p.status = 'pending' THEN 'warning'
                        WHEN p.status = 'failed' THEN 'error'
                        WHEN p.status = 'refunded' THEN 'info'
                        ELSE 'default'
                    END as status_variant
                FROM payments p
                WHERE p.client_unique_id = ?
            ";
            
            // Add sorting
            $query = $baseQuery . " ORDER BY p.{$sortBy} {$sortOrder} LIMIT ? OFFSET ?";
            
            // Execute main query
            $stmt = $this->conn->prepare($query);
            $stmt->bind_param("iii", $clientUniqueId, $limit, $offset);
            $stmt->execute();
            $payments = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            
            // Get total count
            $countQuery = "SELECT COUNT(*) as total FROM payments WHERE client_unique_id = ?";
            $countStmt = $this->conn->prepare($countQuery);
            $countStmt->bind_param("i", $clientUniqueId);
            $countStmt->execute();
            $totalCount = $countStmt->get_result()->fetch_assoc()['total'];
            
            // Format payments data
            foreach ($payments as &$payment) {
                $payment['amount'] = (float)$payment['amount'];
                $payment['period_days'] = (int)$payment['period_days'];
                $payment['payment_date_formatted'] = date('d/m/Y H:i', strtotime($payment['payment_date']));
                $payment['period_start_formatted'] = date('d/m/Y', strtotime($payment['period_start']));
                $payment['period_end_formatted'] = date('d/m/Y', strtotime($payment['period_end']));
            }
            
            // Calculate pagination
            $totalPages = ceil($totalCount / $limit);
            $hasMore = $page < $totalPages;
            
            APIResponse::success([
                'data' => $payments,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $limit,
                    'total' => (int)$totalCount,
                    'total_pages' => $totalPages,
                    'has_more' => $hasMore
                ]
            ], 'Client payments fetched successfully');
            
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch payments: ' . $e->getMessage(), 500);
        }
    }
    
    private function getClientPaymentSummary() {
        $clientUniqueId = $_GET['client_unique_id'] ?? null;
        
        if (!$clientUniqueId) {
            APIResponse::error('Client unique ID is required', 400);
        }
        
        try {
            $summaryQuery = "
                SELECT 
                    COUNT(*) as total_payments,
                    SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
                    SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
                    SUM(CASE WHEN status = 'failed' THEN amount ELSE 0 END) as total_failed,
                    SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as total_refunded,
                    AVG(CASE WHEN status = 'paid' THEN amount ELSE NULL END) as average_payment,
                    MAX(payment_date) as last_payment_date,
                    MIN(payment_date) as first_payment_date,
                    COUNT(CASE WHEN status = 'paid' THEN 1 END) as successful_payments,
                    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
                    COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments
                FROM payments 
                WHERE client_unique_id = ?
            ";
            
            $stmt = $this->conn->prepare($summaryQuery);
            $stmt->bind_param("i", $clientUniqueId);
            $stmt->execute();
            $summary = $stmt->get_result()->fetch_assoc();
            
            // Format numeric values
            $summary['total_paid'] = (float)($summary['total_paid'] ?? 0);
            $summary['total_pending'] = (float)($summary['total_pending'] ?? 0);
            $summary['total_failed'] = (float)($summary['total_failed'] ?? 0);
            $summary['total_refunded'] = (float)($summary['total_refunded'] ?? 0);
            $summary['average_payment'] = $summary['average_payment'] ? (float)$summary['average_payment'] : 0;
            
            // Format dates
            if ($summary['last_payment_date']) {
                $summary['last_payment_date_formatted'] = date('d/m/Y', strtotime($summary['last_payment_date']));
            }
            if ($summary['first_payment_date']) {
                $summary['first_payment_date_formatted'] = date('d/m/Y', strtotime($summary['first_payment_date']));
            }
            
            APIResponse::success($summary, 'Payment summary fetched successfully');
            
        } catch (Exception $e) {
            APIResponse::error('Failed to fetch payment summary: ' . $e->getMessage(), 500);
        }
    }
}

$api = new PaymentsAPI();
$api->handleRequest();
?>
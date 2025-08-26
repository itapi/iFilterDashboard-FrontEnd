<?php
// Enable error reporting for debugging (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Get the requested endpoint from the URL
$request = $_SERVER['REQUEST_URI'];
$path = parse_url($request, PHP_URL_PATH);
$pathSegments = explode('/', trim($path, '/'));

// Find the API segment and get the endpoint
$apiIndex = array_search('api', $pathSegments);
if ($apiIndex === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'API endpoint not found']);
    exit;
}

$endpoint = $pathSegments[$apiIndex + 1] ?? '';

// Route to appropriate endpoint
switch ($endpoint) {
    case 'apps':
        require_once 'endpoints/apps.php';
        break;
    case 'categories':
        require_once 'endpoints/categories.php';
        break;
    case 'users':
        require_once 'endpoints/users.php';
        break;
    case 'clients':
        require_once 'endpoints/clients.php';
        break;
    case 'app-configs':
        require_once 'endpoints/app_configs.php';
        break;
    case 'filtering-plans':
        require_once 'endpoints/filtering_plans.php';
        break;
    case 'category-plan-availability':
        require_once 'endpoints/category_plan_availability.php';
        break;
    case 'devices':
        require_once 'endpoints/devices.php';
        break;
    case 'tickets':
        require_once 'endpoints/tickets.php';
        break;
    case 'remote-commands':
        require_once 'endpoints/remote_commands.php';
        break;
    case 'stats':
        require_once 'endpoints/stats.php';
        break;
    case '':
        // API root - show available endpoints
        echo json_encode([
            'success' => true,
            'message' => 'iFilter API v1.0',
            'endpoints' => [
                'apps' => '/api/apps',
                'categories' => '/api/categories',
                'users' => '/api/users',
                'clients' => '/api/clients',
                'app-configs' => '/api/app-configs',
                'filtering-plans' => '/api/filtering-plans',
                'devices' => '/api/devices',
                'tickets' => '/api/tickets',
                'remote-commands' => '/api/remote-commands',
                'stats' => '/api/stats'
            ],
            'documentation' => '/api/docs'
        ]);
        break;
    default:
        http_response_code(404);
        echo json_encode([
            'success' => false, 
            'error' => "Endpoint '$endpoint' not found",
            'available_endpoints' => [
                'apps', 'categories', 'users', 'clients', 
                'app-configs', 'filtering-plans', 'devices', 
                'tickets', 'remote-commands', 'stats'
            ]
        ]);
}
?>
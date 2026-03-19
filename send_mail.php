<?php 
ini_set('display_errors', 1); 
error_reporting(E_ALL); 
require __DIR__ . '/../lib/PHPMailer/src/PHPMailer.php';
require __DIR__ . '/../lib/PHPMailer/src/SMTP.php';
require __DIR__ . '/../lib/PHPMailer/src/Exception.php';
use PHPMailer\PHPMailer\PHPMailer; 
use PHPMailer\PHPMailer\Exception; 

function sanitize_input($data) { 
    return htmlspecialchars(stripslashes(trim($data))); 
} 

function log_error($message) { 
    error_log(date("[Y-m-d H:i:s] ") . $message . "\n", 3, __DIR__ . "/mail_error.log"); 
}

function send_mail($to, $subject, $message, $replyTo = null) {
    if (empty($to) || !filter_var($to, FILTER_VALIDATE_EMAIL))
        return ['success' => false, 'message' => 'Invalid recipient email'];
    if (empty($message))
        return ['success' => false, 'message' => 'Message content is required'];

    $to      = sanitize_input($to);
    $subject = sanitize_input($subject ?: 'No Subject');
    $replyTo = $replyTo ? sanitize_input($replyTo) : $to;

    try { 
        $mail = new PHPMailer(true); 
        $mail->isSMTP(); 
        $mail->Host       = 'smtp.hostinger.com'; 
        $mail->SMTPAuth   = true; 
        $mail->Username   = 'support@ikosher.me'; 
        $mail->Password   = 'Itapi123!'; 
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; 
        $mail->Port       = 587; 
        $mail->CharSet    = 'UTF-8'; 
        $mail->setFrom('support@ikosher.me', 'iFilter Support');
        $mail->addAddress($to); 
        $mail->addReplyTo($replyTo); 
        $mail->isHTML(true); 
        $mail->Subject = $subject; 
        $mail->Body    = $message; 
        $mail->AltBody = strip_tags($message); 
        $mail->send(); 
        return ['success' => true, 'message' => 'Email sent successfully']; 
    } catch (Exception $e) { 
        $errorMsg = "Mail error: " . $mail->ErrorInfo; 
        log_error($errorMsg); 
        return ['success' => false, 'message' => $errorMsg]; 
    } 
}

// // Still support direct HTTP POST calls
// if (php_sapi_name() !== 'cli' && isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'POST') {
//     header('Content-Type: application/json');
//     header('Cache-Control: no-cache');

//     $json_input = file_get_contents('php://input'); 
//     $data = json_decode($json_input, true); 

//     if ($data !== null) {
//         $result = send_mail(
//             $data['to']      ?? '',
//             $data['subject'] ?? 'No Subject',
//             $data['message'] ?? '',
//             $data['replyTo'] ?? null
//         );
//         echo json_encode($result);
//     } else {
//         echo json_encode(['success' => false, 'message' => 'Invalid request. Send POST JSON data.']);
//     }
// }
?>
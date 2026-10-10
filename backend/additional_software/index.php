<?php
header("Access-Control-Allow-Origin: https://soft-skills-crm.ru");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Response-ID, X-Response-Code, x-response-id, x-response-code, X-Session-ID, x-session-id");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (strpos($_SERVER['REQUEST_URI'], '/.well-known/acme-challenge/') !== false) {
    $acme_path = dirname(__FILE__) . $_SERVER['REQUEST_URI'];
    if (file_exists($acme_path)) {
        header('Content-Type: text/plain');
        echo file_get_contents($acme_path);
        exit;
    }
}

error_reporting(0);
ini_set('display_errors', 0);

$tmp_dir = dirname(__FILE__) . '/tmp_bridge';

if (!is_dir($tmp_dir)) {
    mkdir($tmp_dir, 0777, true);
    chmod($tmp_dir, 0777);
}

$headers = getallheaders();

$lower_headers = array_change_key_case($headers, CASE_LOWER);

if (isset($_GET['check_bridge_id']) || isset($_POST['check_bridge_id'])) {
    $check_id = $_GET['check_bridge_id'] ?? $_POST['check_bridge_id'];
    $check_id = preg_replace('/[^a-zA-Z0-9\._-]/', '', $check_id);
    $target_file = $tmp_dir . "/res_" . $check_id . ".json";
    
    clearstatcache(true, $target_file);
    if (file_exists($target_file)) {
        $res = json_decode(file_get_contents($target_file), true);
        unlink($target_file);
        
        if ($res && isset($res['code'])) {
            http_response_code(intval($res['code']));
            header('Content-Type: application/json; charset=utf-8');
            
            echo $res['body'];
            exit;
        }
    }
    
    http_response_code(202);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["status" => "pending"]);
    exit;
}

$client_key = $_GET['bridge_key'] ?? $_POST['bridge_key'] ?? '';

if ($client_key === 'my_super_secret_key_123') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        
        $response_id = $_GET['response_id'] 
            ?? $_POST['response_id'] 
            ?? $lower_headers['x-response-id'] 
            ?? $_SERVER['HTTP_X_RESPONSE_ID']
            ?? '';

        $response_id = preg_replace('/[^a-zA-Z0-9\._-]/', '', $response_id);
        $response_code = $_GET['response_code'] ?? $lower_headers['x-response-code'] ?? 200;

        if (empty($response_id)) {
            file_put_contents($tmp_dir . "/debug_bridge.log", "Ошибка: ID пуст. Доступные заголовки: " . json_encode($headers) . " GET: " . json_encode($_GET) . "\n", FILE_APPEND);
        } else {
            file_put_contents($tmp_dir . "/debug_bridge.log", "Успех! Записан файл для ID: " . $response_id . " со статусом: " . $response_code . "\n", FILE_APPEND);
        }

        if ($response_id) {
            $file_path = $tmp_dir . "/res_" . $response_id . ".json";
            file_put_contents($file_path, json_encode([
                'code' => $response_code,
                'body' => file_get_contents('php://input')
            ]), LOCK_EX);
            chmod($file_path, 0777);
            
            clearstatcache(true, $file_path);
            
            header('Content-Type: application/json');
            echo json_encode(['status' => 'ok']);
        }
        exit;
    } else {
        $files = glob($tmp_dir . "/req_*.json");
        $output = [];
        foreach ($files as $file) {
            $name = basename($file, '.json');
            $output[$name] = json_decode(file_get_contents($file), true);
            unlink($file);
        }
        header('Content-Type: application/json');
        echo json_encode($output);
        exit;
    }
}

$id = 'r' . substr(md5(microtime(true) . mt_rand()), 0, 15); 

$uri = $_SERVER['REQUEST_URI'] ?? '/';
if (($pos = strpos($uri, '?')) !== false) $uri = substr($uri, 0, $pos);
if (strpos($uri, '/index.php') === 0) $uri = substr($uri, 10);
if (empty($uri)) $uri = '/';

$request_data = [
    'uri' => $uri,
    'method' => $_SERVER['REQUEST_METHOD'],
    'headers' => $headers,
    'body' => file_get_contents('php://input')
];

file_put_contents($tmp_dir . "/req_" . $id . ".json", json_encode($request_data), LOCK_EX);
clearstatcache(true, $tmp_dir . "/req_" . $id . ".json");

$content_type = $lower_headers['content-type'] ?? '';
$accept = $lower_headers['accept'] ?? '';
$requested_with = $lower_headers['x-requested-with'] ?? '';

$is_json_request = (strpos($content_type, 'application/json') !== false) || 
                   (strpos($accept, 'application/json') !== false) ||
                   ($requested_with === 'xmlhttprequest') ||
                   ($_SERVER['REQUEST_METHOD'] !== 'GET') ||
                   ($uri !== '/' && strpos($accept, 'text/html') === false);

if ($is_json_request) {
    $target_file = $tmp_dir . "/res_" . $id . ".json";
    
    for ($i = 0; $i < 75; $i++) {
        clearstatcache(true, $target_file);
        if (file_exists($target_file)) {
            $res = json_decode(file_get_contents($target_file), true);
            unlink($target_file);
            
            if ($res && isset($res['code'])) {
                http_response_code(intval($res['code']));
                header('Content-Type: application/json; charset=utf-8');
                echo $res['body'];
                exit;
            }
        }
        usleep(200000); 
    }
    
    http_response_code(504);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(["error" => "Gateway Timeout", "message" => "Локальный сервер не ответил вовремя"]);
    exit;
}

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <title>Загрузка данных...</title>
    <style>
        body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f4f6f9; color: #333; }
        .loader { text-align: center; }
        .spinner { border: 4px solid rgba(0,0,0,.1); width: 36px; height: 36px; border-radius: 50%; border-left-color: #09f; animation: spin 1s linear infinite; margin: 0 auto 10px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="loader">
        <div class="spinner"></div>
        <div id="status">Связываюсь с локальным сервером...</div>
    </div>
    <script>
    (() => {
        var bridgeId = '<?php echo $id; ?>';
        
        async function checkStatus() {
            try {
                const res = await fetch('/?check_bridge_id=' + bridgeId);
                
                if (res.status === 202) {
                    setTimeout(checkStatus, 200);
                } else {
                    const contentType = res.headers.get("content-type");
                    
                    if (contentType && contentType.includes("application/json")) {
                        const jsonResult = await res.json();
                        
                        document.open();
                        document.write('<pre style="padding:20px; background:#1e1e1e; color:#00ff00; font-family:monospace; border-radius:5px; font-size:14px; overflow:auto; line-height:1.5;">' + JSON.stringify(jsonResult, null, 2) + '</pre>');
                        document.close();
                    } else {
                        const textResult = await res.text();
                        document.open();
                        document.write(textResult);
                        document.close();
                    }
                }
            } catch (err) {
                const statusEl = document.getElementById('status');
                if (statusEl) {
                    statusEl.innerText = 'Ошибка моста: ' + err.message;
                }
            }
        }
        setTimeout(checkStatus, 100);
    })();
    </script>
</body>
</html>

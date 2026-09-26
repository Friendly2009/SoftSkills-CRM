<?php
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

$base_dir = dirname(__FILE__);
$tmp_dir = $base_dir . '/tmp_bridge';

if (!is_dir($tmp_dir)) {
    mkdir($tmp_dir, 0777, true);
    chmod($tmp_dir, 0777);
}
$tmp_dir = realpath($tmp_dir);
$headers = getallheaders();

if (isset($_GET['check_bridge_id']) || isset($_POST['check_bridge_id'])) {
    $check_id = $_GET['check_bridge_id'] ?? $_POST['check_bridge_id'];
    $check_id = preg_replace('/[^a-zA-Z0-9\._-]/', '', $check_id);
    $target_file = $tmp_dir . "/res_" . $check_id . ".json";
    
    clearstatcache(true, $target_file);
    if (file_exists($target_file)) {
        $res = json_decode(file_get_contents($target_file), true);
        @unlink($target_file);
        
        if ($res && isset($res['code'])) {
            http_response_code(intval($res['code']));
            
            if (isset($res['headers']['content-type'])) {
                header('Content-Type: ' . $res['headers']['content-type']);
            } elseif (isset($res['headers']['Content-Type'])) {
                header('Content-Type: ' . $res['headers']['Content-Type']);
            } else {
                header('Content-Type: text/html; charset=utf-8');
            }
            
            echo $res['body'];
            exit;
        }
    }
    
    http_response_code(202);
    header('Content-Type: application/json');
    echo json_encode(["status" => "pending"]);
    exit;
}

$query_string = $_SERVER['QUERY_STRING'] ?? '';
parse_str($query_string, $parsed_query);
$client_key = $parsed_query['bridge_key'] ?? $_POST['bridge_key'] ?? '';

if ($client_key === 'my_super_secret_key_123') {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $response_id = $headers['X-Response-ID'] ?? $headers['x-response-id'] ?? '';
        $response_code = $headers['X-Response-Code'] ?? $headers['x-response-code'] ?? 200;

        if ($response_id) {
            $response_id = preg_replace('/[^a-zA-Z0-9\._-]/', '', $response_id);
            $file_path = $tmp_dir . "/res_" . $response_id . ".json";
            
            file_put_contents($file_path, json_encode([
                'code' => $response_code,
                'headers' => $headers,
                'body' => file_get_contents('php://input')
            ]), LOCK_EX);
            chmod($file_path, 0777);
            
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
            @unlink($file);
        }
        header('Content-Type: application/json');
        echo json_encode($output);
        exit;
    }
}

$id = uniqid('r');
$uri = $_SERVER['REQUEST_URI'] ?? '/';
if (($pos = strpos($uri, '?')) !== false) {
    $uri = substr($uri, 0, $pos);
}
$uri = str_replace('/index.php', '', $uri);
if (empty($uri)) {
    $uri = '/';
}

$request_data = [
    'uri' => $uri,
    'method' => $_SERVER['REQUEST_METHOD'],
    'headers' => $headers,
    'body' => file_get_contents('php://input')
];

file_put_contents($tmp_dir . "/req_" . $id . ".json", json_encode($request_data), LOCK_EX);

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
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
        const bridgeId = '<?php echo $id; ?>';
        async function checkStatus() {
            try {
                const res = await fetch('/index.php?check_bridge_id=' + bridgeId);
                if (res.status === 202) {
                    setTimeout(checkStatus, 250);
                } else {
                    const text = await res.text();
                    document.open();
                    document.write(text);
                    document.close();
                }
            } catch (err) {
                document.getElementById('status').innerText = 'Ошибка моста: ' + err.message;
            }
        }
        setTimeout(checkStatus, 100);
    </script>
</body>
</html>

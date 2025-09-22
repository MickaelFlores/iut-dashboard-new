<?php
/**
 * Script de connexion ScoDoc IUT Blagnac - Version corrigée
 * Correction des erreurs de syntaxe et amélioration de la logique
 */

class ScoDocConnector {
    private $baseUrl = 'https://scodocetudiant.iut-blagnac.fr';
    private $cookieJar;
    private $phpsessid = null;
    private $dashboardUrl = 'https://iam-mickael.me/dashboard';
    private $allCookies = [];
    private $allHeaders = '';
    
    public function __construct() {
        $this->cookieJar = tempnam(sys_get_temp_dir(), 'scodoc_cookies');
    }
    
    /**
     * Utilise un PHPSESSID existant du navigateur
     */
    public function useExistingPHPSESSID($existingPHPSESSID) {
        echo "<p>🔄 Utilisation du PHPSESSID existant du navigateur...</p>";
        
        $this->phpsessid = $existingPHPSESSID;
        $this->allCookies['PHPSESSID'] = $existingPHPSESSID;
        
        echo "<p>🆔 PHPSESSID défini: " . htmlspecialchars($existingPHPSESSID) . " (longueur: " . strlen($existingPHPSESSID) . ")</p>";
        
        // Tester si cette session fonctionne
        echo "<p>🧪 Test de validité de la session existante...</p>";
        $result = $this->makeAuthenticatedRequest('https://scodocetudiant.iut-blagnac.fr');
        
        if ($result['http_code'] === 200 && !preg_match('/login|connexion/i', $result['content'])) {
            echo "<p>✅ Session existante valide ! Taille réponse: " . strlen($result['content']) . " bytes</p>";
            $this->saveCookieInBrowser();
            return true;
        } else {
            echo "<p>❌ Session existante expirée ou invalide (HTTP " . $result['http_code'] . ")</p>";
            echo "<p>🔄 Fallback vers création d'une nouvelle session...</p>";
            return false;
        }
    }

    /**
     * Version modifiée de makeAuthenticatedRequest pour forcer le PHPSESSID
     */
    public function makeAuthenticatedRequestWithPHPSESSID($url, $phpsessid = null) {
        $sessionId = $phpsessid ?: $this->phpsessid;
        
        if (!$sessionId) {
            throw new Exception("Aucun PHPSESSID disponible pour la requête authentifiée");
        }
        
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_COOKIE, 'PHPSESSID=' . $sessionId);
        
        echo "<p>🌐 Requête avec PHPSESSID: " . htmlspecialchars($sessionId) . "</p>";
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
        
        curl_close($ch);
        
        return [
            'content' => $response,
            'http_code' => $httpCode,
            'final_url' => $finalUrl
        ];
    }

    /**
     * Comparaison des deux sessions
     */
    public function compareSessions($browserPHPSESSID, $scriptPHPSESSID) {
        echo "<div style='background: #e8f4f8; padding: 15px; margin: 10px 0; border-radius: 5px;'>";
        echo "<h3>🔍 Comparaison des deux sessions</h3>";
        
        echo "<h4>📱 Session du navigateur (" . strlen($browserPHPSESSID) . " chars):</h4>";
        $browserResult = $this->makeAuthenticatedRequestWithPHPSESSID('https://scodocetudiant.iut-blagnac.fr', $browserPHPSESSID);
        echo "<p>HTTP: " . $browserResult['http_code'] . " | Taille: " . strlen($browserResult['content']) . " bytes</p>";
        
        if ($browserResult['http_code'] === 200 && !preg_match('/login|connexion/i', $browserResult['content'])) {
            echo "<p>✅ Session navigateur: <strong>VALIDE</strong></p>";
        } else {
            echo "<p>❌ Session navigateur: <strong>EXPIRÉE</strong></p>";
        }
        
        echo "<h4>🤖 Session du script (" . strlen($scriptPHPSESSID) . " chars):</h4>";
        $scriptResult = $this->makeAuthenticatedRequestWithPHPSESSID('https://scodocetudiant.iut-blagnac.fr', $scriptPHPSESSID);
        echo "<p>HTTP: " . $scriptResult['http_code'] . " | Taille: " . strlen($scriptResult['content']) . " bytes</p>";
        
        if ($scriptResult['http_code'] === 200 && !preg_match('/login|connexion/i', $scriptResult['content'])) {
            echo "<p>✅ Session script: <strong>VALIDE</strong></p>";
        } else {
            echo "<p>❌ Session script: <strong>EXPIRÉE</strong></p>";
        }
        
        // Recommandation
        if (strlen($browserResult['content']) > strlen($scriptResult['content'])) {
            echo "<p>💡 <strong>Recommandation:</strong> Utiliser la session du navigateur (plus de contenu accessible)</p>";
            $this->phpsessid = $browserPHPSESSID;
            $this->allCookies['PHPSESSID'] = $browserPHPSESSID;
            $this->saveCookieInBrowser();
        } else {
            echo "<p>💡 <strong>Recommandation:</strong> Utiliser la session du script (équivalente ou meilleure)</p>";
        }
        
        echo "</div>";
    }

    /**
     * Récupère la page de connexion
     */
    private function getLoginPage() {
        $this->allHeaders = '';
        
        $ch = curl_init();
        
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_COOKIEJAR, $this->cookieJar);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->cookieJar);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HEADER, true);
        curl_setopt($ch, CURLOPT_HEADERFUNCTION, [$this, 'headerCallbackFixed']);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if ($httpCode !== 200) {
            throw new Exception("Erreur lors de l'accès à la page de connexion: HTTP $httpCode");
        }
        
        curl_close($ch);
        
        // Diagnostic et extraction corrigée
        $this->diagnosePHPSESSID($response, $this->allHeaders);
        $this->extractPHPSESSIDFixed($response, $this->allHeaders);
        $this->loadCookiesFromJar();
        
        return $response;
    }
    
    /**
     * Callback header corrigé
     */
    private function headerCallbackFixed($ch, $header) {
        $this->allHeaders .= $header;
        
        if (stripos($header, 'Set-Cookie:') === 0 && stripos($header, 'PHPSESSID') !== false) {
            echo "<p style='color: red;'>🚨 Header PHPSESSID détecté: " . htmlspecialchars(trim($header)) . "</p>";
        }
        
        return strlen($header);
    }

    /**
     * Extraction corrigée du PHPSESSID
     */
    private function extractPHPSESSIDFixed($response, $headers = '') {
        $fullContent = $response . "\n" . $headers;
        
        echo "<p>🔧 Extraction PHPSESSID avec correction de troncature...</p>";
        
        // Pattern 1: capture jusqu'à 64 caractères hexadécimaux
        if (preg_match('/PHPSESSID=([a-f0-9]{32,64})(?![a-f0-9])/i', $fullContent, $matches)) {
            $this->phpsessid = $matches[1];
            echo "<p>✅ Pattern 1 réussi: " . htmlspecialchars($matches[1]) . " (longueur: " . strlen($matches[1]) . ")</p>";
            return true;
        }
        
        // Pattern 2: capture tout ce qui ressemble à un hash
        if (preg_match('/PHPSESSID=([a-f0-9]+)(?=[^a-f0-9]|$)/i', $fullContent, $matches)) {
            $candidate = $matches[1];
            if (strlen($candidate) >= 26) {
                $this->phpsessid = $candidate;
                echo "<p>✅ Pattern 2 réussi: " . htmlspecialchars($candidate) . " (longueur: " . strlen($candidate) . ")</p>";
                return true;
            }
        }
        
        // Pattern 3: dans les headers Set-Cookie
        if (preg_match('/Set-Cookie:\s*PHPSESSID=([a-f0-9]+)/i', $fullContent, $matches)) {
            $this->phpsessid = $matches[1];
            echo "<p>✅ Pattern 3 (Set-Cookie) réussi: " . htmlspecialchars($matches[1]) . " (longueur: " . strlen($matches[1]) . ")</p>";
            return true;
        }
        
        // Pattern 4: capture brutale caractère par caractère
        $pos = stripos($fullContent, 'PHPSESSID=');
        if ($pos !== false) {
            $start = $pos + 10; // Longueur de "PHPSESSID="
            $sessionId = '';
            
            for ($i = $start; $i < strlen($fullContent); $i++) {
                $char = $fullContent[$i];
                if (preg_match('/[a-f0-9]/i', $char)) {
                    $sessionId .= $char;
                } else {
                    break;
                }
            }
            
            if (strlen($sessionId) >= 26) {
                $this->phpsessid = $sessionId;
                echo "<p>✅ Pattern 4 (brutal) réussi: " . htmlspecialchars($sessionId) . " (longueur: " . strlen($sessionId) . ")</p>";
                return true;
            }
        }
        
        echo "<p>❌ Aucun pattern n'a réussi à extraire le PHPSESSID complet</p>";
        return false;
    }

    /**
     * Diagnostic complet du PHPSESSID
     */
    public function diagnosePHPSESSID($response, $headers = '') {
        echo "<div style='background: #ffe6e6; padding: 15px; margin: 10px 0; border-radius: 5px;'>";
        echo "<h3>🔍 DIAGNOSTIC PHPSESSID - Problème de troncature</h3>";
        
        echo "<h4>1. Recherche brute dans la réponse:</h4>";
        $allMatches = [];
        if (preg_match_all('/PHPSESSID[=\s]*([a-f0-9]+)/i', $response . $headers, $matches, PREG_OFFSET_CAPTURE)) {
            foreach ($matches[1] as $i => $match) {
                $value = $match[0];
                $position = $match[1];
                $allMatches[] = $value;
                echo "<p>• Match $i: <code>" . htmlspecialchars($value) . "</code> (longueur: " . strlen($value) . ", position: $position)</p>";
            }
        }
        
        echo "<h4>2. Test avec différents patterns:</h4>";
        $testPatterns = [
            'basic' => '/PHPSESSID=([a-f0-9]+)/i',
            'with_semicolon' => '/PHPSESSID=([a-f0-9]+);/i',
            'with_space' => '/PHPSESSID=([a-f0-9]+)\s/i',
            'with_newline' => '/PHPSESSID=([a-f0-9]+)[\r\n]/i',
            'greedy_64' => '/PHPSESSID=([a-f0-9]{1,64})/i',
            'exact_64' => '/PHPSESSID=([a-f0-9]{64})/i',
            'non_greedy' => '/PHPSESSID=([^;\s\r\n]+)/i',
            'cookie_header' => '/Set-Cookie:\s*PHPSESSID=([^;\r\n]+)/i'
        ];
        
        foreach ($testPatterns as $name => $pattern) {
            if (preg_match($pattern, $response . $headers, $matches)) {
                echo "<p><strong>$name:</strong> <code>" . htmlspecialchars($matches[1]) . "</code> (longueur: " . strlen($matches[1]) . ")</p>";
            } else {
                echo "<p><strong>$name:</strong> Pas de correspondance</p>";
            }
        }
        
        echo "<h4>3. Contexte complet autour du PHPSESSID:</h4>";
        if (!empty($allMatches)) {
            $pos = strpos($response . $headers, "PHPSESSID");
            if ($pos !== false) {
                $contextStart = max(0, $pos - 200);
                $contextEnd = min(strlen($response . $headers), $pos + 300);
                $context = substr($response . $headers, $contextStart, $contextEnd - $contextStart);
                
                echo "<pre style='background: #f0f0f0; padding: 10px; font-size: 11px; overflow-x: auto;'>";
                echo htmlspecialchars($context);
                echo "</pre>";
            }
        }
        
        echo "<h4>4. Analyse des caractères invisibles:</h4>";
        if (!empty($allMatches)) {
            $testValue = $allMatches[0];
            echo "<p>Valeur brute: " . bin2hex($testValue) . "</p>";
            echo "<p>Caractères de contrôle: " . (ctype_print($testValue) ? "Aucun" : "Détectés") . "</p>";
            
            $pos = strpos($response . $headers, $testValue);
            if ($pos !== false && $pos + strlen($testValue) < strlen($response . $headers)) {
                $nextChar = substr($response . $headers, $pos + strlen($testValue), 1);
                echo "<p>Caractère suivant: '" . htmlspecialchars($nextChar) . "' (ASCII: " . ord($nextChar) . ")</p>";
            }
        }
        
        echo "</div>";
    }

    /**
     * Charge les cookies depuis le fichier jar
     */
    private function loadCookiesFromJar() {
        if (file_exists($this->cookieJar)) {
            $content = file_get_contents($this->cookieJar);
            $lines = explode("\n", $content);
            
            foreach ($lines as $line) {
                $line = trim($line);
                if (empty($line) || $line[0] === '#') continue;
                
                $parts = explode("\t", $line);
                if (count($parts) >= 7) {
                    $cookieName = $parts[5];
                    $cookieValue = $parts[6];
                    
                    $this->allCookies[$cookieName] = $cookieValue;
                    
                    if (strtoupper($cookieName) === 'PHPSESSID') {
                        if (!$this->phpsessid || strlen($cookieValue) > strlen($this->phpsessid)) {
                            $this->phpsessid = $cookieValue;
                            echo "<p>📁 PHPSESSID mis à jour depuis cookiejar: " . htmlspecialchars($cookieValue) . "</p>";
                        }
                    }
                }
            }
        }
    }

    /**
     * Sauvegarde le cookie dans le navigateur
     */
    private function saveCookieInBrowser() {
        if ($this->phpsessid) {
            $expiry = time() + (8 * 3600);
            
            setcookie('scodoc_phpsessid', $this->phpsessid, [
                'expires' => $expiry,
                'path' => '/',
                'domain' => '',
                'secure' => isset($_SERVER['HTTPS']),
                'httponly' => false,
                'samesite' => 'Lax'
            ]);
            
            $cookieData = json_encode([
                'phpsessid' => $this->phpsessid,
                'domain' => parse_url($this->baseUrl, PHP_URL_HOST),
                'timestamp' => time(),
                'expires' => $expiry,
                'all_cookies' => $this->allCookies
            ]);
            
            setcookie('SCODOC_SESSION_DATA', $cookieData, [
                'expires' => $expiry,
                'path' => '/',
                'secure' => isset($_SERVER['HTTPS']),
                'httponly' => false,
                'samesite' => 'Lax'
            ]);
            
            return true;
        }
        return false;
    }

    /**
     * Récupère le cookie existant
     */
    public function getExistingCookie() {
        if (isset($_COOKIE['SCODOC_SESSION_DATA'])) {
            $cookieData = json_decode($_COOKIE['SCODOC_SESSION_DATA'], true);
            if ($cookieData && isset($cookieData['phpsessid']) && $cookieData['expires'] > time()) {
                $this->phpsessid = $cookieData['phpsessid'];
                if (isset($cookieData['all_cookies'])) {
                    $this->allCookies = $cookieData['all_cookies'];
                }
                return $cookieData;
            }
        }
        return null;
    }

    /**
     * Connexion avec identifiants
     */
    public function login($username, $password, $redirect = true) {
        try {
            $existingCookie = $this->getExistingCookie();
            if ($existingCookie) {
                echo "<p>🍪 Cookie existant trouvé, validation en cours...</p>";
                
                $testResult = $this->makeAuthenticatedRequest($this->baseUrl);
                if ($testResult['http_code'] === 200 && !preg_match('/login|connexion/i', $testResult['content'])) {
                    echo "<p>✅ Cookie existant toujours valide!</p>";
                    
                    if ($redirect) {
                        $this->redirectToDashboard();
                    }
                    return true;
                } else {
                    echo "<p>⚠️ Cookie existant expiré, nouvelle connexion nécessaire...</p>";
                }
            }
            
            echo "<p>📡 Récupération de la page de connexion...</p>";
            $loginPage = $this->getLoginPage();
            
            if ($this->phpsessid) {
                echo "<p>✅ Cookie PHPSESSID initial récupéré: " . htmlspecialchars($this->phpsessid) . " (longueur: " . strlen($this->phpsessid) . ")</p>";
            }
            
            if (!empty($this->allCookies)) {
                echo "<p>📋 Cookies détectés: " . implode(', ', array_keys($this->allCookies)) . "</p>";
            }
            
            $loginUrl = $this->findLoginUrl($loginPage);
            $hiddenFields = $this->extractHiddenFields($loginPage);
            
            echo "<p>🔐 Tentative de connexion vers: " . htmlspecialchars($loginUrl) . "</p>";
            
            $postData = array_merge($hiddenFields, [
                'username' => $username,
                'password' => $password
            ]);
            
            $ch = curl_init();
            
            curl_setopt($ch, CURLOPT_URL, $loginUrl);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($postData));
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
            curl_setopt($ch, CURLOPT_COOKIEJAR, $this->cookieJar);
            curl_setopt($ch, CURLOPT_COOKIEFILE, $this->cookieJar);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_HEADER, true);
            curl_setopt($ch, CURLOPT_HEADERFUNCTION, [$this, 'headerCallbackFixed']);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $finalUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
            
            curl_close($ch);
            
            $this->extractPHPSESSIDFixed($response, $this->allHeaders);
            $this->loadCookiesFromJar();
            
            echo "<p>📊 Cookies après connexion: " . count($this->allCookies) . " trouvés</p>";
            if ($this->phpsessid) {
                echo "<p>🆔 PHPSESSID final: " . htmlspecialchars($this->phpsessid) . " (longueur: " . strlen($this->phpsessid) . ")</p>";
            }
            
            if ($this->isLoginSuccessful($response, $finalUrl)) {
                echo "<p>✅ Connexion réussie!</p>";
                echo "<p>🌐 URL finale: " . htmlspecialchars($finalUrl) . "</p>";
                
                if ($this->saveCookieInBrowser()) {
                    echo "<p>🍪 Cookie sauvegardé dans le navigateur!</p>";
                } else {
                    echo "<p>⚠️ Impossible de sauvegarder le cookie</p>";
                }
                
                if ($redirect) {
                    echo "<p>🚀 Redirection vers le dashboard...</p>";
                    $this->redirectToDashboard();
                }
                
                return true;
            } else {
                echo "<p>❌ Échec de la connexion</p>";
                echo "<p>📄 Code HTTP: $httpCode</p>";
                echo "<p>🔗 URL finale: " . htmlspecialchars($finalUrl) . "</p>";
                
                $responsePreview = substr(strip_tags($response), 0, 500);
                echo "<p>📝 Aperçu de la réponse: " . htmlspecialchars($responsePreview) . "...</p>";
                
                return false;
            }
            
        } catch (Exception $e) {
            echo "<p>❌ Erreur: " . htmlspecialchars($e->getMessage()) . "</p>";
            return false;
        }
    }

    /**
     * Redirection vers le dashboard
     */
    private function redirectToDashboard() {
        echo "<script>";
        echo "setTimeout(function() {";
        echo "  window.location.href = '" . $this->dashboardUrl . "';";
        echo "}, 2000);";
        echo "</script>";
    }

    /**
     * Trouve l'URL de connexion
     */
    private function findLoginUrl($html) {
        if (preg_match('/<form[^>]*action=["\']([^"\']+)["\'][^>]*>/i', $html, $matches)) {
            $action = $matches[1];
            if (strpos($action, 'http') !== 0) {
                return $this->baseUrl . '/' . ltrim($action, '/');
            }
            return $action;
        }
        
        return $this->baseUrl . '/login';
    }

    /**
     * Extrait les champs cachés
     */
    private function extractHiddenFields($html) {
        $fields = [];
        if (preg_match_all('/<input[^>]*type=["\']hidden["\'][^>]*>/i', $html, $matches)) {
            foreach ($matches[0] as $hiddenInput) {
                if (preg_match('/name=["\']([^"\']+)["\']/', $hiddenInput, $nameMatch) &&
                    preg_match('/value=["\']([^"\']*)["\']/', $hiddenInput, $valueMatch)) {
                    $fields[$nameMatch[1]] = $valueMatch[1];
                }
            }
        }
        echo "<p>🔍 Champs cachés trouvés: " . implode(', ', array_keys($fields)) . "</p>";
        return $fields;
    }

    /**
     * Vérifie si la connexion a réussi
     */
    private function isLoginSuccessful($response, $finalUrl) {
        $isNotLoginPage = !preg_match('/login|connexion|authentication/i', $finalUrl);
        $noErrorMessages = !preg_match('/erreur|error|échec|invalid|incorrect|failed/i', $response);
        $hasValidSession = !empty($this->phpsessid) && strlen($this->phpsessid) > 10;
        
        return $isNotLoginPage && $noErrorMessages && $hasValidSession;
    }

    /**
     * Effectue une requête authentifiée
     */
    public function makeAuthenticatedRequest($url) {
        $ch = curl_init();
        
        $cookieString = $this->getCookieString();
        
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->cookieJar);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        
        if ($cookieString) {
            curl_setopt($ch, CURLOPT_COOKIE, $cookieString);
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        curl_close($ch);
        
        return [
            'content' => $response,
            'http_code' => $httpCode
        ];
    }

    // Getters
    public function getPhpSessionId() {
        return $this->phpsessid;
    }

    public function getAllCookies() {
        return $this->allCookies;
    }

    public function getCookieString() {
        $cookieStrings = [];
        foreach ($this->allCookies as $name => $value) {
            $cookieStrings[] = $name . '=' . $value;
        }
        return implode('; ', $cookieStrings);
    }

    public function getCookies() {
        if (file_exists($this->cookieJar)) {
            return file_get_contents($this->cookieJar);
        }
        return null;
    }

    public function getDashboardUrl() {
        return $this->dashboardUrl;
    }

    /**
     * Supprime les cookies sauvegardés
     */
    public function clearSavedCookies() {
        setcookie('scodoc_phpsessid', '', time() - 3600, '/');
        setcookie('SCODOC_SESSION_DATA', '', time() - 3600, '/');
        $this->phpsessid = null;
        $this->allCookies = [];
    }

    /**
     * Nettoyage
     */
    public function __destruct() {
        if (file_exists($this->cookieJar)) {
            unlink($this->cookieJar);
        }
    }
}

// Interface Web
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎓 Connexion ScoDoc IUT Blagnac</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #2c3e50;
            text-align: center;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"], input[type="password"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
        }
        button {
            background-color: #3498db;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            width: 100%;
            font-size: 16px;
            margin-bottom: 10px;
        }
        button:hover {
            background-color: #2980b9;
        }
        .button-secondary {
            background-color: #95a5a6;
        }
        .button-secondary:hover {
            background-color: #7f8c8d;
        }
        .result {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #007bff;
            border-radius: 0 5px 5px 0;
        }
        .cookie-box {
            background: #e8f5e8;
            border: 1px solid #d4edda;
            padding: 15px;
            border-radius: 5px;
            margin-top: 10px;
            word-break: break-all;
            font-family: monospace;
            font-size: 12px;
        }
        .cookie-info {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        .redirect-info {
            background: #d1ecf1;
            border: 1px solid #bee5eb;
            padding: 15px;
            border-radius: 5px;
            margin: 10px 0;
            text-align: center;
        }
        .javascript-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 12px;
            margin-top: 10px;
        }
        .no-redirect-option {
            margin-top: 10px;
        }
        .checkbox-group {
            margin: 15px 0;
        }
        .checkbox-group input[type="checkbox"] {
            width: auto;
            margin-right: 10px;
        }
        .debug-info {
            background: #f1f3f4;
            border: 1px solid #dadce0;
            padding: 10px;
            border-radius: 5px;
            margin: 10px 0;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>ScoDoc IUT Blagnac - Connexion</h1>
        <p style="text-align: center; color: #666; font-size: 14px;">Version corrigée - Récupération complète du cookie PHPSESSID</p>
        
        <?php
        // Vérifier s'il y a un cookie existant
        $connector = new ScoDocConnector();
        $existingCookie = $connector->getExistingCookie();
        
        if ($existingCookie && !isset($_POST['clear_cookies'])):
        ?>
        <div class="cookie-info">
            <h3>Session existante détectée</h3>
            <p><strong>PHPSESSID:</strong> <?php echo htmlspecialchars($existingCookie['phpsessid']); ?></p>
            <p><strong>Longueur:</strong> <?php echo strlen($existingCookie['phpsessid']); ?> caractères</p>
            <p><strong>Expire le:</strong> <?php echo date('d/m/Y H:i:s', $existingCookie['expires']); ?></p>
            <?php if (isset($existingCookie['all_cookies'])): ?>
            <p><strong>Autres cookies:</strong> <?php echo implode(', ', array_keys($existingCookie['all_cookies'])); ?></p>
            <?php endif; ?>
            <form method="POST" style="display: inline;">
                <button type="submit" name="use_existing" value="1">Utiliser cette session</button>
                <input type="hidden" name="redirect" value="<?php echo isset($_POST['no_redirect']) ? '0' : '1'; ?>">
            </form>
            <form method="POST" style="display: inline;">
                <button type="submit" name="clear_cookies" value="1" class="button-secondary">Nouvelle connexion</button>
            </form>
        </div>
        <?php endif; ?>
        
        <?php if (!isset($_POST['username']) && !isset($_POST['use_existing']) && !isset($_POST['clear_cookies']) && !isset($_POST['test_sessions']) && !isset($_POST['use_browser_session'])): ?>
        <div class="redirect-info">
            <p>Après connexion réussie, vous serez automatiquement redirigé vers :<br>
            <strong>https://iam-mickael.me/dashboard</strong></p>
        </div>
        
        <!-- Formulaire de connexion standard -->
        <form method="POST">
            <div class="form-group">
                <label for="username">Nom d'utilisateur:</label>
                <input type="text" id="username" name="username" required>
            </div>
            
            <div class="form-group">
                <label for="password">Mot de passe:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <div class="checkbox-group">
                <label>
                    <input type="checkbox" name="no_redirect" value="1"> 
                    Rester sur cette page (ne pas rediriger)
                </label>
            </div>
            
            <button type="submit">Se connecter</button>
        </form>

        <!-- Section de test des sessions -->
        <hr style="margin: 30px 0;">
        <h3>Test des sessions multiples</h3>
        <p style="text-align: center; color: #666; font-size: 14px;">
            <strong>Session navigateur:</strong> 11226...2a7 (64 chars)<br>
            <strong>Session script:</strong> 9ok4b...k119 (26 chars)
        </p>
        
        <form method="POST">
            <button type="submit" name="test_sessions" value="1" class="button-secondary">Comparer les deux sessions</button>
        </form>
        
        <form method="POST" style="margin-top: 10px;">
            <button type="submit" name="use_browser_session" value="1" style="background: #28a745;">Utiliser la session du navigateur</button>
        </form>
        
        <?php else: ?>
        <div class="result">
            <?php
            if (isset($_POST['clear_cookies'])) {
                $connector->clearSavedCookies();
                echo "<p>Cookies supprimés. <a href='" . $_SERVER['PHP_SELF'] . "'>Nouvelle connexion</a></p>";
                exit;
            }
            
            if (isset($_POST['test_sessions'])) {
                $browserSession = '11226283347bc8f28c41431b8551653ad2a8ec7d64804ece0652327c068902a7';
                $scriptSession = '9ok4bhpvsjs7bb31e0hmg0k119';
                $connector->compareSessions($browserSession, $scriptSession);
                
            } elseif (isset($_POST['use_browser_session'])) {
                $browserSession = '11226283347bc8f28c41431b8551653ad2a8ec7d64804ece0652327c068902a7';
                
                if ($connector->useExistingPHPSESSID($browserSession)) {
                    echo "<h3>Session du navigateur utilisée avec succès !</h3>";
                    echo "<p>Redirection vers le dashboard...</p>";
                    echo "<script>setTimeout(() => window.location.href = 'https://iam-mickael.me/dashboard', 2000);</script>";
                } else {
                    echo "<h3>Session du navigateur expirée</h3>";
                    echo "<p><a href='" . $_SERVER['PHP_SELF'] . "'>Créer une nouvelle session</a></p>";
                }
                
            } elseif (isset($_POST['use_existing'])) {
                echo "<h3>Utilisation de la session existante</h3>";
                echo "<div class='cookie-box'>";
                echo "<strong>PHPSESSID:</strong> " . htmlspecialchars($existingCookie['phpsessid']) . "<br>";
                echo "<strong>Longueur:</strong> " . strlen($existingCookie['phpsessid']) . " caractères";
                echo "</div>";
                
                echo "<p>Test de la session existante...</p>";
                $result = $connector->makeAuthenticatedRequest('https://scodocetudiant.iut-blagnac.fr/');
                
                if ($result['http_code'] === 200) {
                    echo "<p>Session existante valide!</p>";
                    echo "<p>Taille de la réponse: " . strlen($result['content']) . " bytes</p>";
                    
                    $shouldRedirect = !isset($_POST['no_redirect']) || $_POST['no_redirect'] !== '1';
                    if ($shouldRedirect) {
                        echo "<div class='redirect-info'>";
                        echo "<p>Redirection vers le dashboard dans 3 secondes...</p>";
                        echo "</div>";
                        echo "<script>setTimeout(function() { window.location.href = 'https://iam-mickael.me/dashboard'; }, 3000);</script>";
                    }
                } else {
                    echo "<p>Session expirée: HTTP " . $result['http_code'] . "</p>";
                }
                
            } else {
                // Nouvelle connexion
                $username = $_POST['username'] ?? '';
                $password = $_POST['password'] ?? '';
                
                if (!empty($username) && !empty($password)) {
                    $shouldRedirect = !isset($_POST['no_redirect']) || $_POST['no_redirect'] !== '1';
                    
                    if ($connector->login($username, $password, $shouldRedirect)) {
                        echo "<h3>Informations de session:</h3>";
                        echo "<div class='cookie-box'>";
                        echo "<strong>PHPSESSID:</strong> " . htmlspecialchars($connector->getPhpSessionId()) . "<br>";
                        echo "<strong>Longueur:</strong> " . strlen($connector->getPhpSessionId()) . " caractères<br>";
                        echo "<strong>Tous les cookies:</strong> " . htmlspecialchars($connector->getCookieString()) . "<br>";
                        echo "</div>";
                        
                        $allCookies = $connector->getAllCookies();
                        if (!empty($allCookies)) {
                            echo "<div class='debug-info'>";
                            echo "<strong>Détail des cookies récupérés:</strong><br>";
                            foreach ($allCookies as $name => $value) {
                                echo "- " . htmlspecialchars($name) . " = " . htmlspecialchars($value) . " (longueur: " . strlen($value) . ")<br>";
                            }
                            echo "</div>";
                        }
                        
                        echo "<p>Test d'une requête authentifiée...</p>";
                        $result = $connector->makeAuthenticatedRequest('https://scodocetudiant.iut-blagnac.fr/');
                        
                        if ($result['http_code'] === 200) {
                            echo "<p>Requête authentifiée réussie!</p>";
                            echo "<p>Taille de la réponse: " . strlen($result['content']) . " bytes</p>";
                            
                            if (preg_match('/tableau|dashboard|accueil|étudiant/i', $result['content'])) {
                                echo "<p>Contenu authentifié détecté dans la réponse!</p>";
                            }
                        } else {
                            echo "<p>Erreur lors de la requête authentifiée: HTTP " . $result['http_code'] . "</p>";
                        }
                        
                    } else {
                        echo "<p>Échec de la connexion. Vérifiez vos identifiants.</p>";
                        
                        echo "<div class='debug-info'>";
                        echo "<strong>Informations de debug:</strong><br>";
                        echo "PHPSESSID récupéré: " . ($connector->getPhpSessionId() ? htmlspecialchars($connector->getPhpSessionId()) : 'Aucun') . "<br>";
                        echo "Nombre de cookies: " . count($connector->getAllCookies()) . "<br>";
                        if (!empty($connector->getAllCookies())) {
                            echo "Cookies trouvés: " . implode(', ', array_keys($connector->getAllCookies())) . "<br>";
                        }
                        echo "</div>";
                    }
                } else {
                    echo "<p>Identifiants requis!</p>";
                }
            }
            
            // Afficher les informations JavaScript si on a un PHPSESSID
            if ($connector->getPhpSessionId() && (!isset($_POST['redirect']) || $_POST['redirect'] !== '1')) {
                echo "<h3>Utilisation JavaScript:</h3>";
                echo "<div class='javascript-box'>";
                echo "// Cookie PHPSESSID complet:<br>";
                echo "const phpsessid = '" . htmlspecialchars($connector->getPhpSessionId()) . "';<br><br>";
                echo "// Utilisation dans une requête fetch:<br>";
                echo "fetch('https://scodocetudiant.iut-blagnac.fr', {<br>";
                echo "&nbsp;&nbsp;credentials: 'include',<br>";
                echo "&nbsp;&nbsp;headers: {<br>";
                echo "&nbsp;&nbsp;&nbsp;&nbsp;'Cookie': 'PHPSESSID=' + phpsessid<br>";
                echo "&nbsp;&nbsp;}<br>";
                echo "});<br><br>";
                echo "// Tous les cookies disponibles:<br>";
                echo "const allCookies = '" . htmlspecialchars($connector->getCookieString()) . "';";
                echo "</div>";
                
                echo "<div class='cookie-box'>";
                echo "<strong>Statistiques du cookie:</strong><br>";
                echo "Longueur PHPSESSID: " . strlen($connector->getPhpSessionId()) . " caractères<br>";
                echo "Nombre total de cookies: " . count($connector->getAllCookies()) . "<br>";
                echo "Cookie string complet: " . strlen($connector->getCookieString()) . " caractères<br>";
                echo "</div>";
                
                echo "<p><strong>Le cookie a été sauvegardé et sera réutilisé automatiquement lors de vos prochaines visites!</strong></p>";
            }
            ?>
        </div>
        
        <?php 
        $shouldRedirect = !isset($_POST['no_redirect']) || $_POST['no_redirect'] !== '1';
        if (!$shouldRedirect || (isset($_POST['use_existing']) && isset($result) && $result['http_code'] !== 200)): 
        ?>
        <div style="margin-top: 20px; text-align: center;">
            <a href="<?php echo $_SERVER['PHP_SELF']; ?>" style="color: #3498db; text-decoration: none;">← Retour</a>
            <?php if ($connector->getPhpSessionId()): ?>
            <span style="margin: 0 10px;">|</span>
            <a href="<?php echo $connector->getDashboardUrl(); ?>" target="_blank" style="color: #28a745; text-decoration: none;">Ouvrir le dashboard</a>
            <?php endif; ?>
        </div>
        <?php endif; ?>
        <?php endif; ?>
    </div>
    
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const cookies = document.cookie.split(';');
        let scodocCookies = 0;
        
        cookies.forEach(function(cookie) {
            if (cookie.trim().startsWith('scodoc_') || cookie.trim().startsWith('SCODOC_')) {
                scodocCookies++;
            }
        });
        
        if (scodocCookies > 0) {
            console.log('🍪 ' + scodocCookies + ' cookie(s) ScoDoc détecté(s) dans le navigateur');
        }
    });
    
    function getCookie(name) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
    }
    
    const savedPhpSessId = getCookie('scodoc_phpsessid');
    if (savedPhpSessId) {
        console.log('🔑 PHPSESSID sauvé:', savedPhpSessId);
    }
    </script>
</body>
</html>
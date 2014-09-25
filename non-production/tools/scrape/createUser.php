<!--
<script src="../../freebeer/js/vendor/xbbcode.js"></script>
<script src="../../freebeer/js/vendor/qrcode.js"></script>

<script src="../../freebeer/js/vendor/timeSince.js"></script>

<script src="../../freebeer/js/vendor/bitcoinjs-min.js"></script>
<script src="../../freebeer/js/vendor/peer.js"></script>

<script src="../../freebeer/js/vendor/react.js"></script>

<script src="../../freebeer/js/freeBeer/site-everybit/config.js"></script>


<script src="../../freebeer/js/core/PB.js"></script>
<script src="../../freebeer/js/core/PB.Net.js"></script>
<script src="../../freebeer/js/modules/PB.M.Forum.js"></script>
<script src="../../freebeer/js/modules/PB.M.Wardrobe.js"></script>
<script src="../../freebeer/js/freeBeer/display.js"></script>
<script src="../../freebeer/js/freeBeer/menu.js"></script>
<script src="../../freebeer/js/freeBeer/puffbox.js"></script>
<script src="../../freebeer/js/freeBeer/reply.js"></script>
<script src="../../freebeer/js/freeBeer/tools.js"></script>
<script src="../../freebeer/js/freeBeer/main.js"></script>

<script src="createUser.js"></script>
-->
<?php
    ini_set('error_reporting', E_ALL);

    require 'config.php';
    require 'ez_sql.php';
    set_time_limit(120);
    
    //  for each row in the users table (except username=anon.usenet)
    // get parent and its privateAdminKey
    // call Scrape.userCreate with parameters
    
    function findParent($username){
        return substr($username, 0, strrpos($username, '.'));
    }

    /**
     * Check if a username exists in DHT
     */
    function checkNameExists($username) {
        set_time_limit(5);
        $url = 'http://162.219.162.56/c/users/api.php?type=getUser&username=' . $username;

        $result = file_get_contents($url);


        if(substr($result,0,7) == '{"FAIL"') {
            return false;
        }
        return true;
    }

    function checkUsersExist($usernames) {
        $existing = array();
        foreach($usernames as $username) {

            if(checkNameExists($username)) {
                echo $username . ' user exists';
                echo '<br>';
                array_push($existing, $username);
            } else {
                //echo $username. ' no user';
                //echo '<br>';
            }
            ob_flush();
        }
        return $existing;
    }
    function deleteUsers($usernames) {
        foreach($usernames as $username) {

            if(checkNameExists($username)) {
                echo $username . ' user exists';
                echo '<br>';
                $result = file_get_contents("" . $username);
                echo $username . " deleted<br>";
                ob_flush();
            } else {
                //echo $username. ' no user';
                //echo '<br>';
                echo '.';
                ob_flush();
            }
        }
    }

    /*
    // delete all the existing users 
    $sqlToRun = "SELECT username FROM users WHERE NOT username='anon.usenet'";
    $users = $db->get_col($sqlToRun);
    // $db->debug();
    deleteUsers($users);

    exit();
    */
    $counter = 0; // for testing
    $list = array();
    echo '<div id="userCreateResult"></div>'; // for display result of user creation
    $users = $db->get_results("SELECT * FROM users WHERE NOT username='anon.usenet'");
    foreach ($users as $user) {
        if ($counter > 40) continue;
        $counter += 1;
        // get parameters
        $username = $user->username;
        $ak = $user->privateAdminKey;
        $dk = $user->privateDefaultKey;
        $rk = $user->privateRootKey;
        
        $parent = findParent($username);
        $signingKey = $db->get_var("SELECT privateAdminKey FROM users WHERE username='$parent' LIMIT 1");
        
        // build array of parameter array
        $param = array($parent, $signingKey, $username, $rk, $ak, $dk);
        $param_js = '["' . implode('","', $param) . '"]';
        array_push($list, $param_js);
        //$param = '"' . implode('","', array($parent, $signingKey, $username, $rk, $ak, $dk)) . '"';
        //$script_to_run = 'Scrape.userCreate(' . $param . ');';
        //echo $script_to_run . '<br>';
        //ob_flush();
        //echo "<script>" . $script_to_run . "</script>";
        //ob_flush();
        
    }
    $script_for_list = 'Scrape.LIST = [' . implode(',', $list) . '];';
    // echo $script_for_list . "<br>";
    echo "<script>" . $script_for_list . "</script>";
    echo "<script>Scrape.rec();</script>";
    
    /*
    $counter  = 0;
    foreach ($posts as $username) {
        if ($counter > 10) continue;
        $counter += 1;
        $username = preg_split('/\./', $username);
        $user = '';
        foreach ($username as $u) {
            $parent = $user;
            if ($user != '') $user = $user . '.';
            $user = $user . $u;
            if (($user != 'anon') && (!$user != 'anon.usenet')) {
                // select three keys
                $key = $db->get_row("SELECT * FROM `keys` ORDER BY RAND() LIMIT 1");
                $ak = $key->privateAdminKey;
                $dk = $key->privateDefaultKey;
                $rk = $key->privateRootKey;
                // add username and keys to users table
                $exist = $db->get_results("SELECT * FROM users WHERE username = '$user'");
                if (!count($exist)) {
                    $sql_for_add = "INSERT INTO users
                            SET username = '$user',
                                privateAdminKey = '$ak',
                                privateDefaultKey = '$dk',
                                privateRootKey = '$rk'";
                    echo $sql_for_add . '<br>';
                    //$db->query($sql_for_add);
                }
                continue;
                // create user
                $exist = $db->get_row("SELECT * FROM users WHERE username = $user");
                $ak = $exist->privateAdminKey;
                $dk = $exist->privateDefaultKey;
                $rk = $exist->privateRootKey;
                
                $parentAdmin = $db->get_var("SELECT privateAdminKey FROM users WHERE username='$parent' LIMIT 1");
                $param = '"' . implode('","', 
                                 array($parent, $parentAdmin,
                                       $user, $rk, $ak, $dk)) . '"';
                $script_to_run = '<script>Scrape.userCreate(' . $param . ');</script>';
                echo '<div id="userCreateResult"></div>';
                ob_flush();
                echo $script_to_run;
                ob_flush();
                
            }
        }
    }
    */
    
    
    /*
    $users = $db->get_results("SELECT * FROM users WHERE NOT username='anon.usenet'");
    foreach ($users as $user) {
        $u = $user->username;
        $prev_u = $user->username;
        $rk = $user->privateRootKey;
        $ak = $user->privateAdminKey;
        $dk = $user->privateDefaultKey;
            
        // create user
        $parentUser = substr($u, 0, strrpos($u, '.'));
        $parentAdmin = $db->get_var("SELECT privateAdminKey FROM users WHERE username='$parentUser' LIMIT 1");
        $param = '"' . implode('","', 
                         array($parentUser, $parentAdmin,
                               $u, $rk, $ak, $dk)) . '"';
        $script_to_run = '<script>Scrape.userCreate(' . $param . ');</script>';
        echo '<div id="userCreateResult"></div>';
        ob_flush();
        echo $script_to_run;
        ob_flush();
    }
    */
    
?>
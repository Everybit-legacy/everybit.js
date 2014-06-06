<?php
    // get all username
    require 'config.php';
    include 'ez_sql.php';
    set_time_limit(240);
    $username = $db->get_col("SELECT username FROM users");
    $count = 0;
    foreach ($username as $u) {
        //if ($count > 8) continue;
        if ($u != 'anon.usenet'){
            $count += 1;
            $result = file_get_contents("http://162.219.162.56/c/users/api.php?type=deleteUser&username=" . $u);
            //echo $u . ' ' . $result . '<br>';
            if ($result == 'CANT FIND') {
                $db->query("DELETE FROM users WHERE username='$u'");
            } else {
                echo $u . ' ' . $result . '<br>';
                ob_flush();
                $db->query("DELETE FROM users WHERE username='$u'");
            }
            ob_flush();
        }
    }
?>
<?php
    require 'config.php';
    include 'ez_sql.php';
    set_time_limit(300);
   
    function emailToUsername($email) {
        $email = strtolower($email);
        $username = array_reverse(preg_split('/[@.]/', $email));
        $username = 'anon.usenet.' . implode('.', $username);
        $username = implode('', preg_split('/[^\.A-Za-z0-9]/', $username));
        return $username;
    }
    
    // loop through files and insert in to posts database
    /*
    for ($i=127; $i<128; $i++) {
        // look for the \b...\sci directories
        $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator('C:\wamp\www\puffballUsenet\b'. $i . '\sci'), RecursiveIteratorIterator::SELF_FIRST );

        $counter = 0; // for testing
        
        foreach ( $iterator as $path ) {
            if ($counter > 3) break;
            // $counter += 1;
            if (!$path->isDir()) {
                $file = $path->__toString();
                if ((!preg_match('/\.TARDIRPERMS/', $file))) { //
                    // && (preg_match('/b\d{3}/', $file) || preg_match('/news\d{3}f./', $file))
                    $entire_file = file_get_contents($file, "r");
                    
                    // From: henry@utzoo.UUCP (Henry Spencer)
                    // From: techwood!johnw@gatech.edu (John Wheeler)
                    $email = NULL;
                    if (preg_match('/\sFrom: ([^@\s]*@[^\(\s]*)/', $entire_file, $matches)) $email = $matches[1];
                    if (!$email) continue; // skip if cannot find email
                    $username = emailToUsername($email);
                    
                    //Article-I.D.: ucb.1354
                    $id = '';
                    if (preg_match('/\s(?:Article-I\.D\.|Message-ID): (.*)/', $entire_file, $matches)) $id = $matches[1];
                    
                    // Newsgroups: fa.arms-d
                    preg_match('/\sNewsgroups: (.*)/', $entire_file, $matches);
                    $groupname = '';
                    if ($matches && count($matches)>1) $groupname = $matches[1];
                    
                    // Title: string-handling routines 
                    // Subject: DH testing successful
                    preg_match('/\s(?:Title|Subject): (.*)/', $entire_file, $matches);
                    $subject = '';
                    if ($matches && count($matches)>1) $subject = $matches[1];
                    $subject = mysql_real_escape_string($subject);
                    
                    // Posted: Wed Dec  7 19:21:58 1983
                    // Date: 16 Jun 89 00:29:29 GMT
                    // Date: Sat, 24 Jun 89 23:00:56 GMT
                    // Date: Fri, 16-Jun-89 11:32:08 EDT
                    // <1989Jun16.103052.25303@jarvis.csri.toronto.edu>
                    $date = NULL;
                    $date_format = "Y-m-d H:i:s";
                    // need convert to: 2010-02-06 19:30:13
                    if (preg_match('/\sPosted: ([A-Za-z]{3})\s+([A-Za-z]{3})\s+(\d+)\s(\d{2}:\d{2}:\d{2})\s+(\d{4})/', $entire_file, $matches)) {
                        //echo $matches . '<br>';
                        $date = $matches[2] . ' ' . $matches[3] . ' ' . $matches[4] . ' ' . $matches[5];
                        $date = date_create_from_format('M j H:i:s Y', $date);
                        $date = $date->format($date_format);
                    } else if (preg_match('/\sDate: [^\d]*(\d\d?)[-\s]([a-zA-Z]{3})[-\s](\d{2})\s(\d{2}:\d{2}:\d{2})/', $entire_file, $matches)) {
                        $date = $matches[1] . ' ' . $matches[2] . ' ' . $matches[3] . ' ' . $matches[4];
                        $date = date_create_from_format('j M y H:i:s', $date);
                        $date = $date->format($date_format);
                    } else if (preg_match('/^\<(\d{4}[A-Za-z]{3}\d{2})./',$id,$matches)) {
                        $date = $matches[1];
                        $date = date_create_from_format('YMd', $date)->format($date_format);
                    }
                    
                    
                    // References: eiss.334
                    preg_match('/\sReferences: (.*)/', $entire_file, $matches);
                    $parent = '';
                    if ($matches && count($matches)>1) $parent = $matches[1];
                    $parent = mysql_real_escape_string($parent);
                    
                    // content
                    // Lines: 2 ...
                    // Keywords: resume ...
                    $content = $entire_file;
                    if (preg_match('/\nSummary: .+\n[^:\s\(]+: [^\n]+\s+(.+)/s', $entire_file, $matches))
                        $content = $matches[1];
                    while (preg_match('/^[^:\s\(]+: [^\n]+\s+(.+)/s', $content, $matches)) {
                        $content = $matches[1];
                    }
                    $content = mysql_real_escape_string($content);
                    
                    // add to database
                    $exist = $db->get_row("SELECT id FROM posts
                                           WHERE ID='$id'");
                    if (!$exist && $date) {
                        $sql_to_run = "INSERT INTO posts
                                SET id = '$id',
                                    parent = '$parent',
                                    content = '$content',
                                    date = '$date',
                                    email = '$email',
                                    username = '$username',
                                    subject = '$subject',
                                    groupname = '$groupname'";
                        $result = $db->query($sql_to_run);
                        if ($result) {
                            echo $file . $date . '<br>';
                            ob_flush();
                            $counter += 1;
                        } else {
                            $db->show_errors();
                            echo '<pre>' . $sql_to_run . '</pre>';
                            ob_flush();
                        }
                    }
                }
            }
        }
    }
    */
    
?>

<?php
    // get all username
    // get three keys from `keys` database
    // updadte users table
    
    // use $counter for testing
    
    $rows = $db->get_results("SELECT DISTINCT username FROM posts");
    // $counter = 0;
    foreach ( $rows as $row ) {
        $username = $row->username;
        $username = preg_split('/\./', $username);
        $user = 'anon.usenet';
        //if ($counter > 200) continue;
        foreach ($username as $u) {
            if ($user == 'anon.usenet' && ($u == 'anon' || $u == 'usenet')) continue;
            //$counter += 1;
            $user = $user . '.' . $u;
            $exist = $db->get_row("SELECT username FROM users WHERE username='$user'");
            if (!$exist) {
                $keys = $db->get_row("SELECT * FROM `keys` ORDER BY RAND() LIMIT 1");
                $ak = $keys->privateAdminKey;
                $dk = $keys->privateDefaultKey;
                $rk = $keys->privateRootKey;
                
                $sql_to_run = "INSERT INTO users
                                SET username = '$user',
                                    privateAdminKey = '$ak',
                                    privateRootKey = '$rk',
                                    privateDefaultKey = '$dk'";
                $result = $db->query($sql_to_run);
                if (!$result) {
                    echo 'unsuccessfull ' . $user . '<pre>' . $sql_to_run . '</pre>';
                    ob_flush();
                } else {
                    echo $user . '<br>';
                    ob_flush();
                };
            }
        }
    }
    
?>
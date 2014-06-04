<?php
    require 'config.php';
    include 'ez_sql.php';
    set_time_limit(60);
    
    // loop through files 
    
    $iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator('C:\wamp\www\puffballUsenet'), RecursiveIteratorIterator::SELF_FIRST );

    $counter = 0;
    
    foreach ( $iterator as $path ) {
        if ($counter > 30) break;
        // $counter += 1;
        if (!$path->isDir()) {
            $file = $path->__toString();
            if ((!preg_match('/\.TARDIRPERMS/', $file)) && (preg_match('/b\d{3}/', $file) || preg_match('/news\d{3}f./', $file))) {
                $entire_file = file_get_contents($file, "r");
                
                // From: henry@utzoo.UUCP (Henry Spencer)
                // From: techwood!johnw@gatech.edu (John Wheeler)
                $email = NULL;
                if (preg_match('/\sFrom: ([^@\s]*@[^\(\s]*)/', $entire_file, $matches)) $email = $matches[1];
                if (!$email) continue; // skip if cannot find email
                
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
    
    
    
    
    // ===
    
    // Select multiple records from the database and print them out..
    $db->get_results("SELECT id, parent, date, email, subject, groupname FROM posts");
    $db->debug();
    /*
    foreach ( $users as $user )
    {
                // Access data using object syntax
                echo $user->id;
                echo $user->content;
                echo $user->email;
                echo $user->date;
    }
    */
    
    
?>
<?php
    //  get all username
    $rows = $db->get_results("SELECT DISTINCT email FROM posts");
    foreach ( $rows as $row ) {
        $email = strtolower($row->email);
        $username = array_reverse(preg_split('/[@.]/', $email));
        $user = 'anon.usenet';
        foreach ($username as $u) {
            $user = $user . '.' . $u;
            $exist = $db->get_row("SELECT username FROM users WHERE username='$user'");
            if (!$exist) {
                $sql_to_run = "INSERT INTO users
                                SET username = '$user',
                                    privateAdminKey = '',
                                    privateRootKey = '',
                                    privateDefaultKey = '',
                                    publicAdminKey = '',
                                    publicRootKey = '',
                                    publicDefaultKey = ''";
                $result = $db->query($sql_to_run);
                // if (!$result) echo 'unsuccessfull ' . $user . '<pre>' . $sql_to_run . '</pre>';
            }
        }
    }
?>
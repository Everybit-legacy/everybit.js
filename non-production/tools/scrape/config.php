<?php

// Start timer
$mtime = microtime();
$mtime = explode(" ",$mtime);
$CONFIG['core']['start_time'] = $mtime[1] + $mtime[0];

define('CONFIG_INCLUDED', true);

define('DEBUG_MODE', true); // If this is set to true then all reports will be added to the end of request
ignore_user_abort(1); // In general it is good to run scrips to the end even if the user hits stop

// Physical Path
// Physical path to your main Fusker!ne directory WITHOUT trailing slash.
// ( On windows use simple forward slashes & be sure to include the drive letter. c:/myfolder )
define('PATH', '/home/lyca/public_html/siteCheck');

// Main path for storing cached content.
// It is HIGHLY recommended that you set a pick a directory
// which cannot be accessed directly from the web
// or use .htaccess to prevent direct web access to this directory
// This directory will need to be writable by the web server
define('CACHE', 'F:/htdocs/siteChecker2/cache');

// For caching
$CONFIG['core']['db_cache']['directory'] = CACHE . '/dbcache';
$CONFIG['core']['db_cache']['expiration_time'] = 24; // time in hours to keep database cache

// If you choose to write to the logfile
// Must be a writtable file, best to put it outside of main web directory
$CONFIG['core']['track']['logfile'] = CACHE . '/log.xml';

// Virtual Path (URL) to this same directory WITHOUT trailing slash
define('URL', 'http://localhost/siteChecker2');

// Write the tracked variables to db and/or logfile
$CONFIG['core']['track']['write_database'] = false;
$CONFIG['core']['track']['write_logfile'] = true;

// Keep track of the processing time for preparing the output
$CONFIG['core']['track']['execution_time'] = true;

// Track the number of database queries needed to execute this request
$CONFIG['core']['track']['database_queries'] = true;

// Database vars
//Choose the type of database to be used.
$CONFIG['core']['db_type'] = 'mysql';

// Table Prefix
// This prefix will be added to all new tables created to avoid name conflict in the database.
// If you are unsure, just use the default.
$CONFIG['core']['db_prefix'] = '';

// Database Hostname
// Hostname of the database server. ( If you are unsure, 'localhost' works in most cases. )
$CONFIG['core']['db_host'] = 'localhost';

// Database Username
// Your database user account on the host. ( Often root when installed on your local machine. )
$CONFIG['core']['db_uname'] = 'usenet';

// Database Password
// Password for your database user account.
$CONFIG['core']['db_pass'] = 'usenetPass';

// Database Name
// The name of database on the host. The installer will attempt to create the database if not exist.
$CONFIG['core']['db_name'] = 'usenet';

// Set some env variable shortcuts for this request
define('NOW', date("Y-m-d H:i:s"));
define('IP', $_SERVER['REMOTE_ADDR']);
define('RAND', rand());

define('SELF', $_SERVER["PHP_SELF"]);
define('HOST', $_SERVER["HTTP_HOST"]);

// For serious errors, unexpected events
$REPORTS['errors'] = array();

// For general problems with user input
$REPORTS['warnings'] = array();

// For messages about procedural paths
$REPORTS['logic'] = array();

// Output could be shown to user
$OUTPUT['errors'] = array();





?><?php
?>
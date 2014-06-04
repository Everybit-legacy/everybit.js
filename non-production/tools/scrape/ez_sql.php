<?php

	// ==================================================================
	//  Author: Justin Vincent (justin@visunet.ie)
	//	Web: 	http://www.justinvincent.com
	//	Name: 	ezSQL
	// 	Desc: 	Class to make it very easy to deal with mySQL database connections.


/*
Integrate these two in
// Table Prefix
// This prefix will be added to all new tables created to avoid name conflict in the database. If you are unsure, just use the default 'prefix'.
$CONFIG['core']['db_prefix'] = 'prefix';



// Use persistent connection? (Yes=1 No=0)
// Default is 'No'. Choose 'No' if you are unsure.
$CONFIG['core']['db_pconnect'] = 0;
*/

	// ==================================================================
// User Settings -- CHANGE HERE

define("EZSQL_DB_USER", $CONFIG['core']['db_uname']);			// <-- mysql db user
define("EZSQL_DB_PASSWORD", $CONFIG['core']['db_pass']);		// <-- mysql db password
define("EZSQL_DB_NAME", $CONFIG['core']['db_name']);		// <-- mysql db pname
define("EZSQL_DB_HOST", $CONFIG['core']['db_host']);	// <-- mysql server host

	//	ezSQL Constants
	define("EZSQL_VERSION","1.26");
	define("OBJECT","OBJECT",true);
	define("ARRAY_A","ARRAY_A",true);
	define("ARRAY_N","ARRAY_N",true);

	// ==================================================================
	//	The Main Class

	class db {

		var $trace = false;      // same as $debug_all
		var $debug_all = false;  // same as $trace
		var $show_errors = true;
		var $num_queries = 0;
		var $last_query;
		var $col_info;
		var $debug_called;
		var $vardump_called;

		// ==================================================================
		//	DB Constructor - connects to the server and selects a database

		function db($dbuser, $dbpassword, $dbname, $dbhost)
		{

			$this->dbh = @mysql_connect($dbhost,$dbuser,$dbpassword);

			if ( ! $this->dbh )
			{
				$this->print_error("Error establishing a database connection! Are you sure you have the correct user/password? Are you sure that you have typed the correct hostname? Are you sure that the database server is running?");
			}


			$this->select($dbname);

		}

		// ==================================================================
		//	Select a DB (if another one needs to be selected)

		function select($db)
		{
			if ( !@mysql_select_db($db,$this->dbh))
			{
				$this->print_error("Error selecting database $db! Are you sure it exists? Are you sure there is a valid database connection?");
			}
		}

		// ====================================================================
		//	Format a string correctly for safe insert under all PHP conditions

		function escape($str)
		{
			return mysql_escape_string(stripslashes($str));
		}

		// ==================================================================
		//	Print SQL/DB error.

		function print_error($str = "")
		{

			// All erros go to the global error array
			global $CONFIG, $REPORTS;

			// If no special error string then use mysql default..
			if ( !$str )
			{
				$str = mysql_error($this->dbh);
				$error_no = mysql_errno($this->dbh);
			}

			/*
			// Log this error to the global array..
			$EZSQL_ERROR[] = array
							(
								"query"      => $this->last_query,
								"error_str"  => $str,
								"error_no"   => $error_no
							);
			*/

			// Is error output turned on or not..
			if ( $this->show_errors )
			{
				// If there is an error then take note of it
				$REPORTS['errors'][] =  '
				SQL/DB Error number ' . $error_no . ':
				' . $str . ' ' .
				$this->last_query . '
				';
			}
			else
			{
				return false;
			}
		}

		// ==================================================================
		//	Turn error handling on or off..

		function show_errors()
		{
			$this->show_errors = true;
		}

		function hide_errors()
		{
			$this->show_errors = false;
		}

		// ==================================================================
		//	Kill cached query results

		function flush()
		{

			// Get rid of these
			$this->last_result = null;
			$this->col_info = null;
			$this->last_query = null;

		}

		// ==================================================================
		//	Basic Query	- see docs for more detail

		function query($query)
		{

			// For reg expressions
			$query = trim($query);

			// initialise return
			$return_val = 0;

			// Flush cached values..
			$this->flush();

			// Log how the function was called
			$this->func_call = "\$db->query(\"$query\")";

			// Keep track of the last query for debug..
			$this->last_query = $query;

			// Perform the query via std mysql_query function..
			$this->result = @mysql_query($query,$this->dbh);
			$this->num_queries++;

			// If there is an error then take note of it..
			if ( mysql_error() )
			{
				$this->print_error();
				return false;
			}

			// Query was an insert, delete, update, replace
			if ( preg_match("/^(insert|delete|update|replace)\s+/i",$query) )
			{
				$this->rows_affected = mysql_affected_rows();

				// Take note of the insert_id
				if ( preg_match("/^(insert|replace)\s+/i",$query) )
				{
					$this->insert_id = mysql_insert_id($this->dbh);
				}

				// Return number of rows affected
				$return_val = $this->rows_affected;
			}
			// Query was an select
			else
			{

				// Take note of column info
				$i=0;
				while ($i < @mysql_num_fields($this->result))
				{
					$this->col_info[$i] = @mysql_fetch_field($this->result);
					$i++;
				}

				// Store Query Results
				$num_rows=0;
				while ( $row = @mysql_fetch_object($this->result) )
				{
					// Store relults as an objects within main array
					$this->last_result[$num_rows] = $row;
					$num_rows++;
				}

				@mysql_free_result($this->result);

				// Log number of rows the query returned
				$this->num_rows = $num_rows;

				// Return number of rows selected
				$return_val = $this->num_rows;
			}

			// If debug ALL queries
			$this->trace || $this->debug_all ? $this->debug() : null ;

			return $return_val;

		}

		// ==================================================================
		//	Get one variable from the DB - see docs for more detail

		function get_var($query=null,$x=0,$y=0)
		{

			// Log how the function was called
			$this->func_call = "\$db->get_var(\"$query\",$x,$y)";

			// If there is a query then perform it if not then use cached results..
			if ( $query )
			{
				$this->query($query);
			}

			// Extract var out of cached results based x,y vals
			if ( $this->last_result[$y] )
			{
				$values = array_values(get_object_vars($this->last_result[$y]));
			}

			// If there is a value return it else return null
			return (isset($values[$x]) && $values[$x]!=='')?$values[$x]:null;
		}

		// ==================================================================
		//	Get one row from the DB - see docs for more detail

		function get_row($query=null,$output=OBJECT,$y=0)
		{

			// Log how the function was called
			$this->func_call = "\$db->get_row(\"$query\",$output,$y)";

			// If there is a query then perform it if not then use cached results..
			if ( $query )
			{
				$this->query($query);
			}

			// If the output is an object then return object using the row offset..
			if ( $output == OBJECT )
			{
				return $this->last_result[$y]?$this->last_result[$y]:null;
			}
			// If the output is an associative array then return row as such..
			elseif ( $output == ARRAY_A )
			{
				return $this->last_result[$y]?get_object_vars($this->last_result[$y]):null;
			}
			// If the output is an numerical array then return row as such..
			elseif ( $output == ARRAY_N )
			{
				return $this->last_result[$y]?array_values(get_object_vars($this->last_result[$y])):null;
			}
			// If invalid output type was specified..
			else
			{
				$this->print_error(" \$db->get_row(string query, output type, int offset) -- Output type must be one of: OBJECT, ARRAY_A, ARRAY_N");
			}

		}

		// ==================================================================
		//	Function to get 1 column from the cached result set based in X index
		// se docs for usage and info

		function get_col($query=null,$x=0)
		{

			// If there is a query then perform it if not then use cached results..
			if ( $query )
			{
				$this->query($query);
			}

			// Extract the column values
			for ( $i=0; $i < count($this->last_result); $i++ )
			{
				$new_array[$i] = $this->get_var(null,$x,$i);
			}

			return $new_array;
		}

		// ==================================================================
		// Return the the query as a result set - see docs for more details

		function get_results($query=null, $output = OBJECT)
		{

			// Log how the function was called
			$this->func_call = "\$db->get_results(\"$query\", $output)";

			// If there is a query then perform it if not then use cached results..
			if ( $query )
			{
				$this->query($query);
			}

			// Send back array of objects. Each row is an object
			if ( $output == OBJECT )
			{
				return $this->last_result;
			}
			elseif ( $output == ARRAY_A || $output == ARRAY_N )
			{
				if ( $this->last_result )
				{
					$i=0;
					foreach( $this->last_result as $row )
					{

						$new_array[$i] = get_object_vars($row);

						if ( $output == ARRAY_N )
						{
							$new_array[$i] = array_values($new_array[$i]);
						}

						$i++;
					}

					return $new_array;
				}
				else
				{
					return null;
				}
			}
		}


		// ==================================================================
		// Function to get column meta data info pertaining to the last query
		// see docs for more info and usage

		function get_col_info($info_type="name",$col_offset=-1)
		{

			if ( $this->col_info )
			{
				if ( $col_offset == -1 )
				{
					$i=0;
					foreach($this->col_info as $col )
					{
						$new_array[$i] = $col->{$info_type};
						$i++;
					}
					return $new_array;
				}
				else
				{
					return $this->col_info[$col_offset]->{$info_type};
				}

			}

		}


		// ==================================================================
		// Dumps the contents of any input variable to screen in a nicely
		// formatted and easy to understand way - any type: Object, Var or Array

		function vardump($mixed='')
		{

			echo "<p><table><tr><td bgcolor=ffffff><blockquote><font color=000090>";
			echo "<pre><font face=arial>";

			if ( ! $this->vardump_called )
			{
				echo "<font color=800080><b>ezSQL</b> (v".EZSQL_VERSION.") <b>Variable Dump..</b></font>\n\n";
			}

			$var_type = gettype ($mixed);
			print_r(($mixed?$mixed:"<font color=red>No Value / False</font>"));
			echo "\n\n<b>Type:</b> " . ucfirst($var_type) . "\n";
			echo "<b>Last Query</b> [$this->num_queries]<b>:</b> ".($this->last_query?$this->last_query:"NULL")."\n";
			echo "<b>Last Function Call:</b> " . ($this->func_call?$this->func_call:"None")."\n";
			echo "<b>Last Rows Returned:</b> ".count($this->last_result)."\n";
			echo "</font></pre></font></blockquote></td></tr></table>".$this->donation();
			echo "\n<hr size=1 noshade color=dddddd>";

			$this->vardump_called = true;

		}

		// Alias for the above function
		function dumpvar($mixed)
		{
			$this->vardump($mixed);
		}

		// ==================================================================
		// Displays the last query string that was sent to the database & a
		// table listing results (if there were any).
		// (abstracted into a seperate file to save server overhead).

		function debug()
		{

			echo "<blockquote>";

			// Only show ezSQL credits once..
			if ( ! $this->debug_called )
			{
				echo "<font color=800080 face=arial size=2><b>ezSQL</b> (v".EZSQL_VERSION.") <b>Debug..</b></font><p>\n";
			}
			echo "<font face=arial size=2 color=000099><b>Query</b> [$this->num_queries] <b>--</b> ";
			echo "[<font color=000000><b>$this->last_query</b></font>]</font><p>";

				echo "<font face=arial size=2 color=000099><b>Query Result..</b></font>";
				echo "<blockquote>";

			if ( $this->col_info )
			{

				// =====================================================
				// Results top rows

				echo "<table cellpadding=5 cellspacing=1 bgcolor=555555>";
				echo "<tr bgcolor=eeeeee><td nowrap valign=bottom><font color=555599 face=arial size=2><b>(row)</b></font></td>";


				for ( $i=0; $i < count($this->col_info); $i++ )
				{
					echo "<td nowrap align=left valign=top><font size=1 color=555599 face=arial>{$this->col_info[$i]->type} {$this->col_info[$i]->max_length}</font><br><span style='font-family: arial; font-size: 10pt; font-weight: bold;'>{$this->col_info[$i]->name}</span></td>";
				}

				echo "</tr>";

				// ======================================================
				// print main results

			if ( $this->last_result )
			{

				$i=0;
				foreach ( $this->get_results(null,ARRAY_N) as $one_row )
				{
					$i++;
					echo "<tr bgcolor=ffffff><td bgcolor=eeeeee nowrap align=middle><font size=2 color=555599 face=arial>$i</font></td>";

					foreach ( $one_row as $item )
					{
						echo "<td nowrap><font face=arial size=2>$item</font></td>";
					}

					echo "</tr>";
				}

			} // if last result
			else
			{
				echo "<tr bgcolor=ffffff><td colspan=".(count($this->col_info)+1)."><font face=arial size=2>No Results</font></td></tr>";
			}

			echo "</table>";

			} // if col_info
			else
			{
				echo "<font face=arial size=2>No Results</font>";
			}

			echo "</blockquote></blockquote>".$this->donation()."<hr noshade color=dddddd size=1>";


			$this->debug_called = true;
		}

		// =======================================================
		// Naughty little function to ask for some remuniration!

		function donation()
		{
			return true;
		}

	// BEGIN FUSECODE
	function prefix($table = '') {
		global $CONFIG;

		$full_table_name = $CONFIG['core']['db_prefix'] . '_' . $table;
		return $full_table_name;
	}


	/**
     	* Checks if cached query is already avaible, caching and retrieving cached info
     	* Note: it doesn't do type conversion but sha1() filenames using $query.$output
     	* so that way results for e.g. ("some query", "OBJECT") and ("some query", ARRAY_N) will be counting as different by the function
     	*
     	* @param $to_call string function to call
     	* @param $query string database query string
     	* @param $output string output format (as in get_results())
     	* @param $x integer as in get_col() or get_var()
     	* @param $y integer as in get_row() or get_var()
     	* @return array
 		* @access private
 		* @author Dmitry Parnas <parnas@rock.zp.ua>
     	*/
	function _cache($to_call, $query, $output, $x, $y) {
		global $CONFIG, $REPORTS;

		$query = trim($query);
		$filename = sha1($query.chr(1).$output.chr(1).$x.chr(1).$y);
		$file = $CONFIG['core']['db_cache']['directory'].'/'.$filename;
		$expiration_time = ($CONFIG['core']['db_cache']['expiration_time'] * 3600); // making it seconds from hours


		$can_read_file = is_readable($file);

		if ($can_read_file) {
			$last_update = filemtime($file);
		}
		$needed_time_to_show_cache = time() - $expiration_time;

		if ($can_read_file && filemtime($file) > $needed_time_to_show_cache) { // that means that we have data ready and avaible from cache
			$cache_output = unserialize(file_get_contents($file));
			$REPORTS['logic'][] = "Got cached query because $can_read_file updated $last_update needed to be updated $needed_time_to_show_cache current time is " . time();

		} else { // if not we will pass query to query() and save the results

			$REPORTS['logic'][] = "Starting NEW cached query because $can_read_file updated $last_update needed to be updated $needed_time_to_show_cache current time is " . time();
			if ($to_call == 'get_results') {
				$cache_output = $this->get_results($query, $output);
			} elseif ($to_call == 'get_row') {
				$cache_output = $this->get_row($query, $output, $y);
			} elseif ($to_call == 'get_col') {
				$cache_output = $this->get_col($query, $x);
			} elseif ($to_call == 'get_var') {
				$cache_output = $this->get_var($query, $x, $y);
			}
			$serialized = serialize($cache_output);
			$fp = fopen($file,"w");
			fputs($fp, $serialized);
			fclose($fp);
		}
		return $cache_output;
	}

		/**
	     	* Replacement for get_results to work with cache
	     	*
	     	* @param $query string database query string
	     	* @param $output string output format (as in get_results())
	     	* @return variable
     		* @access public
     		* @author Dmitry Parnas <parnas@rock.zp.ua>
		**/
		function cache_get_results($query = null, $output = OBJECT)
		{
			return $this->_cache('get_results', $query, $output, '', '');
		}

		/**
	     	* Replacement for get_row to work with cache
	     	*
	     	* @param $query string database query string
	     	* @param $output string output format (as in get_results())
	     	* @param $y integer as in get_row()
	     	* @return variable
     		* @access public
     		* @author Dmitry Parnas <parnas@rock.zp.ua>
		**/
		function cache_get_row($query=null,$output=OBJECT,$y=0)
		{
			return $this->_cache('get_row', $query, $output, '', $y);
		}

		/**
	     	* Replacement for get_col to work with cache
	     	*
	     	* @param $query string database query string
	     	* @param $output string output format (as in get_results())
	     	* @param $x integer as in get_col()
	     	* @return array
     		* @access public
     		* @author Dmitry Parnas <parnas@rock.zp.ua>
		**/
		function cache_get_col($query=null,$x=0)
		{
			return $this->_cache('get_col', $query, '', $x, '');
		}

		/**
	     	* Replacement for get_var to work with cache
	     	*
	     	* @param $query string database query string
	     	* @param $output string output format (as in get_results())
	     	* @param $x integer as in get_var()
	     	* @param $y integer as in get_var()
	     	* @return string
     		* @access public
     		* @author Dmitry Parnas <parnas@rock.zp.ua>
		**/
		function cache_get_var($query=null,$x=0,$y=0)
		{
			return $this->_cache('get_var', $query, $output, $x, $y);
		}


}




$db = new db(EZSQL_DB_USER, EZSQL_DB_PASSWORD, EZSQL_DB_NAME, EZSQL_DB_HOST);

?>
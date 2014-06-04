/**
 * Created by admin on 2014-04-04.
 */

// TODO: change CONFIG to PuffConfig or something else less generic

CONFIG = {};

CONFIG.version = '0.2a';

// Array of versions of Puff supported
// Not yet implemented
CONFIG.puffVersions = [];

CONFIG.userApi = 'http://162.219.162.56/c/users/api.php';
CONFIG.puffApi = 'http://162.219.162.56/c/puffs/api.php';

CONFIG.maxChildrenToShow = 3;
CONFIG.maxLatestRootsToShow = 26;

CONFIG.sortOrder = 'recent';

CONFIG.zone = 'freebeer';
CONFIG.url = 'http://www.freebeer.com';

// Signature of default puff to display on homepage load
// CONFIG.defaultPuff = '3sqa3JEfAHLRwKczv3GZ33kWa5PnaccZC978mSx7kP1f5GNN2d2evno4tDKmKrmy23y6tDVDpT9wgmMiZucKYZBQ5';

CONFIG.text_threshold = 400;

// List of supported
CONFIG.supportedContentTypes = ['img/png', 'bbcode', 'text'];

CONFIG.anon = {};
CONFIG.anon.privateKeyAdmin = '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx'; // public: 161s1zgTMSVLCp72SBphusQHzBzhjqtK5SSrCqKn17VfdvJPugz

// How much space to leave on left side of screen, in pixels
CONFIG.leftMargin = 60;

CONFIG.arrowColors = ['#00F', '#00E','#00D','#00C','#00B','#00A','#009','#008','#007','#006']
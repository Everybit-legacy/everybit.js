/**
 * Created by admin on 2014-04-04.
 */

// TODO: change CONFIG to PuffConfig or something else less generic

CONFIG = {};

CONFIG.version = '0.2a';

// Array of versions of Puff supported
// Not yet implemented
CONFIG.puffVersions = [];

CONFIG.userApi = 'http://localhost:8888/puffballApi/users/api.php';
CONFIG.puffApi = 'http://localhost:8888/puffballApi/puffs/api.php';

CONFIG.maxChildrenToShow = 3;
CONFIG.maxLatestRootsToShow = 26;

CONFIG.sortOrder = 'recent';

CONFIG.zone = 'freebeer';

// Signature of default puff to display on homepage load
CONFIG.defaultPuff = '3sqa3JEfAHLRwKczv3GZ33kWa5PnaccZC978mSx7kP1f5GNN2d2evno4tDKmKrmy23y6tDVDpT9wgmMiZucKYZBQ5';

CONFIG.text_threshold = 400;

// List of supported
CONFIG.supportedContentTypes = ['img/png', 'bbcode', 'text'];

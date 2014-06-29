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

CONFIG.zone = 'everybit';

CONFIG.url = 'http://www.everybit.com';
CONFIG.logo = 'img/EveryBit.gif';
CONFIG.defaultPuff = 'AN1rKooS7u7ZgGs6WG2yfrq77kPCocztNj21Av6wN9dKBYECgVUpU19pFjV33VHkJKv6WJZcAx9sbLcFMUahyV1FUWZfSsgtD';

CONFIG.text_threshold = 400;

// List of supported
// TODO, this is specified elsehere remove!
CONFIG.supportedContentTypes = ['img/png', 'bbcode', 'text'];
CONFIG.defaultContentType = 'markdown';


CONFIG.anon = {};
CONFIG.anon.privateKeyAdmin = '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx'; // public: 161s1zgTMSVLCp72SBphusQHzBzhjqtK5SSrCqKn17VfdvJPugz

CONFIG.users = [
    {
        username: 'anon',
        adminKey: '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx'
    },
    {
        username: 'forum',
        adminKey: '5JM6bnJmPHbtGGcukqjc1Yg8QcoDTorPK3NDGGy4w5fr46Rrhwn'
    },
    {
        username: 'chess',
        adminKey: '5HuvxAxU1ER2riUjA6yhJ6uVHp8eCJFoqVuXHnG5Jw4ZDZUrN62'
    }
];


CONFIG.users['anon'] = {adminKey: '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx'}
CONFIG.users['forum'] = {adminKey: '5JM6bnJmPHbtGGcukqjc1Yg8QcoDTorPK3NDGGy4w5fr46Rrhwn'}
CONFIG.users['chess'] = {adminKey: '5HuvxAxU1ER2riUjA6yhJ6uVHp8eCJFoqVuXHnG5Jw4ZDZUrN62'}

// How much space to leave on left side of screen, in pixels
CONFIG.leftMargin = 60;

CONFIG.minimumPuffLength = 3;
CONFIG.PGNTimeout = 5;

CONFIG.arrowColors = [
     '#737CA1',
     '#4863A0',
     '#2B547E',
     '#2B3856',
     '#151B54',
     '#000080',
     '#342D7E',
     '#15317E',
     '#151B8D',
     '#0000A0',
     '#0020C2',
     '#0041C2',
     '#2554C7',
     '#1569C7',
     '#2B60DE',
     '#1F45FC',
     '#6960EC',
     '#736AFF',
     '#357EC7',
     '#368BC1',
     '#488AC7',
     '#3090C7',
     '#659EC7',
     '#87AFC7',
     '#95B9C7',
     '#728FCE',
     '#2B65EC',
     '#306EFF',
     '#157DEC',
     '#1589FF',
     '#6495ED',
     '#6698FF',
     '#38ACEC',
     '#56A5EC',
     '#5CB3FF',
     '#3BB9FF',
     '#79BAEC',
     '#82CAFA',
     '#82CAFF'
 ];
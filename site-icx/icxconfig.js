/**
 * Created by admin on 2014-09-03.
 */

ICX = {}

ICX.wizard = {}

ICX.adminKey = '5KiCcgZjfvbGJgJbP9RKccwB6NGw8PgfkwZm2P5Xj158NqFFf4a'

//ICX.message = {} changign this to ICX.send
ICX.send = {}

ICX.config = {
    sideBorder: {
        min: 2,
        max: 100,
        ratio:.055
    },

    borderSide: 'left',

    logo: {
        originalW: 643,
        originalH: 279,
        areaRatio:.02,
        minW: 32,
        maxW: 1000,
        insets: {
            top:.095
        },
        insetsSmall: {
            top:.02,
            left:.02
        }
    },
    text: {
        areaRatio: 0.00065,
        default: 14,
        min: 5,
        max: 100
    },
    content: {
        insets: {
            top:.1,
            right:.1,
            left:.18,
            bottom:.1
        }
    },

    minBorder: 1,
    maxBorder: 100,
    borderRatio:.03,
    logoBigRatio:.2,
    logoYFromTop:.05,
    logoSmallRatio:.125,
    buttonHeightRatio:.1,
    buttonWidthRatio:.5,
    buttonSmallWidthRatio:.14,
    buttonFontHeightRatio:.03,
    mainPageFontHeightRatio:.03,
    contentLeftInset: .02,
    contentRightInset: 0.15,
    contentBottomInset:.04
}

// NEEDED because loading identity doesn't happen until whole page has loaded
ICX.identitySet = false

ICX.newUser = {}

ICX.animalName = {}

ICX.userColor = {}

ICX.identityForFile = {}

ICX.errors = ''

// Make this home?
ICX.currScreen = 'init'

ICXdefaults = JSON.parse(JSON.stringify(ICX))

// OTHER
CONFIG = {};

CONFIG.version = '0.4.1';

// Array of versions of Puff supported
// Not yet implemented
CONFIG.puffVersions = [];

CONFIG.userApi = 'https://i.cx/api/users/api.php';
CONFIG.puffApi = 'https://i.cx/api/puffs/api.php';
CONFIG.eventsApi = 'https://i.cx/api/puffs/api.php';

// Zone is added in route of every puff publishing using this code
CONFIG.zone = 'icx';

CONFIG.url = 'https://i.cx';
// CONFIG.logo = 'img/EveryBitLogoLeft.svg';

/* See translate.js */
CONFIG.defaultPuff = '381yXZ2FqXvxAtbY3Csh2Q6X9ByNQUj1nbBWUMGWYoTeK8hHHtKwmsvc8gZKeDnCtfr49Ld9yAayWPV6R8mYQ1Aeh6MJtzEf';
CONFIG.faqPuff = 'AN1rKvtN7zq6EBhuU8EzBmnaHnb3CgvHa9q2B5LJEzeXs5FakhrArCQRtyBoKrywsupwQKZm5KzDd3yVZWJy4hVhwwdSp12di';

// List of supported content types
CONFIG.supportedContentTypes = ['image','bbcode','text','markdown','PGN','profile','file'];
CONFIG.unsupportedContentTypes = [];
CONFIG.defaultContentType = 'markdown';

CONFIG.users = [
    {
        username: 'anon',
        adminKey: '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx'
    },
    {
        username: 'forum',
        adminKey: '5JM6bnJmPHbtGGcukqjc1Yg8QcoDTorPK3NDGGy4w5fr46Rrhwn'
    }
];


CONFIG.users['anon'] = {adminKey: '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx'}
CONFIG.users['forum'] = {adminKey: '5JM6bnJmPHbtGGcukqjc1Yg8QcoDTorPK3NDGGy4w5fr46Rrhwn'}

// How much space to leave on left side of screen, in pixels
CONFIG.leftMargin = 20;

CONFIG.rightMargin = 20;

CONFIG.verticalPadding = 70;

// Side of the page you want the menu to go on
CONFIG.menuRight = false;

CONFIG.menuWidth = 400;

// Minimum width for advanced tools
CONFIG.minWidthAdvancedTools = 400;

/* Puffs must be at least this many characters to be submitted */
CONFIG.minimumPuffLength = 3;
CONFIG.PGNTimeout = 5;

// Space between puffs in regular view
CONFIG.minSpacing = 3;

// Extra space between puffs in relationship view
CONFIG.extraSpacing = 25;

// background color
CONFIG.defaultBgcolor = "E0E0E0";


// configurations for network requests. eventually queries will track their timing and we'll automate these settings.
CONFIG.initLoadBatchSize = 50
CONFIG.initLoadGiveup    = 300

CONFIG.fillSlotsBatchSize = 50
CONFIG.fillSlotsGiveup    = 1000

CONFIG.globalBigBatchLimit = 2000


// default size limits
CONFIG.localStorageMemoryLimit =  3E6 //  3MB
CONFIG.inMemoryMemoryLimit     = 30E6 // 30MB

CONFIG.localStorageShellLimit =  1000 // maximum number of shells
CONFIG.inMemoryShellLimit     = 10000 // (shells are removed to compensate)

CONFIG.shellContentThreshold  =  1000 // size of uncompacted content

// for tableView
CONFIG.defaultColumn = {
    show: false,
    weight: 1,
    allowSort: false
}
CONFIG.maxGeneration = 5
CONFIG.maxParentGen = 3
CONFIG.maxChildGen = 4
CONFIG.initialLoad = 20
CONFIG.newLoad = 10

//should only be changed if the underlying platform changes
CONFIG.standards ={}
CONFIG.standards.usernames = {}
CONFIG.standards.usernames.maxLength = 255




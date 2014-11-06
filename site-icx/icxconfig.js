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

ICX.loading = true

ICX.newUser = {}

ICX.animalName = {}

ICX.userColor = {}

// ICX.identityForFile = {}

ICX.errors = ''

// Make this home?
ICX.currScreen = 'init'

ICXdefaults = JSON.parse(JSON.stringify(ICX))

//Holds users replies in case of loss
ICX.cachedReplies = {}

// OTHER
if(typeof PB === 'undefined') PB = {} // in case we load this before PB.js

if(!PB.CONFIG) PB.CONFIG = {} // in case there's other config files

PB.CONFIG.version = '0.5';

// Array of versions of Puff supported
// Not yet implemented
PB.CONFIG.puffVersions = [];

PB.CONFIG.userApi = 'https://i.cx/api/users/api.php';
PB.CONFIG.puffApi = 'https://i.cx/api/puffs/api.php';
PB.CONFIG.eventsApi = 'https://i.cx/api/puffs/api.php';

// Zone is added in route of every puff publishing using this code
PB.CONFIG.zone = 'icx';

PB.CONFIG.url = 'https://i.cx';
// PB.CONFIG.logo = 'img/EveryBitLogoLeft.svg';

/* See translate.js */
PB.CONFIG.defaultPuff = '381yXZ2FqXvxAtbY3Csh2Q6X9ByNQUj1nbBWUMGWYoTeK8hHHtKwmsvc8gZKeDnCtfr49Ld9yAayWPV6R8mYQ1Aeh6MJtzEf';
PB.CONFIG.faqPuff = 'AN1rKvtN7zq6EBhuU8EzBmnaHnb3CgvHa9q2B5LJEzeXs5FakhrArCQRtyBoKrywsupwQKZm5KzDd3yVZWJy4hVhwwdSp12di';

// List of supported content types
PB.CONFIG.supportedContentTypes = ['image','bbcode','text','markdown','PGN','profile','file'];
PB.CONFIG.unsupportedContentTypes = [];
PB.CONFIG.defaultContentType = 'markdown';

PB.CONFIG.users = [
    {
        username: 'anon',
        adminKey: '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx'
    },
    {
        username: 'forum',
        adminKey: '5JM6bnJmPHbtGGcukqjc1Yg8QcoDTorPK3NDGGy4w5fr46Rrhwn'
    }
];


PB.CONFIG.users['anon'] = {adminKey: '5KdVjQwjhMchrZudFVfeRiiPMdrN6rc4CouNh7KPZmh8iHEiWMx'}
PB.CONFIG.users['forum'] = {adminKey: '5JM6bnJmPHbtGGcukqjc1Yg8QcoDTorPK3NDGGy4w5fr46Rrhwn'}

// How much space to leave on left side of screen, in pixels
PB.CONFIG.leftMargin = 20;

PB.CONFIG.rightMargin = 20;

PB.CONFIG.verticalPadding = 70;

// Side of the page you want the menu to go on
PB.CONFIG.menuRight = false;

PB.CONFIG.menuWidth = 400;

// Minimum width for advanced tools
PB.CONFIG.minWidthAdvancedTools = 400;

/* Puffs must be at least this many characters to be submitted */
PB.CONFIG.minimumPuffLength = 3;
PB.CONFIG.PGNTimeout = 5;

// Space between puffs in regular view
PB.CONFIG.minSpacing = 3;

// Extra space between puffs in relationship view
PB.CONFIG.extraSpacing = 25;

// background color
PB.CONFIG.defaultBgcolor = "E0E0E0";


// configurations for network requests. eventually queries will track their timing and we'll automate these settings.
PB.CONFIG.pageBatchSize = 10

PB.CONFIG.initLoadBatchSize = 20
PB.CONFIG.initLoadGiveup    = 300

PB.CONFIG.fillSlotsBatchSize = 50
PB.CONFIG.fillSlotsGiveup    = 1000

PB.CONFIG.globalBigBatchLimit = 2000


// default size limits
PB.CONFIG.localStorageMemoryLimit =  3E6 //  3MB
PB.CONFIG.inMemoryMemoryLimit     = 30E6 // 30MB

PB.CONFIG.localStorageShellLimit =  1000 // maximum number of shells
PB.CONFIG.inMemoryShellLimit     = 10000 // (shells are removed to compensate)

PB.CONFIG.shellContentThreshold  =  1000 // size of uncompacted content

// for tableView
PB.CONFIG.defaultColumn = {
    show: false,
    weight: 1,
    allowSort: false
}
PB.CONFIG.maxGeneration = 5
PB.CONFIG.maxParentGen = 3
PB.CONFIG.maxChildGen = 4

//should only be changed if the underlying platform changes
PB.CONFIG.standards ={}
PB.CONFIG.standards.usernames = {}
PB.CONFIG.standards.usernames.maxLength = 255
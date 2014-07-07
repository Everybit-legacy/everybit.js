/** @jsx React.DOM */
puffworldprops = {
    dev: {
        items:
            [
                {
                    category: 'feature',
                    name: 'Staring of puffs added',
                    field: 'stars',
                    type: 'boolean',
                    value: 100,
                    default: 0 // Set to 'checked' when done
                },
                {
                    name: 'Number of imported usernames',
                    field: 'importedUsernames',
                    type: 'number',
                    multiplier: 3,
                    default: 0
                },
                {
                    category: 'feature',
                    name: 'Prototyping many puffs before going live all at once',
                    field: 'prototypingPuffs',
                    type: 'boolean',
                    value: 50,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Ability to embed font-awesome icons in puffs. So we can tell people to to click a button and show that button. Could be done with BBcode font',
                    field: 'embedIcons',
                    type: 'boolean',
                    value: 25,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'publicity',
                    name: 'Three minute non-technical explainer video',
                    field: 'threeMinVid',
                    type: 'boolean',
                    value: 100,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'publicity',
                    name: 'Fifteen minute technical Q&A',
                    field: 'fifteenMinVid',
                    type: 'boolean',
                    value: 100,
                    default: 0 // Set to 'checked' when done
                },
                {
                    name: 'Video views',
                    field: 'videoViews',
                    type: 'number',
                    multiplier:.1,
                    default: 0
                },
                {
                    category: 'recurring',
                    frequency: 'weekly',
                    name: 'Review of tutorial done this week, add/adjust as needed',
                    field: 'reviewTutorial',
                    type: 'boolean',
                    value: 10,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'milestone',
                    name: 'Article about puffball at wired.com',
                    field: 'wiredArticle',
                    type: 'boolean',
                    value: 1000,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'publicity',
                    name: 'Set of explanation puffs of value of system for stakeholders',
                    field: 'expinationPuffs',
                    type: 'boolean',
                    value: 300,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'milestone',
                    name: 'One extended work of fiction posted to system',
                    field: 'longFictionPosted',
                    type: 'boolean',
                    value: 500,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Ability to cross-post to FB',
                    field: 'crossPostFB',
                    type: 'boolean',
                    value: 400,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Two-layer boolean filtering (and or, or or, etc)',
                    field: 'twoLayerBooleanFiltering',
                    type: 'boolean',
                    value: 800,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Tag searching supported',
                    field: 'tagSearching',
                    type: 'boolean',
                    value: 400,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Spanish translation added',
                    field: 'spanishVersion',
                    type: 'boolean',
                    value: 300,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'recurring',
                    frequency: 'weekly',
                    name: 'All translation files reviewed, updated as needed',
                    field: 'reviewTranslations',
                    type: 'boolean',
                    value: 50,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Ability to disable error tracking',
                    field: 'errorTrackingOption',
                    type: 'boolean',
                    value: 200,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Support for MP3s',
                    field: 'mp3Support',
                    type: 'boolean',
                    value: 400,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Support for LaTeX',
                    field: 'latexSupport',
                    type: 'boolean',
                    value: 200,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Import content from instagram',
                    field: 'instagramImport',
                    type: 'boolean',
                    value: 800,
                    default: 1 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Import content from twitter',
                    field: 'twitterImport',
                    type: 'boolean',
                    value: 800,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Import content from FB',
                    field: 'fbImport',
                    type: 'boolean',
                    value: 1000,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Vertical scrolling',
                    field: 'verticalScrolling',
                    type: 'boolean',
                    value: 700,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Horizontal scrolling',
                    field: 'horizontalScrolling',
                    type: 'boolean',
                    value: 400,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'milestone',
                    name: 'Real text post of 500 words or more',
                    field: 'text500posted',
                    type: 'boolean',
                    value: 200,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'development',
                    name: 'Build system in place for easy deployment',
                    field: 'buildSystem',
                    type: 'boolean',
                    value: 300,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'publicity',
                    name: 'Docs automatically generated and uploaded to git',
                    field: 'apiDocs',
                    type: 'boolean',
                    value: 500,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Support for smilies in BBcode',
                    field: 'bbcodeSimilies',
                    type: 'boolean',
                    value: 100,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'On-demand module loading system, so contentType visulizers only required as needed',
                    field: 'onDemandModuleLoading',
                    type: 'boolean',
                    value: 500,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'BTC tipping integrated',
                    field: 'btcTipping',
                    type: 'boolean',
                    value: 300,
                    default: 1 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Doge tipping integrated',
                    field: 'dogeTipping',
                    type: 'boolean',
                    value: 300,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Send to names should work like filters, and validate usernames as you add them.',
                    field: 'sendToAdd',
                    type: 'boolean',
                    value: 250,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'feature',
                    name: 'Users can flag their own content for removal from system',
                    field: 'flagToRemove',
                    type: 'boolean',
                    value: 200,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'change',
                    name: 'Remove redundant info from signatures',
                    field: 'trimSignatures',
                    type: 'boolean',
                    value: 200,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'development',
                    name: 'Put a standard header on each src file',
                    field: 'srcFileHeaders',
                    type: 'boolean',
                    value: 150,
                    default: 0 // Set to 'checked' when done
                },
                {
                    category: 'bugs',
                    name: 'Bug free measure (0-1)',
                    field: 'bugFreeLevel',
                    type: 'factor',
                    default:.6
                }
            ]
    }

};


puffworlddefaults = puffworldprops                  // it's immutable so we don't care

///// event stuff. move this into either PuffForum or Puff itself.

events = {}
events.subs = {}

events.pub = function(path, data) {
    return setImmediate(function() {events.start_pub(path, data)})              // do it next tick
}

events.sub = function(path, handler) {
    path = events.scrub_path(path).join('/')
    if(!events.subs[path]) events.subs[path] = []
    events.subs[path].push(handler)
}

events.unsub = function(path, handler) {
    path = events.scrub_path(path).join('/')

    var subs = events.subs[path]
    if(!subs) return false

    var index = subs.indexOf(handler)
    if(index == -1) return false

    subs.splice(index, 1)
}

events.start_pub = function(path, data) {
    //// pub to * at each level and then to path itself
    var pathlist = events.scrub_path(path)
    var realpath = pathlist.join('/')

    events.try_pub('*', data, realpath)                                         // global catchall

    pathlist.reduce(function(acc, seg) {                                        // channel catchalls
        var newacc = acc + seg + '/'
        events.try_pub(newacc + '*', data, realpath)
        return newacc
    }, '')

    events.try_pub(realpath, data, realpath)                                    // actual channel
}

events.try_pub = function(path, data, realpath) {
    var handlers = events.subs[path]
    if(!handlers || !handlers.length) return false
    handlers.forEach(function(handler) {handler(data, realpath)})
    // THINK: use setImmediate here?
}

// event.sub = function(path, handler) {
//     //// add the handler to the tree
//     path = event.scrub_path(path)
//     var tree = event.tree
//     var last = path.length - 1
//     for(var i = 0; i < last; i++) {                                            // walk down, but skip the last item
//         if(!tree[path[i]])
//             tree[path[i]] = {kids: {}, handlers: []}                            // build the tree as needed
//         tree = tree[path[i]].kids                                               // step down one level
//     }
//
//     tree[path[last]] = tree[path[last]]
//                      ? tree[path[last]].concat(handler)                         // add handler to existing list
//                      : [handler]                                                // or create a new one
// }

// event.unsub = function(path, handler) {
//     // remove the handler from the tree
//     path = event.scrub_path(path)
//     var tree = event.tree
//     for(var i = 0; i < path.length; i++) {
//         tree = tree[path[i]]
//         if(!tree) return false
//     }
//
// }


events.scrub_path = function(path) {
    return path.replace(/^[^\w*-]+/, '')                                        // trim leading slashes etc
        .replace(/[^\w*-]+$/, '')                                        // trim trailing gunk
        .split('/')                                                      // break out the path segments
        .map(function(item) {return item.replace(/[^\w*-]/g, '')})       // scrub each segment
}


eventlog = [];
events.sub('*', function(data, path) {
    eventlog.push([path, data])
})


//// event bindings for controlling core behavior from the display

events.sub('prefs/storeKeychain/toggle', function(data, path) {
    var new_state = !PuffWardrobe.getPref('storeKeychain')
    PuffWardrobe.setPref('storeKeychain', new_state)

    var dir = new_state ? 'on' : 'off'
    events.pub('ui/menu/prefs/storeKeychain/' + dir)
})

events.sub('profile/nickname/set', function(data, path) {
    var nickname = data.nickname
    if(!nickname)
        return Puffball.onError('Invalid nickname')  // THINK: do this in React? use Puffball.validations?

    PuffWardrobe.setProfileItem('nickname', nickname)

    events.pub('ui/menu/profile/nickname/set')
});


///// event bindings that are specific to the GUI //////

events.sub('ui/*', function(data, path) {
    //// rerender on all ui events

    // OPT: batch process recent log items on requestAnimationFrame

    // change props in a persistent fashion
    if(data)
        if(Array.isArray(data))
            puffworldprops = React.addons.update(puffworldprops, data[0]) // this is a bit weird
        else
            events.update_puffworldprops(data)

    // set the props in the url and history
    setViewPropsInURL()

    puffworldprops.reply.preview = false;
    // then re-render PuffWorld w/ the new props
    updateUI()
});

/// move these into their own lib
events.update_puffworldprops = function(data) {
    puffworldprops = events.handle_merge_array(puffworldprops, data)
};

events.handle_merge_array = function(props, data) {
    return Object.keys(data).reduce(function(props, key) {
        return events.merge_props(props, key, data[key])
    }, props)
};

events.merge_props = function(props, path, value) {
    var segs = path.split('.')
    var last = segs.pop()
    var final = next = events.shallow_copy(props)

    segs.forEach(function(seg) {
        next[seg] = events.shallow_copy(next[seg])
        next = next[seg]
    })

    next[last] = value
    return final
};

events.shallow_copy = function(obj) {
    return Object.keys(obj || {}).reduce(function(acc, key) {acc[key] = obj[key]; return acc}, {})
};

var Dev = React.createClass({
    render: function() {
        return(
            <div>
                <Items />
            </div>
            )
    }
});




var Items = React.createClass({
    getInitialState: function() {
        return (
            { 'score': 0}
        )
    },
    handleCalculateScore: function() {

        var theScore = 0;
        for (var i in puffworldprops.dev.items) {
            switch(puffworldprops.dev.items[i].type) {
                case 'number':
                    var val = puffworldprops.dev.items[i].multiplier * this.refs[puffworldprops.dev.items[i].field].getDOMNode().value;
                    theScore = theScore + Number(val);

                    break;
                case 'boolean':
                    if(this.refs[puffworldprops.dev.items[i].field].getDOMNode().checked) {
                        var val = puffworldprops.dev.items[i].value;
                    } else {
                        var val = 0;
                    }
                    theScore = theScore + Number(val);
                    break;
                case 'factor':
                    var val = this.refs[puffworldprops.dev.items[i].field].getDOMNode().value;
                    theScore = theScore * Number(val);
                    console.log(Number(val));
                    break;
                default:
                    break;
            }
        }

        this.setState({'score': theScore})

        console.log(this.score);
    },

    componentDidMount: function() {
        this.handleCalculateScore();
    },

    render: function() {

            var self = this;
            var itemNodes = puffworldprops.dev.items.map(function (item) {

                // Is it regular or checkbox
                if(item.type == 'boolean') {

                    return (
                        <tr><td><input type="checkbox" ref={item.field} key={item.field} onChange={self.handleCalculateScore} defaultChecked={item.default} /></td><td>{item.name}</td></tr>
                        );
                } else {
                    return (
                        <tr><td><input type="text" className="narrow" ref={item.field} key={item.field} onChange={self.handleCalculateScore} defaultValue={item.default} /></td><td>{item.name}</td></tr>
                        );
                }

            });

            var tableStyle = {width: '80%'};
            return (
                <div>
                <Score score={this.state.score} />
                    <table style={tableStyle}>
                {itemNodes}
                        </table>
                </div>
                );

    }
});

var Score = React.createClass({
    render: function() {

        // For each dom element, take value, multipy by multiplier, calculate
        // Do all addititive items, then do all multiplicative items

        return (
            <div className="giant">
            score: {Math.round(this.props.score)}
            </div>
            );
    }
});



// Calculate current score based on value of all
React.renderComponent(
    <Dev />,
    document.getElementById('dev')
);

// TODO: Support add of log of things (like # of usernames)
// TODO: List all completed features and milestones at top
// TODO: Review PPT, add features from there
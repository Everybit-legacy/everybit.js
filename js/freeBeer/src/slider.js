/** @jsx React.DOM */

var Slider = React.createClass({

    handleChangeSlide: function() {
        var curr = puffworldprops.slider.currentSlide;
        curr = (curr % this.state.totalSlides) + 1;

        console.log(curr);

        return events.pub( 'ui/slider/currSlide',{ 'slider.currSlide': curr});

    },

    handleHideSlider: function() {
        return events.pub( 'ui/slider/close',{ 'slider.show': false});
    },

    handleGetStarted: function() {

        events.pub( 'ui/slider/close',{ 'slider.show': false});
        return events.pub('ui/publish-expand', {'reply.expand': true,
            'menu.section': false,
            'menu.show': false});

        /*
        // Close slider, focus publish
        events.pub( 'ui/slider/close',{ 'slider.show': false});

        // TODO: Yikes!
        var contentEle = document.getElementById('content');
        if (contentEle) {
            contentEle.focus();
        }

        return events.pub('ui/reply/open', { 'clusters.publish': true
            , 'menu.show': true
            , 'menu.publish': true
            //  , 'reply': {show: true}
        });
        */
    },




    render: function() {
        var slidesArr = new Array();
        for(i=1;i<=puffworldprops.slider.totalSlides;i++) {
            slidesArr.push(i)
        }


        if(puffworldprops.slider.show) {
            var cn = "slider"
        } else {
            var cn = "invisible";
        }

        // TODO: if invisible, short-circuit all the rest

        var w = window.innerWidth;
        var h = window.innerHeight;

        if( (w/h) < 3/2) {
            // Width drives it
            var slideW = Math.round(w *.75);
            var slideH = Math.round(slideW/1.5);

        } else {
            // Height drives it
            var slideH = Math.round(h *.75);
            var slideW = Math.round(slideH*1.5);
        }

        var sliderStyle = {width: slideW+'px',height: slideH+'px'};
        var self = this;

        var slideName;

        switch (puffworldprops.slider.currentSlide) {
            case 1:
                slideName = <WelcomeSlide />
                break;
            case 2:
                slideName = <ShortcutsSlide />
                break;
            case 3:
                slideName = <SecureSlide />
                break;
            case 4:
                slideName = <MultiThreadedSlide />
                break;
            case 5:
                slideName = <FilteringSlide />
                break;
            case 6:
                slideName = <IdentitySlide />
                break;
            case 7:
                slideName = <DecentralizedSlide />
                break;
            default:
                break;
        }

        return (
            <div className={cn} style={sliderStyle}>
                <img src="img/EveryBitLogo.svg" className="sliderLogo" />
                <a href="#" onClick={this.handleHideSlider}>
                    <i className="fa fa-times-circle-o fa-fw closeBox"></i>
                </a>

                <div className="slide">
                    {slideName}
                </div>

                <div className="sliderDots">
                        {slidesArr.map(function(i) {
                            return <SliderBullet active={i == puffworldprops.slider.currentSlide} numb={i} />
                        })} <a href="#" onClick={this.handleGetStarted}><em>Get started!</em></a>
                </div>


            </div>
            );
    }
});

// , position: 'absolute', bottom: '0'

var SliderBullet = React.createClass({
    handleGotoSlide: function() {

        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': this.props.numb});


    },


    render: function() {
        if(this.props.active) {
            return <a href="#" onClick={this.handleGotoSlide}><i className="fa fa-fw fa-circle blue"></i></a>
        } else {
            return <a href="#" onClick={this.handleGotoSlide}><i className="fa fa-fw fa-circle-thin"></i></a>
        }
    }

});

var WelcomeSlide = React.createClass({

    handleGotoSlide: function(goTo) {
        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': goTo});
    },

    render: function() {
        return (
                <div className="slideContent">
                	<a href="#" onClick={this.handleGotoSlide.bind(this,2)} className="black"><i className="blue fa fa-fw fa-plane"></i> Keyboard <em className="blue">shortcuts</em> for everything.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,3)} className="black"><i className="blue fa fa-fw fa-lock"></i> Fully <em className="blue">secure</em> communications</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,4)} className="black"><i className="blue fa fa-fw fa-sitemap"></i> <em className="blue">Multi-threaded</em> conversations.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,5)} className="black"><i className="blue fa fa-fw fa-search-plus"></i> Advanced <em className="blue">filtering</em> tools.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,6)} className="black"><i className="blue fa fa-fw fa-user"></i> Full <em className="blue">identity</em> management.</a><br />

                    <a href="#" onClick={this.handleGotoSlide.bind(this,7)} className="black"><i className="blue fa fa-fw fa-beer"></i> Open source. <em className="blue">Decentralized</em>. Interoperable.</a><br />
                    </div>

            )

    }
})

var ShortcutsSlide = React.createClass({
    handleShowShortcuts: function() {

        var polyglot = Translate.language[puffworldprops.view.language];
        events.pub('ui/view/rows/1', {'view.rows': 1})
        showPuff(polyglot.t("puff.shortcut"));
        return events.pub( 'ui/slider/close',{ 'slider.show': false});
    },

    render: function() {

        return (
            <div className="slideContent">
                <i className="fa fa-plane slideBackground"></i>

                <div className="slideHeader blue">Keyboard shortcuts</div>

                <span className="blue bold">N</span>: Begin a new post<br />

                <span className="blue" bold>CMD-ENTER</span>: Publish your post<br />

                <span className="blue" bold>←↑↓→</span>: Navigate between posts<br />

                <span className="blue" bold>I</span>: Toggle show information about posts<br />

                <span className="blue" bold>SPACE</span>: Toggle show relationships<br />

                <span className="blue" bold>ESC</span>: Close a dialogue box (including this one!)<br />

                <a href="#" onClick={this.handleShowShortcuts}><em>See full list</em></a>
            </div>

            )

    }
})

var SecureSlide = React.createClass({
    handleGotoSlide: function(goTo) {
        return events.pub( 'ui/slider/currSlide',{ 'slider.currentSlide': goTo});
    },

    render: function() {
        return (
            <div className="slideContent">
                <i className="fa fa-lock slideBackground"></i>

                <div className="slideHeader blue">Secure communications</div>
                <i className="gray fa fa-fw fa-arrow-right"></i>Fully encrypted private messages<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>All encryption happens <em>client side</em><br />
                    (passwords are never sent over the network)<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>No single point of failure <br />
                    (posts are stored on a server and <a href="#" onClick={this.handleGotoSlide.bind(this,7)}>distributed over a P2P network</a>)<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Complete control over privacy level <br />
                    (Public, Private, Anonymous, and Invisible)<br />
            </div>

            )

    }
})

var MultiThreadedSlide = React.createClass({
    render: function() {
        return (
            <div className="slideContent">
                <div className="slideHeader blue">Multi-threaded conversations</div>

                <div style={{float: 'left', width: '50%', display: 'inline-block'}}>
                <i className="gray fa fa-fw fa-arrow-right"></i>Reply to multiple posts at once.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Follow just those branches of the conversation that interest you, ignore the rest.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Send and view private messages right in the main thread view.<br />
                </div>
                <div style={{float: 'right', width: '50%', display: 'inline-block'}}>
                  <img src="img/slides/GEB.gif" style={{width: '100%'}} />
                </div>

            </div>

            )

    }
})

var FilteringSlide = React.createClass({
    render: function() {
        return (
            <div className="slideContent">
                <i className="fa fa-search-plus slideBackground"></i>

                <div className="slideHeader blue">Advanced filtering</div>

                <i className="gray fa fa-fw fa-arrow-right"></i>Filter by username, tag, or score.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Sort by most recent or oldest.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Choose how many rows of results you want at a time.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Apply boolean logic to your filters (coming soon).<br />

            </div>

            )

    }
})

var IdentitySlide = React.createClass({
    render: function() {
        return (
            <div className="slideContent">
                <i className="fa fa-user slideBackground"></i>

                <div className="slideHeader blue">Identity management</div>

                <i className="gray fa fa-fw fa-arrow-right"></i>Users own and control their own identities.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Identities are portable across all websites using the same framework.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Three built-in levels of access control.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Users can create and manage sub-usernames as needed.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Create ad-hoc connections with other users that are website-independent.<br />

            </div>

            )
    }
})


var DecentralizedSlide = React.createClass({
    handleShowFaq: function() {
        events.pub( 'ui/slider/close',{ 'slider.show': false});
        showPuff('AN1rKvtN7zq6EBhuU8EzBmnaHnb3CgvHa9q2B5LJEzeXs5FakhrArCQRtyBoKrywsupwQKZm5KzDd3yVZWJy4hVhwwdSp12di');
        return false;
    },


    render: function() {
        return (
            <div className="slideContent">
                <i className="fa fa-beer slideBackground"></i>

                <div className="slideHeader blue">Open source. Decentralized. Interoperable.</div>

                <i className="gray fa fa-fw fa-arrow-right"></i>Open source: <a href="https://github.com/puffball/freebeer" target="_new">fork us on github</a>.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Decentralized using JavaScript P2P libraries.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Open standard for publishing content.<br />

                <i className="gray fa fa-fw fa-arrow-right"></i>Goals: zero lock in, full portability, <a href="#" onClick={this.handleShowFaq}>solve the gatekeeper problem</a>.<br />

            </div>

            )

    }
})
